import { Messages } from '../../src/messageTypes'
import { AusweisModule } from '../../src/module'
import { CardError } from '../../src/types'
import { changePinFlow } from '../helpers/prepareWorkflowMessages'
import { getMessagesSequenceRunner } from '../helpers/sequencesRunner'
import { emitter, initializaAA2NM, makeReaderVariant } from '../helpers/utils'

describe('Change pin workflow', () => {
  let aa2NM: AusweisModule
  let messagesSequenceRunner: Generator<undefined, void, unknown>

  beforeAll(async () => {
    aa2NM = await initializaAA2NM()
  })

  test('user completes the workflow', async () => {
    const mockHandleChangePinCancelFn = jest.fn()
    const mockHandleChangePinSuccessFn = jest.fn()
    const mockHandleEnterNewPinFn = jest.fn()

    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      changePinFlow.buildHappyPath(),
    )

    aa2NM.setHandlers({
      handleChangePinCancel: mockHandleChangePinCancelFn,
      handleChangePinSuccess: mockHandleChangePinSuccessFn,
      handleEnterNewPin: mockHandleEnterNewPinFn,
    })

    const startChangePinPromise = aa2NM.startChangePin()

    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PIN
    messagesSequenceRunner.next()

    await expect(startChangePinPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant(),
    })
    expect(mockHandleChangePinCancelFn).toHaveBeenCalledTimes(0)

    const setPinPromise = aa2NM.setPin('111111')

    // fire messages: INSERT_CARD, ENTER_NEW_PIN
    messagesSequenceRunner.next()

    await expect(setPinPromise).resolves.toEqual({
      msg: Messages.enterNewPin,
      ...makeReaderVariant(),
    })
    expect(mockHandleEnterNewPinFn).toHaveBeenCalledTimes(1)

    const setNewPinPromise = aa2NM.setNewPin('555555')
    // fire messages: INSERT_CARD, CHANGE_PIN
    messagesSequenceRunner.next()

    await expect(setNewPinPromise).resolves.toEqual({
      msg: Messages.changePin,
      success: true,
    })
    expect(mockHandleChangePinSuccessFn).toHaveBeenCalledTimes(1)
  })

  test('user interrupts the workflow after scanning the card is requested', async () => {
    const mockHandleChangePinCancelFn = jest.fn()
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      changePinFlow.buildWithCancel(),
    )

    aa2NM.setHandlers({
      handleChangePinCancel: mockHandleChangePinCancelFn,
    })

    aa2NM.startChangePin()
    // fire messages: CHANGE_PIN, INSERT_CARD
    messagesSequenceRunner.next()

    const cancelWorkflow = aa2NM.cancelFlow()
    // fire messages: CHANGE_PIN
    messagesSequenceRunner.next()

    await expect(cancelWorkflow).resolves.toEqual({
      msg: Messages.changePin,
      success: false,
    })
    expect(mockHandleChangePinCancelFn).toHaveBeenCalledTimes(1)
  })

  test('user interrupts the workflow after pin is requested', async () => {
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      changePinFlow.buildWithCancelAfterPin(),
    )

    const startChangePinPromise = aa2NM.startChangePin()

    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PIN
    messagesSequenceRunner.next()

    await expect(startChangePinPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant(),
    })

    aa2NM.setPin('111111')
    // fire messages: 'INSERT_CARD'
    messagesSequenceRunner.next()

    const cancelWorkflow = aa2NM.cancelFlow()
    // fire messages: 'CHANGE_PIN'
    messagesSequenceRunner.next()
    await expect(cancelWorkflow).resolves.toEqual({
      msg: Messages.changePin,
      success: false,
    })
  })

  test('user uses card in puk state', async () => {
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      changePinFlow.buildWithCardInPukState(),
    )
    const startChangePinPromise = aa2NM.startChangePin()
    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PUK
    messagesSequenceRunner.next()

    await expect(startChangePinPromise).resolves.toEqual({
      msg: Messages.enterPuk,
      ...makeReaderVariant({ retryCounter: 0 }),
    })

    const setPukPromise = aa2NM.setPuk('1111111111')
    // fire messages: INSERT_CARD, ENTER_PIN
    messagesSequenceRunner.next()
    await expect(setPukPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant(),
    })

    const setPinPromise = aa2NM.setPin('555555')
    // fire messages: INSERT_CARD, CHANGE_PIN
    messagesSequenceRunner.next()
    await expect(setPinPromise).resolves.toEqual({
      msg: Messages.enterNewPin,
      ...makeReaderVariant(),
    })

    const setNewPinPromise = aa2NM.setNewPin('555555')
    messagesSequenceRunner.next()
    await expect(setNewPinPromise).resolves.toEqual({
      msg: Messages.changePin,
      success: true,
    })
  })

  test("user's card is blocked", async () => {
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      changePinFlow.buildWithBlockedCard(),
    )

    const startChangePinPromise = aa2NM.startChangePin()
    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PUK
    messagesSequenceRunner.next()

    await expect(startChangePinPromise).resolves.toEqual({
      msg: Messages.enterPuk,
      ...makeReaderVariant({ retryCounter: 0 }),
    })
    const setPukPromise = aa2NM.setPuk('1111111111')
    // fire messages: INSERT_CARD, CHANGE_PIN
    messagesSequenceRunner.next()
    await expect(setPukPromise).rejects.toBe(CardError.cardIsBlocked)
  })

  test('user provides wrong pin twice', async () => {
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      changePinFlow.buildWithCan(),
    )

    const startChangePinPromise = aa2NM.startChangePin()
    // fire messages: CHANGE_PIN, INSERT_CARD, ENTER_PUK
    messagesSequenceRunner.next()
    await expect(startChangePinPromise).resolves.toEqual({
      msg: Messages.enterCan,
      ...makeReaderVariant({ retryCounter: 1 }),
    })

    const setCanPromise = aa2NM.setCan('555555')
    messagesSequenceRunner.next()
    await expect(setCanPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant({ retryCounter: 1 }),
    })

    const setPinPromise3 = aa2NM.setPin('000000')
    messagesSequenceRunner.next()
    await expect(setPinPromise3).resolves.toEqual({
      msg: Messages.enterNewPin,
      ...makeReaderVariant(),
    })

    const setNewPin = aa2NM.setNewPin('555555')
    messagesSequenceRunner.next()
    await expect(setNewPin).resolves.toEqual({
      msg: Messages.changePin,
      success: true,
    })
  })
})
