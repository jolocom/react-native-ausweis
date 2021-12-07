# react-native-ausweis

## **Description**
A react-native module for the AusweisApp2 sdk. To learn more about AusweisApp2 sdk please refer to its [documentation](https://www.ausweisapp.bund.de/sdk/intro.html). 

---
## **Getting started**

  ### **Installation**
  `$ yarn add react-native-aa2-sdk`

  ### **iOS specific**
  (from the root of your repository)

  `$ cd ios && pod install`
  
  this will trigger automatic linking

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

### Handlers
The gist of the AusweisApp2 sdk is to send you messages as a response to the commands you will send. Please refer to AusweisApp2 documentation for the explanation of the [commands](https://www.ausweisapp.bund.de/sdk/commands.html) and [messages](https://www.ausweisapp.bund.de/sdk/messages.html). You can handle messages sent your way from the sdk with handlers.

Set up handlers with:
```javascript
aa2Module.setHandlers({
  // your handlers
})
```

Reset handlers:
```javascript
aa2Module.resetHandlers() 🥵
```

### Commands
To initiate/continue flow(s) available by the AusweisApp2 you should send commands. Note that each command returns a promise and resolution and rejection of the promise happens when a particular messages is sent by the sdk. This vary from cmd to cmd. You should handle messages returned to you with handlers registered with `aa2Module.setHandlers(${handlers})` 


### `setPin` 🥵
```javascript
await aa2Module.setPin('123456') 
```
| Message | Message handler | Resolves | Rejects | Explained
| ----------- | ----------- | ----------- | ----------- | -----------   
| `Messages.enterPin` | `handlePinRequest` 🥵 | yes | no
| `Messages.enterNewPin` | `handleEnterNewPin` | yes | no
| `Messages.enterCan` | `handleCanRequest` 🥵 | yes | no
| `Messages.enterPuk` | `handlePukRequest` 🥵 | yes | no
| `Messages.changePin` | `handleChangePinCancel` | not always | no | yes
| `Messages.auth` | `handleAuthFailde\|handleAuthSuccess` | yes | no | yes

- when the message `Messages.changePin` comes back with `success` property equel to `false` we the handler `handleChangePinCancel` and resolve `setPin` promise. This message should not come back with `success` property equal to `true` based on the logic established within the change pin flow by the sdk.

- when `Messages.auth` contains a payload with property `message` it is an indication of failed state and we run `handleAuthFailed`, otherwise `handleAuthSuccess` will run 


