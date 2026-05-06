export type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  dataUri: string;
  text?: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  attachments?: Attachment[];
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

export type ModelOption = {
  name: string;
  displayName?: string;
  description?: string;
};
