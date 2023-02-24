import {
  AcceptCommand,
  CancelCommand,
  ChangePinCommand,
  Commands,
  SetCanCommand,
  SetPinCommand,
  SetPukCommand,
  GetCertificateCommand,
  GetInfoCommand,
  Handler,
  HandlerDefinition,
  InitCommand,
  RunAuthCommand,
  SetAccessRightsCommand,
  SetNewPinCommand,
  GetStatusCommand,
  GetAPILevelCommand,
  SetAPILevelCommand,
  GetReaderCommand,
  GetReaderListCommand,
  GetAccessRightsCommand,
  SetCardCommand,
  InterruptCommand,
} from './commandTypes'
import {
  AccessRightsMessage,
  ApiLevelMessage,
  AuthMessage,
  BadStateMessage,
  CertificateMessage,
  ChangePinMessage,
  EnterCanMessage,
  EnterNewPinMessage,
  EnterPinMessage,
  EnterPukMessage,
  InfoMessage,
  InitMessage,
  InsertCardMessage,
  Messages,
  ReaderListMessage,
  ReaderMessage,
  StatusMessage,
} from './messageTypes'
import {
  AccessRightsFields,
  CardError,
  ScannerMessages,
  SimulatorData,
} from './types'

export const insertCardHandler: HandlerDefinition<InsertCardMessage> = {
  canHandle: [Messages.insertCard],
  handle: (_, { handleCardRequest }, __) => {
    return handleCardRequest && handleCardRequest()
  },
}

export const readerHandler: HandlerDefinition<ReaderMessage> = {
  canHandle: [Messages.reader],
  handle: (msg, { handleCardInfo }, __) => {
    return handleCardInfo && handleCardInfo(msg.card)
  },
}

export const badStateHandler: HandlerDefinition<BadStateMessage> = {
  canHandle: [Messages.badState],
  handle: (message, _, { reject }) => {
    return reject(message.error)
  },
}

export const statusHandler: HandlerDefinition<StatusMessage> = {
  canHandle: [Messages.status],
  handle: (message, { handleStatus }, { reject }) => {
    return handleStatus && handleStatus(message)
  },
}

export const initSdkCmd = (
  callback: Handler<InitMessage>,
): InitCommand<InitMessage> => ({
  command: { cmd: Commands.init },

  handler: {
    canHandle: [Messages.init],
    handle: callback,
  },
})

