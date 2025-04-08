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
        user = User("", "", "")
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

    # Set an extremely relaxed CSP for development
    response.headers['Content-Security-Policy'] = (
        "default-src * data: blob:; " 
        "script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; " 
        "style-src * data: blob: 'unsafe-inline'; " 
        "img-src * data: blob:; " 
        "font-src * data: blob:; " 
        "connect-src * data: blob:; " 
        "media-src * data: blob:; " 
        "object-src * data: blob:; "
    )
    return response

def init_hooks(app):
    app.before_request(load_model)
    app.after_request(save_model)
