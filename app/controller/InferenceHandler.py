import torch
import torch.nn as nn
from .inferenceFuncs import CryptoLSTM, model_predict_as_list
class InferenceHandler:
    def __init__(self):
        # For illustration, create a dummy model. In practice, load your actual model.
        self.model = CryptoLSTM(

            input_size=5,
            hidden_size=32,
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
        return model_predict_as_list(data, self.model, self.device)