export declare const initAa2Sdk: () => Promise<any>;
export declare const getInfo: () => Promise<any>;
export declare const runAuth: (tcTokenUrl: string) => Promise<any>;
export declare const enterPin: (pin: number) => Promise<any>;
export declare const checkIfCardWasRead: () => Promise<any>;
export declare const acceptAuthRequest: () => Promise<any>;
interface Message {
    msg: string;
    error?: string;
}
export declare const filters: {
    initMsg: (message: Message) => boolean;
    infoMsg: (message: Message) => boolean;
    authMsg: (message: Message) => boolean;
    accessRightsMsg: (message: Message) => boolean;
    insertCardMsg: (message: Message) => boolean;
    enterPinMsg: (message: Message) => boolean;
};
export declare const getEvents: () => Promise<Message[]>;
export {};
