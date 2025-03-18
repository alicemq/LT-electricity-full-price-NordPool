import axios from 'axios';
import moment from 'moment-timezone';
import { logApiCall } from './logService';

export async function fetchPrices(date) {
    const currentDateInit = moment(date);
    console.log('Unix timestamp:', currentDateInit.unix(), 'Date:', currentDateInit.format());
    console.log('Fetching prices for date:', date);
    const currentDate = currentDateInit.format('YYYY-MM-DD');
    console.log('Computed current date:', currentDate);
    
    const lastDayInit = moment(currentDate).subtract(1, 'days');
    const lastDay = lastDayInit.format('YYYY-MM-DD');
    console.log('Computed last day:', lastDay);
    
    const lastDayHour = lastDayInit.isDST() ? 20 : 21;
    const currentDayHour = currentDateInit.isDST() ? 20 : 21;
    console.log('Determined hours - Last day hour:', lastDayHour, ', Current day hour:', currentDayHour);
    
    const apiUrl = `/api/nps/price?start=${lastDay}T${lastDayHour}%3A00%3A00.999Z&end=${currentDate}T${currentDayHour}%3A59%3A59.999Z`;
    logApiCall(apiUrl);
    console.log('Start timestamp:', moment(`${lastDay} ${lastDayHour}:00`).unix());
    console.log('End timestamp:', moment(`${currentDate} ${currentDayHour}:59`).unix());
    console.log('Constructed API URL:', apiUrl);
    
    const response = await axios.get(apiUrl);
    console.log('API response received:', response.data);
    
    return response.data;
}
