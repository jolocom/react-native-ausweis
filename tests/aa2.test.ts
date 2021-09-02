import { Aa2Module } from '../src/module'
import { Message } from '../src/types'

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

const mockAa2Impl = (messages: Message[] = []) => {
    return {
        getNewEvents: async () => messages.map(msg => JSON.stringify(msg)),
        sendCMD: async (_: Object) => true,
        initAASdk: async() => {}
    }
}

it("Correctly runs getInfo", async () => {
    const testAaModule = new Aa2Module(mockAa2Impl([
        initSdkMsg,
        successGetInfoMsg
    ]))

    await testAaModule.initAa2Sdk()

    const resp = await testAaModule.getInfo()
    console.log(resp)
})

it("Correctly handles valid auth request", async () => {
    const accessRightsMsg = {
        msg: "ACCESS_RIGHTS",
        aux:
            {
                "ageVerificationDate": "1999-07-20",
                "requiredAge": "18",
                "validityDate": "2017-07-20",
                "communityId": "02760400110000"
            },
        chat:
                {
                "effective": ["Address", "FamilyName", "GivenNames", "AgeVerification"],
                "optional": ["GivenNames", "AgeVerification"],
                "required": ["Address", "FamilyName"]
                },
        transactionInfo: "this is an example",
        canAllowed: false
    }

    const testAaModule = new Aa2Module(mockAa2Impl([
        initSdkMsg,
        accessRightsMsg
    ]))

    await testAaModule.initAa2Sdk()

    const resp = await testAaModule.runAuth("https://example.com")
    console.log(resp)
})

it("Correctly handles invalid auth request", async () => {
    const accessRightsMsg = {
        msg: "ACCESS_RIGHTS",
        aux:
            {
                "ageVerificationDate": "1999-07-20",
                "requiredAge": "18",
                "validityDate": "2017-07-20",
                "communityId": "02760400110000"
            },
        chat:
                {
                "effective": ["Address", "FamilyName", "GivenNames", "AgeVerification"],
                "optional": ["GivenNames", "AgeVerification"],
                "required": ["Address", "FamilyName"]
                },
        transactionInfo: "this is an example",
        canAllowed: false
    }

    const testAaModule = new Aa2Module(mockAa2Impl([
        initSdkMsg,
        accessRightsMsg
    ]))

    await testAaModule.initAa2Sdk()

    const resp = await testAaModule.runAuth("https://example.com")
    console.log(resp)
})
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
