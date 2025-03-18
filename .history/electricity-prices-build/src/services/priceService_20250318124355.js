import axios from 'axios';
import moment from 'moment-timezone';
import { logApiCall } from './logService';

function getDateRangeForApi(date) {
    const currentDate = moment.tz(date, "Europe/Vilnius").startOf('day');
    const prevDay = moment(currentDate).subtract(1, 'days');
    
    const startHour = prevDay.isDST() ? 21 : 22;
    const endHour = currentDate.isDST() ? 20 : 21;
    
    const result = {
        start: prevDay.utc().set({ hour: startHour, minute: 0 }).format(),
        end: currentDate.utc().set({ hour: endHour, minute: 59, second: 59 }).format()
    };

    console.log('API Date Range:', {
        inputDate: date,
        currentDate: currentDate.format(),
        prevDay: prevDay.format(),
        isDST: {
            prev: prevDay.isDST(),
            current: currentDate.isDST()
        },
        result
    });

    return result;
}

export async function fetchPrices(date) {
    const range = getDateRangeForApi(date);
    const apiUrl = `/api/nps/price?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`;
    
    logApiCall(apiUrl);
    const response = await axios.get(apiUrl);
    return response.data;
}
