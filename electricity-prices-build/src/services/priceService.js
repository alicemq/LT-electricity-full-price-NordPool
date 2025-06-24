import axios from 'axios';
import moment from 'moment-timezone';
import { logApiCall } from './logService';

function getPriceSettings() {
    const defaultSettings = {
        margin: 0.0,
        vat: 21
    };
    const settings = localStorage.getItem('priceCalculationSettings');
    return settings ? JSON.parse(settings) : defaultSettings;
}

export async function fetchPrices(date) {
    // Format date as YYYY-MM-DD for the new backend API
    const formattedDate = moment(date).format('YYYY-MM-DD');
    
    // Use the new NordPool API endpoint
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/nps/prices?date=${formattedDate}&country=lt`;

    logApiCall(apiUrl);
    // Save settings to localStorage but don't send them to API
    getPriceSettings(); // Just to ensure settings are loaded
    return (await axios.get(apiUrl)).data;
}
