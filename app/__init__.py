from flask import Flask
import logging
from app.config import Config

def create_app():
    app = Flask(__name__)
    
    app.config.from_object(Config)
    
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
