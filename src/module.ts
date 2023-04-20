import {
  NativeModules,
  Platform,
  NativeEventEmitter,
  DeviceEventEmitter,
} from 'react-native'

import EventEmitter from 'events'
import TypedEmitter from 'typed-emitter'
import {
  acceptCmd,
  setPinCmd,
  getInfoCmd,
  runAuthCmd,
  initSdkCmd,
  getCertificateCmd,
  cancelFlowCmd,
  setCanCmd,
  setPukCmd,
  setAccessRightsCmd,
  setNewPinCmd,
  changePinCmd,
  insertCardHandler,
  readerHandler,
  badStateHandler,
  getStatusCmd,
  setAPILevelCmd,
  getAPILevelCmd,
  getReaderCmd,
  getReaderListCmd,
  getAccessRightsCmd,
  interruptFlowCmd,
  setCardCmd,
  statusHandler,
  disconnectSdkCmd,
} from './commands'
import {
  CommandDefinition,
  disruptiveCommands,
  EventHandlers,
  HandlerDefinition,
  VoidCommandDefinition,
} from './commandTypes'
import { SdkNotInitializedError } from './errors'
import { MessageEvents } from './messageEvents'
import {
  EnterCanMessage,
  EnterPinMessage,
  EnterPukMessage,
  Message,
  Messages,
} from './messageTypes'
import {
  Filter,
  Events,
  AccessRightsFields,
  ScannerMessages,
  SimulatorData,
} from './types'
import { delay } from './utils'

interface NativeEmitter {
  addListener: (event: Events, callback: Function) => void
}

interface AusweisImplementation {
  initAASdk: () => void
  disconnectSdk: () => void
  sendCMD: (cmd: string) => void
}

