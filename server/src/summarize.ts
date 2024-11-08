import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 타입 정의에 export 추가
export interface SummarizeInput {
  messages: string[];
}

export interface SummarizeOutput {
  channelId: string;
  groupId: string;
  summarizedText: string;
  createdAt: number;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Express 앱 설정
const app = express();
const PORT = process.env.PORT || 3000;

// JSON 파싱 미들웨어
app.use(express.json());

async function summarize(channelId: string, groupId: string, userId: string, plainText: SummarizeInput): Promise<SummarizeOutput> {
    try {
        const { messages } = plainText;

        // 입력값 검증
        if (!plainText) {
            throw new Error('plainText is required');
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            throw new Error('Invalid input: messages array is required.');
        }

        if (!channelId || !groupId || !userId) {
            throw new Error('channelId, groupId, and userId are required');
        }

        const prompt = `다음 대화 내용을 불릿 포인트로 요약해 주세요:\nText:"""${messages.join('\n')}"""`;

        /*const completion = await openai.chat.completions.create({
            model: 'gpt-40-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that summarizes conversations.' },
                { role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.5,
        });

        const messageContent = completion.choices[0]?.message?.content?.trim();

        if (!messageContent) {
            throw new Error('Failed to generate summary from OpenAI');
        }

        const summarizedText = messageContent.trim();*/

        const summarizedText = prompt;

        const response: SummarizeOutput = {
            channelId,
            groupId,
            summarizedText,
            createdAt: Date.now()
        };

        return response;
    } catch (error: any) {
        // 에러 객체를 더 자세하게 처리
        const errorMessage = error.message || 'Unknown error occurred';
        console.error('Summarize function error:', {
            error: errorMessage,
            channelId,
            groupId,
            userId
        });
        throw new Error(`Summarize failed: ${errorMessage}`);
    }
}    

export { summarize };