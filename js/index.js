"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aa2Module = void 0;
const react_native_1 = require("react-native");
const module_1 = require("./module");
const emitter = react_native_1.Platform.select({
    ios: new react_native_1.NativeEventEmitter(react_native_1.NativeModules.Emitter),
    android: react_native_1.DeviceEventEmitter,
});
exports.aa2Module = new module_1.AusweisModule(react_native_1.NativeModules.Aa2Sdk, emitter);
//# sourceMappingURL=index.js.map