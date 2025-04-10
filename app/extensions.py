import redis
import logging
from .controller.Controller import Controller
from .controller.dbHandler import dbHandler
from .controller.InferenceHandler import InferenceHandler
# Set up logging
logger = logging.getLogger(__name__)

# Global variables for extensions
redis_client = None
controller = None
db = None
inference_handler = None

def init_extensions(app):
    global redis_client, controller, db, inference_handler
    
    # Initialize Redis client
    try:
        redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
        logger.info("Redis client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Redis client: {e}")

    # Initialize inference handler
    inference_handler = InferenceHandler()
    logger.info("Inference handler initialized successfully")
    
    # Initialize controller
    controller = Controller(inference_handler)
    logger.info("Controller initialized successfully")
    
    # Initialize database handler and connect
    try:
        db = dbHandler()
        connected = db.connect_to_db()
        if connected:
            logger.info("Database connected successfully")
        else:
            logger.error("Failed to connect to database, but dbHandler was initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database handler: {e}")
    
    logger.info(f"Extension initialization complete. DB object: {db}")
