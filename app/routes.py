from flask import Blueprint, render_template, session, request, jsonify, g, redirect, url_for
from app.extensions import controller, db
import logging

main = Blueprint('main', __name__)
logger = logging.getLogger(__name__)

@main.route('/')
def landing():
    return render_template('landing.html')

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username_email = request.form.get('username-email')
        password = request.form.get('password')
        if db.validate_user(username_email, password):
            session['user_id'] = db.get_user_id(username_email)
            session['username'] = db.get_username(username_email)
            logger.info("User %s logged in", session['user_id'])
            return jsonify({'success': True, 'message': 'Logged in successfully'}), 200
        else:
            logger.warning("Login failed for %s", username_email)
            return jsonify({'error': 'Invalid username/email or password'}), 401
    return render_template('login.html')

@main.route('/registration', methods=['GET', 'POST'])
def registration():
    if request.method == 'POST':
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')
        if db.create_user(username, password, email):
            logger.info("User %s created successfully", username)
            return jsonify({'success': True, 'message': 'User created successfully'}), 200
        else:
            logger.error("Failed to create user %s", username)
            return jsonify({'error': 'Failed to create user'}), 400
    return render_template('registration.html')

@main.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    # Dashboard page
    # POST request to get predictions
    controller.setModel(g.model)
    if request.method == 'POST':
        try:
            predictions_list = controller.get_inference()
            return jsonify({'response': predictions_list})
        except Exception as e:
            logger.error("Error generating response: %s", e)
            return jsonify({'error': 'Error generating response'}), 500
        finally:
            controller.clear_model()
    
    return render_template('dashboard.html', session=session)

@main.route('/chartTest', methods=['GET'])
def chartTest():
    return render_template('chartTest.html')
