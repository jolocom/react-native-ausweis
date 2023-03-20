"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disruptiveCommands = exports.Commands = void 0;
var Commands;
(function (Commands) {
    Commands["init"] = "INIT";
    Commands["disconnect"] = "DISCONNECT";
    Commands["getInfo"] = "GET_INFO";
    Commands["getStatus"] = "GET_STATUS";
    Commands["getAPILevel"] = "GET_API_LEVEL";
    Commands["setAPILevel"] = "SET_API_LEVEL";
    Commands["getReader"] = "GET_READER";
    Commands["getReaderList"] = "GET_READER_LIST";
    Commands["runAuth"] = "RUN_AUTH";
    Commands["runChangePin"] = "RUN_CHANGE_PIN";
    Commands["getAccessRights"] = "GET_ACCESS_RIGHTS";
    Commands["setAccessRights"] = "SET_ACCESS_RIGHTS";
    Commands["setCard"] = "SET_CARD";
    Commands["getCertificate"] = "GET_CERTIFICATE";
    Commands["cancel"] = "CANCEL";
    Commands["accept"] = "ACCEPT";
    Commands["interrupt"] = "INTERRUPT";
    Commands["setPin"] = "SET_PIN";
    Commands["setNewPin"] = "SET_NEW_PIN";
    Commands["setCan"] = "SET_CAN";
    Commands["setPuk"] = "SET_PUK";
})(Commands = exports.Commands || (exports.Commands = {}));
exports.disruptiveCommands = [Commands.cancel];
//# sourceMappingURL=commandTypes.js.map