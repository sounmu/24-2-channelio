interface Block {
  type: string;
  language: string;
  value: string;
  blocks: any[];  // 블록 내의 값이 무엇인지에 따라 더 구체화할 수 있음
}

interface Button {
  title: string;
  colorVariant: string;
  url: string;
}

interface File {
  id: string;
  readonly name: string;
  type: string;
  size: number;
  contentType: string;
  duration: number;
  width: number;
  height: number;
  orientation: number;
  animated: boolean;
  bucket: string;
  key: string;
  previewKey: string;
  channelId: string;
  chatType: string;
  chatId: string;
}

interface WebPage {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  publisher: string;
  author: string;
  width: number;
  height: number;
  bucket: string;
  previewKey: string;
  logo: string;
  name: string;
}

interface Log {
  action: string;
  values: string[];
  triggerType: string;
  triggerId: string;
}

interface Reaction {
  emojiName: string;
  personKeys: string[];
}

interface Form {
  inputs: Array<{
    value: any;
    readOnly: boolean;
    type: string;
    label: string;
    dataType: string;
    bindingKey: string;
  }>;
  submittedAt: number;
  type: string;
}

interface Marketing {
  type: string;
  id: string;
  advertising: boolean;
  sendToOfflineXms: boolean;
  sendToOfflineEmail: boolean;
  exposureType: string;
}

interface SupportBot {
  id: string;
  revisionId: string;
  sectionId: string;
  stepIndex: number;
  buttons: Array<{
    text: string;
    nextSectionId: string;
  }>;
  submitButtonIndex: number;
}

interface Action {
  type: string;
  buttons: Array<{
    key: string;
    text: string;
  }>;
}

interface Submit {
  id: string;
  key: string;
}

interface Message {
  chatKey: string;
  id: string;
  mainKey: string;
  threadKey: string;
  root: boolean;
  channelId: string;
  chatType: string;
  chatId: string;
  personType: string;
  personId: string;
  requestId: string;
  language: string;
  createdAt: number;
  version: number;
  blocks: Block[];
  plainText: string;
  updatedAt: number;
  buttons: Button[];
  files: File[];
  webPage: WebPage;
  log: Log;
  reactions: Reaction[];
  form: Form;
  state: string;
  options: string[];
  marketing: Marketing;
  supportBot: SupportBot;
  action: Action;
  submit: Submit;
  threadMsg: boolean;
  broadcastedMsg: boolean;
  rootMessageId: string;
}

interface MesgApiResponse {
  prev: string;
  next: string;
  messages: Message[];
  bots: Array<{
    id: string;
    channelId: string;
    name: string;
    description: string;
    nameDescI18nMap: Record<string, { name: string; description: string }>;
    createdAt: number;
    avatar: {
      bucket: string;
      key: string;
      width: number;
      height: number;
    };
    color: string;
    avatarUrl: string;
  }>;
}

interface GroupChats {
  personId: string;
  plainText: string;
}

interface SummerizeApiRequest {
  data: GroupChats[];
  count: number;
}

export {
  MesgApiResponse,
  Message,
  SummerizeApiRequest, GroupChats
};
