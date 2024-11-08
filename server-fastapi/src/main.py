from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from route import router
from database import Base, engine

app = FastAPI()

origins = [
    "http://localhost:3000",
]

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Hello World"}