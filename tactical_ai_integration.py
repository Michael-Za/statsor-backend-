import os
from dotenv import load_dotenv
from transformers import pipeline
import torch

# ===== SECURE KEY LOADING =====
load_dotenv()  # Load from .env file
HF_API_KEY = os.getenv("HF_API_KEY")  # Never commit .env to git!

# ===== LLAMA 3 SETUP =====
model_id = "meta-llama/Meta-Llama-3-8B-Instruct"

# Initialize pipeline with your key
llama_tactical = pipeline(
    "text-generation",
    model=model_id,
    device_map="auto",
    model_kwargs={
        "torch_dtype": torch.bfloat16,
        "token": HF_API_KEY  # Removed duplicate assignment and syntax error
    }
)

# ===== TACTICAL AI CHAT =====
messages = [
    {"role": "system", "content": "You are a professional football tactical AI assistant who provides expert analysis and strategic advice!"},
    {"role": "user", "content": "What tactical formation should I use?"},
]

# Generate response
output = llama_tactical(
    messages,
    max_new_tokens=100,
    eos_token_id=[
        llama_tactical.tokenizer.eos_token_id,
        llama_tactical.tokenizer.convert_tokens_to_ids("<|eot_id|>")
    ],
    temperature=0.7
)

# ===== CLEAN OUTPUT =====
response = output[0]["generated_text"][-1]["content"]
print(f"⚽ {response}")