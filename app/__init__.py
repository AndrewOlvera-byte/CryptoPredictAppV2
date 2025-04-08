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
    
    # If in debug mode, ensure our CSP is applied last by adding an additional
    # hook at the very end of initialization
    if app.debug:
        from app.hooks import final_csp_check
        # Explicitly add as the very last after_request handler
        app.after_request_funcs.setdefault(None, []).append(final_csp_check)
        logger.info("Added final CSP check for debug mode")

    return app
