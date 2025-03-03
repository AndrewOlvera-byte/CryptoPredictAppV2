import pandas as pd
import numpy as np
import torch
import torch.nn as nn
# ------------------------------------------------------------
#Copied from CryptoLSTM.py
# ------------------------------------------------------------
# Model parameters (using 5 features)
input_size = 5         # Number of features: open, high, low, close, volume
hidden_size = 64
output_size = 5        # Must match input_size
num_layers = 1
dropout = 0.1
seq_length = 365       # One year of historical data
prediction_length = 365  # Predict one year into the future
batch_size = 256
num_epochs = 10
learning_rate = 0.001


class CryptoLSTM(nn.Module):
    def __init__(self, input_size, hidden_size, output_size, num_layers=1, dropout=0.0, prediction_length=365):
        """
        Initializes the CryptoLSTM model.

        Args:
            input_size (int): Number of input features.
            hidden_size (int): Number of features in the hidden state.
            output_size (int): Number of output features.
            num_layers (int): Number of recurrent layers.
            dropout (float): Dropout probability between LSTM layers.
            prediction_length (int): Number of future timesteps to predict.
        """
        super(CryptoLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.prediction_length = prediction_length

        # Encoder LSTM: processes the historical input sequence.
        self.encoder = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True
        )

        # Decoder LSTM: generates the future sequence one timestep at a time.
        # It takes the previous prediction as input.
        self.decoder = nn.LSTM(
            input_size=output_size,  # Because we feed in the previous output
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True
        )

        # Fully connected layer: maps the hidden state to the output features.
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        """
        Forward pass of the model.

        Args:
            x: Tensor of shape (batch_size, sequence_length, input_size)
               representing the historical data.

        Returns:
            outputs: Tensor of shape (batch_size, prediction_length, output_size)
                     representing the predicted future sequence.
        """
        batch_size = x.size(0)

        # Encode the historical sequence; only use the final hidden and cell states.
        _, (h, c) = self.encoder(x)

        # Initialize the decoder input with zeros.
        # Shape: (batch_size, 1, output_size)
        decoder_input = torch.zeros(batch_size, 1, self.fc.out_features, device=x.device)

        outputs = []
        # Generate predictions for each future timestep.
        for _ in range(self.prediction_length):
            decoder_output, (h, c) = self.decoder(decoder_input, (h, c))
            pred = self.fc(decoder_output)  # Shape: (batch_size, 1, output_size)
            outputs.append(pred)
            decoder_input = pred  # Use current prediction as next input

        outputs = torch.cat(outputs, dim=1)  # (batch_size, prediction_length, output_size)
        return outputs


def data_to_tensor(json_data):
    """
    Converts JSON data into a NumPy array suitable for LSTM inference.

    Parameters:
        json_data (list of dict): JSON data where each dict has keys 'open', 'high', 'low', 'close', 'volume'

    Returns:
        np.ndarray: A NumPy array with shape (365, 5) where each row is a timestep.
    """
    print("Data received:", json_data)
    df = pd.DataFrame(json_data)
    print("DataFrame columns:", df.columns)

    # Expected features: 'open', 'high', 'low', 'close', 'volume'
    features = ['open', 'high', 'low', 'close', 'volume']
    if not all(col in df.columns for col in features):
        raise ValueError("Input data does not contain the required columns: " + str(features))
    df_selected = df[features].copy()

    # Convert the DataFrame to a NumPy array.
    data_array = df_selected.to_numpy()

    # Ensure that the data has exactly 365 timesteps.
    num_rows, num_features = data_array.shape
    if num_rows < 365:
        # Create a padding array of zeros for the missing timesteps.
        padding = np.zeros((365 - num_rows, num_features))
        data_array = np.concatenate([padding, data_array], axis=0)
    elif num_rows > 365:
        # Take the last 365 rows.
        data_array = data_array[-365:, :]

    return data_array


def model_predict(json_data):
    """
    Uses the CryptoLSTM model to make predictions based on the input JSON data.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    data_array = data_to_tensor(json_data)
    # Convert to tensor and add a batch dimension (resulting shape: (1, 365, 5))
    data_tensor = torch.tensor(data_array, dtype=torch.float32).unsqueeze(0).to(device)

    # Initialize the model with input_size=5 and output_size=5.
    model_instance = CryptoLSTM(
        input_size=input_size,
        hidden_size=hidden_size,
        output_size=output_size,
        num_layers=num_layers,
        dropout=dropout,
        prediction_length=prediction_length
    )
    model_instance.to(device)
    # Load the state dictionary (ensure the saved model matches this architecture)
    state_dict = torch.load('C:/CryptoClaudeApp/Training/models/cryptoLSTMmodelV1.pth', map_location=device)
    model_instance.load_state_dict(state_dict)
    model_instance.eval()

    predictions = model_instance(data_tensor)
    return predictions


def output_tensor_to_data(tensor):
    """
    Converts a NumPy array (tensor) with shape (prediction_length, output_size) into a JSON string.

    Parameters:
        tensor (np.ndarray): A NumPy array with shape (prediction_length, output_size).

    Returns:
        str: A JSON string where each row is represented as a dictionary with keys:
             'open', 'high', 'low', 'close', 'volume'.
    """
    # Define the column names corresponding to the features.
    columns = ['open', 'high', 'low', 'close', 'volume']
    df = pd.DataFrame(tensor, columns=columns)
    json_str = df.to_json(orient='records')
    return json_str


def get_prediction_output(json_data):
    """
    Generates predictions using the model from JSON input data and returns the predictions as a JSON string.
    """
    predictions = model_predict(json_data)
    # Remove the batch dimension and convert the predictions to a NumPy array.
    predictions_np = predictions.squeeze(0).detach().cpu().numpy()
    return output_tensor_to_data(predictions_np)

def model_predict_as_list(json_data):
    """
    A convenience function that:
      1) Converts input JSON data -> NumPy array -> PyTorch tensor
      2) Runs inference
      3) Converts the predictions to a Python list of dictionaries
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    data_array = data_to_tensor(json_data)
    data_tensor = torch.tensor(data_array, dtype=torch.float32).unsqueeze(0).to(device)

    model_instance = CryptoLSTM(
        input_size=5,
        hidden_size=64,
        output_size=5,
        num_layers=1,
        dropout=0.1,
        prediction_length=365
    ).to(device)

    state_dict = torch.load('C:/CryptoClaudeApp/Training/models/cryptoLSTMmodelV1.pth',
                            map_location=device)
    model_instance.load_state_dict(state_dict)
    model_instance.eval()

    predictions = model_instance(data_tensor)
    predictions_np = predictions.squeeze(0).detach().cpu().numpy()  # shape: (365, 5)

    # Convert predictions_np to a list of dicts
    columns = ['open', 'high', 'low', 'close', 'volume']
    df = pd.DataFrame(predictions_np, columns=columns)
    # If you want a 'day' field, re-add it:
    df.insert(0, 'day', range(1, len(df) + 1))

    # Convert to list of dicts
    python_list = df.to_dict(orient='records')
    return python_list