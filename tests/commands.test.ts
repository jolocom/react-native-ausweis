import { Aa2Module } from '../src/module'
import { Events } from '../src/types'
import { testWorkflowData } from './data'

class TestEmitter {
  private listeners: { Events?: Function } = {}

  public addListener(event: Events, callback: Function) {
    this.listeners[event] = callback
  }

  public dispatch(event: Events, message?: string) {
    setTimeout(() => {
      this.listeners[event](message)
    }, 1000)
  }
}

const emitter = new TestEmitter()

const mockAa2Impl = {
  sendCMD: async (_: Object) => {},
  initAASdk: async () => {},
}

const getTestAaModule = async () => {
  const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
  const initPromise = aa2Sdk.initAa2Sdk()
  emitter.dispatch(Events.sdkInitialized)

  await initPromise
  return aa2Sdk
}

describe('Initializing the AA2 SDK', () => {
  it('Correctly handles succesfull initalization', async () => {
    const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
    const initPromise = aa2Sdk.initAa2Sdk()

    expect(aa2Sdk.isInitialized).toBe(false)
    emitter.dispatch(Events.sdkInitialized)
    expect(aa2Sdk.isInitialized).toBe(false)

    await initPromise

    expect(aa2Sdk.isInitialized).toBe(true)
  })

  it('Correctly throws if the AA2 SDK is already initialized', async () => {
    const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
    const promise = aa2Sdk.initAa2Sdk()

    emitter.dispatch(
      Events.error,
      JSON.stringify({ error: 'SdkInitializationException' }),
    )

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"SdkInitializationException"`,
    )
  })

  it('Correctly throws in case of an unexpected error', async () => {
    // What are some test cases here?
  })
})

const wrap = (msg: Object) => JSON.stringify({ message: JSON.stringify(msg) })

describe('Commands', () => {
  it('calls correct handler if card is provided', async () => {
    const aa2Sdk = await getTestAaModule()
    const mockHandler = jest.fn()

    aa2Sdk.setHandlers({
      handleCanRequest: mockHandler,
    })

    const infoPromise = aa2Sdk.getInfo()

    emitter.dispatch(Events.message, wrap(testWorkflowData.info))

    emitter.dispatch(Events.message, wrap(testWorkflowData.cardRequest))
    emitter.dispatch(Events.message, wrap(testWorkflowData.cardRequest))

    await infoPromise

    expect(mockHandler).toHaveBeenCalledTimes(2)
  })

  it('Implements runAuth', async () => {
    const aa2Sdk = await getTestAaModule()

    const authPromise = aa2Sdk.processRequest(
      'https://test.governikus-eid.de/DEMO',
    )

    emitter.dispatch(Events.message, wrap(testWorkflowData.auth.empty))
    emitter.dispatch(Events.message, wrap(testWorkflowData.accessRights))

    await expect(authPromise).resolves.toStrictEqual(
      testWorkflowData.accessRights,
    )
  })

  it('Implements getInfo', async () => {
    const aa2Sdk = await getTestAaModule()

    const infoPromise = aa2Sdk.getInfo()

    emitter.dispatch(Events.message, wrap(testWorkflowData.info))

    await expect(infoPromise).resolves.toStrictEqual(testWorkflowData.info)
  })

  it('Correctly queues subsequent requests', async () => {
    const aa2Sdk = await getTestAaModule()

    const infoPromise = aa2Sdk.getInfo()
    const authPromise = aa2Sdk.processRequest(
      'https://test.governikus-eid.de/DEMO',
    )

    emitter.dispatch(Events.message, wrap(testWorkflowData.info))

    await expect(infoPromise).resolves.toStrictEqual(testWorkflowData.info)

    emitter.dispatch(Events.message, wrap(testWorkflowData.auth.empty))
    emitter.dispatch(Events.message, wrap(testWorkflowData.accessRights))

    await expect(authPromise).resolves.toStrictEqual(
      testWorkflowData.accessRights,
    )
  })

  describe('Enter PIN', () => {
    it('Handles correct pin in AUTH', async () => {
      const aa2Sdk = await getTestAaModule()
      const pinPromise = aa2Sdk.enterPin(0)

      emitter.dispatch(Events.message, wrap(testWorkflowData.auth.success))

      await expect(pinPromise).resolves.toStrictEqual(
        testWorkflowData.auth.success,
      )
    })

    it('Handles incorrect pin entry', async () => {
      const aa2Sdk = await getTestAaModule()

      const mockHandler = jest.fn()

      aa2Sdk.setHandlers({
        handlePinRequest: mockHandler,
      })

      const pinPromise = aa2Sdk.enterPin(111)

      emitter.dispatch(
        Events.message,
        wrap(testWorkflowData.repeatedPinRequest),
      )

      await expect(pinPromise).resolves.toStrictEqual(
        testWorkflowData.repeatedPinRequest,
      )
      expect(mockHandler).toBeCalledWith({
        deactivated: false,
        inoperative: false,
        retryCounter: 2,
      })
    })

    it('Correctly handles incorrect pin + CAN request', async () => {
      const aa2Sdk = await getTestAaModule()

      const mockHandler = jest.fn()

      aa2Sdk.setHandlers({
        handleCanRequest: mockHandler,
      })

      const pinPromise = aa2Sdk.enterPin(111)

      emitter.dispatch(Events.message, wrap(testWorkflowData.canRequest))

      await expect(pinPromise).resolves.toStrictEqual(
        testWorkflowData.canRequest,
      )

      expect(mockHandler).toBeCalledWith({
        deactivated: false,
        inoperative: false,
        retryCounter: 1,
      })
    })
  })
})
