import axios from 'axios';
import moment from 'moment-timezone';
import { logApiCall } from './logService';

function getDateRangeForApi(date) {
    const currentDate = moment.tz(date, "Europe/Vilnius").startOf('day');
    const nextDay = moment(currentDate).add(1, 'days');
    
    const startHour = currentDate.isDST() ? 21 : 22;
    const endHour = nextDay.isDST() ? 20 : 21;
    
    return {
        start: currentDate.utc().set({ hour: startHour, minute: 0 }).format(),
        end: nextDay.utc().set({ hour: endHour, minute: 59, second: 59 }).format()
    };
}

function getPriceSettings() {
    const defaultSettings = {
        margin: 0.0,
        vat: 21
    };
    const settings = localStorage.getItem('priceCalculationSettings');
    return settings ? JSON.parse(settings) : defaultSettings;
}

export async function fetchPrices(date) {
    const range = getDateRangeForApi(date);
    const settings = getPriceSettings();
    
    const apiUrl = `/api/nps/price?` + new URLSearchParams({
        start: range.start,
        end: range.end,
        margin: settings.margin,
        vat: settings.vat
    });

    logApiCall(apiUrl);
    return (await axios.get(apiUrl)).data;
}
