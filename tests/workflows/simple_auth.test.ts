import { Aa2Module } from "../../src/module"
import { Message, Events } from "../../src/types"
import { testWorkflowData } from "../data"

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

const wrap = (msg: Object) => JSON.stringify({ message: JSON.stringify(msg) })
it("Minimal successful authentication", async () => {
  const aa2Sdk = await getTestAaModule()

  const processReqPromise = aa2Sdk.processRequest(
    "https://test.governikus-eid.de/DEMO"
  )

  emitter.dispatch(Events.message, wrap(testWorkflowData.auth.empty))
  emitter.dispatch(Events.message, wrap(testWorkflowData.accessRights))

  await expect(processReqPromise).resolves.toStrictEqual(
    testWorkflowData.accessRights
  )

  aa2Sdk.acceptAuthRequest()
  emitter.dispatch(Events.message, wrap(testWorkflowData.cardRequest))

  const cardReadPromise = aa2Sdk.checkIfCardWasRead()

  emitter.dispatch(Events.message, wrap(testWorkflowData.pinRequest))

  await expect(cardReadPromise).resolves.toStrictEqual(
    testWorkflowData.pinRequest
  )

  const pinPromise = aa2Sdk.enterPin(111111)

  emitter.dispatch(Events.message, wrap(testWorkflowData.auth.success))

  await expect(pinPromise).resolves.toStrictEqual(testWorkflowData.auth.success)
})
