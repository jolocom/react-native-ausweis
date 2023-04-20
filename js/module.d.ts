import TypedEmitter from 'typed-emitter';
import { EventHandlers } from './commandTypes';
import { MessageEvents } from './messageEvents';
import { EnterCanMessage, EnterPinMessage, EnterPukMessage, Messages } from './messageTypes';
import { Events, AccessRightsFields, ScannerMessages, SimulatorData } from './types';
interface NativeEmitter {
    addListener: (event: Events, callback: Function) => void;
}
interface AusweisImplementation {
    initAASdk: () => void;
    disconnectSdk: () => void;
    sendCMD: (cmd: string) => void;
}
export declare class AusweisModule {
    private nativeAa2Module;
    private nativeEventEmitter;
    private logger;
    private unprocessedMessages;
    private currentOperation;
    private queuedOperations;
    private handlers;
    private eventHandlers;
    messageEmitter: TypedEmitter<MessageEvents>;
    isInitialized: boolean;
    constructor(aa2Implementation: AusweisImplementation, nativeEventEmitter: NativeEmitter);
    enableLogger(shouldEnable: boolean): void;
    private log;
    private setupEventHandlers;
    setHandlers(eventHandlers: Partial<EventHandlers>): void;
    resetHandlers(): void;
    initAa2Sdk(): Promise<unknown>;
    disconnectAa2Sdk(): Promise<unknown>;
    private rejectCurrentOperation;
    private clearCurrentOperation;
    private sendVoidCmd;
    private sendCmd;
    private onMessage;
    private fireNextCommand;
    checkIfCardWasRead(): Promise<Messages.enterPin | Messages.enterPuk | Messages.enterCan>;
    getInfo(): Promise<import("./messageTypes").InfoMessage>;
    startAuth(tcTokenUrl: string, developerMode?: boolean, handleInterrupt?: boolean, status?: boolean, messages?: ScannerMessages): Promise<import("./messageTypes").AccessRightsMessage>;
    getStatus(): Promise<import("./messageTypes").StatusMessage>;
    setAPILevel(level: number): Promise<import("./messageTypes").ApiLevelMessage>;
    getAPILevel(): Promise<import("./messageTypes").ApiLevelMessage>;
    getReader(name: string): Promise<import("./messageTypes").ReaderMessage>;
    getReaderList(): Promise<import("./messageTypes").ReaderListMessage>;
    setCard(readerName: string, simulatorData?: SimulatorData): void;
    setPin(pin: string | undefined): Promise<EnterPinMessage>;
    setCan(can: string): Promise<EnterCanMessage>;
    setPuk(puk: string): Promise<EnterPinMessage | EnterPukMessage>;
    acceptAuthRequest(): Promise<import("./messageTypes").AuthMessage>;
    getCertificate(): Promise<import("./messageTypes").CertificateMessage>;
    cancelFlow(): Promise<import("./messageTypes").AuthMessage>;
    setAccessRights(optionalFields: Array<AccessRightsFields>): Promise<import("./messageTypes").AccessRightsMessage>;
    getAccessRights(): Promise<import("./messageTypes").AccessRightsMessage>;
    setNewPin(pin?: string): Promise<import("./messageTypes").ChangePinMessage>;
    startChangePin(handleInterrupt?: boolean, status?: boolean, messages?: ScannerMessages): Promise<import("./messageTypes").ChangePinMessage>;
    interruptFlow(): void;
}
export {};
