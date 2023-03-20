"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
const delay = async (delay) => {
    return new Promise((resolve) => setTimeout(resolve, delay));
};
exports.delay = delay;
//# sourceMappingURL=utils.js.map