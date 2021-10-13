import { selectors } from './responseFilters'
import { Message } from './types'

type Handler<T = any> = (
  message: Message,
  eventHandlers: Partial<EventHandlers>,
  callbacks: { resolve: Function; reject: Function },
) => T

export type HandlerDefinition<T = any> = {
  canHandle: Array<(message: Message) => boolean>
  handle: Handler<T>
}

const identity = <T>(arg: T) => arg

export interface EventHandlers {
  handlePinRequest: (cardInfo: any) => void
  handleCanRequest: (cardInfo: any) => void
  handlePukRequest: (cardInfo: any) => void
  handleCardRequest: () => void
  handleCardInfo: (cardInfo: any) => void
  handleAuthResult: (url: string) => void
}

export type CommandDefinition = {
  command: { cmd: string; [k: string]: any }
  handler: HandlerDefinition
}

export const initSdkCmd = (callback: Handler): CommandDefinition => ({
  command: { cmd: 'INIT' },
  handler: {
    canHandle: [selectors.initMsg],
    handle: callback,
  },
})

export const getInfoCmd = (): CommandDefinition => {
  return {
    command: { cmd: 'GET_INFO' },
    handler: {
      canHandle: [selectors.infoMsg],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const runAuthCmd = (tcTokenURL: string): CommandDefinition => {
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
      handle: (message, _, { resolve }) => {
        if (selectors.accessRightsMsg(message)) {
          return resolve(message)
        }
      },
    },
  }
}

export const changePinCmd = (): CommandDefinition => {
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
      canHandle: [],
      handle: identity,
    },
  }
}

export const enterPukCmd = (puk: number): CommandDefinition => {
  return {
    command: {
      cmd: 'SET_PUK',
      value: puk.toString(),
    },
    handler: {
      canHandle: [selectors.enterPinMsg, selectors.enterPukMsg],
      handle: (message, eventHandlers, { reject, resolve }) => {
        const { handlePukRequest, handlePinRequest } = eventHandlers

        switch (message.msg) {
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader?.card)
            return resolve(message)
          case 'ENTER_PUK':
            handlePukRequest && handlePukRequest(message.reader?.card)
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const enterCanCmd = (can: number): CommandDefinition => {
  return {
    command: {
      cmd: 'SET_CAN',
      value: can.toString(),
    },
    handler: {
      canHandle: [selectors.enterPinMsg, selectors.enterCanMsg],
      handle: (message, eventHandlers, { resolve, reject }) => {
        const { handleCanRequest, handlePinRequest } = eventHandlers

        switch (message.msg) {
          case 'ENTER_PIN':
            handlePinRequest && handlePinRequest(message.reader?.card)
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

export const enterPinCmd = (pin: number): CommandDefinition => {
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
            }
            break
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

export const acceptAuthReqCmd = (): CommandDefinition => {
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

export const getCertificate = (): CommandDefinition => {
  return {
    command: { cmd: 'GET_CERTIFICATE' },
    handler: {
      canHandle: [selectors.getCertificate],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const cancelFlow = (): CommandDefinition => {
  return {
    command: { cmd: 'CANCEL' },
    handler: {
      canHandle: [selectors.authMsg],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const setAccessRights = (
  optionalFields: Array<string>,
): CommandDefinition => {
  return {
    command: { cmd: 'SET_ACCESS_RIGHTS', chat: optionalFields },
    handler: {
      canHandle: [selectors.accessRightsMsg],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}
