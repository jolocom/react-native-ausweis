import {
  NativeModules,
  Platform,
  NativeEventEmitter,
  DeviceEventEmitter,
} from 'react-native'

import { AusweisModule } from './module'

const emitter = Platform.select({
  ios: new NativeEventEmitter(NativeModules.Emitter),
  android: DeviceEventEmitter,
})

export const aa2Module = new AusweisModule(NativeModules.Aa2Sdk, emitter)
