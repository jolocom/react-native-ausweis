import { Messages } from '../../src/messageTypes'
import { CardError, Events } from '../../src/types'
import { changePinFlow, Msg } from '../helpers/prepareWorkflowMessages'
import {
  emitter,
  initializaAA2NM,
  makeReaderVariant,
  stringifyMessage,
  TestEmitter,
} from '../helpers/utils'

function* getRunChangePinMessagesSequence(
  emitter: TestEmitter,
  msgSequences: Msg[][],
) {
  for (const sequence of msgSequences) {
    /**
     * dispatch all the messages in a sequence and
     * stop execution until next .next() will be called
     */
    for (const msg of sequence) {
      emitter.dispatch(Events.message, stringifyMessage(msg))
    }
    yield
  }
}

describe('Change pin workflow', () => {
  let aa2NM = undefined
  let runChangePinMessagesSequence = undefined

  beforeAll(async () => {
    aa2NM = await initializaAA2NM()
  })
  afterEach(() => {
    runChangePinMessagesSequence = undefined
  })

  test('user completes the workflow', async () => {
    runChangePinMessagesSequence = getRunChangePinMessagesSequence(
      emitter,
      changePinFlow.buildHappyPath(),
    )

    const changePinPromise = aa2NM.changePin()

    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PIN
    runChangePinMessagesSequence.next()

    await expect(changePinPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant(),
    })

    const setPinPromise = aa2NM.enterPin('111111')

    // fire messages: INSERT_CARD, ENTER_NEW_PIN
    runChangePinMessagesSequence.next()

    await expect(setPinPromise).resolves.toEqual({
      msg: Messages.enterNewPin,
      ...makeReaderVariant(),
    })

    const setNewPinPromise = aa2NM.setNewPin('555555')
    // fire messages: INSERT_CARD, CHANGE_PIN
    runChangePinMessagesSequence.next()

    await expect(setNewPinPromise).resolves.toEqual({
      msg: Messages.changePin,
      success: true,
    })
  })

  test('user interrupts the workflow after scanning the card is requested', async () => {
    runChangePinMessagesSequence = getRunChangePinMessagesSequence(
      emitter,
      changePinFlow.buildWithCancel(),
    )

    aa2NM.changePin()
    // fire messages: CHANGE_PIN, INSERT_CARD
    runChangePinMessagesSequence.next()

    const cancelWorkflow = aa2NM.cancelFlow()
    // fire messages: CHANGE_PIN
    runChangePinMessagesSequence.next()

    await expect(cancelWorkflow).resolves.toEqual({
      msg: Messages.changePin,
      success: false,
    })
  })

  test('user interrupts the workflow after pin is requested', async () => {
    runChangePinMessagesSequence = getRunChangePinMessagesSequence(
      emitter,
      changePinFlow.buildWithCancelAfterPin(),
    )

    const changePinPromise = aa2NM.changePin()

    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PIN
    runChangePinMessagesSequence.next()

    await expect(changePinPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant(),
    })

    aa2NM.enterPin('111111')
    // fire messages: 'INSERT_CARD'
    runChangePinMessagesSequence.next()

    const cancelWorkflow = aa2NM.cancelFlow()
    // fire messages: 'CHANGE_PIN'
    runChangePinMessagesSequence.next()
    await expect(cancelWorkflow).resolves.toEqual({
      msg: Messages.changePin,
      success: false,
    })
  })

  test('user uses card in puk state', async () => {
    runChangePinMessagesSequence = getRunChangePinMessagesSequence(
      emitter,
      changePinFlow.buildWithCardInPukState(),
    )
    const changePinPromise = aa2NM.changePin()
    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PUK
    runChangePinMessagesSequence.next()

    await expect(changePinPromise).resolves.toEqual({
      msg: Messages.enterPuk,
      ...makeReaderVariant({ retryCounter: 0 }),
    })

    const setPukPromise = aa2NM.enterPUK('1111111111')
    // fire messages: INSERT_CARD, ENTER_PIN
    runChangePinMessagesSequence.next()
    await expect(setPukPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant(),
    })

    const setPinPromise = aa2NM.enterPin('555555')
    // fire messages: INSERT_CARD, CHANGE_PIN
    runChangePinMessagesSequence.next()
    await expect(setPinPromise).resolves.toEqual({
      msg: Messages.changePin,
      success: true,
    })
  })

  test("user's card is blocked", async () => {
    runChangePinMessagesSequence = getRunChangePinMessagesSequence(
      emitter,
      changePinFlow.buildWithBlockedCard(),
    )

    const changePinPromise = aa2NM.changePin()
    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PUK
    runChangePinMessagesSequence.next()

    await expect(changePinPromise).resolves.toEqual({
      msg: Messages.enterPuk,
      ...makeReaderVariant({ retryCounter: 0 }),
    })
    const setPukPromise = aa2NM.enterPUK('1111111111')
    // fire messages: INSERT_CARD, CHANGE_PIN
    runChangePinMessagesSequence.next()
    await expect(setPukPromise).rejects.toBe(CardError.cardIsBlocked)
  })
})
