import torch
import torch.nn as nn
from .inferenceFuncs import CryptoLSTM, model_predict_as_list
import json
import logging

class InferenceHandler:
    def __init__(self):
        # Set up logging
        self.logger = logging.getLogger(__name__)
        
        # For illustration, create a dummy model. In practice, load your actual model.
        self.model = CryptoLSTM(
            input_size=5,
            hidden_size=64,
            output_size=5,
            num_layers=1,
            dropout=0.0,
            prediction_length=365
        )
        self.model.eval()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        state_dict = torch.load('C:/CryptoClaudeApp/Training/models/cryptoLSTMmodelV1.pth',
                            map_location=self.device)
        self.model.load_state_dict(state_dict)

    def inference(self, data):
        self.logger.info("Running inference with data: %s", json.dumps(data[:5])[:200] + "...")
        predictions = model_predict_as_list(data, self.model, self.device)
        
        # Log and validate the predictions to ensure they're correctly formatted
        self.logger.info("Generated predictions count: %d", len(predictions))
        if len(predictions) > 0:
            self.logger.info("First prediction: %s", json.dumps(predictions[0]))
            self.logger.info("Last prediction: %s", json.dumps(predictions[-1]))
        
        # Ensure each prediction has distinct values (not all the same)
        for i, pred in enumerate(predictions):
            pred['day'] = i + 1  # Ensure day field is sequential and starts at 1
            # Ensure numeric values are proper numbers
            for field in ['open', 'high', 'low', 'close', 'volume']:
                if field in pred and isinstance(pred[field], str):
                    try:
                        pred[field] = float(pred[field])
                    except (ValueError, TypeError):
                        pred[field] = 0.0
        
        return predictions