export class AusweisModule {
  private nativeAa2Module: AusweisImplementation
  private nativeEventEmitter: NativeEmitter
  private logger: boolean

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
    statusHandler,
  ]

  private eventHandlers: Partial<EventHandlers> = {}

  public messageEmitter = new EventEmitter() as TypedEmitter<MessageEvents>
  public isInitialized = false

  constructor(
    aa2Implementation: AusweisImplementation,
    nativeEventEmitter: NativeEmitter,
  ) {
    this.nativeAa2Module = aa2Implementation
    this.nativeEventEmitter = nativeEventEmitter
    this.setupEventHandlers()
  }

  public enableLogger(shouldEnable: boolean) {
    this.logger = shouldEnable
  }

  private log(data: Object) {
    if (this.logger) {
      console.log('Ausweis Logger: ', JSON.stringify(data, null, 2))
    }
  }

  private setupEventHandlers() {
    this.nativeEventEmitter.addListener(Events.sdkInitialized, () =>
      this.onMessage({ msg: Messages.init }),
    )

    this.nativeEventEmitter.addListener(Events.sdkDisconnected, () =>
      this.onMessage({ msg: Messages.disconnect }),
    )

    this.nativeEventEmitter.addListener(Events.message, (response: string) => {
      const { message, error } = JSON.parse(response)

      if (error) {
        this.rejectCurrentOperation(error)
      }

      if (message) {
        this.onMessage(JSON.parse(message))
      }
    })

    this.nativeEventEmitter.addListener(Events.error, (err) => {
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
      const initCmd = initSdkCmd(() => {
        this.isInitialized = true

        this.currentOperation.callbacks.resolve()

        return this.clearCurrentOperation()
      })

      this.currentOperation = {
        ...initCmd,
        callbacks: { resolve, reject },
      }

      this.nativeAa2Module.initAASdk()
    })
  }

  public async disconnectAa2Sdk() {
    return new Promise((resolve, reject) => {
      const disconnectCmd = disconnectSdkCmd(() => {
        this.isInitialized = false

        this.currentOperation.callbacks.resolve()

        return this.clearCurrentOperation()
      })

      this.currentOperation = {
        ...disconnectCmd,
        callbacks: { resolve, reject },
      }

      this.nativeAa2Module.disconnectSdk()
    })
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

  private sendVoidCmd({ command }: VoidCommandDefinition): void {
    this.log(command)

    if (!this.isInitialized) {
      throw new SdkNotInitializedError()
    }

    this.nativeAa2Module.sendCMD(JSON.stringify(command))
  }

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
        this.log(command)
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
    this.log(message)

    this.messageEmitter.emit(message.msg, message as any)

    if (this.currentOperation) {
      const { handler, callbacks } = this.currentOperation

      if (handler.canHandle.some((msg) => msg === message.msg)) {
        handler.handle(message, this.eventHandlers, callbacks)
      }
    }

    const { handle } =
      this.handlers.find(({ canHandle }) =>
        canHandle.some((msg) => msg === message.msg),
      ) || {}

    if (handle) {
      // FIXME: background handlers can't be called without a "current operation"
      const placeholderCallbacks = {
        resolve: () => undefined,
        reject: () => undefined,
      }

      return handle(
        message,
        this.eventHandlers,
        this.currentOperation?.callbacks ?? placeholderCallbacks,
      )
    }
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

  public async checkIfCardWasRead(): Promise<
    Messages.enterPin | Messages.enterPuk | Messages.enterCan
  > {
    const relevantMessages = [
      Messages.enterPin,
      Messages.enterPuk,
      Messages.enterCan,
    ]
    return new Promise((res) => {
      const resolveMessage = (message) => {
        res(message)
        relevantMessages.forEach((messageType) => {
          this.messageEmitter.removeListener(messageType, resolveMessage)
        })
      }
      relevantMessages.forEach((messageType) =>
        this.messageEmitter.addListener(messageType, resolveMessage),
      )
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

  public async startAuth(
    tcTokenUrl: string,
    developerMode?: boolean,
    handleInterrupt?: boolean,
    status?: boolean,
    messages?: ScannerMessages,
  ) {
    return this.sendCmd(
      runAuthCmd(tcTokenUrl, developerMode, handleInterrupt, status, messages),
    )
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-status
   */

  public async getStatus() {
    return this.sendCmd(getStatusCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-api-level
   */

  public async setAPILevel(level: number) {
    return this.sendCmd(setAPILevelCmd(level))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-api-level
   */

  public async getAPILevel() {
    return this.sendCmd(getAPILevelCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-reader
   */

  public async getReader(name: string) {
    return this.sendCmd(getReaderCmd(name))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-reader-list
   */

  public async getReaderList() {
    return this.sendCmd(getReaderListCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-card
   */

  public setCard(readerName: string, simulatorData?: SimulatorData) {
    return this.sendVoidCmd(setCardCmd(readerName, simulatorData))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-pin
   */

  // TODO Make sure 5 / 6 digits
  public async setPin(pin: string | undefined) {
    return this.sendCmd(setPinCmd(pin))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-can
   */

  public async setCan(can: string) {
    // TODO Make sure 6 digits
    return this.sendCmd(setCanCmd(can))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-puk
   */

  public async setPuk(puk: string) {
    // TODO Make sure 10 digits
    return this.sendCmd(setPukCmd(puk))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#accept
   */

  public async acceptAuthRequest() {
    return this.sendCmd(acceptCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-certificate
   */

  public async getCertificate() {
    return this.sendCmd(getCertificateCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#cancel
   */

  public async cancelFlow() {
    return this.sendCmd(cancelFlowCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-access-rights
   */

  public async setAccessRights(optionalFields: Array<AccessRightsFields>) {
    return this.sendCmd(setAccessRightsCmd(optionalFields))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#get-access-rights
   */

  public async getAccessRights() {
    return this.sendCmd(getAccessRightsCmd())
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#set-new-pin
   */

  public async setNewPin(pin?: string) {
    return this.sendCmd(setNewPinCmd(pin))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#run-change-pin
   */

  public async startChangePin(
    handleInterrupt?: boolean,
    status?: boolean,
    messages?: ScannerMessages,
  ) {
    return this.sendCmd(changePinCmd(handleInterrupt, status, messages))
  }

  /**
   * @see https://www.ausweisapp.bund.de/sdk/commands.html#interrupt
   */

  public interruptFlow() {
    return this.sendVoidCmd(interruptFlowCmd())
  }
}
