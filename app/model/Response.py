import json

class Response:
    def __init__(self):
        self.prediction_json = {}

    def set_prediction_json(self, prediction_json):
        self.prediction_json = prediction_json
    
    def get_prediction_json(self):
        return self.prediction_json


    def to_json(self):
        return {
            'prediction_json': self.prediction_json
        }
    
    @classmethod
    def from_json(cls, dict_obj):
        response = cls()
        response.prediction_json = dict_obj.get('prediction_json', {})
        return response
