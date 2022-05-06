import { Messages } from '../../src/messageTypes'
import { AusweisModule } from '../../src/module'
import { AccessRightsFields, CardError } from '../../src/types'
import {
  mockedAccessRightMessage,
  mockedCertificatesMessage,
} from '../helpers/mockedMessages'
import { authFlow } from '../helpers/prepareWorkflowMessages'
import { getMessagesSequenceRunner } from '../helpers/sequencesRunner'
import { emitter, initializaAA2NM, makeReaderVariant } from '../helpers/utils'

async function proceedAuthUntilTheScanner(
  aa2NM: AusweisModule,
  messagesSequenceRunner,
) {
  const certificatesPromise = aa2NM.getCertificate()
  // fire messages: CERTIFICATE
  messagesSequenceRunner.next()
  await expect(certificatesPromise).resolves.toEqual(mockedCertificatesMessage)

  const setAccessRightsPromise = aa2NM.setAccessRights([
    AccessRightsFields.PlaceOfBirth,
  ])
  // fire messages: ACCESS_RIGHTS
  messagesSequenceRunner.next()
  await expect(setAccessRightsPromise).resolves.toEqual(
    mockedAccessRightMessage,
  )

  const acceptPromise = aa2NM.acceptAuthRequest()
  // fire messages: ACCESS_RIGHTS
  messagesSequenceRunner.next()
  await expect(acceptPromise).resolves.toEqual({
    msg: Messages.enterPin,
    ...makeReaderVariant(),
  })
}

describe('Run auth workflow', () => {
  let aa2NM = undefined
  let messagesSequenceRunner = undefined

  beforeAll(async () => {
    aa2NM = await initializaAA2NM()
  })
  jest.setTimeout(10000)
  it('user completes the workflow', async () => {
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      authFlow.buildHappyPath(),
    )
    const mockHandleAuthFailedFn = jest.fn()
    const mockHandlePinRequestFn = jest.fn()
    const mockHandleAuthSuccessFn = jest.fn()

    aa2NM.setHandlers({
      handleAuthFailed: mockHandleAuthFailedFn,
      handleAuthSuccess: mockHandleAuthSuccessFn,
      handlePinRequest: mockHandlePinRequestFn,
    })

    const authPromise = aa2NM.startAuth('https://test.tstoken.de')
    // fire messages: AUTH, ACCESS_RIGHTS
    messagesSequenceRunner.next()
    await expect(authPromise).resolves.toEqual(mockedAccessRightMessage)
    expect(mockHandleAuthFailedFn).toHaveBeenCalledTimes(0)

    await proceedAuthUntilTheScanner(aa2NM, messagesSequenceRunner)

    expect(mockHandlePinRequestFn).toHaveBeenCalledTimes(1)

    const setPinPromise = aa2NM.setPin('111111')
    // fire messages: AUTH
    messagesSequenceRunner.next()
    await expect(setPinPromise).resolves.toEqual({
      msg: Messages.auth,
      result: { major: 'ok' },
      url: 'httpK//test.de',
    })
    expect(mockHandleAuthSuccessFn).toHaveBeenCalledTimes(1)
    expect(mockHandleAuthSuccessFn).toHaveBeenCalledWith('httpK//test.de')
  })

  it('is interrupted because the card is blocked', async () => {
    messagesSequenceRunner = getMessagesSequenceRunner(
      emitter,
      authFlow.buildWithCancel(),
    )

    const mockHandleAuthFailedFn = jest.fn()
    const mockHandlePinRequestFn = jest.fn()
    const mockHandleAuthSuccessFn = jest.fn()
    const mockHandleCanRequestFn = jest.fn()
    const mockHandlePukRequestFn = jest.fn()

    aa2NM.setHandlers({
      handleAuthFailed: mockHandleAuthFailedFn,
      handleAuthSuccess: mockHandleAuthSuccessFn,
      handlePinRequest: mockHandlePinRequestFn,
      handleCanRequest: mockHandleCanRequestFn,
      handlePukRequest: mockHandlePukRequestFn,
    })

    const authPromise = aa2NM.startAuth('https://test.tstoken.de')
    // fire messages: AUTH, ACCESS_RIGHTS
    messagesSequenceRunner.next()
    await authPromise

    await proceedAuthUntilTheScanner(aa2NM, messagesSequenceRunner)
    expect(mockHandlePinRequestFn).toHaveBeenCalledTimes(1)

    const setPinPromise1 = aa2NM.setPin('111111')
    messagesSequenceRunner.next()
    await expect(setPinPromise1).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant({ retryCounter: 2 }),
    })
    expect(mockHandlePinRequestFn).toHaveBeenCalledTimes(2)

    const setPinPromise2 = aa2NM.setPin('111110')
    messagesSequenceRunner.next()
    await expect(setPinPromise2).resolves.toEqual({
      msg: Messages.enterCan,
      ...makeReaderVariant({ retryCounter: 1 }),
    })
    expect(mockHandleCanRequestFn).toHaveBeenCalledTimes(1)

    const setCanPromise = aa2NM.setCan('555555')
    messagesSequenceRunner.next()
    await expect(setCanPromise).resolves.toEqual({
      msg: Messages.enterPin,
      ...makeReaderVariant({ retryCounter: 1 }),
    })
    expect(mockHandlePinRequestFn).toBeCalledTimes(3)

    const setPinPromise3 = aa2NM.setPin('111110')
    messagesSequenceRunner.next()
    await expect(setPinPromise3).resolves.toEqual({
      msg: Messages.enterPuk,
      ...makeReaderVariant({ retryCounter: 0 }),
    })
    expect(mockHandlePukRequestFn).toBeCalledTimes(1)

    const setPukPromise = aa2NM.setPuk()
    messagesSequenceRunner.next()
    await expect(setPukPromise).rejects.toBe(CardError.cardIsBlocked)
    expect(mockHandleAuthFailedFn).toBeCalledTimes(0)
  })
})
