import crypto from 'crypto';

export interface TelebirrConfig {
    baseUrl: string;
    appId?: string;
    appSecret?: string;
    shortCode?: string;
    merchantId?: string;
    frontendUrl: string;
    rsaPrivateKey: string;
}

export const config: TelebirrConfig = {
    baseUrl: "https://iapapi.telebirr.com:21443/apiaccess",
    appId: process.env.TELEBIRR_APP_ID,
    appSecret: process.env.TELEBIRR_APP_KEY,
    shortCode: process.env.TELEBIRR_SHORT_CODE,
    merchantId: process.env.TELEBIRR_MERCHANT_ID,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    rsaPrivateKey: `-----BEGIN PRIVATE KEY-----\n${process.env.TELEBIRR_PRIVATE_KEY}\n-----END PRIVATE KEY-----`
};

export function sortAndConcatParams(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    let paramStr = "";
    for (let key of sortedKeys) {
        if (key === "sign" || params[key] === undefined || params[key] === null || params[key] === "") continue;
        if (paramStr.length > 0) paramStr += "&";
        
        if (typeof params[key] === "object") {
            paramStr += `${key}=${JSON.stringify(params[key])}`;
        } else {
            paramStr += `${key}=${params[key]}`;
        }
    }
    return paramStr;
}

export function generateSignature(params: Record<string, any>, privateKey: string): string {
    const signString = sortAndConcatParams(params);
    const sign = crypto.createSign('SHA256');
    sign.update(signString);
    return sign.sign(privateKey, 'base64');
}
