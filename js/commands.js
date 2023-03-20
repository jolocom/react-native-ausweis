"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNewPinCmd = exports.setCardCmd = exports.setAccessRightsCmd = exports.getAccessRightsCmd = exports.interruptFlowCmd = exports.cancelFlowCmd = exports.getCertificateCmd = exports.acceptCmd = exports.setPinCmd = exports.setCanCmd = exports.setPukCmd = exports.changePinCmd = exports.runAuthCmd = exports.getReaderListCmd = exports.getReaderCmd = exports.setAPILevelCmd = exports.getAPILevelCmd = exports.getStatusCmd = exports.getInfoCmd = exports.disconnectSdkCmd = exports.initSdkCmd = exports.statusHandler = exports.badStateHandler = exports.readerHandler = exports.insertCardHandler = void 0;
const commandTypes_1 = require("./commandTypes");
const messageTypes_1 = require("./messageTypes");
const types_1 = require("./types");
exports.insertCardHandler = {
    canHandle: [messageTypes_1.Messages.insertCard],
    handle: (_, { handleCardRequest }, __) => {
        return handleCardRequest && handleCardRequest();
    },
};
exports.readerHandler = {
    canHandle: [messageTypes_1.Messages.reader],
    handle: (msg, { handleCardInfo }, __) => {
        return handleCardInfo && handleCardInfo(msg.card);
    },
};
exports.badStateHandler = {
    canHandle: [messageTypes_1.Messages.badState],
    handle: (message, _, { reject }) => reject(message.error),
};
exports.statusHandler = {
    canHandle: [messageTypes_1.Messages.status],
    handle: (message, { handleStatus }, __) => {
        return handleStatus && handleStatus(message);
    },
};
const initSdkCmd = (callback) => ({
    command: { cmd: commandTypes_1.Commands.init },
    handler: {
        canHandle: [messageTypes_1.Messages.init],
        handle: callback,
    },
});
exports.initSdkCmd = initSdkCmd;
const disconnectSdkCmd = (callback) => ({
    command: { cmd: commandTypes_1.Commands.disconnect },
    handler: {
        canHandle: [messageTypes_1.Messages.disconnect],
        handle: callback,
    },
});
exports.disconnectSdkCmd = disconnectSdkCmd;
const getInfoCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.getInfo },
        handler: {
            canHandle: [messageTypes_1.Messages.info],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.getInfoCmd = getInfoCmd;
const getStatusCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.getStatus },
        handler: {
            canHandle: [messageTypes_1.Messages.status],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.getStatusCmd = getStatusCmd;
const getAPILevelCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.getAPILevel },
        handler: {
            canHandle: [messageTypes_1.Messages.apiLevel],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.getAPILevelCmd = getAPILevelCmd;
const setAPILevelCmd = (level) => {
    return {
        command: { cmd: commandTypes_1.Commands.setAPILevel, level },
        handler: {
            canHandle: [messageTypes_1.Messages.apiLevel],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.setAPILevelCmd = setAPILevelCmd;
const getReaderCmd = (name) => {
    return {
        command: { cmd: commandTypes_1.Commands.getReader, name },
        handler: {
            canHandle: [messageTypes_1.Messages.reader],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.getReaderCmd = getReaderCmd;
const getReaderListCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.getReaderList },
        handler: {
            canHandle: [messageTypes_1.Messages.readerList],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.getReaderListCmd = getReaderListCmd;
const runAuthCmd = (tcTokenURL, developerMode, handleInterrupt, status, messages) => {
    return {
        command: {
            cmd: commandTypes_1.Commands.runAuth,
            tcTokenURL,
            developerMode,
            handleInterrupt,
            status,
            messages,
        },
        handler: {
            canHandle: [messageTypes_1.Messages.accessRights, messageTypes_1.Messages.auth],
            handle: (message, _, { resolve, reject }) => {
                var _a;
                switch (message.msg) {
                    case messageTypes_1.Messages.auth:
                        if ((_a = message === null || message === void 0 ? void 0 : message.result) === null || _a === void 0 ? void 0 : _a.message) {
                            return reject(message.result);
                        }
                        return;
                    case messageTypes_1.Messages.accessRights:
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.runAuthCmd = runAuthCmd;
const changePinCmd = (handleInterrupt, status, messages) => {
    return {
        command: {
            cmd: commandTypes_1.Commands.runChangePin,
            handleInterrupt,
            status,
            messages,
        },
        handler: {
            canHandle: [
                messageTypes_1.Messages.enterPin,
                messageTypes_1.Messages.enterPuk,
                messageTypes_1.Messages.enterCan,
                messageTypes_1.Messages.changePin,
            ],
            handle: (message, { handlePinRequest, handlePukRequest, handleCanRequest, handleChangePinCancel, }, { resolve, reject }) => {
                switch (message.msg) {
                    case messageTypes_1.Messages.enterPin:
                        handlePinRequest && handlePinRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterPuk:
                        handlePukRequest && handlePukRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterCan:
                        handleCanRequest && handleCanRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.changePin:
                        if (message.success === false) {
                            handleChangePinCancel && handleChangePinCancel();
                            return resolve(message);
                        }
                        return;
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.changePinCmd = changePinCmd;
const setPukCmd = (puk) => {
    return {
        command: {
            cmd: commandTypes_1.Commands.setPuk,
            value: puk,
        },
        handler: {
            canHandle: [
                messageTypes_1.Messages.enterPin,
                messageTypes_1.Messages.enterPuk,
                messageTypes_1.Messages.changePin,
                messageTypes_1.Messages.auth,
            ],
            handle: (message, eventHandlers, { reject, resolve }) => {
                const { handlePukRequest, handlePinRequest } = eventHandlers;
                switch (message.msg) {
                    case messageTypes_1.Messages.auth:
                        return reject(types_1.CardError.cardIsBlocked);
                    case messageTypes_1.Messages.changePin:
                        if (message.success === false) {
                            return reject(types_1.CardError.cardIsBlocked);
                        }
                        return;
                    case messageTypes_1.Messages.enterPin:
                        handlePinRequest && handlePinRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterPuk:
                        handlePukRequest && handlePukRequest(message.reader.card);
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.setPukCmd = setPukCmd;
const setCanCmd = (can) => {
    return {
        command: {
            cmd: commandTypes_1.Commands.setCan,
            value: can,
        },
        handler: {
            canHandle: [
                messageTypes_1.Messages.enterPin,
                messageTypes_1.Messages.enterCan,
                messageTypes_1.Messages.changePin,
                messageTypes_1.Messages.auth,
            ],
            handle: (message, eventHandlers, { resolve, reject }) => {
                var _a;
                const { handleCanRequest, handlePinRequest, handleChangePinCancel, handleAuthFailed, handleAuthSuccess, } = eventHandlers;
                switch (message.msg) {
                    case messageTypes_1.Messages.changePin:
                        if (message.success === false) {
                            handleChangePinCancel && handleChangePinCancel();
                            return resolve(message);
                        }
                        return;
                    case messageTypes_1.Messages.auth:
                        if ((_a = message.result) === null || _a === void 0 ? void 0 : _a.message) {
                            handleAuthFailed &&
                                handleAuthFailed(message.url, message.result.message);
                        }
                        else {
                            handleAuthSuccess && handleAuthSuccess(message.url);
                        }
                        return resolve(message);
                    case messageTypes_1.Messages.enterPin:
                        handlePinRequest && handlePinRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterCan:
                        handleCanRequest && handleCanRequest(message.reader.card);
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.setCanCmd = setCanCmd;
const setPinCmd = (pin) => {
    return {
        command: {
            cmd: commandTypes_1.Commands.setPin,
            value: pin,
        },
        handler: {
            canHandle: [
                messageTypes_1.Messages.enterPuk,
                messageTypes_1.Messages.enterPin,
                messageTypes_1.Messages.enterCan,
                messageTypes_1.Messages.auth,
                messageTypes_1.Messages.enterNewPin,
                messageTypes_1.Messages.changePin,
            ],
            handle: (message, eventHandlers, { resolve, reject }) => {
                var _a, _b, _c, _d;
                const { handleCanRequest, handlePinRequest, handlePukRequest, handleEnterNewPin, handleChangePinCancel, handleAuthFailed, handleAuthSuccess, } = eventHandlers;
                switch (message.msg) {
                    case messageTypes_1.Messages.changePin:
                        if (message.success === false) {
                            handleChangePinCancel && handleChangePinCancel();
                            return resolve(message);
                        }
                        return;
                    case messageTypes_1.Messages.enterNewPin:
                        handleEnterNewPin && handleEnterNewPin();
                        return resolve(message);
                    case messageTypes_1.Messages.auth:
                        if ((_a = message.result) === null || _a === void 0 ? void 0 : _a.message) {
                            handleAuthFailed &&
                                handleAuthFailed(message.url, message.result.message);
                        }
                        else {
                            handleAuthSuccess && handleAuthSuccess(message.url);
                        }
                        return resolve(message);
                    case messageTypes_1.Messages.enterPin:
                        handlePinRequest && handlePinRequest((_b = message.reader) === null || _b === void 0 ? void 0 : _b.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterPuk:
                        handlePukRequest && handlePukRequest((_c = message.reader) === null || _c === void 0 ? void 0 : _c.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterCan:
                        handleCanRequest && handleCanRequest((_d = message.reader) === null || _d === void 0 ? void 0 : _d.card);
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.setPinCmd = setPinCmd;
const acceptCmd = () => {
    return {
        command: {
            cmd: commandTypes_1.Commands.accept,
        },
        handler: {
            canHandle: [
                messageTypes_1.Messages.enterPin,
                messageTypes_1.Messages.enterCan,
                messageTypes_1.Messages.enterPuk,
                messageTypes_1.Messages.auth,
            ],
            handle: (message, { handlePinRequest, handlePukRequest, handleCanRequest, handleAuthFailed, handleAuthSuccess, }, { resolve, reject }) => {
                var _a;
                switch (message.msg) {
                    case messageTypes_1.Messages.enterPin:
                        handlePinRequest && handlePinRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterPuk:
                        handlePukRequest && handlePukRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.enterCan:
                        handleCanRequest && handleCanRequest(message.reader.card);
                        return resolve(message);
                    case messageTypes_1.Messages.auth:
                        if ((_a = message.result) === null || _a === void 0 ? void 0 : _a.message) {
                            handleAuthFailed &&
                                handleAuthFailed(message.url, message.result.message);
                        }
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.acceptCmd = acceptCmd;
const getCertificateCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.getCertificate },
        handler: {
            canHandle: [messageTypes_1.Messages.certificate],
            handle: (message, _, { resolve }) => resolve(message),
        },
    };
};
exports.getCertificateCmd = getCertificateCmd;
const cancelFlowCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.cancel },
        handler: {
            canHandle: [messageTypes_1.Messages.auth, messageTypes_1.Messages.changePin],
            handle: (message, { handleChangePinCancel, handleAuthFailed, handleAuthSuccess }, { resolve, reject }) => {
                var _a;
                switch (message.msg) {
                    case messageTypes_1.Messages.auth:
                        if ((_a = message.result) === null || _a === void 0 ? void 0 : _a.message) {
                            handleAuthFailed &&
                                handleAuthFailed(message.url, message.result.message);
                        }
                        return resolve(message);
                    case messageTypes_1.Messages.changePin:
                        if (message.success === false) {
                            handleChangePinCancel && handleChangePinCancel();
                            return resolve(message);
                        }
                        return;
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.cancelFlowCmd = cancelFlowCmd;
const interruptFlowCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.interrupt },
    };
};
exports.interruptFlowCmd = interruptFlowCmd;
const getAccessRightsCmd = () => {
    return {
        command: { cmd: commandTypes_1.Commands.getAccessRights },
        handler: {
            canHandle: [messageTypes_1.Messages.accessRights],
            handle: (message, _, { resolve, reject }) => {
                switch (message.msg) {
                    case messageTypes_1.Messages.accessRights:
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.getAccessRightsCmd = getAccessRightsCmd;
const setAccessRightsCmd = (optionalFields) => {
    return {
        command: { cmd: commandTypes_1.Commands.setAccessRights, chat: optionalFields },
        handler: {
            canHandle: [messageTypes_1.Messages.accessRights],
            handle: (message, _, { resolve, reject }) => {
                switch (message.msg) {
                    case messageTypes_1.Messages.accessRights:
                        return resolve(message);
                    default:
                        return reject(new Error('Unknown message type'));
                }
            },
        },
    };
};
exports.setAccessRightsCmd = setAccessRightsCmd;
const setCardCmd = (readerName, simulatorData) => {
    return {
        command: {
            cmd: commandTypes_1.Commands.setCard,
            name: readerName,
            simulator: simulatorData,
        },
    };
};
exports.setCardCmd = setCardCmd;
const setNewPinCmd = (pin) => {
    return {
        command: { cmd: commandTypes_1.Commands.setNewPin, value: pin },
        handler: {
            canHandle: [messageTypes_1.Messages.changePin],
            handle: (message, eventHandlers, { resolve }) => {
                const { handleChangePinSuccess, handleChangePinCancel } = eventHandlers;
                if (message.success === true) {
                    handleChangePinSuccess && handleChangePinSuccess();
                    return resolve(message);
                }
                else if (message.success === false) {
                    handleChangePinCancel && handleChangePinCancel();
                    return resolve(message);
                }
            },
        },
    };
};
exports.setNewPinCmd = setNewPinCmd;
//# sourceMappingURL=commands.js.map