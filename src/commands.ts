import {
  AcceptCommand,
  CancelCommand,
  ChangePinCommand,
  CommandDefinition,
  EnterCanCommand,
  EnterPinCommand,
  EnterPukCommand,
  GetCertificateCommand,
  GetInfoCommand,
  Handler,
  RunAuthCommand,
  SetAccessRightsCommand,
} from './commandTypes'
import {
  AccessRightsMessage,
  AuthMessage,
  BadStateMessage,
  CertificateMessage,
  EnterCanMessage,
  EnterPinMessage,
  EnterPukMessage,
  InfoMessage,
  InsertCardMessage,
} from './messageTypes'
import { selectors } from './responseFilters'
import { AccessRightsFields } from './types'

export const initSdkCmd = (callback: Handler): CommandDefinition => ({
  command: { cmd: 'INIT' },
  handler: {
    canHandle: [selectors.initMsg],
    handle: callback,
  },
})

export const getInfoCmd = (): GetInfoCommand<InfoMessage> => {
  return {
    command: { cmd: 'GET_INFO' },
    handler: {
      canHandle: [selectors.infoMsg],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const runAuthCmd = (
  tcTokenURL: string,
): RunAuthCommand<AccessRightsMessage | AuthMessage> => {
  return {
    command: {
      cmd: 'RUN_AUTH',
      tcTokenURL,
      handleInterrupt: false,
      messages: {
        sessionStarted:
          "Please place your ID card on the top of the device's back side.",
        sessionFailed: 'Scanning process failed.',
        sessionSucceeded: 'Scanning process has been finished successfully.',
        sessionInProgress: 'Scanning process is in progress.',
      },
    },
    handler: {
      canHandle: [selectors.accessRightsMsg, selectors.authMsg],
      handle: (message, _, { resolve, reject }) => {
        if (message.msg === 'AUTH' && message.error) {
          return reject(new Error(message.error))
        }
        if (message.msg === 'ACCESS_RIGHTS') {
          return resolve(message)
        }
      },
    },
  }
}

export const changePinCmd = (): ChangePinCommand<
  BadStateMessage | EnterPinMessage | EnterPukMessage | EnterCanMessage
> => {
  return {
    command: {
      cmd: 'RUN_CHANGE_PIN',
      handleInterrupt: false,
      messages: {
        sessionStarted:
          "Please place your ID card on the top of the device's back side.",
        sessionFailed: 'Scanning process failed.',
        sessionSucceeded: 'Scanning process has been finished successfully.',
        sessionInProgress: 'Scanning process is in progress.',
      },
    },
    handler: {
      canHandle: [
        selectors.badState,
        selectors.enterPinMsg,
        selectors.enterPukMsg,
        selectors.enterCanMsg,
      ],
      handle: (
        message,
        { handlePinRequest, handlePukRequest, handleCanRequest },
        { resolve, reject },
      ) => {
        switch (message.msg) {
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case 'ENTER_PUK':
            handlePukRequest && handlePukRequest(message.reader.card)
            return resolve(message)
          case 'ENTER_CAN':
            handleCanRequest && handleCanRequest(message.reader.card)
            return resolve(message)
          default:
            return reject(new Error(message.error))
        }
      },
    },
  }
}

export const enterPukCmd = (
  puk: number,
): EnterPukCommand<BadStateMessage | EnterPinMessage | EnterPukMessage> => {
  return {
    command: {
      cmd: 'SET_PUK',
      value: puk.toString(),
    },
    handler: {
      canHandle: [
        selectors.enterPinMsg,
        selectors.enterPukMsg,
        selectors.badState,
      ],
      handle: (message, eventHandlers, { reject, resolve }) => {
        const { handlePukRequest, handlePinRequest } = eventHandlers
        switch (message.msg) {
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case 'ENTER_PUK':
            handlePukRequest && handlePukRequest(message.reader.card)
            return resolve(message)
          default:
            return reject(new Error(message.error))
        }
      },
    },
  }
}

export const enterCanCmd = (
  can: number,
): EnterCanCommand<BadStateMessage | EnterPinMessage | EnterCanMessage> => {
  return {
    command: {
      cmd: 'SET_CAN',
      value: can.toString(),
    },
    handler: {
      canHandle: [
        selectors.badState,
        selectors.enterPinMsg,
        selectors.enterCanMsg,
      ],
      handle: (message, eventHandlers, { resolve, reject }) => {
        const { handleCanRequest, handlePinRequest } = eventHandlers

        switch (message.msg) {
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case 'ENTER_CAN':
            handleCanRequest && handleCanRequest(message.reader.card)
            return resolve(message)
          default:
            return reject(new Error(message.error))
        }
      },
    },
  }
}

export const enterPinCmd = (
  pin: number,
): EnterPinCommand<
  EnterPinMessage | EnterPukMessage | EnterCanMessage | AuthMessage
> => {
  return {
    command: {
      cmd: 'SET_PIN',
      value: pin.toString(),
    },
    handler: {
      canHandle: [
        selectors.enterPinMsg,
        selectors.enterCanMsg,
        selectors.enterPukMsg,
        selectors.authMsg,
      ],
      handle: (message, eventHandlers, { resolve, reject }) => {
        const {
          handleCanRequest,
          handleAuthResult,
          handlePinRequest,
          handlePukRequest,
        } = eventHandlers

        switch (message.msg) {
          case 'AUTH':
            if (message.url) {
              handleAuthResult && handleAuthResult(message.url)
              return resolve(message)
            } else return reject(message)
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader?.card)
            return resolve(message)
          case 'ENTER_PUK':
            handlePukRequest && handlePukRequest(message.reader?.card)
            return resolve(message)
          case 'ENTER_CAN':
            handleCanRequest && handleCanRequest(message.reader?.card)
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const acceptAuthReqCmd = (): AcceptCommand<
  EnterPinMessage | EnterPukMessage | EnterCanMessage | InsertCardMessage
> => {
  return {
    command: {
      cmd: 'ACCEPT',
    },
    handler: {
      canHandle: [
        selectors.insertCardMsg,
        selectors.enterPinMsg,
        selectors.enterCanMsg,
        selectors.enterPukMsg,
      ],
      handle: (
        message,
        {
          handleCardRequest,
          handlePinRequest,
          handlePukRequest,
          handleCanRequest,
        },
        { resolve, reject },
      ) => {
        switch (message.msg) {
          case 'INSERT_CARD':
            handleCardRequest && handleCardRequest()
            return
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case 'ENTER_PUK':
            handlePukRequest && handlePukRequest(message.reader.card)
            return resolve(message)
          case 'ENTER_CAN':
            handleCanRequest && handleCanRequest(message.reader.card)
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const getCertificate = (): GetCertificateCommand<CertificateMessage> => {
  return {
    command: { cmd: 'GET_CERTIFICATE' },
    handler: {
      canHandle: [selectors.getCertificate],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const cancelFlow = (): CancelCommand<BadStateMessage | AuthMessage> => {
  return {
    command: { cmd: 'CANCEL' },
    handler: {
      canHandle: [selectors.authMsg, selectors.badState],
      handle: (message, _, { resolve, reject }) => {
        switch (message.msg) {
          case 'AUTH':
            return resolve(message)
          case 'BAD_STATE':
            return reject(message.error)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const setAccessRights = (
  optionalFields: Array<AccessRightsFields>,
): SetAccessRightsCommand<AccessRightsMessage | BadStateMessage> => {
  return {
    command: { cmd: 'SET_ACCESS_RIGHTS', chat: optionalFields },
    handler: {
      canHandle: [selectors.accessRightsMsg],
      handle: (message, _, { resolve, reject }) => {
        switch (message.msg) {
          case 'ACCESS_RIGHTS':
            return resolve(message)
          case 'BAD_STATE':
            return reject(message.error)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}
