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

async function getPricesWithMetadata(date) {
    try {
        const data = await fetchPrices(date);
        return {
            date: moment(date).format('YYYY-MM-DD'),
            prices: data.data?.lt || [],
            hasData: data.data?.lt?.length >= 3 || false
        };
    } catch (error) {
        return {
            date: moment(date).format('YYYY-MM-DD'),
            prices: [],
            hasData: false,
            error: 'Failed to fetch prices'
        };
    }
}

export async function handlePriceApi(path) {
    try {
        return new Promise((resolve) => {
            setTimeout(async () => {
                if (path === '/priceapi/v1') {
                    resolve({
                        version: 1,
                        endpoints: API_ENDPOINTS,
                        timestamp: new Date().toISOString()
                    });
                }
            
                try {
                    switch (path) {
                        case '/priceapi/v1/today': {
                            const result = await getPricesWithMetadata(new Date());
                            resolve({
                                ...result,
                                timestamp: new Date().toISOString()
                            });
                            break;
                        }
                        case '/priceapi/v1/tomorrow': {
                            const result = await getPricesWithMetadata(moment().add(1, 'days').toDate());
                            resolve({
                                ...result,
                                timestamp: new Date().toISOString()
                            });
                            break;
                        }
                        case '/priceapi/v1/todaywithtomorrow': {
                            const [today, tomorrow] = await Promise.all([
                                getPricesWithMetadata(new Date()),
                                getPricesWithMetadata(moment().add(1, 'days').toDate())
                            ]);
                            resolve({
                                today,
                                tomorrow,
                                timestamp: new Date().toISOString()
                            });
                            break;
                        }
                        default:
                            resolve({ 
                                error: 'Invalid endpoint',
                                availableEndpoints: Object.keys(API_ENDPOINTS)
                            });
                    }
                } catch (error) {
                    resolve({ 
                        error: 'Failed to fetch prices',
                        timestamp: new Date().toISOString()
                    });
                }
            }, 100);
        });
    } catch (error) {
        return { 
            error: 'Failed to fetch prices',
            timestamp: new Date().toISOString()
        };
    }
}
