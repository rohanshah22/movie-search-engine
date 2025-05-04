from fastapi import FastAPI

import json

app = FastAPI()

# Load your large inverted index once at startup
# with open("inverted_index.json", "r") as f:
#     INVERTED_INDEX = json.load(f)

@app.get("/search")
async def search(q: str):
    # Use INVERTED_INDEX in your search logic
    results = []  # Your search implementation here
    return {"results": results}