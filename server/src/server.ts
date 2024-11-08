import express, { Request, Response } from 'express';
import path from 'path';
import { requestIssueToken, registerCommand, sendAsBot, tutorial, verification, hello } from './util';
import { summarize, SummarizeInput } from './summarize';

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
        case 'hello':
            await hello(
                channelId,
                body.params.input.groupId,
                body.params.input.broadcast,
                body.params.input.rootMessageId
            );
            return ({ result: {} });
        case 'summarize':
            const plainText: SummarizeInput = {
                messages: body.params.input.plainText.messages
            };
            
            await summarize(
                channelId,
                body.params.input.groupId,
                body.params.input.userId,
                plainText
            );
            return ({ result: {} });
        case 'tutorial':
            return tutorial(WAM_NAME, callerId, body.params);
        case 'sendAsBot':
            await sendAsBot(
                channelId,
                body.params.input.groupId,
                body.params.input.broadcast,
                body.params.input.rootMessageId
            );
            return ({ result: {} });
    }
}

async function server() {
    try {
        await startServer();

        app.use(express.json());
        app.use(`/resource/wam/${WAM_NAME}`, express.static(path.join(__dirname, '../../wam/dist')));

        app.put('/functions', (req: Request, res: Response) => {
            console.log("req body" + JSON.stringify(req.body))
            if (typeof req.headers['x-signature'] !== 'string' || verification(req.headers['x-signature'], JSON.stringify(req.body)) === false) {
                res.status(401).send('Unauthorized');
            }
            functionHandler(req.body).then(result => {
                res.send(result);
            });
        });

        app.post('/summarize', async (req: Request, res: Response) => {
            try {
                const { channelId, groupId, userId, messages } = req.body;
                
                const plainText: SummarizeInput = {
                    messages: messages
                };

                const result = await summarize(
                    channelId,
                    groupId,
                    userId,
                    plainText
                );
                res.status(200).json(result);
            } catch (error: any) {
                console.error('API Error:', error);
                res.status(400).json({
                    error: error.message || 'An error occurred during summarization'
                });
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
