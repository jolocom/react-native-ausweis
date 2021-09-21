import { NativeModules, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import { Aa2Module } from './module';
import { Events } from './types';

const { Aa2Sdk, Emitter } = NativeModules;

const eventEmitter = new NativeEventEmitter(Emitter);

eventEmitter.addListener("onMessage", (body) => {
  alert(333)
  console.log({body})
})

DeviceEventEmitter.addListener(event, callback)
export const aa2Module = new Aa2Module(Aa2Sdk, androidEmitterWrapper)