export const getInfoCmd = (): GetInfoCommand<InfoMessage> => {
  return {
    command: { cmd: Commands.getInfo },
    handler: {
      canHandle: [Messages.info],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const getStatusCmd = (): GetStatusCommand<StatusMessage> => {
  return {
    command: { cmd: Commands.getStatus },
    handler: {
      canHandle: [Messages.status],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const getAPILevelCmd = (): GetAPILevelCommand<ApiLevelMessage> => {
  return {
    command: { cmd: Commands.getAPILevel },
    handler: {
      canHandle: [Messages.apiLevel],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const setAPILevelCmd = (
  level: number,
): SetAPILevelCommand<ApiLevelMessage> => {
  return {
    command: { cmd: Commands.setAPILevel, level },
    handler: {
      canHandle: [Messages.apiLevel],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const getReaderCmd = (name: string): GetReaderCommand<ReaderMessage> => {
  return {
    command: { cmd: Commands.getReader, name },
    handler: {
      canHandle: [Messages.reader],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const getReaderListCmd = (): GetReaderListCommand<ReaderListMessage> => {
  return {
    command: { cmd: Commands.getReaderList },
    handler: {
      canHandle: [Messages.readerList],
      handle: (message, _, { resolve }) => resolve(message),
    },
  }
}

export const runAuthCmd = (
  tcTokenURL: string,
  developerMode?: boolean,
  handleInterrupt?: boolean,
  status?: boolean,
  messages?: ScannerMessages,
): RunAuthCommand<AccessRightsMessage, AccessRightsMessage | AuthMessage> => {
  return {
    command: {
      cmd: Commands.runAuth,
      tcTokenURL,
      developerMode,
      handleInterrupt,
      status,
      messages,
    },
    handler: {
      canHandle: [Messages.accessRights, Messages.auth],
      handle: (message, _, { resolve, reject }) => {
        switch (message.msg) {
          case Messages.auth:
            if (message?.result?.message) {
              return reject(message.result)
            }
            return
          case Messages.accessRights:
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const changePinCmd = (
  handleInterrupt?: boolean,
  status?: boolean,
  messages?: ScannerMessages,
): ChangePinCommand<
  ChangePinMessage,
  EnterPinMessage | EnterPukMessage | EnterCanMessage | ChangePinMessage
> => {
  return {
    command: {
      cmd: Commands.runChangePin,
      handleInterrupt,
      status,
      messages,
    },
    handler: {
      canHandle: [
        Messages.enterPin,
        Messages.enterPuk,
        Messages.enterCan,
        Messages.changePin,
      ],
      handle: (
        message,
        {
          handlePinRequest,
          handlePukRequest,
          handleCanRequest,
          handleChangePinCancel,
        },
        { resolve, reject },
      ) => {
        switch (message.msg) {
          case Messages.enterPin:
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case Messages.enterPuk:
            handlePukRequest && handlePukRequest(message.reader.card)
            return resolve(message)
          case Messages.enterCan:
            handleCanRequest && handleCanRequest(message.reader.card)
            return resolve(message)
          case Messages.changePin:
            if (message.success === false) {
              handleChangePinCancel && handleChangePinCancel()
              return resolve(message)
            }
            return
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const setPukCmd = (
  puk: string,
): SetPukCommand<
  EnterPinMessage | EnterPukMessage,
  EnterPinMessage | EnterPukMessage | ChangePinMessage | AuthMessage
> => {
  return {
    command: {
      cmd: Commands.setPuk,
      value: puk,
    },
    handler: {
      canHandle: [
        Messages.enterPin,
        Messages.enterPuk,
        Messages.changePin,
        Messages.auth,
      ],
      handle: (message, eventHandlers, { reject, resolve }) => {
        const { handlePukRequest, handlePinRequest } = eventHandlers
        switch (message.msg) {
          /**
           * NOTE:
           * if we receive CHANGE_PIN or AUTH as a response to SET_PUK
           * cmd, this indicates that the card is blocked, therefore, we are
           * rejecting.
           */
          case Messages.auth:
            return reject(CardError.cardIsBlocked)
          case Messages.changePin:
            if (message.success === false) {
              return reject(CardError.cardIsBlocked)
            }
            return
          case Messages.enterPin:
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case Messages.enterPuk:
            handlePukRequest && handlePukRequest(message.reader.card)
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const setCanCmd = (
  can: string,
): SetCanCommand<
  EnterCanMessage,
  EnterPinMessage | EnterCanMessage | ChangePinMessage | AuthMessage
> => {
  return {
    command: {
      cmd: Commands.setCan,
      value: can,
    },
    handler: {
      canHandle: [
        Messages.enterPin,
        Messages.enterCan,
        Messages.changePin,
        Messages.auth,
      ],
      handle: (message, eventHandlers, { resolve, reject }) => {
        const {
          handleCanRequest,
          handlePinRequest,
          handleChangePinCancel,
          handleAuthFailed,
          handleAuthSuccess,
        } = eventHandlers

        switch (message.msg) {
          case Messages.changePin:
            if (message.success === false) {
              handleChangePinCancel && handleChangePinCancel()
              return resolve(message)
            }
            return
          case Messages.auth:
            if (message.result?.message) {
              handleAuthFailed &&
                handleAuthFailed(message.url, message.result.message)
            } else {
              handleAuthSuccess && handleAuthSuccess(message.url)
            }
            return resolve(message)
          case Messages.enterPin:
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case Messages.enterCan:
            handleCanRequest && handleCanRequest(message.reader.card)
            return resolve(message)

          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const setPinCmd = (
  pin: string,
): SetPinCommand<
  EnterPinMessage,
  | EnterPinMessage
  | EnterPukMessage
  | EnterCanMessage
  | AuthMessage
  | EnterNewPinMessage
  | ChangePinMessage
> => {
  return {
    command: {
      cmd: Commands.setPin,
      value: pin,
    },
    handler: {
      canHandle: [
        Messages.enterPuk,
        Messages.enterPin,
        Messages.enterCan,
        Messages.auth,
        Messages.enterNewPin,
        Messages.changePin,
      ],
      handle: (message, eventHandlers, { resolve, reject }) => {
        const {
          handleCanRequest,
          handlePinRequest,
          handlePukRequest,
          handleEnterNewPin,
          handleChangePinCancel,
          handleAuthFailed,
          handleAuthSuccess,
        } = eventHandlers

        switch (message.msg) {
          case Messages.changePin:
            if (message.success === false) {
              handleChangePinCancel && handleChangePinCancel()
              return resolve(message)
            }
            return
          case Messages.enterNewPin:
            handleEnterNewPin && handleEnterNewPin()
            return resolve(message)
          case Messages.auth:
            if (message.result?.message) {
              handleAuthFailed &&
                handleAuthFailed(message.url, message.result.message)
            } else {
              handleAuthSuccess && handleAuthSuccess(message.url)
            }
            return resolve(message)

          case Messages.enterPin:
            handlePinRequest && handlePinRequest(message.reader?.card)
            return resolve(message)
          case Messages.enterPuk:
            handlePukRequest && handlePukRequest(message.reader?.card)
            return resolve(message)
          case Messages.enterCan:
            handleCanRequest && handleCanRequest(message.reader?.card)
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const acceptCmd = (): AcceptCommand<
  AuthMessage,
  EnterPinMessage | EnterPukMessage | EnterCanMessage | AuthMessage
> => {
  return {
    command: {
      cmd: Commands.accept,
    },
    handler: {
      canHandle: [
        Messages.enterPin,
        Messages.enterCan,
        Messages.enterPuk,
        Messages.auth,
      ],
      handle: (
        message,
        {
          handlePinRequest,
          handlePukRequest,
          handleCanRequest,
          handleAuthFailed,
          handleAuthSuccess,
        },
        { resolve, reject },
      ) => {
        switch (message.msg) {
          case Messages.enterPin:
            handlePinRequest && handlePinRequest(message.reader.card)
            return resolve(message)
          case Messages.enterPuk:
            handlePukRequest && handlePukRequest(message.reader.card)
            return resolve(message)
          case Messages.enterCan:
            handleCanRequest && handleCanRequest(message.reader.card)
            return resolve(message)

          case Messages.auth:
            if (message.result?.message) {
              handleAuthFailed &&
                handleAuthFailed(message.url, message.result.message)
            }
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const getCertificateCmd =
  (): GetCertificateCommand<CertificateMessage> => {
    return {
      command: { cmd: Commands.getCertificate },
      handler: {
        canHandle: [Messages.certificate],
        handle: (message, _, { resolve }) => resolve(message),
      },
    }
  }

export const cancelFlowCmd = (): CancelCommand<
  AuthMessage,
  AuthMessage | ChangePinMessage
> => {
  return {
    command: { cmd: Commands.cancel },
    handler: {
      canHandle: [Messages.auth, Messages.changePin],
      handle: (
        message,
        { handleChangePinCancel, handleAuthFailed, handleAuthSuccess },
        { resolve, reject },
      ) => {
        /**
         * NOTE: we are resolving all the messages here, because when
         * user sends CANCEL cmd these msgs indicate the end of a flow;
         * this is not an erroneous state
         */
        switch (message.msg) {
          case Messages.auth:
            if (message.result?.message) {
              handleAuthFailed &&
                handleAuthFailed(message.url, message.result.message)
            }
            return resolve(message)
          case Messages.changePin:
            if (message.success === false) {
              handleChangePinCancel && handleChangePinCancel()
              return resolve(message)
            }
            return
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const interruptFlowCmd = (): InterruptCommand => {
  return {
    command: { cmd: Commands.interrupt },
  }
}

export const getAccessRightsCmd =
  (): GetAccessRightsCommand<AccessRightsMessage> => {
    return {
      command: { cmd: Commands.getAccessRights },
      handler: {
        canHandle: [Messages.accessRights],
        handle: (message, _, { resolve, reject }) => {
          switch (message.msg) {
            case Messages.accessRights:
              return resolve(message)
            default:
              return reject(new Error('Unknown message type'))
          }
        },
      },
    }
  }

export const setAccessRightsCmd = (
  optionalFields: Array<AccessRightsFields>,
): SetAccessRightsCommand<AccessRightsMessage> => {
  return {
    command: { cmd: Commands.setAccessRights, chat: optionalFields },
    handler: {
      canHandle: [Messages.accessRights],
      handle: (message, _, { resolve, reject }) => {
        switch (message.msg) {
          case Messages.accessRights:
            return resolve(message)
          default:
            return reject(new Error('Unknown message type'))
        }
      },
    },
  }
}

export const setCardCmd = (
  readerName: string,
  simulatorData?: SimulatorData,
): SetCardCommand => {
  return {
    command: {
      cmd: Commands.setCard,
      name: readerName,
      simulator: simulatorData,
    },
  }
}

export const setNewPinCmd = (
  pin: string,
): SetNewPinCommand<ChangePinMessage, ChangePinMessage> => {
  return {
    command: { cmd: Commands.setNewPin, value: pin },
    handler: {
      canHandle: [Messages.changePin],
      handle: (message, eventHandlers, { resolve }) => {
        const { handleChangePinSuccess, handleChangePinCancel } = eventHandlers
        if (message.success === true) {
          handleChangePinSuccess && handleChangePinSuccess()
          return resolve(message)
        } else if (message.success === false) {
          handleChangePinCancel && handleChangePinCancel()
          return resolve(message)
        }
      },
    },
  }
}
