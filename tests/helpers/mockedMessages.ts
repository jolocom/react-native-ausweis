import { Messages } from '../../src/messageTypes'
import { AccessRightsFields } from '../../src/types'

export const mockedAccessRightMessage = {
  msg: Messages.accessRights,
  aux: {
    ageVerificationDate: '2003-11-29',
    requiredAge: '18',
    validityDate: '2021-11-29',
  },
  chat: {
    effective: [AccessRightsFields.GivenNames, AccessRightsFields.DocumentType],
    optional: [AccessRightsFields.GivenNames],
    required: [AccessRightsFields.DocumentType],
  },
  transactionInfo: 'abcdefg',
}

export const mockedCertificatesMessage = {
  msg: Messages.certificate,
  description: {
    issuerName: 'Governikus Test DVCA',
    issuerUrl: 'http://www.governikus.de',
    subjectName: 'Governikus GmbH & Co. KG',
    subjectUrl: 'https://test.governikus-eid.de',
    termsOfUsage: 'terms',
    purpose: 'Demonstration des eID-Service',
  },
  validity: {
    effectiveDate: '2021-11-15',
    expirationDate: '2021-12-15',
  },
}
