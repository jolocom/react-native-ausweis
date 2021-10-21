import { AccessRights, CardInfo } from './types'

export enum Messages {
  init = 'INIT',
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
}

export interface Message {
  msg: Messages
  error?: string
}

// NOTE: Is this even a thing?
export interface InitMessage extends Message {
  msg: Messages.init
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
  keypad: boolean
  card: CardInfo
}

export interface EnterPinMessage extends Message {
  msg: Messages.enterPin
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

export interface InsertCardMessage extends Message {
  msg: Messages.insertCard
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

export interface ReaderMessage extends Message {
  msg: Messages.reader
  attached: boolean
  keypad: boolean
  card: CardInfo
}
