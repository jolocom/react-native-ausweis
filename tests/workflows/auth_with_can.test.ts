import { Aa2Module } from '../../src/module'
import { Events } from '../../src/types'
import { testWorkflowData } from './../data'

const wrap = (msg: Object) => JSON.stringify({ message: JSON.stringify(msg) })

class TestEmitter {
  private listeners: { Events?: Function } = {}

  public addListener(event: Events, callback: Function) {
    this.listeners[event] = callback
  }

  public dispatch(event: Events, message?: string) {
    setTimeout(() => {
      this.listeners[event](message)
    }, 100)
  }
}

const emitter = new TestEmitter()

const getTestAaModule = async () => {
  const mockAa2Impl = {
    sendCMD: async (_: Object) => {},
    initAASdk: async () => {},
  }

  const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
  const initPromise = aa2Sdk.initAa2Sdk()
  emitter.dispatch(Events.sdkInitialized)

  await initPromise
  return aa2Sdk
}

it('Successful authentication with CAN', async () => {
  const aa2Sdk = await getTestAaModule()

  const processReqPromise = aa2Sdk.processRequest(
    'https://test.governikus-eid.de/DEMO',
  )

  emitter.dispatch(Events.message, wrap(testWorkflowData.auth.empty))
  emitter.dispatch(Events.message, wrap(testWorkflowData.accessRights))

  await expect(processReqPromise).resolves.toStrictEqual(
    testWorkflowData.accessRights,
  )

  aa2Sdk.acceptAuthRequest()

  const cardReadPromise = aa2Sdk.checkIfCardWasRead()

  emitter.dispatch(Events.message, wrap(testWorkflowData.pinRequest))

  await expect(cardReadPromise).resolves.toStrictEqual(
    testWorkflowData.pinRequest,
  )

  // Incorrect pin entry
  const pinPromise = aa2Sdk.enterPin(111111)
  emitter.dispatch(Events.message, wrap(testWorkflowData.repeatedPinRequest))

  await pinPromise

  const repeatedPinPromise = aa2Sdk.enterPin(111112)

  emitter.dispatch(Events.message, wrap(testWorkflowData.canRequest))

  await expect(repeatedPinPromise).resolves.toStrictEqual(
    testWorkflowData.canRequest,
  )

  const canPromise = aa2Sdk.enterCan(555555)

  emitter.dispatch(Events.message, wrap(testWorkflowData.repeatedPinRequest))

  await expect(canPromise).resolves.toStrictEqual(
    testWorkflowData.repeatedPinRequest,
  )

  const correctPinPromise = aa2Sdk.enterPin(159652)

  emitter.dispatch(Events.message, wrap(testWorkflowData.auth.success))

  await expect(correctPinPromise).resolves.toStrictEqual(
    testWorkflowData.auth.success,
  )
})
