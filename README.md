# react-native-ausweis

## **Description**
A react-native module for the AusweisApp2 SDK. To learn more about AusweisApp2 sdk please refer to its [documentation](https://www.ausweisapp.bund.de/sdk/intro.html).

The communication with the AusweisApp2 SDK is facillitated by messages and commands. Please refer to AusweisApp2 documentation for the explanation of the [commands](https://www.ausweisapp.bund.de/sdk/commands.html) and [messages](https://www.ausweisapp.bund.de/sdk/messages.html). Furthermore, you can make use of the [example workflows](https://www.ausweisapp.bund.de/sdk/workflow.html) from the documentation, which demonstrate the exchange of commands and messages in different contexts. Currently, only two workflows are supported - `AUTH` and `CHANGE_PIN`.

## Terminology
**Module** - React-Native module that wraps around the AusweisApp2 SDK

**SDK** - AusweisApp2 core functionality that is used in this module 

---
## **Getting started**

  ### **Installation**
  `$ yarn add react-native-ausweis`

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

  `$ react-native link react-native-ausweis`
  
---
## **Usage**

### Initialization
To start interacting with the SDK, you first need to initialize it

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
When you send a command to the SDK it will respond with a message (or more).

Below is the list of messages supported by the module.
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

>Note, there are differences between how the NFC popup is handled on iOS and Android. On iOS, the NFC popup is managed by the SDK and is shown along with the INSERT_CARD message. However, on Android only the INSERT_CARD message is received, allowing the application to proceed with scanning.

## Handlers 
Some received [messages](#messages) can be processed with handlers.

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

To handle a message sent by the SDK you have to register a message handler.
```javascript
aa2Module.setHandlers({
  // your handlers
})
```
For example, to handle the `ENTER_PUK` message, register its handler as follows:
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
In order to communicate with the SDK, the React-Native application must send commands. As a result, the SDK will respond with messages according to the internal protocol. In case the received message does not satisfy the protocol, the command will reject with the `Unknown message type` error.

>Note that each command returns a Promise, which either rejects or resolves based on the received messages. This may vary from command to command. 

Nevertheless, messages can also be handled using the handlers registered with `aa2Module.setHandlers(${handlers})`. [Here](#handlers) is the list of available message handlers.


### `processRequest`
To initiate the `AUTH` workflow, the module sends the `RUN_AUTH` command. As a response, the SDK sends both `AUTH` and `ACCESS_RIGHTS` messages. 
The `processRequest` Promise will be resolved as soon as the `ACCESS_RIGHTS` message is received.

```javascript
const tcTokenUrl = "https://test.governikus-eid.de/DEMO"
await aa2Module.processRequest(tcTokenUrl) // send RUN_AUTH cmd

```

### `changePin`
To initiate the `CHANGE_PIN` workflow, the module sends the `RUN_CHANGE_PIN` command. As a response, the SDK will send the `CHANGE_PIN` message with payload: `{success: false}` if the workflow was interrupted (i.e. by canceling NFC popup on iOS), or the `ENTER_PIN`/`ENTER_CAN`/`ENTER_PUK` messages if the workflow continues. 

Initiate the `CHANGE_PIN` workflow

```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  }
  handlePinRequest: (cardInfo) => {
    console.log('showing pin input')
  }
})

const message = await aa2Module.changePin()

// Sequence of events happening: 
// 1. handler is registered with aa2Module.setHandlers
// 2. sending command aa2Module.changePin
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('show NFC popup on Android')
// 3. user scans eID card
// 4. a message is send { msg: "ENTER_PIN" } and aa2Module.changePin promise is resolved
```

### `getCertificate`
> Note this command is part of the [AUTH flow](#processRequest) and should be sent only after AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 

To get more information about the requester, send the `GET_CERTIFICATE` command. As a result, it will be resolved with the `CERTIFICATE` message.

```javascript
await aa2Module.getCertificate() // send GET_CERTIFICATE cmd
```

### `setAccessRights`
> Note this command is part of the [AUTH flow](#processRequest) and should be sent only after AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 

To select which data should be shared within the `AUTH` workflow, the `SET_ACCESS_RIGHTS` command is sent together with the choosen fields. As a response, the SDK will send the `ACCESS_RIGHTS` message.

```javascript
const optionalFields = ['Address', 'DateOfBirth']
await aa2Module.setAccessRights(optionalFields) // send GET_CERTIFICATE cmd
```

### `acceptAuthRequest`
> Note this command is part of the [AUTH flow](#processRequest) and should be sent only after AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 


To accept the selected access rights, the SDK sends the "ACCEPT" command. As a response, the SDK will send `INSERT_CARD` message. If user has scanned eID card successfully, the commands will be resolved with the `ENTER_PIN`/`ENTER_CAN`/`ENTER_PUK` messages. If user has cancelled the NFC popup, an `AUTH` message will be sent. 
> Note, canceling the NFC popup on iOS will cancel the workflow. You need to explicitly send the `CANCEL` command on Android.

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
As a response to the `ENTER_PIN` message, the module should send the `SET_PIN` command (using the `enterPin` method). Afterwards, the SDK can send `ENTER_PIN` (if the PIN provided doesn't match the one stored on the eID card), `ENTER_CAN` (if the wrong eID PIN was entered 2 times), `ENTER_PUK` (if the wrong eID PIN was entered 3 times), `ENTER_NEW_PIN` (if the corect PIN was entered during the `CHANGE_PIN` workflow), `AUTH` (if the `AUTH` workflow was successfully finished), `CHANGE_PIN` (if the `CHANGE_PIN` workflow was finished).

Below is an example of handlers for processing both the wrong PIN and the successful completion of the `AUTH` workflow.

> Note, upon successful completion of AUTH workflow you should send a GET request to url provided as an argument to `handleAuthSuccess` handler

```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  },
  handlePinRequest: () => {
    console.log('showing pin again, because wrong pin was entered')
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
// 4. a message is send { msg: "ENTER_PIN" } and aa2Module.enterPin promise is resolved
// 5. ENTER-PIN handler runs: console.log('showing pin again, because wrong pin was entered')
```

Below is the example of interrupting the CHANGE_PIN workflow at the step when the eID pin was requested.
>Note, on Android you should send the `CANCEL` command if you decide to interrupt the workflow. 
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
As a response to the `ENTER_CAN` message, the module should send the `SET_CAN` command. Following, the SDK responds with the `ENTER_PIN` message (if the provided CAN was correct), `ENTER_CAN` (if the provided CAN was incorrect), `AUTH` (if `AUTH` workflow was interrupted), `CHANGE_PIN` (if the `CHANGE_PIN` workflow was interrupted).

Below is an example of providing the wrong CAN
```javascript
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('NFC popup is shown on iOS')
  },
  handleCanRequest: () => {
    console.log('wrong CAN')
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

## `enterPUK`
As a response to the `ENTER_PUK` message, the module should send the `SET_PUK` command. Afterwards, the SDK can send the `ENTER_PIN` message (if the provided PUK was correct), `ENTER_PUK` (if the provided PUK was incorrect), `AUTH` (if the `AUTH` workflow was interrupted), `CHANGE_PIN` (if CHANGE_PIN workflow was interrupted).
> Note `handleChangePinCancel` and `handleAuthFailed` will not be called when rejection happens 🥵

If the user has a blocked card (used the PUK correctly 10 times) and tries to provide the PUK within the CHANGE_PIN workflow.
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
> Note this command is part of the [CHANGE_PIN flow](#changePin) and should be sent only after the `CHANGE_PIN` workflow was initiated.

As a response to the `ENTER_NEW_PIN` message, the module should send the `SET_NEW_PIN` command. Afterwards, the SDK will send the `CHANGE_PIN` msg with a (boolean) `success` property.

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
To cancel the `AUTH` or `CHANGE_PIN` flows, send the `CANCEL` command.
> Note that on iOS, pressing the "cancel" button on NFC popup also cancels the active workflow. Sending a `CANCEL` command while the NFC popup is visible will result in a `BAD_STATE` message.

As a response, the SDK can send the `AUTH` (if canceled within the `AUTH` workflow) or `CHANGE_PIN` (if cancelled within the `CHANGE_PIN` workflow) messages.

Canceling the `AUTH` workflow
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
