import moment from 'moment-timezone';
import { fetchPrices } from './priceService';

const API_ENDPOINTS = {
    '/priceapi/v1': {
        description: 'API root - lists all available endpoints',
        method: 'GET'
    },
    '/priceapi/v1/today': {
        description: 'Get today\'s prices',
        method: 'GET'
    },
    '/priceapi/v1/tomorrow': {
        description: 'Get tomorrow\'s prices',
        method: 'GET'
    },
    '/priceapi/v1/todaywithtomorrow': {
        description: 'Get both today\'s and tomorrow\'s prices',
        method: 'GET'
    }
};

export async function handlePriceApi(path) {
    try {
        // Handle root endpoint
        if (path === '/priceapi/v1') {
            return {
                version: 1,
                endpoints: API_ENDPOINTS,
                timestamp: new Date().toISOString()
            };
        }

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
