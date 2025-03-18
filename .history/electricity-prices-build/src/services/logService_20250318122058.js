export function logApiCall(url, method = 'GET') {
    console.log(`[${new Date().toISOString()}] API ${method}: ${url}`);
}
