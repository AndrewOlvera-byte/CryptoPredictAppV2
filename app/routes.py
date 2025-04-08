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
    session['last_5_responses'] = db.get_last_5_responses(session['user_id'])
    if request.method == 'POST':
        prod_id = request.form.get('prod_id')
        if g.model.hasQueries():
            try:
                predictions_list = controller.get_inference()
                db.add_response_to_db(session['user_id'], prod_id, predictions_list)
                return jsonify({'response': predictions_list})
            except Exception as e:
                logger.error("Error generating response: %s", e)
                return jsonify({'error': 'Error generating response'}), 500
            finally:
                controller.clear_model()
        else:
            return jsonify({'error': 'No queries available, please wait until your query limit is reset'}), 400
    
    return render_template('dashboard.html', session=session)

@main.route('/chartTest', methods=['GET'])
def chartTest():
    return render_template('chartTest.html')

@main.route('/profile', methods=['GET', 'POST'])
def profile():
    return render_template('profile.html', session=session)

@main.route('/history', methods=['GET'])
def history():
    return render_template('history.html', session=session)

@main.route('/api/update_username', methods=['GET', 'POST'])
def update_username():
    if request.method == 'POST':
        username = request.form.get('username')
        try:
            db.update_username(username)
            return jsonify({'success': True, 'message': 'Username updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid request method'}), 405

@main.route('/api/update_password', methods=['GET', 'POST'])
def update_password():
    if request.method == 'POST':
        password = request.form.get('password')
        try:
            db.update_password(password)
            return jsonify({'success': True, 'message': 'Password updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid request method'}), 405

@main.route('/api/update_email', methods=['GET', 'POST'])
def update_email():
    if request.method == 'POST':
        email = request.form.get('email')
        try:
            db.update_email(email)
            return jsonify({'success': True, 'message': 'Email updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid request method'}), 405

@main.route('/api/update_subscription', methods=['GET', 'POST'])
def update_subscription():
    if request.method == 'POST':
        subscription = request.form.get('subscription')
        try:
            db.update_subscription(subscription)
            return jsonify({'success': True, 'message': 'Subscription updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid request method'}), 405

