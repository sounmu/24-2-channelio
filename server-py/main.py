import uvicorn
from src.server import app  # app을 server.py에서 import

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
