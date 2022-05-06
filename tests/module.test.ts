import { Messages } from '../src/messageTypes'
import { AusweisModule } from '../src/module'
import { Events } from '../src/types'
import { changePinFlow } from './helpers/prepareWorkflowMessages'
import { getMessagesSequenceRunner } from './helpers/sequencesRunner'
import {
  emitter,
  initializaAA2NM,
  makeReaderVariant,
  mockAa2Impl,
} from './helpers/utils'

describe('AA2 SDK', () => {
  it('handles succesfull initalization', async () => {
    const aa2NM = new AusweisModule(mockAa2Impl, emitter)
    const initPromise = aa2NM.initAa2Sdk()

    expect(aa2NM.isInitialized).toBe(false)
    emitter.dispatch(Events.sdkInitialized)
    expect(aa2NM.isInitialized).toBe(false)

    await initPromise

    expect(aa2NM.isInitialized).toBe(true)
  })

  it('throws if the AA2 SDK is already initialized', async () => {
    const aa2NM = new AusweisModule(mockAa2Impl, emitter)
    const promise = aa2NM.initAa2Sdk()

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

  describe('internal quirks; module', () => {
    let aa2NM = undefined
    let messagesSequenceRunner = undefined

    beforeAll(async () => {
      aa2NM = await initializaAA2NM()
    })
    it('overwrites current opeartion if disruptive command is sent', async () => {
      messagesSequenceRunner = getMessagesSequenceRunner(
        emitter,
        changePinFlow.buildForDisruptiveCmd(),
      )
      const startChangePinPromise = aa2NM.startChangePin()
      // fire just INSERT_CARD msg; because as soon as ENTER_PIN msg is
      // sent - 'startChangePinPromise' will be resolved and currentOperation
      // will be cleared up
      messagesSequenceRunner.next()

      const cancelFlowPromise = aa2NM.cancelFlow()
      // here we receive ENTER_PIN msg that should resolve startChangePinPromise;
      // however it was already overwritten by CANCEL cmd
      messagesSequenceRunner.next()
      /**
       * TODO @sbub
       * make sure to handle promise with either resolve or reject rather than
       * just overwriting current operation
       */
      startChangePinPromise.catch((e) => {
        expect(e).toMatch(/Exceeded timeout/)
      })

      messagesSequenceRunner.next()
      return cancelFlowPromise
    })

    it('queues up cmds', async () => {
      messagesSequenceRunner = getMessagesSequenceRunner(
        emitter,
        changePinFlow.buildForQueuingCmd(),
      )
      const startChangePinPromise = aa2NM.startChangePin()
      // fire only INSERT_CARD msg
      messagesSequenceRunner.next()

      // before startChangePinPromise is resolved fire another cmd
      const setPinPromise = aa2NM.setPin('111111')
      // fire ENTER_CAN msg
      messagesSequenceRunner.next()
      // change pin should have been resolved by ENTER_CAN msg
      await expect(startChangePinPromise).resolves.toEqual({
        msg: Messages.enterCan,
        ...makeReaderVariant(),
      })

      // next cmd in the queue should be fired (aa2NM.setPin('111111'))
      messagesSequenceRunner.next()
      await expect(setPinPromise).resolves.toEqual({
        msg: Messages.enterPin,
        ...makeReaderVariant(),
      })
    })
  })
})
