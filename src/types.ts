export interface Message {
  msg: string;
  error?: string;
  [k: string]: any
}

export type Filter = (messages: Message) => boolean;

export enum Events {
  error = 'onError',
  message = 'onMessage',
  sdkInitialized = 'onSdkInit',
  sdkDisconnected = 'onSdkDisconnect',
  commandSentSuccessfully = 'onCommandSentSuccessfully',
}
