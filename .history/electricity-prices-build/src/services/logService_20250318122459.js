export function logApiCall(url, method = 'GET') {
    console.log(`[${new Date().toISOString()}] API ${method}: ${url}`);
}

export function logPriceCalculation(timestamp, originalPrice, finalPrice, modifiers) {
    console.log(`[${new Date(timestamp * 1000).toISOString()}] Price calculation:
    Original: ${originalPrice}
    Final: ${finalPrice}
    Modifiers:`, modifiers);
}
