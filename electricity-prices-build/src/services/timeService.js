import moment from 'moment-timezone';

export function formatPriceHours(time, addHours) {
  const newDate = moment(new Date(time * 1000));
  const hour = newDate.format('HH');
  const minute = newDate.format('mm');
  const nextHour = newDate.add(addHours, 'hour').format('HH');
  const nextMinute = newDate.add(addHours, 'hour').format('mm');
  return `${hour}<sup>${minute}</sup> - ${nextHour}<sup>${nextMinute}</sup>`;
}

export function isCurrentHour(time) {
  const thisdate = new Date();
  const currDate = moment(thisdate).format('YYYY-MM-DD');
  const priceDate = moment(time * 1000).format('YYYY-MM-DD');
  const priceHour = moment(time * 1000).hour();
  const currentHour = moment(thisdate).hour();
  
  return currDate === priceDate && priceHour === currentHour ? "table-primary" : "";
}
