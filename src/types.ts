import { Message } from './messageTypes'

export type Filter<T extends Message> = (messages: T) => boolean

export enum Events {
  error = 'onError',
  message = 'onMessage',
  sdkInitialized = 'onSdkInit',
  sdkDisconnected = 'onSdkDisconnect',
  commandSentSuccessfully = 'onCommandSentSuccessfully',
}

export type IncorrectPinResponse = {
  required: 'pin' | 'can' | 'puk'
  triesLeft: number
}

export type CardInfo = {
  inoperative: boolean
  deactivated: boolean
  retryCounter: number
}

export enum AccessRightsFields {
  Address = 'Address',
  BirthName = 'BirthName',
  FamilyName = 'FamilyName',
  GivenNames = ' GivenNames',
  PlaceOfBirth = 'PlaceOfBirth',
  DateOfBirth = 'DateOfBirth',
  DoctoralDegree = 'DoctoralDegree',
  ArtisticName = 'ArtisticName',
  Pseudonym = 'Pseudonym',
  ValidUntil = 'ValidUntil',
  Nationality = 'Nationality',
  IssuingCountry = 'IssuingCountry',
  DocumentType = 'DocumentType',
  ResidencePermitI = 'ResidencePermitI',
  ResidencePermitII = 'ResidencePermitII',
  CommunityID = 'CommunityID',
  AddressVerification = 'AddressVerification',
  AgeVerification = 'AgeVerification',
  WriteAddress = 'WriteAddress',
  WriteCommunityID = 'WriteCommunityID',
  WriteResidencePermitI = 'WriteResidencePermitI',
  WriteResidencePermitII = 'WriteResidencePermitII',
  CanAllowed = 'CanAllowed',
  PinManagement = 'PinManagement',
}

export type AccessRights = {
  optional: AccessRightsFields[]
  required: AccessRightsFields[]
  // NOTE: contains both the `optional` and `required` fields
  effective: AccessRightsFields[]
}
