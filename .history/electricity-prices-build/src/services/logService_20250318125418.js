export function logApiCall(url) {
    console.log(`[API Call] ${url}`);
}

export function logPriceCalculation(timestamp, originalPrice, finalPrice, modifiers) {
    console.log(`[Price] ${new Date(timestamp * 1000).toLocaleString()}: ${originalPrice} -> ${finalPrice}`);
}
