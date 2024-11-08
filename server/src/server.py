from fastapi import FastAPI, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import os
import json
from dotenv import load_dotenv
from src.util import request_issue_token, register_command, send_as_bot, tutorial, verification, hello

load_dotenv()  # .env 파일의 환경 변수 로드

app = FastAPI()
WAM_NAME = 'wam_name'

class BodyParams(BaseModel):
    input: dict

class BodyContext(BaseModel):
    caller: dict
    channel: dict

class Body(BaseModel):
    method: str
    params: BodyParams
    context: BodyContext

async def start_server():
    access_token, refresh_token, expires_at = await request_issue_token()
    await register_command(access_token)

async def function_handler(body: Body):
    method = body.method
    caller_id = body.context.caller['id']
    channel_id = body.context.channel['id']

    if method == 'hello':
        await hello(
            channel_id,
            body.params.input['groupId'],
            body.params.input['broadcast'],
            body.params.input['rootMessageId']
        )
        return {"result": {}}
    elif method == 'tutorial':
        return tutorial(WAM_NAME, caller_id, body.params)
    elif method == 'sendAsBot':
        await send_as_bot(
            channel_id,
            body.params.input['groupId'],
            body.params.input['broadcast'],
            body.params.input['rootMessageId']
        )
        return {"result": {}}

@app.put("/functions")
async def functions(request: Request, x_signature: Optional[str] = Header(None)):
    body = await request.json()
    if not x_signature or not verification(x_signature, json.dumps(body)):
        raise HTTPException(status_code=401, detail="Unauthorized")
    result = await function_handler(Body(**body))
    return result

@app.on_event("startup")
async def on_startup():
    await start_server()
