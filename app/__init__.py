from flask import Flask
from flask_talisman import Talisman
import logging
from app.config import Config

def create_app():
    app = Flask(__name__)
    
    app.config.from_object(Config)

    # Define a Plotly-friendly CSP
    csp = {
        'default-src': ['\'self\'', 'data:', 'blob:'],
        'script-src': ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\'', 'https://cdn.plot.ly'],
        'style-src': ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        'font-src': ['\'self\'', 'https://fonts.gstatic.com'],
        'img-src': ['\'self\'', 'data:', 'blob:'],
        'connect-src': ['\'self\''],
        'worker-src': ['\'self\'', 'blob:']
    }
    
    # Replace the current Talisman initialization
    talisman = Talisman(
        app,
        content_security_policy=csp,
        content_security_policy_nonce_in=['script-src']
    )
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.info("Starting application initialization")

    # Initialize extensions
    from app.extensions import init_extensions
    init_extensions(app)
    logger.info("Extensions initialized")

    # Register routes as a blueprint
    from app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    logger.info("Routes registered")

    # Register request hooks
    from app.hooks import init_hooks
    init_hooks(app)
    logger.info("Hooks initialized")

    return app
