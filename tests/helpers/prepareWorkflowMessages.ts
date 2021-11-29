import {
  ChangePinMessage,
  EnterCanMessage,
  EnterNewPinMessage,
  EnterPinMessage,
  EnterPukMessage,
  InsertCardMessage,
  Messages,
} from '../../src/messageTypes'
import { CardInfo } from '../../src/types'
import { makeReaderVariant } from './utils'

export type Msg =
  | EnterPinMessage
  | EnterNewPinMessage
  | EnterPukMessage
  | EnterCanMessage
  | ChangePinMessage
  | InsertCardMessage

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
  makeInsertCard() {
    this.messages.addMessage({ msg: Messages.insertCard })
    return this
  }
  makeEnterPin(cardProps?: Record<keyof CardInfo, CardInfo[keyof CardInfo]>) {
    this.messages.addMessage({
      msg: Messages.enterPin,
      ...makeReaderVariant(cardProps),
    })
    return this
  }
  makeEnterNewPin(
    cardProps?: Record<keyof CardInfo, CardInfo[keyof CardInfo]>,
  ) {
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
}

export const changePinFlow = new ChangePinWorkflowDirector(
  new MessagesSequenceBuilder(),
)
