import requests
import json

# Test the chatbot API with an agent action
url = "http://localhost:5000/api/chat"
headers = {"Content-Type": "application/json"}
data = {"message": "schedule a match against Real Madrid"}

response = requests.post(url, headers=headers, data=json.dumps(data))

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")