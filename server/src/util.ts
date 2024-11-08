import axios from 'axios';
import * as crypto from 'crypto';


require("dotenv").config();

let channelTokenMap = new Map<string, [string, string, number]>();

const tutorialMsg = "This is a test message sent by a manager.";
const helloMsg = "Hellooo";
const botName = "제곧내";
const myName = "YOUNA";

const defaultWamArgs = ["rootMessageId", "broadcast", "isPrivate"];

async function getChannelToken(channelId: string): Promise<[string, string]> {
    const channelToken = channelTokenMap.get(channelId);
    if (channelToken === undefined || channelToken[2] < new Date().getTime() / 1000) {
        const [accessToken, refreshToken, expiresAt]: [string, string, number] = await requestIssueToken(channelId);
        channelTokenMap.set(channelId, [accessToken, refreshToken, expiresAt]);
        return [accessToken, refreshToken]
    }
    else {
        return [channelToken[0], channelToken[1]]
    }
}

async function requestIssueToken(channelId?: string): Promise<[string, string, number]> {
    let body = {
        method: 'issueToken',
        params: {
            secret: process.env.APP_SECRET,
            channelId: channelId
        }
    };

    const headers = {
        'Content-Type': 'application/json'
    };

    const response = await axios.put(process.env.APPSTORE_URL ?? '', body, { headers });
    console.log('response', response.data);
    const accessToken = response.data.result.accessToken;
    const refreshToken = response.data.result.refreshToken;
    const expiresAt = new Date().getTime() / 1000 + response.data.result.expiresIn - 5;

    return [accessToken, refreshToken, expiresAt];
}

async function refreshTokenRequest(channelId?: string): Promise<[string, string, number]> {
    let body = {
        method: 'refreshToken',
        params: {
            secret: process.env.APP_SECRET,
            channelId: channelId
        }
    };

    const response = await axios.put(process.env.APPSTORE_URL ?? '', body);
    const accessToken = response.data.result.accessToken;
    const new_refreshToken = response.data.result.refreshToken;
    const expiresAt = new Date().getTime() / 1000 + response.data.result.expiresIn - 5;

    return [accessToken, new_refreshToken, expiresAt];
}

async function registerCommand(accessToken: string) {
    const body = {
        method: "registerCommands",
        params: {
            appId: process.env.APP_ID,
            commands: [
                {
                    name: "tutorial",
                    scope: "desk",
                    description: "This is a desk command of App-tutorial",
                    actionFunctionName: "tutorial",
                    alfMode: "disable",
                    enabledByDefault: true,
                },
                {
                    name: "getGroupChat",
                    scope: "desk",
                    description: "This is a get Group Chat command",
                    actionFunctionName: "getGroupChat",
                    alfMode: "disable",
                    enabledByDefault: true,
                }, {
                    name: "getGroupChatByDate",
                    scope: "desk",
                    description: "This is a get Group Chat command In Some Period",
                    actionFunctionName: "getGroupChatByDate",
                    alfMode: "disable",
                    enabledByDefault: true,
                },
                {
                    name: "summarize",
                    scope: "desk",
                    description: "This is a summarize command",
                    actionFunctionName: "summarize",
                    alfMode: "disable",
                    enabledByDefault: true,
                }
            ]
        }
    };

    const headers = {
        'x-access-token': accessToken,
        'Content-Type': 'application/json'
    };

    const response = await axios.put(process.env.APPSTORE_URL ?? '', body, { headers });

    if (response.data.error != null) {
        throw new Error("register command error");
    }
}

async function sendAsBot(sendAsBotMsg: string, channelId: string, groupId: string, broadcast: boolean, rootMessageId?: string) {
    const body = {
        method: "writeGroupMessage",
        params: {
            channelId: channelId,
            groupId: groupId,
            rootMessageId: rootMessageId,
            broadcast: broadcast,
            dto: {
                plainText: sendAsBotMsg,
                botName: botName
            }
        }
    }

    const channelToken = await getChannelToken(channelId);

    const headers = {
        'x-access-token': channelToken[0],
        'Content-Type': 'application/json'
    };

    const response = await axios.put(process.env.APPSTORE_URL ?? '', body, { headers });

    if (response.data.error != null) {
        throw new Error("send as bot error");
    }
}

async function hello(groupId: string) {

    // GET 요청 URL 생성
    const url = `https://api.channel.io/open/v5/groups/${groupId}/messages`;

    // 쿼리 파라미터 생성
    const params = {
        // since: 2411080000, // 이 값을 실제로 설정해야 할 것으로 보입니다. 
        limit: 100,
        sortOrder: 'asc', // 'as' 값이 어떤 의미인지 확인 후 사용
    };

    const headers = {
        'x-access-key': '672e14424568d272813c',
        'x-access-secret': "4dc86e44a6b9cd524f6bf2d183921d3f",
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.get(url, {
            params: params,  // URL 쿼리 파라미터 추가
            headers: headers
        });

        // 에러 처리 (API 응답에 에러가 있는 경우)
        if (response.data.error != null) {
            throw new Error("User chat ERRORRRRR");
        }
        console.log('정신차려', response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw new Error("Failed to fetch messages");
    }
}


function verification(x_signature: string, body: string): boolean {
    const key: crypto.KeyObject = crypto.createSecretKey(Buffer.from(process.env.SIGNING_KEY ?? '', 'hex'));
    const mac = crypto.createHmac('sha256', key);
    mac.update(body, 'utf8');

    const signature: string = mac.digest('base64');
    return signature === x_signature;
}

function tutorial(wamName: string, callerId: string, params: any) {
    const wamArgs = {
        message: tutorialMsg,
        managerId: callerId,
    } as { [key: string]: any }

    if (params.trigger.attributes) {
        defaultWamArgs.forEach(k => {
            if (k in params.trigger.attributes) {
                wamArgs[k] = params.trigger.attributes[k]
            }
        })
    }

    return ({
        result: {
            type: "wam",
            attributes: {
                appId: process.env.APP_ID,
                name: wamName,
                wamArgs: wamArgs,
            }
        }
    });
}

export { requestIssueToken, registerCommand, sendAsBot, tutorial, verification, hello };
