import { AccessRightsMessage, ApiLevelMessage, AuthMessage, BadStateMessage, CertificateMessage, ChangePinMessage, EnterCanMessage, EnterNewPinMessage, EnterPinMessage, EnterPukMessage, InfoMessage, InitMessage, InsertCardMessage, Messages, ReaderMessage } from "./messageTypes";

export interface MessageEvents {
  [Messages.init]: (msg: InitMessage) => void,
  [Messages.apiLevel]: (msg: ApiLevelMessage) => void,
  [Messages.badState]: (msg: BadStateMessage) => void,
  [Messages.info]: (msg: InfoMessage) => void,
  [Messages.auth]: (msg: AuthMessage) => void,
  [Messages.accessRights]:(msg: AccessRightsMessage) => void,
  [Messages.enterPin]: (msg: EnterPinMessage) => void,
  [Messages.enterPuk]: (msg: EnterPukMessage) => void,
  [Messages.enterCan]: (msg: EnterCanMessage) => void,
  [Messages.insertCard]: (msg: InsertCardMessage) => void,
  [Messages.certificate]: (msg: CertificateMessage) => void,
  [Messages.reader]: (msg: ReaderMessage) => void,
  [Messages.enterNewPin]: (msg: EnterNewPinMessage) => void,
  [Messages.changePin]: (msg: ChangePinMessage) => void,
}
