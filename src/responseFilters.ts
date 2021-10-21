import {
  AccessRightsMessage,
  ApiLevelMessage,
  AuthMessage,
  BadStateMessage,
  CertificateMessage,
  EnterCanMessage,
  EnterPinMessage,
  EnterPukMessage,
  InfoMessage,
  InitMessage,
  InsertCardMessage,
  Message,
  ReaderMessage,
} from './messageTypes'

export const selectors = {
  initMsg: (message: InitMessage) => message.msg === 'INIT',
  cmdSentMsg: (message: Message) => (message.msg = ''),
  infoMsg: (message: InfoMessage) => message.msg === 'INFO',
  authMsg: (message: AuthMessage) => message.msg === 'AUTH',
  accessRightsMsg: (message: AccessRightsMessage) =>
    message.msg === 'ACCESS_RIGHTS',
  insertCardMsg: (message: InsertCardMessage) => message.msg === 'INSERT_CARD',
  enterPinMsg: (message: EnterPinMessage) => message.msg === 'ENTER_PIN',
  enterPukMsg: (message: EnterPukMessage) => message.msg === 'ENTER_PUK',
  enterCanMsg: (message: EnterCanMessage) => message.msg === 'ENTER_CAN',
  apiLvlMsg: (message: ApiLevelMessage) => message.msg === 'API_LEVEL',
  getCertificate: (message: CertificateMessage) =>
    message.msg === 'CERTIFICATE',
  reader: (message: ReaderMessage) => message.msg === 'READER',
  badState: (message: BadStateMessage) => message.msg === 'BAD_STATE',
}
