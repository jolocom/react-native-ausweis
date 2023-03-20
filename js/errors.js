"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendCommandError = exports.SdkNotInitializedError = exports.SdkInternalError = exports.SdkInitializationError = void 0;
var ErrorTypes;
(function (ErrorTypes) {
    ErrorTypes["sdkInitError"] = "SdkInitializationError";
    ErrorTypes["sdkNotInitialized"] = "SdkNotInitializedError";
    ErrorTypes["sdkInternalError"] = "SdkInternalError";
    ErrorTypes["sendCommandError"] = "SendCommandError";
})(ErrorTypes || (ErrorTypes = {}));
class SdkInitializationError extends Error {
    constructor() {
        super('AusweisApp2 SDK already initialized.');
        this.name = ErrorTypes.sdkInitError;
    }
}
exports.SdkInitializationError = SdkInitializationError;
class SdkInternalError extends Error {
    constructor() {
        super('Internal error caused by the AusweisApp2');
        this.name = ErrorTypes.sdkInitError;
    }
}
exports.SdkInternalError = SdkInternalError;
class SdkNotInitializedError extends Error {
    constructor() {
        super('AusweisApp2 SDK is not initialized.');
        this.name = ErrorTypes.sdkInitError;
    }
}
exports.SdkNotInitializedError = SdkNotInitializedError;
class SendCommandError extends Error {
    constructor() {
        super('Could not send command to the AusweisApp2 SDK background service');
        this.name = ErrorTypes.sdkInitError;
    }
}
exports.SendCommandError = SendCommandError;
//# sourceMappingURL=errors.js.map