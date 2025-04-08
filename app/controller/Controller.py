from .InferenceHandler import InferenceHandler
class Controller:
    def __init__(self, inference_handler):
        self.model = None
        self.inference_handler = inference_handler
        
    def setModel(self, model):
        self.model = model
    
    def get_inference(self):
        data = self.generate_ohlcv_data_test()
        predictions_list = self.get_inference_handler_inference(data)
        # Add day attribute to jsons for plotly
        for i, pred in enumerate(predictions_list):
            pred['day'] = i + 1
        self.model.response.set_prediction_json(predictions_list)
        return predictions_list
    
    def get_prediction_json(self):
        return self.model.response.get_prediction_json()
    
    def generate_ohlcv_data_test(self):
        data = []
        for day in range(1, 366):
            # Generate simple OHLCV data
            open_val = round(100 + day * 0.1, 2)
            high_val = round(open_val + 5, 2)
            low_val = round(open_val - 3, 2)
            close_val = round(open_val + 2, 2)
            volume = 1000 + day * 10
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
        return self.inference_handler.inference(data)
