import { AccessRights, CardInfo } from './types'

export enum Messages {
  init = 'INIT',
  disconnect = 'DISCONNECT',
  apiLevel = 'API_LEVEL',
  badState = 'BAD_STATE',
  info = 'INFO',
  auth = 'AUTH',
  accessRights = 'ACCESS_RIGHTS',
  enterPin = 'ENTER_PIN',
  enterPuk = 'ENTER_PUK',
  enterCan = 'ENTER_CAN',
  insertCard = 'INSERT_CARD',
  certificate = 'CERTIFICATE',
  reader = 'READER',
  enterNewPin = 'ENTER_NEW_PIN',
  changePin = 'CHANGE_PIN',
  internalError = 'INTERNAL_ERROR',
  invalid = 'INVALID',
  readerList = 'READER_LIST',
  status = 'STATUS',
  unknownCommand = 'UNKNOWN_COMMAND',
}

export interface Message {
  msg: Messages
  error?: string
}

// NOTE: Is this even a thing?
export interface InitMessage extends Message {
  msg: Messages.init
}

// NOTE: Is this even a thing?
export interface DisconnectMessage extends Message {
  msg: Messages.disconnect
}

export interface ApiLevelMessage extends Message {
  msg: Messages.apiLevel
  available: number[]
  current: number
}

export interface BadStateMessage extends Message {
  msg: Messages.badState
  error: string
}

export interface InfoMessage extends Message {
  msg: Messages.info
  VersionInfo: {
    Name: string
    'Implementation-Title': string
    'Implementation-Vendor': string
    'Implementation-Version': string
    'Specification-Title': string
    'Specification-Vendor': string
    'Specification-Version': string
  }
}

//TODO: add proper type
export interface AuthMessage extends Message {
  msg: Messages.auth
  url?: string
  result?: {
    description?: string
    language?: string
    major: string
    message?: string
    minor?: string
    reason: string
  }
}

export interface AccessRightsMessage extends Message {
  msg: Messages.accessRights
  aux: {
    ageVerificationDate?: string
    requiredAge?: string
    validityDate?: string
    communityId?: string
  }
  chat: AccessRights
  transactionInfo?: string
  canAllowed?: boolean
}

interface ReaderInfo {
  name: string
  attached: boolean
  insertable: boolean
  keypad: boolean
  card: CardInfo | null
}

export interface EnterPinMessage extends Message {
  msg: Messages.enterPin
  reader: ReaderInfo
}

export interface EnterNewPinMessage extends Message {
  msg: Messages.enterNewPin
  reader: ReaderInfo
}

export interface EnterPukMessage extends Message {
  msg: Messages.enterPuk
  reader: ReaderInfo
}

export interface EnterCanMessage extends Message {
  msg: Messages.enterCan
  reader: ReaderInfo
}

export interface ChangePinMessage extends Message {
  msg: Messages.changePin
  success?: boolean
}

export interface InsertCardMessage extends Message {
  msg: Messages.insertCard
}

export interface InternalErrordMessage extends Message {
  msg: Messages.internalError
}

export interface InvalidMessage extends Message {
  msg: Messages.invalid
  error: string
}

interface CertificateDescription {
  issuerName: string
  issuerUrl: string
  subjectName: string
  subjectUrl: string
  termsOfUsage: string
  purpose: string
}

interface CertificateValidity {
  effectiveDate: string
  expirationDate: string
}

export interface CertificateMessage extends Message {
  msg: Messages.certificate
  description: CertificateDescription
  validity: CertificateValidity
}

export interface ReaderMessage extends Message, ReaderInfo {
  msg: Messages.reader
}

export interface ReaderListMessage extends Message {
  msg: Messages.readerList
  readers: Array<ReaderInfo>
}

export interface StatusMessage extends Message {
  msg: Messages.status
  workflow: string | null
  progress: number | null
  state: string | null
}

export interface UnkownCommandMessage extends Message {
  msg: Messages.unknownCommand
  error: string
}
