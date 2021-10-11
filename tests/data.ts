export const testWorkflowData = {
    auth : {
        success: {
                "msg": "AUTH",
                "result": { "major" : "http://www.bsi.bund.de/ecard/api/1.1/resultmajor#ok" },
                "url":"https://test.governikus-eid.de/DEMO/?refID=123456"
        },
            empty: {
                "msg": "AUTH"
            },
            error: {}
        },
    info: {
        msg: 'INFO',
        VersionInfo: {
        "Name": "AusweisApp2",
        "Implementation-Title": "AusweisApp2",
        "Implementation-Vendor": "Governikus GmbH & Co. KG",
        "Implementation-Version": "1.10.0",
        "Specification-Title": "TR-03124",
        "Specification-Vendor": "Federal Office for Information Security",
        }
    },
    cardRequest: {
        "msg": "INSERT_CARD"
    },
    accessRights: {
        "msg": "ACCESS_RIGHTS",
        "chat": {
            "effective":["GivenNames","DocumentType"],
            "optional":["GivenNames"],
            "required":["DocumentType"]
        }
    },
    pinRequest: {
        "msg": "ENTER_PIN",
        "reader": {
            "attached":true
            ,"card":{"inoperative":false,"deactivated":false,"retryCounter":3},
            "keypad":false,
            "name":"NFC"

        }
    },
    repeatedPinRequest: {
        "msg": "ENTER_PIN",
        "reader": {
            "attached":true
            ,"card":{"inoperative":false,"deactivated":false,"retryCounter":2},
            "keypad":false,
            "name":"NFC"

        }
    },
    canRequest: {
        "msg": "ENTER_CAN", "reader": {"attached":true,"card":{"inoperative":false,"deactivated":false,"retryCounter":1},"keypad":false,"name":"NFC"}
    }
}
