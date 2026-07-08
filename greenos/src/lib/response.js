export function apiResponse(success, message, data = null) {
    return { success, message, data, timestamp: new Date().toISOString() };
}
