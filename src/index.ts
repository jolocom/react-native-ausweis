import {
  NativeModules,
  Platform,
  NativeEventEmitter,
  DeviceEventEmitter,
} from 'react-native';

import { Aa2Module } from './module';
import { Events } from './types';

const emitter = Platform.select({
  ios: new NativeEventEmitter(NativeModules.Emitter),
  android: DeviceEventEmitter,
});

export const aa2Module = new Aa2Module(NativeModules.Aa2Sdk, emitter)
