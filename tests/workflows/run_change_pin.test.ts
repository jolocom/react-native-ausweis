import { Messages } from '../../src/messageTypes'
import { Events } from '../../src/types'
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
    runChangePinMessagesSequence = getRunChangePinMessagesSequence(
      emitter,
      changePinFlow.buildHappyPath(),
    )
  })

  test('goes through happy path', async () => {
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
})
