import { NativeModules, DeviceEventEmitter } from 'react-native';

import { Aa2Module } from './module';
import { Events } from './types';

const { Aa2Sdk } = NativeModules;

const androidEmitterWrapper = {
    on: (event: Events, callback: Function) => {
        DeviceEventEmitter.addListener(event, callback)
    }
}
export const aa2Module = new Aa2Module(Aa2Sdk, androidEmitterWrapper)
