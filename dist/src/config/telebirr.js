"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.sortAndConcatParams = sortAndConcatParams;
exports.generateSignature = generateSignature;
const crypto_1 = __importDefault(require("crypto"));
exports.config = {
    baseUrl: "https://iapapi.telebirr.com:21443/apiaccess",
    appId: process.env.TELEBIRR_APP_ID,
    appSecret: process.env.TELEBIRR_APP_KEY,
    shortCode: process.env.TELEBIRR_SHORT_CODE,
    merchantId: process.env.TELEBIRR_MERCHANT_ID,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    rsaPrivateKey: `-----BEGIN PRIVATE KEY-----\n${process.env.TELEBIRR_PRIVATE_KEY}\n-----END PRIVATE KEY-----`
};
function sortAndConcatParams(params) {
    const sortedKeys = Object.keys(params).sort();
    let paramStr = "";
    for (let key of sortedKeys) {
        if (key === "sign" || params[key] === undefined || params[key] === null || params[key] === "")
            continue;
        if (paramStr.length > 0)
            paramStr += "&";
        if (typeof params[key] === "object") {
            paramStr += `${key}=${JSON.stringify(params[key])}`;
        }
        else {
            paramStr += `${key}=${params[key]}`;
        }
    }
    return paramStr;
}
function generateSignature(params, privateKey) {
    const signString = sortAndConcatParams(params);
    const sign = crypto_1.default.createSign('SHA256');
    sign.update(signString);
    return sign.sign(privateKey, 'base64');
}
