import pandas as pd
import os

script_directory = os.getcwd()
dataset = f"{script_directory}\Airports\T_MASTER_CORD.csv"
data = pd.read_csv(dataset)

filtered = data[data["AIRPORT_COUNTRY_NAME"] == "United States"]
filtered = filtered[filtered["AIRPORT_IS_CLOSED"] != 1]
filtered = filtered.drop_duplicates(subset=['AIRPORT'], keep="first")

filtered.to_csv('filtered_dataset.csv', index=False)
from IPython.display import FileLink
FileLink('filtered_dataset.csv')