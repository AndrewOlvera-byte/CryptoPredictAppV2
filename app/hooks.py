import logging
from flask import request, g, session, redirect, url_for, jsonify
from app.extensions import redis_client, db
from .model.Model import Model
from .model.User import User
from .model.Query import Query
from .model.Response import Response

logger = logging.getLogger(__name__)

def get_model_key(user_id):
    return f"model:{user_id}"



def load_model():
    # Function called before each request
    protected_endpoints = ['main.dashboard', 'main.profile']  # note: blueprint routes are prefixed
    if request.endpoint not in protected_endpoints:
        return

    # Check if user is logged in
    if 'user_id' not in session:
        return redirect(url_for('main.login'))

    # Set model key
    user_id = session['user_id']
    model_key = get_model_key(user_id)
    g.model_key = model_key

    # Get model from Redis if available or create new model
    try:
        json_data = redis_client.get(model_key)
    except Exception as e:
        logger.error("Redis error: %s", e)
        json_data = None

    if json_data is None:
        # Create a new composite Model if not found
        user = User("", "", "", 0, 0, "", "")
        query = Query()
        response_obj = Response()
        model = Model(user, query, response_obj)
        user_data = db.get_user_data(user_id)
        if user_data:
            model.user.load_user_data(user_data)
        else:
            logger.error("User data not found for user_id: %s", user_id)
            return jsonify({'error': 'User data not found'}), 404
    else:
        try:
            model = Model.from_json(json_data)
        except Exception as e:
            logger.error("Deserialization error: %s", e)
            user = User("", "", "", 0, 0, "", "")
            query = Query()
            response_obj = Response()
            model = Model(user, query, response_obj)
            user_data = db.get_user_data(user_id)
            if user_data:
                model.user.load_user_data(user_data)
            else:
                logger.error("User data not found for user_id: %s", user_id)
                return jsonify({'error': 'User data not found'}), 404

    

    g.model = model

def save_model(response):
    if hasattr(g, 'model') and hasattr(g, 'model_key'):
        try:
            # Clear transient data before saving
            if hasattr(g.model, 'clear_transient_data'):
                g.model.clear_transient_data()
            else:
                g.model.user.clear_query()
                g.model.user.clear_response()
            redis_client.set(g.model_key, g.model.to_json())
        except Exception as e:
            logger.error("Error saving model to Redis: %s", e)

    # This will remove any existing CSP header (in case it was set by another middleware)
    response.headers.pop('Content-Security-Policy', None)
    
    # Set an extremely relaxed CSP for development - allowing ALL scripts and eval
    response.headers['Content-Security-Policy'] = (
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " 
        "script-src * 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plot.ly data: blob:; "
        "style-src * 'unsafe-inline' data: blob:; " 
        "img-src * data: blob:; " 
        "font-src * data: blob:; " 
        "connect-src * data: blob:; " 
        "media-src * data: blob:; " 
        "object-src * data: blob:; "
        "frame-src * data: blob:; "
    )
    
    # Log the final CSP header for debugging
    logger.info(f"Final CSP header: {response.headers.get('Content-Security-Policy')}")
    
    return response

# This ensures our CSP overrides others
def final_csp_check(response):
    if 'Content-Security-Policy' not in response.headers:
        # If CSP header was removed, add it back
        response.headers['Content-Security-Policy'] = (
            "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " 
            "script-src * 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plot.ly data: blob:; "
            "style-src * 'unsafe-inline' data: blob:; " 
            "img-src * data: blob:; " 
            "font-src * data: blob:; " 
            "connect-src * data: blob:; " 
            "media-src * data: blob:; " 
            "object-src * data: blob:; "
            "frame-src * data: blob:; "
        )
    return response

def init_hooks(app):
    app.before_request(load_model)
    # First apply save_model
    app.after_request(save_model)
    # Then make sure our CSP is the final one with a second handler
    app.after_request(final_csp_check)
