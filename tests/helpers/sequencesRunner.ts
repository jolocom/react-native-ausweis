import { Events } from '../../src/types'
import { Msg } from './prepareWorkflowMessages'
import { stringifyMessage, TestEmitter } from './utils'

export function* getMessagesSequenceRunner(
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
