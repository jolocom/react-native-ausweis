# react-native-ausweis

## **Description**
A react-native module for the AusweisApp2 sdk. To learn more about AusweisApp2 sdk please refer to its [documentation](https://www.ausweisapp.bund.de/sdk/intro.html).

The gist of the AusweisApp2 sdk is to send you messages as a response to a command you send. Please refer to AusweisApp2 documentation for the explanation of the [commands](https://www.ausweisapp.bund.de/sdk/commands.html) and [messages](https://www.ausweisapp.bund.de/sdk/messages.html). It is important you understand how commands and messages play together before you proceed. Follow along with [example workflows](https://www.ausweisapp.bund.de/sdk/workflow.html) to grasp the idea. 

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

List of supported messages in this module.
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

>Note, there are differences between how NFC popup is handled on iOS and Android. NFC popup is managed by the sdk and presented in your application along with the INSERT_CARD message. However, on Android you should make your own NFC popup. Sdk will send INSERT_CARD message - this is a good place to show NFC popup on Android. You can do so by registering `handleCardRequest` handler with a functionality to show NFC popup. 

## Handlers 
You can handle [messages](#messages) sent your way from the sdk with handlers.

List of available message handlers and their signatures:
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
To initiate an AUTH workflow you should send RUN_AUTH command. As a response sdk will send `AUTH` and `ACCESS_RIGHTS` messages. 
The promise `processRequest` will be resolved as soon as the `ACCESS_RIGHTS` message is received. The resolution happens with the original sdk message. If other messages (from the aformentioned) will be send meanwhile the promise will be reject with `new Error('Unknown message type')`
```javascript
const tcTokenUrl = "https://test.governikus-eid.de/DEMO"
await aa2Module.processRequest(tcTokenUrl) // send RUN_AUTH cmd
```

### `getCertificate`
> Note this command is part of the [AUTH flow](#processRequest) and should be send only when AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 

To get more information about a requester send `GET_CERTIFICATE` cmd. As a response sdk will send `CERTIFICATE` message. The promise `getCertificate` will be resolved as soon as the `CERTIFICATE` message is received. The resolution happens with the original sdk message. If other messages (from the aformentioned) will be send meanwhile the promise will be reject with `new Error('Unknown message type')`
```javascript
await aa2Module.getCertificate() // send GET_CERTIFICATE cmd
```

### `setAccessRights`
> Note this command is part of the [AUTH flow](#processRequest) and should be send only when AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 

To limit access to data from user's eID card send `SET_ACCESS_RIGHTS` cmd. As a response sdk will send `SET_ACCESS_RIGHTS` message. The promise `getCertificate` will be resolved as soon as the `CERTIFICATE` message is received. The resolution happens with the original sdk message. If other messages (from the aformentioned) will be send meanwhile the promise will be reject with `new Error('Unknown message type')`
```javascript
const optionalFields = ['Address', 'DateOfBirth']
await aa2Module.setAccessRights(optionalFields) // send GET_CERTIFICATE cmd
```

### `acceptAuthRequest`
> Note this command is part of the [AUTH flow](#processRequest) and should be send only when AUTH workflow was initiated with `aa2Module.processRequest(tcTokenUrl)` 


To accept access rights sent earlier user needs to accept or deny. To accept send `ACCEPT` cmd.
As a response sdk will send `INSERT_CARD` message. If user has scanned
eID card successfully `ENTER_PIN` or `ENTER_CAN` or `ENTER_PUK` messages will be send.
If user has cancelled the NFC popup `AUTH` message will be send. 
> Note, cancelling NFC popup on iOS will cancel the workflow. You need to explicitly send `CANCEL` cmd on Android if you choose to interrupt the workflow when cancelling the NFC popup.

The promise `acceptAuthRequest` will
be resolved as soon as the `ENTER_PIN` or `ENTER_CAN` or `ENTER_PUK` or `AUTH` message is received. The resolution happens with the original sdk message. If other messages (from the aformentioned) will be send meanwhile the promise will be reject with `new Error('Unknown message type')`
```javascript
// setup handler for the INSERT_CARD message 
aa2Module.setHandlers({
  handleCardRequest: () => {
    console.log('show NFC popup on Android')
  }
})
await aa2Module.acceptAuthRequest()
console.log('after accept')

// Sequence of event happening: 
// 1. handler is registered with .setHandlers
// 2. sending command .acceptAuthRequest
// 3. a message is send { msg: "INSERT_CARD" } 
// 4. INSERT_CARD handler runs: console.log('show NFC popup on Android')
// 3. user scans eID card
// 4. a message is send { msg: "ENTER_PIN" } and .acceptAuthRequest promise is resolved
// 5. console.log('after accept')
```

### `setPin` 🥵
To respond to`ENTER_PIN` cmd user need to send `SET_PIN` cmd. 

```javascript
await aa2Module.setPin('123456') 
```
