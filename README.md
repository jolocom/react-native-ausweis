# react-native-ausweis

## **Description**
A react-native module for the AusweisApp2 sdk. To learn more about AusweisApp2 sdk please refer to its [documentation](https://www.ausweisapp.bund.de/sdk/intro.html).

The gist of the AusweisApp2 sdk is to send you messages as a response to a command you send. Please refer to AusweisApp2 documentation for the explanation of the [commands](https://www.ausweisapp.bund.de/sdk/commands.html) and [messages](https://www.ausweisapp.bund.de/sdk/messages.html). You must understand how commands and messages play together before you proceed. Follow along with [example workflows](https://www.ausweisapp.bund.de/sdk/workflow.html) to grasp the idea. 

## Terminology
**Module** - react native module to support AusweisApp2 sdk

**SDK** - AusweisApp2 core functionality that we utilize in this module 

---
## **Getting started**

  ### **Installation**
  `$ yarn add react-native-aa2-sdk`

  ### **iOS specific**
  1. Enable the card identifier in your applications `Info.plist`. For more details refer to the [AusweisApp documentation](#https://www.ausweisapp.bund.de/sdk/ios.html)
  ```javascript
  <key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
  <array>
    <string>E80704007F00070302</string>
  </array>

  <key>NFCReaderUsageDescription</key>
  <string>AusweisApp2 needs NFC to access the ID card.</string>
  ```
  2. in Xcode's `Signing & Capabilities` tab, make sure Near Field Communication Tag Reading capability had been added. If this is the first time you toggle the capabilities, the Xcode will generate a <your-project>.entitlement file for you

  3. (from the root of your project)

      `$ cd ios && pod install`
  
       this will trigger automatic linking

  ### **Android specific**
  in `AndroidManifest.xml`
  ```javascript
  <uses-permission android:name="android.permission.NFC"/>
  ```

  ### **Automatic linking** 
  (for react-native with version < 0.60.0)

  `$ react-native link react-native-aa2-sdk`
  
---
## **Usage**

### Initialization
To start interacting with the AusweisApp2 sdk you first need to initialize it

```javascript
import { aa2Module } from 'react-native-ausweis'

if (!aa2Module.isInitialized) {
  try {
    await aa2Module.initAa2Sdk()
  } catch (e) {
    console.error(e)
  }
}
```

### Disconnect
Note: currently it is a noop method
```javascript
await aa2Module.disconnectAa2Sdk()
```

## Messages 
When you send a commands to the sdk it will respond to you with message sequences.

Below is the list of supported messages in this module.
```javascript
export enum Messages {
  init = 'INIT',
  apiLevel = 'API_LEVEL',
  badState = 'BAD_STATE',
  info = 'INFO',
  auth = 'AUTH',
  accessRights = 'ACCESS_RIGHTS',
  enterPin = 'ENTER_PIN',
  enterPuk = 'ENTER_PUK',
  enterCan = 'ENTER_CAN',
  insertCard = 'INSERT_CARD',
  certificate = 'CERTIFICATE',
  reader = 'READER',
  enterNewPin = 'ENTER_NEW_PIN',
  changePin = 'CHANGE_PIN',
}
```

>Note, there are differences between how NFC popup is handled on iOS and Android. NFC popup is managed by the sdk and presented in your application along with the INSERT_CARD message. However, on Android you should make your own NFC popup. Sdk will send INSERT_CARD message - this is a good place to show NFC popup on Android. You can do so by registering `handleCardRequest` handler with functionality to show NFC popup. 

## Handlers 
You can handle [messages](#messages) sent your way from the sdk with handlers.

Below in the list of available message handlers and their signatures:
```javascript
type CardInfo = {
  inoperative: boolean
  deactivated: boolean
  retryCounter: number
}

interface EventHandlers {
  handlePinRequest: (cardInfo: CardInfo) => void // msg ENTER_PIN
  handleCanRequest: (cardInfo: CardInfo) => void // msg ENTER_CAN
  handlePukRequest: (cardInfo: CardInfo) => void // msg ENTER_PUK
  handleCardInfo: (cardInfo: CardInfo) => void // msg READER
  handleCardRequest: () => void // msg INSERT_CARD
  handleAuthFailed: (url: string, message: string) => void // msg AUTH (user has cancelled the RUN_AUTH flow or RUN_AUTH flow has failed)
  handleAuthSuccess: (url: string) => void // msg AUTH (successful completion of the RUN_AUTH flow)
  handleEnterNewPin: () => void // msg ENTER_NEW_PIN
  handleChangePinCancel: () => void // msg CHANGE_PIN (success: false)
  handleChangePinSuccess: () => void // msg CHANGE_PIN (success: true)
}
```

To handle a message sent by the sdk you have to register a message handler.
```javascript
aa2Module.setHandlers({
  // your handlers
})
```
For example, to handle `ENTER_PUK` message register its handler like this:
```javascript
aa2Module.setHandlers({
  handlePinRequest: (cardInfo: CardInfo) => {
    console.log(cardInfo)
  }
})
```

Reset handlers with:
```javascript
aa2Module.resetHandlers()
```

## Commands
To initiate/continue flow(s) available by the AusweisApp2 you should send commands. Following, sdk will respond with messages associated with a command sent.

>Note, that each command returns a promise and resolution or rejection of the promise happens when a particular message is dispatched by the sdk. This vary from cmd to cmd. 

You can **choose** to handle messages returned to you with handlers registered with `aa2Module.setHandlers(${handlers})`. [Here](#handlers) is the list of available message handlers


### `processRequest`
To initiate an AUTH workflow you should send `RUN_AUTH` command. As a response sdk will send `AUTH` and `ACCESS_RIGHTS` messages. 
The promise `processRequest` will be resolved as soon as the `ACCESS_RIGHTS` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`
```javascript
const tcTokenUrl = "https://test.governikus-eid.de/DEMO"
await aa2Module.processRequest(tcTokenUrl) // send RUN_AUTH cmd
```

### `changePin`
To initiate an CHAGE_PIN workflow you should send `RUN_CHANGE_PIN` command. As a response sdk will send `CHANGE_PIN` (if the workflow was interrupted by canceling NFC popup on iOS), or `ENTER_PIN`, or `ENTER_CAN`, or `ENTER_PUK` message. 
The promise `changePin` will be resolved as soon as the `ACCESS_RIGHTS` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`

Initiate CHANGE_PIN workflow
```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  }
  handlePinRequest: (cardInfo) => {
    console.log('showing pin input')
  }
})
await aa2Module.changePin()

// Sequence of events happening: 
// 1. handler is registered with aa2Module.setHandlers
// 2. sending command aa2Module.changePin
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('show NFC popup on Android')
// 3. user scans eID card
// 4. a message is send { msg: "ENTER_PIN" } and aa2Module.changePin promise is resolved
```

### `getCertificate`
> Note this command is part of the [AUTH flow](#processRequest) and should be sent only when AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 

To get more information about a requester send `GET_CERTIFICATE` cmd. As a response sdk will send `CERTIFICATE` message. The promise `getCertificate` will be resolved as soon as the `CERTIFICATE` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`
```javascript
await aa2Module.getCertificate() // send GET_CERTIFICATE cmd
```

### `setAccessRights`
> Note this command is part of the [AUTH flow](#processRequest) and should be sent only when AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 

To limit access to data from user's eID card send `SET_ACCESS_RIGHTS` cmd. As a response sdk will send `SET_ACCESS_RIGHTS` message. The promise `setAccessRights` will be resolved as soon as the `CERTIFICATE` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`
```javascript
const optionalFields = ['Address', 'DateOfBirth']
await aa2Module.setAccessRights(optionalFields) // send GET_CERTIFICATE cmd
```

### `acceptAuthRequest`
> Note this command is part of the [AUTH flow](#processRequest) and should be sent only when AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 


To accept access rights sent earlier user needs to accept or deny. To accept send `ACCEPT` cmd.
As a response sdk will send `INSERT_CARD` message. If user has scanned
eID card successfully `ENTER_PIN` or `ENTER_CAN` or `ENTER_PUK` messages will be sent.
If user has cancelled the NFC popup `AUTH` message will be sent. 
> Note, canceling the NFC popup on iOS will cancel the workflow. You need to explicitly send `CANCEL` cmd on Android 
.

The promise `acceptAuthRequest` will
be resolved as soon as the `ENTER_PIN` or `ENTER_CAN` or `ENTER_PUK` or `AUTH` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`
```javascript
// setup handler for the INSERT_CARD message 
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  }
})
await aa2Module.acceptAuthRequest()

// Sequence of events happening: 
// 1. handler is registered with aa2Module.setHandlers
// 2. sending command aa2Module.acceptAuthRequest
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('show NFC popup on Android')
// 3. user scans eID card
// 4. a message is send { msg: "ENTER_PIN" } and aa2Module.acceptAuthRequest promise is resolved
```

### `enterPin`
To respond to `ENTER_PIN` message user needs to send `SET_PIN` cmd with `aa2Module.enterPin` method. As a response sdk can send `ENTER_PIN` (if the pin provided doesn't match the one stored on the eID card), `ENTER_CAN` (if eID pin was entered wrong 2 times), `ENTER_PUK`, `ENTER_NEW_PIN` (for change pin of the eID card), `AUTH` (as a cofirmation of completion of the AUTH workflow), `CHANGE_PIN` (as a cofirmation of completion of the CHANGE_PIN workflow). The promise `enterPin` will
be resolved as soon as the `ENTER_PIN` or `ENTER_CAN` or `ENTER_PUK` or `AUTH` or `CHANGE_PIN` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`

Below is the example of handling wrong pin if the pin provided with `enterPin` cmd didn't match the one from the eID card

```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  },
  handlePinRequest: () => {
    console.log('showing pin again, because wrong pin was entered')
  },
})
await aa2Module.enterPin('123456') 

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.enterPin
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('show NFC popup on Android')
// 3. user scans eID card
// 4. a message is send { msg: "ENTER_PIN" } and aa2Module.enterPin promise is resolved
// 5. ENTER-PIN handler runs: console.log('showing pin again, because wrong pin was entered')
```

Below is the example of setting correct pin and receiving completion message of the AUTH workflow.
> Note, upon successful completion of AUTH workflow you should send a GET request to url provided as an argument to `handleAuthSuccess` handler
```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  },
  handleAuthSuccess: (url) => {
    console.log('successful completion of AUTH')
    fetch(url)
  },
})
await aa2Module.enterPin('123456')

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.enterPin
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('show NFC popup on Android')
// 3. user scans eID card
// 4. a message is send { msg: "AUTH", ...payload } and aa2Module.enterPin promise is resolved
// 5. handleAuthSuccess handler runs: console.log('successful completion of AUTH')
// 6. triggering fetch
```

Below is the example of interrupting CHANGE_PIN workflow at the step when the eID pin was requested.
>Note, on Android you should send CANCEL cmd if you decide to interrupt the workflow when canceling the NFC popup. 
```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('NFC popup is shown on iOS')
  },
  handleChangePinCancel: () => {
    console.log('CHANGE_PIN workflow was interrupted')
  },
})
await aa2Module.enterPin('123456')

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.enterPin
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('NFC popup is shown on iOS')
// 3. user presses "cancel" btn on NFC popup
// 4. a message is send { msg: "CHANGE_PIN", .success: false } and aa2Module.enterPin promise is resolved
// 5. handleChangePinCancel handler runs: console.log('CHANGE_PIN workflow was interrupted')
```

### `enterCan`
To respond to `ENTER_CAN` message user needs to send `SET_CAN`. As a response sdk can send `ENTER_PIN` (if CAN provided was coorect), `ENTER_CAN` (if provided was incorrect), `ENTER_PUK`, `AUTH` (if AUTH was interrupted), `CHANGE_PIN` (if CHANGE_PIN was interrupted). The promise `enterCan` will
be resolved as soon as the `ENTER_PIN` or `ENTER_CAN` or `AUTH` or `CHANGE_PIN` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`

Below is an example providing a wrong CAN
```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('NFC popup is shown on iOS')
  },
  handleCanRequest: () => {
    console.log('wrong can')
  },
})
await aa2Module.enterCan('123456')

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.enterCan
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('NFC popup is shown on iOS')
// 5. user scans eID card
// 6. a message is send { msg: "ENTER_CAN" } and aa2Module.enterPin promise is resolved
// 7. handleCanRequest handler runs: console.log('wrong can')

```

## `enterPUK` 🥵
To respond to `ENTER_PUK` message user needs to send `SET_PUK`. As a response sdk can send `ENTER_PIN` (if the provided PUK was correct), `ENTER_PUK` (if the provided PUK was incorrect), `AUTH` (if AUTH workflow was interrupted because scanned eID card is blocked or CANCEL cmd was sent), `CHANGE_PIN` (if CHANGE_PIN workflow was interrupted because scanned eID card is blocked or CANCEL cmd was sent). The promise `enterPUK` will
be resolved as soon as the `ENTER_PIN` or `ENTER_PUK` or `AUTH` message is received or rejected with `CardError.cardIsBlocked` when `AUTH` or `CHANGE_PIN` messages were sent. The resolution happens with the original sdk message.
> Note `handleChangePinCancel` and `handleAuthFailed` will not run when rejection happens 🥵

If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`

On iOS - user has a blocked card (correct PUK was used 10 times already) and tries to provide PUK within CHANGE_PIN workflow.
> Note, that the same sequence of messages received will happen if user presses "cancel" on NFC popup on iOS
```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('NFC popup is shown on iOS')
  }
  handleChangePinCancel: () => {
    console.log('change_pin workflow was interrupted')
  }
})
try {
  await aa2Module.enterPUK('1234567890')
} catch(e) {
  console.log('Error', e)
}

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.enterPUK
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('NFC popup is shown on iOS')
// 5. user scans eID card
// 6. a message is send { msg: "CHANGE_PIN", success: false } and aa2Module.enterPUK promise is rejected with `CardError.cardIsBlocked`
// 7. handleChangePinCancel won't run !!!
```

## `setNewPin`
> Note this command is part of the [CHANGE_PIN flow](#changePin) and should be sent only when CHANGE_PIN workflow was initiated with 

To respode to the `ENTER_NEW_PIN` msg user should send `SET_NEW_PIN` cmd. As a response sdk will send `CHANGE_PIN` msg with `success` property set to `true` or `false`. The resolution of `setNewPin` promise happens as soon as `CHANGE_PIN` message has been received.

Completing CHANGE_PIN workflow by setting a new pin
```javascript
aa2Module.setHandlers({
  handleChangePinSuccess: () => {
    console.log('CHANGE_PIN workflow was completed')
  }
})
await aa2Module.setNewPin('123456')

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.setNewPin
// 3. a message is send { msg: "CHANGE_PIN", success: true } and aa2Module.setNewPin promise is resolved
// 7. handleChangePinSuccess runs: console.log('CHANGE_PIN workflow was completed')
```


## `cancelFlow`
To cancel AUTH or CHANGE_PIN flow send `CANCEL` cmd.
> Note, on iOS pressing "cancel" btn on NFC popup - cancels initiated workflow. You don't need to send CANCEL cmd in such a case as this will result in the `BAD_STATE` message

As a response sdk can send `AUTH` (if canceled within AUTH workflow) or `CHANGE_PIN` (if cancelled within CHANGE_PIN workflow), The promise `cancelFlow` will be resolved as soon as the `AUTH` or `CHANGE_PIN` message is received. The resolution happens with the original sdk message. If other messages (from the aforementioned) will be sent meanwhile the promise will be rejected with `new Error('Unknown message type')`

Canceling AUTH workflow
```javascript
aa2Module.setHandlers({
  handleAuthFailed: (url, message) => {
    console.log('AUTH workflow was interrupted')
  }
})
await aa2Module.cancelFlow()

// Sequence of events happening: 
// 1. handlers are registered with aa2Module.setHandlers
// 2. sending command aa2Module.cancelFlow
// 3. a message is send { msg: "AUTH", ...payload } and aa2Module.cancelFlow promise is resolved
// 7. handleAuthFailed runs: console.log('AUTH workflow was interrupted')
```
