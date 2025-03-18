import moment from 'moment-timezone';
import { fetchPrices } from './priceService';

export async function handlePriceApi(path) {
    try {
        let date, data;
        switch (path) {
            case '/priceapi/v1/today':
                date = new Date();
                data = await fetchPrices(date);
                return {
                    date: moment(date).format('YYYY-MM-DD'),
                    prices: data.data.lt,
                    timestamp: new Date().toISOString()
                };
            case '/priceapi/v1/tomorrow':
                date = moment().add(1, 'days').toDate();
                data = await fetchPrices(date);
                return {
                    date: moment(date).format('YYYY-MM-DD'),
                    prices: data.data.lt,
                    timestamp: new Date().toISOString()
                };
            case '/priceapi/v1/todaywithtomorrow':
                const today = await fetchPrices(new Date());
                const tomorrow = await fetchPrices(moment().add(1, 'days').toDate());
                return {
                    today: {
                        date: moment().format('YYYY-MM-DD'),
                        prices: today.data.lt
                    },
                    tomorrow: {
                        date: moment().add(1, 'days').format('YYYY-MM-DD'),
                        prices: tomorrow.data.lt
                    },
                    timestamp: new Date().toISOString()
                };
            default:
                return { error: 'Invalid endpoint' };
        }
    } catch (error) {
        return { error: 'Failed to fetch prices' };
    }
}
