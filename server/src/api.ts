import axios from 'axios';
import type { GroupChats, SummerizeApiRequest, Message, SummarizeApiResponse } from './types';
import { response } from 'express';

require("dotenv").config();

async function getGroupChat(groupId: string) {

  // GET 요청 URL 생성
  const url = `https://api.channel.io/open/v5/groups/${groupId}/messages`;

  // 쿼리 파라미터 생성
  const params = {
    limit: 100,
    sortOrder: 'asc', // 'as' 값이 어떤 의미인지 확인 후 사용
  };

  const headers = {
    'x-access-key': process.env.API_ACCESS_KEY,
    'x-access-secret': process.env.API_ACCESS_SECRET,
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

    if (Array.isArray(response.data.messages)) {
      const groupChatsList: GroupChats[] = response.data.messages
        .filter((msg: Message) => msg.personType === 'manager' && msg.plainText !== undefined)  // personType이 'manager'이고 plainText가 정의된 메시지만 필터링
        .map((msg: Message) => ({
          personId: msg.personId,
          plainText: msg.plainText,
        }));

      console.log('제발제발요', groupChatsList);
      const result: SummerizeApiRequest = {
        data: groupChatsList,
        count: groupChatsList.length,
      }
      return result;
    } else {
      throw new Error("response.data.message is not an array or is undefined.");
    }
  } catch (error) {
    console.log(response);
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch messages");
  }
}

async function summarize(groupId: string) {
  const chatList: SummerizeApiRequest = await getGroupChat(groupId);
  const url = `http://127.0.0.1:8000/api/summarize`;

  try {
    const response = await axios.post(url, chatList);
    console.log(response.data); // FastAPI의 응답을 확인
    return response.data.output; // FastAPI 서버에서 `output`을 반환한다고 가정
  } catch (error) {
    console.error('Error communicating with FastAPI:', error);
    throw error;
  }

}

export { getGroupChat, summarize };
