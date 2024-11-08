import axios from 'axios';
import * as crypto from 'crypto';
import type { GroupChats, SummerizeApiRequest, Message } from './types';

require("dotenv").config();

let channelTokenMap = new Map<string, [string, string, number]>();

const tutorialMsg = "This is a test message sent by a manager.";
const sendAsBotMsg = "This is a test message sent by a bot.";
const helloMsg = "Hellooo";
const botName = "Bot";
const myName = "YOUNA";

const defaultWamArgs = ["rootMessageId", "broadcast", "isPrivate"];

async function getGroupChat(groupId: string) {

  // GET 요청 URL 생성
  const url = `https://api.channel.io/open/v5/groups/${groupId}/messages`;

  // 쿼리 파라미터 생성
  const params = {
    limit: 100,
    sortOrder: 'asc', // 'as' 값이 어떤 의미인지 확인 후 사용
  };

  const headers = {
    'x-access-key': '672e3225d9e028e83858',
    'x-access-secret': "ed94bedcb865580d614728e436b4b2ed",
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
      console.log('누구냐', response.data);
      throw new Error("response.data.message is not an array or is undefined.");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch messages");
  }
}

export { getGroupChat };
