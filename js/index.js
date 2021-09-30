"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = exports.filters = exports.acceptAuthRequest = exports.checkIfCardWasRead = exports.enterPin = exports.runAuth = exports.getInfo = exports.initAa2Sdk = void 0;
const react_native_1 = require("react-native");
const { Aa2Sdk } = react_native_1.NativeModules;
const initAa2Sdk = async () => Aa2Sdk.initAASdk().then(() => waitTillCondition(exports.filters.initMsg));
exports.initAa2Sdk = initAa2Sdk;
const getInfo = async () => {
    const getInfoCmd = {
        cmd: 'GET_INFO',
    };
    return sendCmd(getInfoCmd).then(() => waitTillCondition(exports.filters.infoMsg));
};
exports.getInfo = getInfo;
const runAuth = async (tcTokenUrl) => {
    const runAuthCmd = {
        cmd: 'RUN_AUTH',
        tcTokenURL: tcTokenUrl,
        handleInterrupt: true,
        messages: {
            sessionStarted: "Please place your ID card on the top of the device's back side.",
            sessionFailed: 'Scanning process failed.',
            sessionSucceeded: 'Scanning process has been finished successfully.',
            sessionInProgress: 'Scanning process is in progress.',
        },
    };
    return sendCmd(runAuthCmd).then(_ => waitTillCondition(exports.filters.accessRightsMsg));
};
exports.runAuth = runAuth;
const enterPin = async (pin) => {
    const enterPinMsg = {
        "cmd": "SET_PIN",
        "value": pin.toString()
    };
    return sendCmd(enterPinMsg).then(() => waitTillCondition(exports.filters.authMsg));
};
exports.enterPin = enterPin;
const checkIfCardWasRead = async () => {
    return waitTillCondition(exports.filters.enterPinMsg);
};
exports.checkIfCardWasRead = checkIfCardWasRead;
const acceptAuthRequest = async () => {
    const acceptCmd = { cmd: 'ACCEPT' };
    return sendCmd(acceptCmd).then(() => waitTillCondition(exports.filters.insertCardMsg));
};
exports.acceptAuthRequest = acceptAuthRequest;
const delay = async (delay) => {
    return new Promise(resolve => setTimeout(resolve, delay));
};
exports.filters = {
    initMsg: (message) => message.msg === 'INIT',
    infoMsg: (message) => message.msg === 'INFO',
    authMsg: (message) => message.msg === 'AUTH',
    accessRightsMsg: (message) => message.msg === 'ACCESS_RIGHTS',
    insertCardMsg: (message) => message.msg === 'INSERT_CARD',
    enterPinMsg: (message) => message.msg === 'ENTER_PIN',
};
const waitTillCondition = async (filter) => {
    await delay(3000);
    return exports.getEvents()
        .then(messages => (messages || []).filter(filter)[0])
        .then(message => {
        return message || waitTillCondition(filter);
    });
};
const sendCmd = async (message) => {
    const res = await Aa2Sdk.sendCMD(JSON.stringify(message));
    if (!res) {
        throw new Error('TODO: Sending failed');
    }
    return;
};
const getEvents = async () => {
    return Aa2Sdk.getNewEvents().then(events => {
        if (events.length) {
            return events.map(JSON.parse);
        }
        return [];
    });
};
exports.getEvents = getEvents;
//# sourceMappingURL=index.js.map