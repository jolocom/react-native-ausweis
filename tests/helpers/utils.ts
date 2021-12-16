import { Aa2Module } from '../../src/module'
import { CardInfo, Events } from '../../src/types'

export class TestEmitter {
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

export const mockAa2Impl = {
  sendCMD: async (_: Object) => {},
  initAASdk: async () => {},
}

export const emitter = new TestEmitter()

export const initializaAA2NM = async () => {
  const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
  const initPromise = aa2Sdk.initAa2Sdk()

  emitter.dispatch(Events.sdkInitialized)
  await initPromise
  return aa2Sdk
}

/**
 * Messages are being dispatch from SDK in strigified json format
 */
export const stringifyMessage = (msg: Object) =>
  JSON.stringify({ message: JSON.stringify(msg) })

/**
 * Reader properties are used accross different messages,
 * i.e. ENTER_PIN; some tests require variations of
 * card properties to test different use cases
 */
export function makeReaderVariant(cardProps?: Partial<CardInfo>) {
  const defaultReaderMsg = {
    reader: {
      attached: true,
      card: {
        deactivated: false,
        inoperative: false,
        retryCounter: 3,
      },
      keypad: false,
      name: 'NFC',
    },
  }
  if (cardProps && Object.keys(cardProps).length) {
    return Object.assign(defaultReaderMsg, {
      reader: { card: { ...defaultReaderMsg.reader.card, ...cardProps } },
    })
  }
  return defaultReaderMsg
}
