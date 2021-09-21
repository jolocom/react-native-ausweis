import { acceptAuthReqCmd, enterPinCmd, getInfoCmd, runAuthCmd, Request, initSdkCmd } from './commands';
import { filters } from './responseFilters';
import { Filter, Message, Events } from './types';

const delay = async (delay: number) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};


type CB = (error: Message | null, message: Message | null) => void

type RequestSummary = {
  request: Request,
  requestSent: boolean
  callback: CB
}

const createRequestSummary = (request: Request, callback: CB): RequestSummary => {
  return {
    request,
    callback,
    requestSent: false
  }
}

interface Emitter {
  addListener: (event: Events, callback: Function) => void
}

export class Aa2Module {
  private nativeAa2Module: any
  private unprocessedMessages: Object[] = []
  private currentOperation: RequestSummary | undefined
  private queuedOperations: RequestSummary[] = []
  public isInitialized = false

  constructor(aa2Implementation: any, eventEmitter: Emitter) {
    this.nativeAa2Module = aa2Implementation

    eventEmitter.addListener(Events.message, (response: string) => {
      console.log(response)
      const parsed = JSON.parse(response)
      this.onMessage(JSON.parse(parsed.message))
    })

    eventEmitter.addListener(Events.sdkInitialized, () => this.onMessage({'msg': 'INIT'}));

    eventEmitter.addListener(Events.error, (err) => {
      // TODO Abstract to helper, e.g. rejectCurrentOperation
      const {error} = JSON.parse(err)
      this.currentOperation.callback(error, null)
      this.currentOperation = undefined
    });

    eventEmitter.addListener(Events.commandSentSuccessfully, () => {
      // TODO
      if (this.currentOperation) {
        this.currentOperation.requestSent = true
      }
    })
  }

  public async initAa2Sdk() {
    return new Promise((resolve, reject) => {
      this.nativeAa2Module.initAASdk()

      this.currentOperation = createRequestSummary(
        initSdkCmd(),
        (error: Message, message: Message) => {
          if (error) {
            return reject(error)
          }

          this.isInitialized = true
          return resolve(message)
        }
      )
    })
  }

  public async disconnectAa2Sdk() {
  }


  private async sendCmd(request: Request, callback: CB): Promise<void> {
      const operation = {
        request,
        callback,
        requestSent: false
      }

      if (!this.currentOperation) {
        this.currentOperation = operation
        this.nativeAa2Module.sendCMD(JSON.stringify(request.command));

      } else {
        this.queuedOperations.push(operation)
      }
  }

  // TODO Message should be added to unprocessed if both filters failed as well
  private onMessage(message: Message) {
    if (!this.currentOperation) {
      this.unprocessedMessages.push(message)
      return
    }

    const { request: { responseConditions }, callback } = this.currentOperation

    if (responseConditions.success(message)) {
      this.currentOperation = undefined

      callback(null, message)
    } else if (responseConditions.failure && responseConditions.failure(message)) {
      this.currentOperation = undefined
      callback(message, null)
    }

    const [queuedRequest, ...rest] = this.queuedOperations

    if (queuedRequest) {
      this.queuedOperations = rest
      return this.sendCmd(queuedRequest.request, queuedRequest.callback)
    }
  }

  private async waitTillCondition(filter: Filter, pollInterval = 1500) {
    await delay(pollInterval);

    const relevantResponse = this.unprocessedMessages.filter(filter)

    // TODO Drop the read message from the buffer if all was processed
    if (relevantResponse.length === 1) {
      this.currentOperation = undefined
      return relevantResponse[0]
    } else {
      return this.waitTillCondition(filter, pollInterval)
    }
  };

  public async checkIfCardWasRead() {
    return this.waitTillCondition(filters.enterPinMsg)
  }

  public async getInfo() {
    return new Promise((resolve, reject) => {
      this.sendCmd(getInfoCmd(), (error, message) => error ? reject(error) : resolve(message));
    })
  }

  public async processRequest(tcTokenUrl: string) {
    return new Promise((resolve, reject) => {
      this.sendCmd(runAuthCmd(tcTokenUrl), (error, message) => error ? reject(error) : resolve(message))
    })
  }

  public async cancelAuth() {
    // return this.sendCmd({cmd: 'CANCEL'}) // ?
  }

  public async enterPin(pin: number) {
    return new Promise((resolve, reject) => {
      this.sendCmd(enterPinCmd(pin), (error, message) => error ? reject(error) : resolve(message))
    })
  }

  public async acceptAuthRequest() {
    return new Promise((resolve, reject) => {
      this.sendCmd(acceptAuthReqCmd(), (error, message) => error ? reject(error) : resolve(message))
    })
  }

  // public async getApiLevel() {
  //   return new Promise((resolve, reject) => {
  //   return this.sendCmd({cmd: 'GET_API_LEVEL'}, (error, message) => error ? reject(error) : resolve(message))
  //   })
  // }
}
