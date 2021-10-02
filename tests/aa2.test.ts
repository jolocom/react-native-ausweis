import { Aa2Module } from '../src/module'
import { Message, Events } from '../src/types'

const initSdkMsg: Message = {
    msg: 'INIT'
}

const successGetInfoMsg: Message = {
    msg: 'INFO',
    VersionInfo: {
      "Name": "AusweisApp2",
      "Implementation-Title": "AusweisApp2",
      "Implementation-Vendor": "Governikus GmbH & Co. KG",
      "Implementation-Version": "1.10.0",
      "Specification-Title": "TR-03124",
      "Specification-Vendor": "Federal Office for Information Security",
    }
}

class TestEmitter {
    private listeners: {Events?: Function} = {}

    public addListener(event: Events, callback: Function) {
        this.listeners[event] = callback
    }

    public dispatch(event: Events, message?: string) {
        this.listeners[event](message)
    }
}

const emitter = new TestEmitter()

const mockAa2Impl = {
    sendCMD: async (_: Object) => true,
    initAASdk: async () => {}
}
const delay = async (duration: number) => new Promise((resolve, _) => {
    setTimeout(resolve, duration)
})

describe("Initializing the AA2 SDK", () => {
    it("Correctly handles succesfull initalization", async () => {
        const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
        aa2Sdk.initAa2Sdk()

        expect(aa2Sdk.isInitialized).toBe(false)

        await delay(3000)
        expect(aa2Sdk.isInitialized).toBe(false)

        emitter.dispatch(Events.sdkInitialized)
        expect(aa2Sdk.isInitialized).toBe(true)
    })

    it("Correctly throws if the AA2 SDK is already initialized", async () => {
        const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
        const promise = aa2Sdk.initAa2Sdk()
        emitter.dispatch(Events.error, JSON.stringify({error: "SdkInitializationException"}))

        await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`"AusweisApp2 SDK already initialized."`)
    })

    it("Correctly throws in case of an unexpected error", async () => {
        // What are some test cases here?
    })
})

const wrap = (msg: Object) => JSON.stringify({ message: JSON.stringify(msg)})

describe("Workflow, Minimal successful authentication", () => {

    it ("Runs", async () => {
        const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
        aa2Sdk.initAa2Sdk()
        emitter.dispatch(Events.sdkInitialized)

        const processReqPromise = aa2Sdk.processRequest("https://test.governikus-eid.de/DEMO")
        emitter.dispatch(Events.message, wrap({"msg": "AUTH"}))

        const accessRightsMsg = {
            "msg": "ACCESS_RIGHTS",
            "chat": {
                "effective":["GivenNames","DocumentType"],
                "optional":["GivenNames"],
                "required":["DocumentType"]
            }
        }

        emitter.dispatch(Events.message, wrap(accessRightsMsg))
        await expect(processReqPromise).resolves.toStrictEqual(accessRightsMsg)
        aa2Sdk.acceptAuthRequest()
        emitter.dispatch(Events.message, wrap({"msg": "INSERT_CARD"}))

        const cardReadPromise = aa2Sdk.checkIfCardWasRead()

        const pinMessage = {
            "msg": "ENTER_PIN",
            "reader": {
                "attached":true
                ,"card":{"inoperative":false,"deactivated":false,"retryCounter":3},
                "keypad":false,
                "name":"NFC"
            }
        }

        emitter.dispatch(Events.message,wrap(pinMessage))

        await expect(cardReadPromise).resolves.toStrictEqual(pinMessage)

        const pinPromise = aa2Sdk.enterPin(111111)

        const authMessage = {
            "msg": "AUTH",
            "result": { "major" : "http://www.bsi.bund.de/ecard/api/1.1/resultmajor#ok" },
            "url":"https://test.governikus-eid.de/DEMO/?refID=123456"
        }

        emitter.dispatch(
            Events.message,
            wrap(authMessage)
        )

        await expect(pinPromise).resolves.toStrictEqual(authMessage)
    })
})

describe("Send Command", () => {
    // it("Correctly fails to send the command if the SDK is not initialized", async() => {
    //     const aa2Sdk = new Aa2Module(mockAa2Impl, emitter)
    //     expect(aa2Sdk.getInfo()).rejects.toEqual("YEA")
    // })

    // it("Correctly fails in case no confirmation for a sent command is received", async() => {
    // })

    // it("Correctly queues parallel commands", async () => {
    // })
})

describe("Pin management", () => {
})

describe("Data exchange interaction", () => {
})

// it("Correctly runs getInfo", async () => {
// 
//     const testAaModule = new Aa2Module(mockAa2Impl, emitter)
// 
//     await testAaModule.initAa2Sdk()
// 
//     const resp = await testAaModule.getInfo()
//     console.log(resp)
// })
// 
// it("Correctly handles valid auth request", async () => {
//     const accessRightsMsg = {
//         msg: "ACCESS_RIGHTS",
//         aux:
//             {
//                 "ageVerificationDate": "1999-07-20",
//                 "requiredAge": "18",
//                 "validityDate": "2017-07-20",
//                 "communityId": "02760400110000"
//             },
//         chat:
//                 {
//                 "effective": ["Address", "FamilyName", "GivenNames", "AgeVerification"],
//                 "optional": ["GivenNames", "AgeVerification"],
//                 "required": ["Address", "FamilyName"]
//                 },
//         transactionInfo: "this is an example",
//         canAllowed: false
//     }
// 
//     const testAaModule = new Aa2Module(mockAa2Impl([
//         initSdkMsg,
//         accessRightsMsg
//     ]))
// 
//     await testAaModule.initAa2Sdk()
// 
//     const resp = await testAaModule.runAuth("https://example.com")
//     console.log(resp)
// })
// it("Correctly handles valid auth request", async () => {
//     const accessRightsMsg = {
//         msg: "ACCESS_RIGHTS",
//         aux:
//             {
//                 "ageVerificationDate": "1999-07-20",
//                 "requiredAge": "18",
//                 "validityDate": "2017-07-20",
//                 "communityId": "02760400110000"
//             },
//         chat:
//                 {
//                 "effective": ["Address", "FamilyName", "GivenNames", "AgeVerification"],
//                 "optional": ["GivenNames", "AgeVerification"],
//                 "required": ["Address", "FamilyName"]
//                 },
//         transactionInfo: "this is an example",
//         canAllowed: false
//     }
// 
//     const testAaModule = new Aa2Module(mockAa2Impl([
//         initSdkMsg,
//         accessRightsMsg
//     ]))
// 
//     await testAaModule.initAa2Sdk()
// 
//     const resp = await testAaModule.runAuth("https://example.com")
//     console.log(resp)
// })
//
// it("", () => {
// })
//
// it("", () => {
// })
//
// it("", () => {
// })
//
// it("", () => {
// })
//
// it("", () => {
// })
