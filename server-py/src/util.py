from typing import Tuple, Dict, Any
import os
import hmac
import hashlib
import base64
import httpx
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

channel_token_map: Dict[str, Tuple[str, str, float]] = {}

TUTORIAL_MSG = "This is a test message sent by a manager."
SEND_AS_BOT_MSG = "This is a test message sent by a bot."
BOT_NAME = "Bot"

DEFAULT_WAM_ARGS = ["rootMessageId", "broadcast", "isPrivate"]

async def get_channel_token(channel_id: str) -> Tuple[str, str]:
    if channel_id not in channel_token_map or channel_token_map[channel_id][2] < datetime.now().timestamp():
        access_token, refresh_token, expires_at = await request_issue_token(channel_id)
        channel_token_map[channel_id] = (access_token, refresh_token, expires_at)
        return access_token, refresh_token
    else:
        return channel_token_map[channel_id][0], channel_token_map[channel_id][1]

async def request_issue_token(channel_id: str = None) -> Tuple[str, str, float]:
    body = {
        "method": "issueToken",
        "params": {
            "secret": os.getenv("APP_SECRET"),
            "channelId": channel_id
        }
    }

    headers = {
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(os.getenv("APPSTORE_URL", ""), json=body, headers=headers)
        data = response.json()

    access_token = data["result"]["accessToken"]
    refresh_token = data["result"]["refreshToken"]
    expires_at = datetime.now().timestamp() + data["result"]["expiresIn"] - 5

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
        data = response.json()

    if "error" in data and data["error"] is not None:
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
                "plainText": SEND_AS_BOT_MSG,
                "botName": BOT_NAME
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
        data = response.json()

    if "error" in data and data["error"] is not None:
        raise Exception("send as bot error")

def verify_signature(signature: str, body: str) -> bool:
    key = bytes.fromhex(os.getenv("SIGNING_KEY", ""))
    hmac_obj = hmac.new(key, body.encode('utf-8'), hashlib.sha256)
    calculated_signature = base64.b64encode(hmac_obj.digest()).decode('utf-8')
    return hmac.compare_digest(calculated_signature, signature)

def tutorial(wam_name: str, caller_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    wam_args = {
        "message": TUTORIAL_MSG,
        "managerId": caller_id,
    }

    if params and isinstance(params.get("trigger"), dict):
        attributes = params["trigger"].get("attributes", {})
        if isinstance(attributes, dict):
            for k in DEFAULT_WAM_ARGS:
                if k in attributes:
                    wam_args[k] = attributes[k]

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