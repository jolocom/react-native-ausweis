export interface Message {
  msg: string;
  error?: string;
  [k: string]: any
}

export type Filter = (messages: Message) => boolean;
