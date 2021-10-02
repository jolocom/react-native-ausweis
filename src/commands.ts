import { filters } from "./responseFilters"
import { Filter } from "./types"

export type Request = {
  command: Object,
  responseConditions: {
    success: Filter,
    failure: Filter
  }
}

export const initSdkCmd = (): Request => {
  return {
    command: { cmd: {cmd: 'INIT'} },
    responseConditions: {
      success: filters.initMsg,
      failure: (_) => false
    }
  }
}

export const getInfoCmd = (): Request => {
  return {
    command: {cmd: 'GET_INFO'},
    responseConditions: {
      success: filters.infoMsg,
      failure: (_) => false
    }
  }
}

export const runAuthCmd = (tcTokenURL: string): Request => {
  return {
    command: {
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
    },
    responseConditions: {
      success: filters.accessRightsMsg,
      failure: (_) => false
    }
  }
}

export const changePinCmd = (): Request => {
  return { command: {
    cmd: 'RUN_CHANGE_PIN',
    handleInterrupt: false,
    messages: {
      sessionStarted:
        "Please place your ID card on the top of the device's back side.",
      sessionFailed: 'Scanning process failed.',
      sessionSucceeded: 'Scanning process has been finished successfully.',
      sessionInProgress: 'Scanning process is in progress.',
    }
  },
           responseConditions: {
             success: (_) => false,
             failure: (_) => false
           }
  }
}


export const enterPinCmd = (pin: number): Request => {
  return {
    command: {
    cmd: "SET_PIN",
    value: pin.toString()
  },
    responseConditions: {
             success: filters.authMsg,
             failure: (_) => false
    }
  }
}

export const acceptAuthReqCmd = (): Request => {
  return {
    command: {
      cmd: 'ACCEPT'
    },
    responseConditions: {
             success: filters.insertCardMsg,
             failure: (_) => false
    }
  }
}

export const getCertificate = (): Request => {
  return {
    command: { cmd:  'GET_CERTIFICATE' },
    responseConditions: {
      success: filters.getCertificate,
      failure: (_) => false
    }
  }
}
