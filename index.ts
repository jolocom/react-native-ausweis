// main index.js

//@ts-ignore
import { NativeModules } from 'react-native';

const { Aa2Sdk } = NativeModules;

export const initAa2Sdk = async () => {
  return Aa2Sdk.initAASdk();
};

export const getInfo = async () => {
  const getInfoCmd = {
    cmd: 'GET_INFO',
  };

  return sendCmd(getInfoCmd).then(() => waitTillCondition(filters.infoMsg));
};

export const runAuth = async (tcTokenUrl: string) => {
  const runAuthCmd = {
    cmd: 'RUN_AUTH',
    tcTokenURL: tcTokenUrl,
    handleInterrupt: true,
    messages: {
      sessionStarted:
        "Please place your ID card on the top of the device's back side.",
      sessionFailed: 'Scanning process failed.',
      sessionSucceeded: 'Scanning process has been finished successfully.',
      sessionInProgress: 'Scanning process is in progress.',
    },
  };

  return sendCmd(runAuthCmd).then(_ =>
    waitTillCondition(filters.accessRightsMsg),
  );
};

export const enterPin = async (pin: number) => {
  const enterPinMsg = {
    "cmd": "SET_PIN",
    "value": pin.toString()
  }

  return sendCmd(enterPinMsg).then(() => waitTillCondition(filters.authMsg))
}


export const checkIfCardWasRead = async () => {
  return waitTillCondition(filters.enterPinMsg)
}

export const acceptAuthRequest = async () => {
  const acceptCmd = {cmd: 'ACCEPT'};

  return sendCmd(acceptCmd).then(() =>
    waitTillCondition(filters.insertCardMsg),
  );
};

const delay = async (delay: number) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

interface Message {
  msg: string;
  error?: string;
}

type Filter = (messages: Message) => boolean;

export const filters = {
  infoMsg: (message: Message) => message.msg === 'INFO',
  authMsg: (message: Message) => message.msg === 'AUTH',
  accessRightsMsg: (message: Message) => message.msg === 'ACCESS_RIGHTS',
  insertCardMsg: (message: Message) => message.msg === 'INSERT_CARD',
  // TODO What about TAN?
  enterPinMsg: (message: Message) => message.msg === 'ENTER_PIN',
};

const waitTillCondition = async (filter: Filter) => {
  await delay(3000);
  return getEvents()
    .then(messages => (messages || []).filter(filter)[0])
    .then(message => {
      return message || waitTillCondition(filter);
    });
};

const sendCmd = async (message: Object): Promise<void> => {
  const res = await Aa2Sdk.sendCMD(JSON.stringify(message));
  if (!res) {
    throw new Error('TODO: Sending failed');
  }
  return;
};

export const getEvents = async (): Promise<Message[]> => {
  return Aa2Sdk.getNewEvents().then(events => {
    // Can be an array of strings, or an empty array
    if (events.length) {
      return events.map(JSON.parse);
    }
    return [];
  });
};
