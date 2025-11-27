import requests
import json

# Test the chatbot API
url = "http://localhost:5000/api/chat"
headers = {"Content-Type": "application/json"}
data = {"message": "add a new player"}

response = requests.post(url, headers=headers, data=json.dumps(data))

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")