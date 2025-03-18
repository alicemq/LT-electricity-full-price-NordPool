import axios from 'axios';
import moment from 'moment-timezone';

export async function fetchPrices(date) {
  const currentDateInit = moment(date);
  const currentDate = currentDateInit.format('YYYY-MM-DD');
  const lastDayInit = moment(currentDate).subtract(1, 'days');
  const lastDay = lastDayInit.format('YYYY-MM-DD');
  const lastDayHour = lastDayInit.isDST() ? 21 : 22;
  const currentDayHour = currentDateInit.isDST() ? 20 : 21;

  const apiUrl = `/api/nps/price?start=${lastDay}T${lastDayHour}%3A00%3A00.999Z&end=${currentDate}T${currentDayHour}%3A59%3A59.999Z`;
  const response = await axios.get(apiUrl);
  return response.data;
}
