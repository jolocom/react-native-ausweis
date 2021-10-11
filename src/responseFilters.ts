import { Message } from "./types"

export const selectors = {
  initMsg: (message: Message) => message.msg === "INIT",
  cmdSentMsg: (message: Message) => (message.msg = ""),
  infoMsg: (message: Message) => message.msg === "INFO",
  authMsg: (message: Message) => message.msg === "AUTH",
  accessRightsMsg: (message: Message) => message.msg === "ACCESS_RIGHTS",
  insertCardMsg: (message: Message) => message.msg === "INSERT_CARD",
  enterPinMsg: (message: Message) => message.msg === "ENTER_PIN",
  apiLvlMsg: (message: Message) => message.msg === "API_LEVEL",
  getCertificate: (message: Message) => message.msg === "CERTIFICATE",
}
