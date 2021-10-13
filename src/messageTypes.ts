import { AccessRights, CardInfo } from './types'

export interface Message {
  msg: string
  error?: string
}

// NOTE: Is this even a thing?
export interface InitMessage extends Message {
  msg: 'INIT'
}

export interface ApiLevelMessage extends Message {
  msg: 'API_LEVEL'
}

export interface BadStateMessage extends Message {
  msg: 'BAD_STATE'
  error: string
}

export interface InfoMessage extends Message {
  msg: 'INFO'
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
  msg: 'AUTH'
  url?: string
}

export interface AccessRightsMessage extends Message {
  msg: 'ACCESS_RIGHTS'
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

//TODO: move outside of here
interface ReaderInfo {
  name: string
  attached: boolean
  keypad: boolean
  card: CardInfo
}

export interface EnterPinMessage extends Message {
  msg: 'ENTER_PIN'
  reader: ReaderInfo
}

export interface EnterPukMessage extends Message {
  msg: 'ENTER_PUK'
  reader: ReaderInfo
}

export interface EnterCanMessage extends Message {
  msg: 'ENTER_CAN'
  reader: ReaderInfo
}

export interface InsertCardMessage extends Message {
  msg: 'INSERT_CARD'
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
  msg: 'CERTIFICATE'
  description: CertificateDescription
  validity: CertificateValidity
}

export interface ReaderMessage extends Message {
  msg: 'READER'
  attached: boolean
  keypad: boolean
  card: CardInfo
}
