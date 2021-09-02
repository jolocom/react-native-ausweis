import { NativeModules } from 'react-native';
import { Aa2Module } from './module';

const { Aa2Sdk } = NativeModules;

export const aa2Module = new Aa2Module(Aa2Sdk)
