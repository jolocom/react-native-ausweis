import {
  acceptAuthReqCmd,
  enterPinCmd,
  getInfoCmd,
  runAuthCmd,
  CommandDefinition,
  initSdkCmd,
  getCertificate,
  cancelFlow,
  HandlerDefinition,
  EventHandlers,
  enterCanCmd,
  enterPukCmd,
  setAccessRights
} from "./commands"
import { SdkNotInitializedError } from "./errors"
import { selectors } from "./responseFilters"
import { Filter, Message, Events } from "./types"

const delay = async (delay: number) => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

interface Emitter {
  addListener: (event: Events, callback: Function) => void
}

const insertCardHandler: HandlerDefinition = {
  canHandle: [selectors.insertCardMsg],
  handle: (_, { handleCardRequest }, __) => {
    console.log(handleCardRequest)
    return handleCardRequest && handleCardRequest()
  }
}

const readerHandler: HandlerDefinition = {
  canHandle: [selectors.reader],
  handle: (msg, { handleCardInfo }, __)  => {
    return handleCardInfo && handleCardInfo(msg.card)
  }
}

// TODO
// const newReaderHandler: HandlerDefinition = {
// }

export class Aa2Module {
  private nativeAa2Module: any
  private unprocessedMessages: Object[] = []
  private currentOperation:
    | (CommandDefinition & {
        callbacks: {
          resolve: Function
          reject: Function
        }
      })
    | undefined

  private queuedOperations: Array<CommandDefinition & {callbacks: {resolve: Function, reject: Function}}> = []
  private handlers: HandlerDefinition[] = [insertCardHandler, readerHandler]
  private eventHandlers: Partial<EventHandlers> = {}

  public isInitialized = false

  constructor(aa2Implementation: any, eventEmitter: Emitter) {
    this.nativeAa2Module = aa2Implementation

    eventEmitter.addListener(Events.sdkInitialized, () =>
      this.onMessage({ msg: "INIT" })
    )

    eventEmitter.addListener(Events.message, (response: string) => {
      const { message, error } = JSON.parse(response)

      if (error) {
        this.rejectCurrentOperation(error)
      }

      if (message) {
        this.onMessage(JSON.parse(message))
      }
    })

    eventEmitter.addListener(Events.error, (err) => {
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

      const initCmd = initSdkCmd((_, __, callback) => {
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
    return this.sendCmd(
      getInfoCmd()
    )
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#run-auth
   */

  public async processRequest(tcTokenUrl: string) {
    return this.sendCmd(
      runAuthCmd(tcTokenUrl)
    )
  }

  private rejectCurrentOperation(errorMessage: string) {
    if (!this.currentOperation) {
      throw new Error("TODO")
    }

    this.currentOperation.callbacks.reject(new Error(errorMessage))
    this.clearCurrentOperation()
    return
  }

  private clearCurrentOperation() {
    this.currentOperation = undefined
  }

  public async disconnectAa2Sdk() {}

  private async sendCmd({
    command,
    handler,
  }: CommandDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        return reject(new SdkNotInitializedError())
      }

      if (!this.currentOperation) {
        this.currentOperation = {
          command,
          handler,
          callbacks: {
            resolve: (message) => {
              this.clearCurrentOperation()
              this.fireNextCommand()
              return resolve(message)
            },
            reject: (error) => {
              this.clearCurrentOperation()
              this.fireNextCommand()
              return reject(error)
            },
          },
        }
        this.nativeAa2Module.sendCMD(JSON.stringify(command))
      } else {
        this.queuedOperations.push({ command, handler, callbacks: { resolve, reject} })
        return
      }
    })
  }

  private onMessage(message: Message) {
    // FIXME: background handlers can't be called without a "current operation"
    const placeholderCallbacks = {
      resolve: () => undefined,
      reject: () => undefined     
    }

    const { handle } =
      this.handlers.find(({ canHandle }) =>
        canHandle.some((check) => check(message))
      ) || {}

    if (handle) {
      return handle(message, this.eventHandlers, this.currentOperation ? this.currentOperation.callbacks : placeholderCallbacks)
    }

    if (!this.currentOperation) {
      this.unprocessedMessages.push(message)
      return
    }

    const { handler, callbacks } = this.currentOperation

    if (handler.canHandle.some((f) => f(message))) {
      return handler.handle(message, this.eventHandlers, callbacks)
    }


    this.unprocessedMessages.push(message)
  }

  private fireNextCommand() {
    const [nextCommand, ...commandQueue] = this.queuedOperations

    if (nextCommand) {
      this.queuedOperations = commandQueue
      return this.sendCmd(nextCommand).then(v => nextCommand.callbacks.resolve(v)).catch(e => nextCommand.callbacks.reject(e))
    }
  }

  private async waitTillCondition(filter: Filter, pollInterval = 1500) {
    await delay(pollInterval)

    const relevantResponse = this.unprocessedMessages.filter(filter)

    // TODO Drop the read message from the buffer if all was processed
    if (relevantResponse.length === 1) {
      this.currentOperation = undefined
      return relevantResponse[0]
    } else {
      return this.waitTillCondition(filter, pollInterval)
    }
  }

  public async checkIfCardWasRead() {
    return this.waitTillCondition(selectors.enterPinMsg)
  }

  // TODO Make sure 5 / 6 digits
  public async enterPin(pin: number) {
    return this.sendCmd(enterPinCmd(pin))
  }

  // TODO Make sure 6 digits
  public async enterCan(can: number) {
    return this.sendCmd(enterCanCmd(can))
  }

  // TODO Make sure 10 digits
  public async enterPUK(puk: number) {
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

  public setAccessRights(optionalFields: Array<string>) {
    return this.sendCmd(setAccessRights(optionalFields))
  }
}
