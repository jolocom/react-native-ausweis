import EventEmitter from 'events'
import TypedEmitter from 'typed-emitter'
import {
  acceptAuthReqCmd,
  enterPinCmd,
  getInfoCmd,
  runAuthCmd,
  initSdkCmd,
  getCertificate,
  cancelFlow,
  enterCanCmd,
  enterPukCmd,
  setAccessRights,
  setNewPin,
  changePinCmd,
} from './commands'
import {
  CommandDefinition,
  disruptiveCommands,
  EventHandlers,
  HandlerDefinition,
} from './commandTypes'
import { SdkNotInitializedError } from './errors'
import { MessageEvents } from './messageEvents'
import {
  BadStateMessage,
  EnterCanMessage,
  EnterPinMessage,
  EnterPukMessage,
  InsertCardMessage,
  Message,
  Messages,
  ReaderMessage,
} from './messageTypes'
import { Filter, Events, AccessRightsFields, ScannerConfig } from './types'

const delay = async (delay: number) => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

interface NativeEmitter {
  addListener: (event: Events, callback: Function) => void
}

const insertCardHandler: HandlerDefinition<InsertCardMessage> = {
  canHandle: [Messages.insertCard],
  handle: (_, { handleCardRequest }, __) => {
    return handleCardRequest && handleCardRequest()
  },
}

const readerHandler: HandlerDefinition<ReaderMessage> = {
  canHandle: [Messages.reader],
  handle: (msg, { handleCardInfo }, __) => {
    return handleCardInfo && handleCardInfo(msg.card)
  },
}

const badStateHandler: HandlerDefinition<BadStateMessage> = {
  canHandle: [Messages.badState],
  handle: (message, _, { reject }) => {
    return reject(message.error)
  },
}

export class Aa2Module {
  private nativeAa2Module: any
  private unprocessedMessages: Message[] = []
  private currentOperation:
    | (CommandDefinition & {
        callbacks: {
          resolve: Function
          reject: Function
        }
      })
    | undefined

  private queuedOperations: Array<
    CommandDefinition & { callbacks: { resolve: Function; reject: Function } }
  > = []
  private handlers: HandlerDefinition<Message>[] = [
    insertCardHandler,
    readerHandler,
    badStateHandler,
  ]
  private eventHandlers: Partial<EventHandlers> = {}

  public messageEmitter = new EventEmitter() as TypedEmitter<MessageEvents>
  public isInitialized = false

  constructor(aa2Implementation: any, nativeEventEmitter: NativeEmitter) {
    this.nativeAa2Module = aa2Implementation

    nativeEventEmitter.addListener(Events.sdkInitialized, () =>
      this.onMessage({ msg: Messages.init }),
    )

    nativeEventEmitter.addListener(Events.message, (response: string) => {
      const { message, error } = JSON.parse(response)

      if (error) {
        this.rejectCurrentOperation(error)
      }

      if (message) {
        this.onMessage(JSON.parse(message))
      }
    })

    nativeEventEmitter.addListener(Events.error, (err) => {
      const { error } = JSON.parse(err)
      this.rejectCurrentOperation(error)
    })
  }

  // TODO Change to controllerFunctions?
  public setHandlers(eventHandlers: Partial<EventHandlers>) {
    this.eventHandlers = { ...this.eventHandlers, ...eventHandlers }
  }

  public resetHandlers() {
    this.eventHandlers = {}
  }

