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

export async function fetchPrices(date) {
    const range = getDateRangeForApi(date);
    const apiUrl = `/api/nps/price?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`;
    logApiCall(apiUrl);
    return (await axios.get(apiUrl)).data;
}
