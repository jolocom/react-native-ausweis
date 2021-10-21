enum ErrorTypes {
  sdkInitError = 'SdkInitializationError',
  sdkNotInitialized = 'SdkNotInitializedError',
  sdkInternalError = 'SdkInternalError',
  sendCommandError = 'SendCommandError',
}

export class SdkInitializationError extends Error {
  constructor() {
    super('AusweisApp2 SDK already initialized.')
    this.name = ErrorTypes.sdkInitError
  }
}

export class SdkInternalError extends Error {
  constructor() {
    // TODO More?
    super('Internal error caused by the AusweisApp2')
    this.name = ErrorTypes.sdkInitError
  }
}

export class SdkNotInitializedError extends Error {
  constructor() {
    super('AusweisApp2 SDK is not initialized.')
    this.name = ErrorTypes.sdkInitError
  }
}

export class SendCommandError extends Error {
  constructor() {
    super('Could not send command to the AusweisApp2 SDK background service')
    this.name = ErrorTypes.sdkInitError
  }
}
