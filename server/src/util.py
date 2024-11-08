import httpx
import os
import time
import hmac
import hashlib
import base64
import json
from dotenv import load_dotenv

load_dotenv()

channel_token_map = {}

tutorial_msg = "This is a test message sent by a manager."
send_as_bot_msg = "This is a test message sent by a bot."
hello_msg = "Hellooo"
bot_name = "Bot"
my_name = "YOUNA"
default_wam_args = ["rootMessageId", "broadcast", "isPrivate"]

async def get_channel_token(channel_id: str):
    current_time = time.time()
    channel_token = channel_token_map.get(channel_id)

    if channel_token is None or channel_token[2] < current_time:
        access_token, refresh_token, expires_at = await request_issue_token(channel_id)
        channel_token_map[channel_id] = (access_token, refresh_token, expires_at)
        return access_token, refresh_token
    else:
        return channel_token[0], channel_token[1]

async def request_issue_token(channel_id: str = None):
    body = {
        "method": "issueToken",
        "params": {
            "secret": os.getenv("APP_SECRET"),
            "channelId": channel_id
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(os.getenv("APPSTORE_URL", ""), json=body)
        response_data = response.json()

    access_token = response_data["result"]["accessToken"]
    refresh_token = response_data["result"]["refreshToken"]
    expires_at = time.time() + response_data["result"]["expiresIn"] - 5
    return access_token, refresh_token, expires_at

async def register_command(access_token: str):
    body = {
        "method": "registerCommands",
        "params": {
            "appId": os.getenv("APP_ID"),
            "commands": [
                {
                    "name": "tutorial",
                    "scope": "desk",
                    "description": "This is a desk command of App-tutorial",
                    "actionFunctionName": "tutorial",
                    "alfMode": "disable",
                    "enabledByDefault": True,
                }
            ]
        }
    }

    headers = {
        "x-access-token": access_token,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(os.getenv("APPSTORE_URL", ""), json=body, headers=headers)
        response_data = response.json()

    if "error" in response_data:
        raise Exception("register command error")

async def send_as_bot(channel_id: str, group_id: str, broadcast: bool, root_message_id: str = None):
    body = {
        "method": "writeGroupMessage",
        "params": {
            "channelId": channel_id,
            "groupId": group_id,
            "rootMessageId": root_message_id,
            "broadcast": broadcast,
            "dto": {
                "plainText": send_as_bot_msg,
                "botName": bot_name
            }
        }
    }

    access_token, _ = await get_channel_token(channel_id)
    headers = {
        "x-access-token": access_token,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(os.getenv("APPSTORE_URL", ""), json=body, headers=headers)
        response_data = response.json()

    if "error" in response_data:
        raise Exception("send as bot error")

async def hello(channel_id: str, group_id: str, broadcast: bool, root_message_id: str = None):
    body = {
        "method": "writeGroupMessage",
        "params": {
            "channelId": channel_id,
            "groupId": group_id,
            "rootMessageId": root_message_id,
            "broadcast": broadcast,
            "dto": {
                "plainText": hello_msg,
                "botName": my_name
            }
        }
    }

    access_token, _ = await get_channel_token(channel_id)
    headers = {
        "x-access-token": access_token,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(os.getenv("APPSTORE_URL", ""), json=body, headers=headers)
        response_data = response.json()

    if "error" in response_data:
        raise Exception("hello error")



def verification(x_signature: str, body: dict) -> bool:
    # SIGNING_KEY 가져오기
    key = bytes.fromhex(os.getenv("SIGNING_KEY", ""))
    
    # JSON 직렬화 및 서명 생성
    body_str = json.dumps(body, sort_keys=True)  # sort_keys=True로 키 순서 일관성 유지
    mac = hmac.new(key, body_str.encode("utf-8"), hashlib.sha256)
    
    # URL-safe Base64 인코딩을 사용
    signature = base64.urlsafe_b64encode(mac.digest()).decode()  # URL-safe Base64 인코딩

    print(f"Expected signature: {signature}")
    print(f"Received x_signature: {x_signature}")

    return signature == x_signature



def tutorial(wam_name: str, caller_id: str, params: dict):
    wam_args = {
        "message": tutorial_msg,
        "managerId": caller_id,
    }

    if "trigger" in params and "attributes" in params["trigger"]:
        for k in default_wam_args:
            if k in params["trigger"]["attributes"]:
                wam_args[k] = params["trigger"]["attributes"][k]

    return {
        "result": {
            "type": "wam",
            "attributes": {
                "appId": os.getenv("APP_ID"),
                "name": wam_name,
                "wamArgs": wam_args,
            }
        }
    }
