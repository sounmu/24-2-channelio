import express, { Request, Response } from 'express';
import path from 'path';
import { requestIssueToken, registerCommand, sendAsBot, tutorial, verification } from './util';
import { getGroupChat, getGroupChatByDate, summarize } from './api';
import { GroupChats, SummerizeApiRequest, SummarizeApiResponse } from './types';


require("dotenv").config();

const app = express();

const WAM_NAME = 'wam_name';

async function startServer() {
    const [accessToken, refreshToken, expiresAt]: [string, string, number] = await requestIssueToken();
    await registerCommand(accessToken);
}

async function functionHandler(body: any) {
    const method = body.method;
    const callerId = body.context.caller.id;
    const channelId = body.context.channel.id;
    console.log(body);
    switch (method) {
        case 'getGroupChat':
            const result = await getGroupChat(body.params.chat.id);
            return ({ result: { result } });
        case 'getGroupChatByDate':
            return getGroupChatByDate(body.params.chat.id, 1731087275272, 1731088930)
        case 'summarize':
            const sendAsBotMsg = await summarize(body.params.chat.id);
            await sendAsBot(
                sendAsBotMsg,
                channelId,
                body.params.chat.id,
                body.params.input.broadcast,
                body.params.input.rootMessageId
            );
            return ({ result: {} });
        case 'tutorial':
            return tutorial(WAM_NAME, callerId, body.params);
    }
}

async function server() {
    try {
        await startServer();

        app.use(express.json());
        app.use(`/resource/wam/${WAM_NAME}`, express.static(path.join(__dirname, '../../wam/dist')));

        app.put('/functions', async (req: Request, res: Response) => {
            console.log("req body: " + JSON.stringify(req.body));

            // 인증 실패 시 응답을 바로 반환하고, 이후 코드 실행을 중단
            if (typeof req.headers['x-signature'] !== 'string' || verification(req.headers['x-signature'], JSON.stringify(req.body)) === false) {
                return res.status(401).send('Unauthorized');
            }

            try {
                // functionHandler가 비동기 함수이므로 await을 사용하여 결과를 받음
                const result = await functionHandler(req.body);
                res.send(result);  // 응답을 한 번만 보내도록 처리
            } catch (error) {
                console.error('Function handler error:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running at http://localhost:${process.env.PORT}`);
        });
    } catch (error: any) {
        console.error('Error caught:', error);
    }
}


export { server };
