import pandas as pd
import numpy as np
import torch
import torch.nn as nn

class CryptoLSTM(nn.Module):
    def __init__(self, input_size, hidden_size, output_size, num_layers=1, dropout=0.0, prediction_length=365):
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

def output_tensor_to_data(tensor):
    # Define the column names corresponding to the features.
    columns = ['open', 'high', 'low', 'close', 'volume']
    df = pd.DataFrame(tensor, columns=columns)
    json_str = df.to_json(orient='records')
    return json_str

def model_predict_as_list(json_data, model_instance, device):
    data_array = data_to_tensor(json_data)
    data_tensor = torch.tensor(data_array, dtype=torch.float32).unsqueeze(0).to(device)

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