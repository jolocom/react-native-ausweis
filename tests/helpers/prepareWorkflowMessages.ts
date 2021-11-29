import {
  ChangePinMessage,
  EnterCanMessage,
  EnterNewPinMessage,
  EnterPinMessage,
  EnterPukMessage,
  InsertCardMessage,
  Messages,
} from '../../src/messageTypes'
import { CardProps } from '../../src/types'
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
  makeEnterPin(cardProps?: CardProps) {
    this.messages.addMessage({
      msg: Messages.enterPin,
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
}

export const changePinFlow = new ChangePinWorkflowDirector(
  new MessagesSequenceBuilder(),
)
