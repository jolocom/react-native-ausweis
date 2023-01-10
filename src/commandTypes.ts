import { Message } from './messageTypes'
import { AccessRightsFields, CardInfo, ScannerConfig } from './types'

export enum Commands {
  init = 'INIT',
  getInfo = 'GET_INFO',
  runAuth = 'RUN_AUTH',
  runChangePin = 'RUN_CHANGE_PIN',
  setPuk = 'SET_PUK',
  setCan = 'SET_CAN',
  setPin = 'SET_PIN',
  accept = 'ACCEPT',
  getCertificate = 'GET_CERTIFICATE',
  cancel = 'CANCEL',
  setAccessRights = 'SET_ACCESS_RIGHTS',
  setNewPin = 'SET_NEW_PIN',
}

export const disruptiveCommands = [Commands.cancel]

export interface EventHandlers {
  handlePinRequest: (cardInfo: CardInfo) => void
  handleCanRequest: (cardInfo: CardInfo) => void
  handlePukRequest: (cardInfo: CardInfo) => void
  handleCardInfo: (cardInfo: CardInfo) => void
  handleCardRequest: () => void
  handleAuthFailed: (url: string, message: string) => void
  handleAuthSuccess: (url: string) => void
  handleEnterNewPin: () => void
  handleChangePinCancel: () => void
  handleChangePinSuccess: () => void
}

export type Handler<T extends Message, R extends Message = T> = (
  message: T | R,
  eventHandlers: Partial<EventHandlers>,
  callbacks: { resolve: Function; reject: Function },
) => T | R | void

export type HandlerDefinition<T extends Message, R extends Message = T> = {
  canHandle: Array<T['msg']> | Array<R['msg']>
  handle: Handler<T, R>
}

export interface CommandDefinition<
  T extends Message = Message,
  R extends Message = Message,
> {
  command: { cmd: Commands; [x: string]: any }
  handler: HandlerDefinition<T, R>
}

export interface InitCommand<T extends Message> extends CommandDefinition<T> {
  command: {
    cmd: Commands.init
  }
}

export interface GetInfoCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getInfo
  }
}

export interface RunAuthCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.runAuth
    tcTokenURL: string
    handleInterrupt: boolean
    messages: ScannerConfig
  }
}

export interface ChangePinCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.runChangePin
    handleInterrupt: boolean
    messages: ScannerConfig
  }
}

export interface EnterPukCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setPuk
    value: string
  }
}

export interface EnterCanCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setCan
    value: string
  }
}

export interface EnterPinCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setPin
    value: string
  }
}

export interface AcceptCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.accept
  }
}

export interface GetCertificateCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getCertificate
  }
}

export interface CancelCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.cancel
  }
}

export interface SetAccessRightsCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.setAccessRights
    chat: AccessRightsFields[]
  }
}

export interface SetNewPinCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setNewPin
    value: string
  }
}
