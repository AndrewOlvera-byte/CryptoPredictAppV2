import requests

def get_data_from_CG(coin_name):
    # Define the full endpoint URL for OHLC data for Bitcoin over the last 365 days
    url = f"https://api.coingecko.com/api/v3/coins/{coin_name}/ohlc"
    params = {
        "vs_currency": "usd",
        "days": "365"
    }
    # Make the API request
    response = requests.get(url, params=params)

    if response.status_code == 200:
        ohlc_data = response.json()
        # For example, you might want to print the first OHLC data point:
        print("First OHLC entry:", ohlc_data[0])
        return ohlc_data
    else:
        print("Error fetching data:", response.status_code)
        return None