  public async initAa2Sdk() {
    return new Promise((resolve, reject) => {
      this.nativeAa2Module.initAASdk()

      const initCmd = initSdkCmd(() => {
        this.isInitialized = true

        this.currentOperation.callbacks.resolve()

        return this.clearCurrentOperation()
      })

      this.currentOperation = {
        ...initCmd,
        callbacks: { resolve, reject },
      }
    })
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-info
   */

  public async getInfo() {
    return this.sendCmd(getInfoCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#run-auth
   */

  public async startAuth(tcTokenUrl: string, config?: ScannerConfig) {
    return this.sendCmd(runAuthCmd(tcTokenUrl, config))
  }

  private rejectCurrentOperation(errorMessage: string) {
    if (!this.currentOperation) {
      throw new Error('TODO')
    }

    this.currentOperation.callbacks.reject(new Error(errorMessage))
    this.clearCurrentOperation()
    return
  }

  private clearCurrentOperation() {
    this.currentOperation = undefined
  }

  public async disconnectAa2Sdk() {}

  private async sendCmd<T extends Message>({
    command,
    handler,
  }: CommandDefinition<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        return reject(new SdkNotInitializedError())
      }
      if (!this.currentOperation || disruptiveCommands.includes(command.cmd)) {
        this.currentOperation = {
          command,
          handler,
          callbacks: {
            resolve: (message: T) => {
              this.clearCurrentOperation()
              this.fireNextCommand()
              return resolve(message)
            },
            reject: (error: Error) => {
              this.clearCurrentOperation()
              this.fireNextCommand()
              return reject(error)
            },
          },
        }
        this.nativeAa2Module.sendCMD(JSON.stringify(command))
      } else {
        this.queuedOperations.push({
          command,
          handler,
          callbacks: { resolve, reject },
        })
        return
      }
    })
  }

  private onMessage(message: Message) {
    // FIXME: background handlers can't be called without a "current operation"
    const placeholderCallbacks = {
      resolve: () => undefined,
      reject: () => undefined,
    }

    this.messageEmitter.emit(message.msg, message as any)

    const { handle } =
      this.handlers.find(({ canHandle }) =>
        canHandle.some((msg) => msg === message.msg),
      ) || {}

    if (handle) {
      return handle(
        message,
        this.eventHandlers,
        this.currentOperation
          ? this.currentOperation.callbacks
          : placeholderCallbacks,
      )
    }

    if (!this.currentOperation) {
      this.unprocessedMessages.push(message)
      return
    }

    const { handler, callbacks } = this.currentOperation

    if (handler.canHandle.some((msg) => msg === message.msg)) {
      return handler.handle(message, this.eventHandlers, callbacks)
    }

    this.unprocessedMessages.push(message)
  }

  private fireNextCommand() {
    const [nextCommand, ...commandQueue] = this.queuedOperations

    if (nextCommand) {
      this.queuedOperations = commandQueue
      return this.sendCmd(nextCommand)
        .then((v) => nextCommand.callbacks.resolve(v))
        .catch((e) => nextCommand.callbacks.reject(e))
    }
  }

  private async waitTillCondition<T extends Message>(
    filter: Filter<T>,
    pollInterval = 1500,
  ): Promise<T> {
    await delay(pollInterval)

    const relevantResponse = this.unprocessedMessages.filter(filter)

    // TODO Drop the read message from the buffer if all was processed
    if (relevantResponse.length === 1) {
      this.currentOperation = undefined
      return relevantResponse[0] as T
    } else {
      return this.waitTillCondition(filter, pollInterval)
    }
  }

  public async checkIfCardWasRead() {
    return this.waitTillCondition(
      (message: EnterPinMessage | EnterPukMessage | EnterCanMessage) =>
        [Messages.enterPin, Messages.enterPuk, Messages.enterCan].includes(
          message.msg,
        ),
    )
  }

  // TODO Make sure 5 / 6 digits
  public async setPin(pin: string) {
    return this.sendCmd(enterPinCmd(pin))
  }

  // TODO Make sure 6 digits
  public async setCan(can: string) {
    return this.sendCmd(enterCanCmd(can))
  }

  // TODO Make sure 10 digits
  public async setPuk(puk: string) {
    return this.sendCmd(enterPukCmd(puk))
  }

  public async acceptAuthRequest() {
    return this.sendCmd(acceptAuthReqCmd())
  }

  public async getCertificate() {
    return this.sendCmd(getCertificate())
  }

  public cancelFlow() {
    return this.sendCmd(cancelFlow())
  }

  public setAccessRights(optionalFields: Array<AccessRightsFields>) {
    return this.sendCmd(setAccessRights(optionalFields))
  }

  public setNewPin(pin: string) {
    return this.sendCmd(setNewPin(pin))
  }

  public startChangePin(config?: ScannerConfig) {
    return this.sendCmd(changePinCmd(config))
  }
}
