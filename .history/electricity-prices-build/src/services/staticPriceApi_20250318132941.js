import moment from 'moment-timezone';

const SAMPLE_PRICE_DATA = [
  { timestamp: 1709164800, price: 45.12 },
  { timestamp: 1709168400, price: 44.89 },
  { timestamp: 1709172000, price: 46.01 }
];

export function generateSampleData(date) {
  const startOfDay = moment(date).startOf('day');
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: startOfDay.unix() + (i * 3600),
    price: Math.round((40 + Math.random() * 20) * 100) / 100
  }));
}

export function handleStaticPriceApi(path) {
  if (path === '/priceapi/v1') {
    return {
      version: 1,
      description: 'Static price API for testing',
      endpoints: ['/priceapi/v1/today', '/priceapi/v1/tomorrow']
    };
  }

  if (path === '/priceapi/v1/today') {
    return {
      date: moment().format('YYYY-MM-DD'),
      prices: generateSampleData(new Date()),
      hasData: true
    };
  }

  if (path === '/priceapi/v1/tomorrow') {
    return {
      date: moment().add(1, 'days').format('YYYY-MM-DD'),
      prices: generateSampleData(moment().add(1, 'days').toDate()),
      hasData: true
    };
  }

  return { error: 'Invalid endpoint' };
}
