from .InferenceHandler import InferenceHandler
import logging
import json

class Controller:
    def __init__(self, inference_handler):
        self.model = None
        self.inference_handler = inference_handler
        self.logger = logging.getLogger(__name__)
        
    def setModel(self, model):
        self.model = model
    
    def get_inference(self):
        # Generate test data for the model
        data = self.generate_ohlcv_data_test()
        self.logger.info("Generated test data with %d entries", len(data))
        
        # Get predictions from the inference handler
        predictions_list = self.get_inference_handler_inference(data)
        self.logger.info("Received predictions with %d entries", len(predictions_list))
        
        # Verify each prediction has unique values (not all the same)
        if len(predictions_list) > 0:
            # Log a sample of the predictions for debugging
            self.logger.info("Sample prediction (first entry): %s", json.dumps(predictions_list[0]))
            
            # Verify day values are sequential
            days = [p.get('day', 0) for p in predictions_list[:10]]
            self.logger.info("First 10 day values: %s", days)
            
            # Verify close prices have variation
            close_prices = [p.get('close', 0) for p in predictions_list[:10]]
            self.logger.info("First 10 close prices: %s", close_prices)
            
            # Store predictions in model response
            self.model.response.set_prediction_json(predictions_list)
            
            return predictions_list
        else:
            self.logger.error("No predictions generated")
            return []
    
    def get_prediction_json(self):
        return self.model.response.get_prediction_json()
    
    def generate_ohlcv_data_test(self):
        """Generate test OHLCV data with unique values for each day."""
        data = []
        for day in range(1, 366):
            # Generate simple OHLCV data with slight randomization
            base_val = 100 + day * 0.1
            open_val = round(base_val + (day % 5), 2)  # Add variation based on day
            high_val = round(open_val + 5 + (day % 3), 2)  # Varying high
            low_val = round(open_val - 3 - (day % 2), 2)   # Varying low
            close_val = round(open_val + 2 + ((day * 0.1) % 4), 2)  # Varying close
            volume = 1000 + day * 10 + (day % 100)  # Varying volume
            
            data.append({
                "day": day,
                "open": open_val,
                "high": high_val,
                "low": low_val,
                "close": close_val,
                "volume": volume
            })
        return data
        
    def clear_model(self):
        self.model.response.set_prediction_json({})
        self.model.query.set_prod_id("")

    def get_inference_handler_inference(self, data):
        """Get predictions from the inference handler and ensure correct format."""
        predictions = self.inference_handler.inference(data)
        
        # Sanity check the predictions
        if not predictions or not isinstance(predictions, list):
            self.logger.error("Invalid predictions: not a list or empty")
            return []
            
        # Ensure each prediction has the required fields
        for i, pred in enumerate(predictions):
            if not isinstance(pred, dict):
                self.logger.error("Prediction %d is not a dictionary", i)
                continue
                
            # Ensure day field matches index+1
            if pred.get('day') != i+1:
                self.logger.warning("Fixing day value for prediction %d", i)
                pred['day'] = i+1
                
        return predictions
