export function sanitizeKamaitachiErrorMessage(msg: string, payload: string) {
    return msg.replaceAll(payload, "");
}
