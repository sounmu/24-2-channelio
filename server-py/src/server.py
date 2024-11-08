from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
from pathlib import Path
from . import util
import json
from contextlib import asynccontextmanager


WAM_NAME = "wam_name"

async def start_server():
    access_token, _, _ = await util.request_issue_token()
    await util.register_command(access_token)

async def function_handler(body: dict):
    method = body.get("method")
    caller_id = body.get("context", {}).get("caller", {}).get("id")
    channel_id = body.get("context", {}).get("channel", {}).get("id")

    if method == "tutorial":
        return util.tutorial(WAM_NAME, caller_id, body.get("params", {}))
    elif method == "sendAsBot":
        params = body.get("params", {}).get("input", {})
        await util.send_as_bot(
            channel_id,
            params.get("groupId"),
            params.get("broadcast"),
            params.get("rootMessageId")
        )
        return {"result": {}}

@asynccontextmanager
async def lifespan(app):
    await start_server()
    yield

app = FastAPI(lifespan=lifespan)

@app.put("/functions")
async def functions(request: Request):
    body = await request.json()
    body_str = json.dumps(body, separators=(',', ':'))
    signature = request.headers.get("x-signature")
    
    if not signature or not util.verify_signature(signature, body_str):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    result = await function_handler(body)
    return JSONResponse(content=result)

# Static files for WAM
wam_path = Path(__file__).parent.parent.parent / "wam" / "dist"
if not wam_path.exists():
    print(f"Warning: WAM path does not exist: {wam_path}")

print(f"WAM path: {wam_path}")
app.mount(f"/resource/wam/{WAM_NAME}", StaticFiles(directory=str(wam_path)), name="wam") 
# app.mount("/resource/wam/{WAM_NAME}", StaticFiles(directory="../../wam/dist"), name="static")
