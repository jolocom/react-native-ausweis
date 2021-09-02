export const getInfoCmd = () => {
  return {
    cmd: 'GET_INFO',
  }
}

export const runAuthCmd = (tcTokenURL: string) => {
  return {
    cmd: 'RUN_AUTH',
    tcTokenURL,
    handleInterrupt: false,
    messages: {
      sessionStarted:
        "Please place your ID card on the top of the device's back side.",
      sessionFailed: 'Scanning process failed.',
      sessionSucceeded: 'Scanning process has been finished successfully.',
      sessionInProgress: 'Scanning process is in progress.',
    },
  }
}

export const changePinCmd = () => {
  return {
    cmd: 'RUN_CHANGE_PIN',
    handleInterrupt: false,
    messages: {
      sessionStarted:
        "Please place your ID card on the top of the device's back side.",
      sessionFailed: 'Scanning process failed.',
      sessionSucceeded: 'Scanning process has been finished successfully.',
      sessionInProgress: 'Scanning process is in progress.',
    },
  }
}


export const enterPinCmd = (pin: number) => {
  return {
    cmd: "SET_PIN",
    value: pin.toString()
  }
}

export const acceptAuthReqCmd = () => {
  return {
    cmd: 'ACCEPT'
  }
}
