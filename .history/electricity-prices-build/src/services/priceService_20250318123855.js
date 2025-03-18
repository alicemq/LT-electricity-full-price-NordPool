import axios from 'axios';
import moment from 'moment-timezone';
import { logApiCall } from './logService';

function isDayAfterDSTEnd(date) {
    const previousDay = moment(date).subtract(1, 'days');
    return previousDay.isDST() && !moment(date).isDST();
}

export async function fetchPrices(date) {
    const currentDateInit = moment(date);
    console.log('Unix timestamp:', currentDateInit.unix(), 'Date:', currentDateInit.format());
    console.log('Fetching prices for date:', date);
    const isDSTTransition = isDayAfterDSTEnd(currentDateInit);
    
    const currentDate = currentDateInit.format('YYYY-MM-DD');
    console.log('Computed current date:', currentDate);
    
    const lastDayInit = moment(currentDate).subtract(1, 'days');
    const lastDay = lastDayInit.format('YYYY-MM-DD');
    console.log('Computed last day:', lastDay);
    
    // Adjust hours based on DST transition
    const lastDayHour = lastDayInit.isDST() ? 20 : (isDSTTransition ? 20 : 21);
    const currentDayHour = currentDateInit.isDST() ? 20 : (isDSTTransition ? 21 : 21);
    console.log('Determined hours - Last day hour:', lastDayHour, ', Current day hour:', currentDayHour);
    
    const apiUrl = `/api/nps/price?start=${lastDay}T${lastDayHour}%3A00%3A00.999Z&end=${currentDate}T${currentDayHour}%3A59%3A59.999Z`;
    logApiCall(apiUrl);
    console.log('Start timestamp:', moment(`${lastDay} ${lastDayHour}:00`).unix());
