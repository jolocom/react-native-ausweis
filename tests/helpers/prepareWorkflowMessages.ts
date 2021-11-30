import {
  AccessRightsMessage,
  AuthMessage,
  CertificateMessage,
  ChangePinMessage,
  EnterCanMessage,
  EnterNewPinMessage,
  EnterPinMessage,
  EnterPukMessage,
  InsertCardMessage,
  Messages,
} from '../../src/messageTypes'
import { CardProps } from '../../src/types'
import { mockedAccessRightMessage, mockedCertificatesMessage } from './mockedMessages'
import { makeReaderVariant } from './utils'

export type Msg =
  | EnterPinMessage
  | EnterNewPinMessage
  | EnterPukMessage
  | EnterCanMessage
  | ChangePinMessage
  | InsertCardMessage
  | AuthMessage
  | AccessRightsMessage
  | CertificateMessage

class MessagesSequence {
  public result: Msg[][] = [[]]
  private activeSequence = 0

  addSequence() {
    this.result[++this.activeSequence] = []
  }

  addMessage(msg: Msg) {
    this.result[this.activeSequence].push(msg)
  }
}

export class MessagesSequenceBuilder {
  private messages: MessagesSequence
  constructor() {
    this.reset()
  }
  makeChangePin(success?: boolean) {
    this.messages.addMessage({ msg: Messages.changePin, success })
    return this
  }
  makeAuth(authProps?: Omit<AuthMessage, 'msg'>) {
    this.messages.addMessage({
      msg: Messages.auth,
      ...(authProps !== undefined && { ...authProps }),
    })
    return this
  }
  makeAccessRights() {
    // @ts-expect-error
    this.messages.addMessage(mockedAccessRightMessage)
    return this
  }
  makeCertificate() {
    // @ts-expect-error
    this.messages.addMessage(mockedCertificatesMessage)
    return this
  }
  makeInsertCard() {
    this.messages.addMessage({ msg: Messages.insertCard })
    return this
  }
  makeEnterPin(cardProps?: CardProps) {
    this.messages.addMessage({
      msg: Messages.enterPin,
      ...makeReaderVariant(cardProps),
    })
    return this
  }
  makeEnterCan(cardProps?: CardProps) {
    this.messages.addMessage({
      msg: Messages.enterCan,
      ...makeReaderVariant(cardProps),
    })
    return this
  }
  makeEnterPuk(cardProps?: CardProps) {
    this.messages.addMessage({
      msg: Messages.enterPuk,
      ...makeReaderVariant(cardProps),
    })
    return this
  }
  makeEnterNewPin(cardProps?: CardProps) {
    this.messages.addMessage({
      msg: Messages.enterNewPin,
      ...makeReaderVariant(cardProps),
    })
    return this
  }
  nextSequence() {
    this.messages.addSequence()
    return this
  }
  getResult() {
    const result = this.messages.result
    this.reset()
    return result
  }
  reset() {
    this.messages = new MessagesSequence()
  }
}

export class ChangePinWorkflowDirector {
  constructor(private builder: MessagesSequenceBuilder) {}
  buildHappyPath() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .makeEnterPin()
      .nextSequence()
      .makeInsertCard()
      .makeEnterNewPin()
      .nextSequence()
      .makeInsertCard()
      .makeChangePin(true)
      .getResult()
  }
  buildWithCancel() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .nextSequence()
      .makeChangePin(false)
      .getResult()
  }
  buildWithCancelAfterPin() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .makeEnterPin()
      .nextSequence()
      .makeInsertCard()
      .nextSequence()
      .makeChangePin(false)
      .getResult()
  }
  buildWithCardInPukState() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .makeEnterPuk({ retryCounter: 0 })
      .nextSequence()
      .makeInsertCard()
      .makeEnterPin()
      .nextSequence()
      .makeInsertCard()
      .makeChangePin(true)
      .getResult()
  }
  buildWithBlockedCard() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .makeEnterPuk({ retryCounter: 0 })
      .nextSequence()
      .makeInsertCard()
      .makeChangePin(false)
      .getResult()
  }
  buildWithCan() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .makeEnterCan({ retryCounter: 1 })
      .nextSequence()
      .makeInsertCard()
      .makeEnterPin({ retryCounter: 1 })
      .nextSequence()
      .makeInsertCard()
      .makeChangePin(true)
      .getResult()
  }
  buildForDisruptiveCmd() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .nextSequence()
      .makeEnterPin()
      .nextSequence() // CANCEL
      .makeChangePin(false)
      .getResult()
  }
  buildForQueuingCmd() {
    return this.builder
      .makeChangePin()
      .makeInsertCard()
      .nextSequence()
      .makeEnterCan()
      .nextSequence()
      .makeChangePin(true)
      .getResult()
  }
}

export const changePinFlow = new ChangePinWorkflowDirector(
  new MessagesSequenceBuilder(),
)

export class AuthWorkflowDirector {
  constructor(private builder: MessagesSequenceBuilder) {}
  private buildCommonSteps() {
    return this.builder
      .makeAuth()
      .makeAccessRights()
      .nextSequence() // cmd GET_CERTIFICATE
      .makeCertificate()
      .nextSequence() // cmd SET_ACCESS_RIGHT
      .makeAccessRights()
      .nextSequence() // cmd ACCEPT
      .makeInsertCard()
      .makeEnterPin()
  }
  buildHappyPath() {
    return this.buildCommonSteps()
      .nextSequence() // cmd SET_PIN
      .makeInsertCard()
      .makeAuth({ result: { major: 'ok' }, url: 'httpK//test.de' })
      .getResult()
  }
  buildWithCancel() {
    return this.buildCommonSteps()
      .nextSequence() // cmd SET_PIN; 1st wrong attempt
      .makeEnterPin({ retryCounter: 2 })
      .nextSequence() // cmd SET_PIN; 2nd wrong attempt
      .makeInsertCard()
      .makeEnterCan({ retryCounter: 1 })
      .nextSequence() // cmd SET_CAN
      .makeInsertCard()
      .makeEnterPin({ retryCounter: 1 })
      .nextSequence() // SET_PIN
      .makeInsertCard()
      .makeEnterPuk({ retryCounter: 0 })
      .nextSequence() // cmd ENTER_PUK
      .makeAuth({
        result: { major: 'error', message: 'You used PUK 10 times already' },
      })
      .getResult()
  }
}

export const authFlow = new AuthWorkflowDirector(new MessagesSequenceBuilder())
