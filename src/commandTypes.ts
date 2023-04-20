import { Message, StatusMessage } from './messageTypes'
import {
  AccessRightsFields,
  CardInfo,
  ScannerMessages,
  SimulatorData,
} from './types'

export enum Commands {
  init = 'INIT',
  disconnect = 'DISCONNECT',
  getInfo = 'GET_INFO',
  getStatus = 'GET_STATUS',
  getAPILevel = 'GET_API_LEVEL',
  setAPILevel = 'SET_API_LEVEL',
  getReader = 'GET_READER',
  getReaderList = 'GET_READER_LIST',
  runAuth = 'RUN_AUTH',
  runChangePin = 'RUN_CHANGE_PIN',
  getAccessRights = 'GET_ACCESS_RIGHTS',
  setAccessRights = 'SET_ACCESS_RIGHTS',
  setCard = 'SET_CARD',
  getCertificate = 'GET_CERTIFICATE',
  cancel = 'CANCEL',
  accept = 'ACCEPT',
  interrupt = 'INTERRUPT',
  setPin = 'SET_PIN',
  setNewPin = 'SET_NEW_PIN',
  setCan = 'SET_CAN',
  setPuk = 'SET_PUK',
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
  handleStatus: (status: StatusMessage) => void
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

export interface VoidCommandDefinition {
  command: { cmd: Commands; [x: string]: any }
}

export interface CommandDefinition<
  T extends Message = Message,
  R extends Message = Message,
> extends VoidCommandDefinition {
  handler: HandlerDefinition<T, R>
}

export interface InitCommand<T extends Message> extends CommandDefinition<T> {
  command: {
    cmd: Commands.init
  }
}

export interface DisconnectCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.disconnect
  }
}

export interface GetInfoCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getInfo
  }
}

export interface GetStatusCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getStatus
  }
}

export interface SetAPILevelCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.setAPILevel
    level: number
  }
}

export interface GetAPILevelCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getAPILevel
  }
}

export interface GetReaderCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getReader
    name: string
  }
}

export interface GetReaderListCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getReaderList
  }
}

export interface RunAuthCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.runAuth
    tcTokenURL: string
    developerMode?: boolean
    handleInterrupt?: boolean
    status?: boolean
    messages?: ScannerMessages
  }
}

export interface ChangePinCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.runChangePin
    handleInterrupt?: boolean
    status?: boolean
    messages?: ScannerMessages
  }
}

export interface GetAccessRightsCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.getAccessRights
  }
}

export interface SetAccessRightsCommand<T extends Message>
  extends CommandDefinition<T> {
  command: {
    cmd: Commands.setAccessRights
    chat: AccessRightsFields[]
  }
}

export interface SetCardCommand extends VoidCommandDefinition {
  command: {
    cmd: Commands.setCard
    name: string
    simulator: SimulatorData
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

export interface AcceptCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.accept
  }
}

export interface InterruptCommand extends VoidCommandDefinition {
  command: {
    cmd: Commands.interrupt
  }
}

export interface SetPinCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setPin
    value: string | undefined
  }
}

export interface SetNewPinCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setNewPin
    value?: string
  }
}

export interface SetCanCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setCan
    value: string
  }
}

export interface SetPukCommand<T extends Message, R extends Message>
  extends CommandDefinition<T, R> {
  command: {
    cmd: Commands.setPuk
    value: string
  }
}
