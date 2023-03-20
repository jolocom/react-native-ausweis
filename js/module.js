"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AusweisModule = void 0;
const events_1 = __importDefault(require("events"));
const commands_1 = require("./commands");
const commandTypes_1 = require("./commandTypes");
const errors_1 = require("./errors");
const messageTypes_1 = require("./messageTypes");
const types_1 = require("./types");
class AusweisModule {
    constructor(aa2Implementation, nativeEventEmitter) {
        this.unprocessedMessages = [];
        this.queuedOperations = [];
        this.handlers = [
            commands_1.insertCardHandler,
            commands_1.readerHandler,
            commands_1.badStateHandler,
            commands_1.statusHandler,
        ];
        this.eventHandlers = {};
        this.messageEmitter = new events_1.default();
        this.isInitialized = false;
        this.nativeAa2Module = aa2Implementation;
        this.nativeEventEmitter = nativeEventEmitter;
        this.setupEventHandlers();
    }
    enableLogger(shouldEnable) {
        this.logger = shouldEnable;
    }
    log(data) {
        if (this.logger) {
            console.log('Ausweis Logger: ', JSON.stringify(data, null, 2));
        }
    }
    setupEventHandlers() {
        this.nativeEventEmitter.addListener(types_1.Events.sdkInitialized, () => this.onMessage({ msg: messageTypes_1.Messages.init }));
        this.nativeEventEmitter.addListener(types_1.Events.sdkDisconnected, () => this.onMessage({ msg: messageTypes_1.Messages.disconnect }));
        this.nativeEventEmitter.addListener(types_1.Events.message, (response) => {
            const { message, error } = JSON.parse(response);
            if (error) {
                this.rejectCurrentOperation(error);
            }
            if (message) {
                this.onMessage(JSON.parse(message));
            }
        });
        this.nativeEventEmitter.addListener(types_1.Events.error, (err) => {
            const { error } = JSON.parse(err);
            this.rejectCurrentOperation(error);
        });
    }
    setHandlers(eventHandlers) {
        this.eventHandlers = Object.assign(Object.assign({}, this.eventHandlers), eventHandlers);
    }
    resetHandlers() {
        this.eventHandlers = {};
    }
    async initAa2Sdk() {
        return new Promise((resolve, reject) => {
            const initCmd = (0, commands_1.initSdkCmd)(() => {
                this.isInitialized = true;
                this.currentOperation.callbacks.resolve();
                return this.clearCurrentOperation();
            });
            this.currentOperation = Object.assign(Object.assign({}, initCmd), { callbacks: { resolve, reject } });
            this.nativeAa2Module.initAASdk();
        });
    }
    async disconnectAa2Sdk() {
        return new Promise((resolve, reject) => {
            if (this.currentOperation !== undefined ||
                this.queuedOperations.length !== 0) {
                reject(new Error('Command queue not empty'));
            }
            const initCmd = (0, commands_1.disconnectSdkCmd)(() => {
                this.isInitialized = false;
                this.currentOperation.callbacks.resolve();
                return this.clearCurrentOperation();
            });
            this.currentOperation = Object.assign(Object.assign({}, initCmd), { callbacks: { resolve, reject } });
            this.nativeAa2Module.disconnectSdk();
        });
    }
    rejectCurrentOperation(errorMessage) {
        if (!this.currentOperation) {
            throw new Error('TODO');
        }
        this.currentOperation.callbacks.reject(new Error(errorMessage));
        this.clearCurrentOperation();
        return;
    }
    clearCurrentOperation() {
        this.currentOperation = undefined;
    }
    sendVoidCmd({ command }) {
        this.log(command);
        if (!this.isInitialized) {
            throw new errors_1.SdkNotInitializedError();
        }
        this.nativeAa2Module.sendCMD(JSON.stringify(command));
    }
    async sendCmd({ command, handler, }) {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                return reject(new errors_1.SdkNotInitializedError());
            }
            if (!this.currentOperation || commandTypes_1.disruptiveCommands.includes(command.cmd)) {
                this.currentOperation = {
                    command,
                    handler,
                    callbacks: {
                        resolve: (message) => {
                            this.clearCurrentOperation();
                            this.fireNextCommand();
                            return resolve(message);
                        },
                        reject: (error) => {
                            this.clearCurrentOperation();
                            this.fireNextCommand();
                            return reject(error);
                        },
                    },
                };
                this.log(command);
                this.nativeAa2Module.sendCMD(JSON.stringify(command));
            }
            else {
                this.queuedOperations.push({
                    command,
                    handler,
                    callbacks: { resolve, reject },
                });
                return;
            }
        });
    }
    onMessage(message) {
        var _a, _b;
        this.log(message);
        this.messageEmitter.emit(message.msg, message);
        if (this.currentOperation) {
            const { handler, callbacks } = this.currentOperation;
            if (handler.canHandle.some((msg) => msg === message.msg)) {
                handler.handle(message, this.eventHandlers, callbacks);
            }
        }
        const { handle } = this.handlers.find(({ canHandle }) => canHandle.some((msg) => msg === message.msg)) || {};
        if (handle) {
            const placeholderCallbacks = {
                resolve: () => undefined,
                reject: () => undefined,
            };
            return handle(message, this.eventHandlers, (_b = (_a = this.currentOperation) === null || _a === void 0 ? void 0 : _a.callbacks) !== null && _b !== void 0 ? _b : placeholderCallbacks);
        }
    }
    fireNextCommand() {
        const [nextCommand, ...commandQueue] = this.queuedOperations;
        if (nextCommand) {
            this.queuedOperations = commandQueue;
            return this.sendCmd(nextCommand)
                .then((v) => nextCommand.callbacks.resolve(v))
                .catch((e) => nextCommand.callbacks.reject(e));
        }
    }
    async checkIfCardWasRead() {
        const relevantMessages = [
            messageTypes_1.Messages.enterPin,
            messageTypes_1.Messages.enterPuk,
            messageTypes_1.Messages.enterCan,
        ];
        return new Promise((res) => {
            const resolveMessage = (message) => {
                res(message);
                relevantMessages.forEach((messageType) => {
                    this.messageEmitter.removeListener(messageType, resolveMessage);
                });
            };
            relevantMessages.forEach((messageType) => this.messageEmitter.addListener(messageType, resolveMessage));
        });
    }
    async getInfo() {
        return this.sendCmd((0, commands_1.getInfoCmd)());
    }
    async startAuth(tcTokenUrl, developerMode, handleInterrupt, status, messages) {
        return this.sendCmd((0, commands_1.runAuthCmd)(tcTokenUrl, developerMode, handleInterrupt, status, messages));
    }
    async getStatus() {
        return this.sendCmd((0, commands_1.getStatusCmd)());
    }
    async setAPILevel(level) {
        return this.sendCmd((0, commands_1.setAPILevelCmd)(level));
    }
    async getAPILevel() {
        return this.sendCmd((0, commands_1.getAPILevelCmd)());
    }
    async getReader(name) {
        return this.sendCmd((0, commands_1.getReaderCmd)(name));
    }
    async getReaderList() {
        return this.sendCmd((0, commands_1.getReaderListCmd)());
    }
    setCard(readerName, simulatorData) {
        return this.sendVoidCmd((0, commands_1.setCardCmd)(readerName, simulatorData));
    }
    async setPin(pin) {
        return this.sendCmd((0, commands_1.setPinCmd)(pin));
    }
    async setCan(can) {
        return this.sendCmd((0, commands_1.setCanCmd)(can));
    }
    async setPuk(puk) {
        return this.sendCmd((0, commands_1.setPukCmd)(puk));
    }
    async acceptAuthRequest() {
        return this.sendCmd((0, commands_1.acceptCmd)());
    }
    async getCertificate() {
        return this.sendCmd((0, commands_1.getCertificateCmd)());
    }
    async cancelFlow() {
        return this.sendCmd((0, commands_1.cancelFlowCmd)());
    }
    async setAccessRights(optionalFields) {
        return this.sendCmd((0, commands_1.setAccessRightsCmd)(optionalFields));
    }
    async getAccessRights() {
        return this.sendCmd((0, commands_1.getAccessRightsCmd)());
    }
    async setNewPin(pin) {
        return this.sendCmd((0, commands_1.setNewPinCmd)(pin));
    }
    async startChangePin(handleInterrupt, status, messages) {
        return this.sendCmd((0, commands_1.changePinCmd)(handleInterrupt, status, messages));
    }
    interruptFlow() {
        return this.sendVoidCmd((0, commands_1.interruptFlowCmd)());
    }
}
exports.AusweisModule = AusweisModule;
//# sourceMappingURL=module.js.map