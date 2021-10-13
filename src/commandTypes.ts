import { Message } from './messageTypes'
import { AccessRightsFields, CardInfo } from './types'

export interface EventHandlers {
  handlePinRequest: (cardInfo: CardInfo) => void
  handleCanRequest: (cardInfo: CardInfo) => void
  handlePukRequest: (cardInfo: CardInfo) => void
  handleCardInfo: (cardInfo: CardInfo) => void
  handleCardRequest: () => void
  handleAuthResult: (url: string) => void
}

export type Handler<T extends Message = Message> = (
  message: T,
  eventHandlers: Partial<EventHandlers>,
  callbacks: { resolve: Function; reject: Function },
) => T | void

export type HandlerDefinition<T extends Message> = {
  canHandle: Array<(message: T) => boolean>
  handle: Handler<T>
}

export interface CommandDefinition<T extends Message = Message> {
  command: { cmd: string; [x: string]: any }
  handler: HandlerDefinition<T>
}

export interface GetInfoCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'GET_INFO'
  }
}

export interface ScannerConfig {
  sessionStarted: string
  sessionFailed: string
  sessionSucceeded: string
  sessionInProgress: string
}

export interface RunAuthCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'RUN_AUTH'
    tcTokenURL: string
    handleInterrupt: boolean
    messages: ScannerConfig
  }
}

export interface ChangePinCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'RUN_CHANGE_PIN'
    handleInterrupt: boolean
    messages: ScannerConfig
  }
}

export interface EnterPukCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'SET_PUK'
    value: string
  }
}

export interface EnterCanCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'SET_CAN'
    value: string
  }
}

export interface EnterPinCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'SET_PIN'
    value: string
  }
}

export interface AcceptCommand<T extends Message> extends CommandDefinition<T> {
  command: {
    cmd: 'ACCEPT'
  }
}

export interface GetCertificateCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'GET_CERTIFICATE'
  }
}

export interface CancelCommand<T extends Message> extends CommandDefinition<T> {
  command: {
    cmd: 'CANCEL'
  }
}

export interface SetAccessRightsCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: 'SET_ACCESS_RIGHTS'
    chat: AccessRightsFields[]
  }
}
