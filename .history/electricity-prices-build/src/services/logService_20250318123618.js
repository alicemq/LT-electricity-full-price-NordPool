export function logApiCall(url, method = 'GET') {
    console.log(`[${new Date().toISOString()}] API ${method}: ${url}`);
}

export function logPriceCalculation(timestamp, originalPrice, finalPrice, modifiers) {
    const date = new Date(timestamp * 1000);
    console.log(`[${date.toISOString()}] Price calculation:
    Time: ${date.toLocaleTimeString()}
    Timestamp: ${timestamp}
    Original: ${originalPrice}
    Final: ${finalPrice}
    Modifiers:`, modifiers);
}
