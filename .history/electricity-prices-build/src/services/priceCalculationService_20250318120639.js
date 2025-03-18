import { useStorage } from '@vueuse/core';
import { ref } from 'vue';
import moment from 'moment-timezone';
import { timeZones, holidayDates, priceHistory } from '../config/priceConfig';

let state = ref(useStorage('elecsettings', {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0.02003',
  VIAP: 0,
  distributionplus: "0.00054",
  PVMIncluded: true
}));

function getPricesForDate(date) {
  const dateStr = moment(date).format('YYYY-MM-DD');
  const periods = Object.keys(priceHistory.tariffs).sort();
  
  // Find the applicable price period
  const applicablePeriod = periods.reduce((prev, curr) => {
    return dateStr >= curr ? curr : prev;
  }, periods[0]);

  return {
    tariffs: priceHistory.tariffs[applicablePeriod],
    systemCharges: Object.keys(priceHistory.systemCharges)
      .reduce((prev, curr) => dateStr >= curr ? priceHistory.systemCharges[curr] : prev, 
        priceHistory.systemCharges[Object.keys(priceHistory.systemCharges)[0]])
  };
}

function getDistributionPrice(time) {
  const timestamp = new Date(time * 1000);
  const prices = getPricesForDate(timestamp);
  const newDate = moment(timestamp);
  let weekend = [0, 6].includes(newDate.day()) === false ? 'mondayToFriday' : 'weekend';
  const hour = newDate.hour();
  const daylightSaving = newDate.isDST() === false ? "wintertime" : "summertime";
  const zone = timeZones[state.value.zone];
  const plan = prices.tariffs[state.value.zone]?.[state.value.plan] || 
               timeZones[state.value.zone].values.tariffs[state.value.plan];
  
  let timetable;
  switch (zone.name) {
    case "Four zones":
      weekend = holidayDates.includes(newDate.format('MM-DD')) ? 'weekend' : weekend;
      timetable = zone.values.hours['alltime'][weekend];
      break;
    case "Two zones":
      timetable = zone.values.hours[daylightSaving][weekend];
      break;
    case "Single zone":
      timetable = zone.values.hours['alltime'][weekend];
      break;
  }
  
  return plan.dayTime ? plan.dayTime[timetable[hour]] : plan[timetable[hour]];
}

export function calculatePrice(price) {
  const timestamp = new Date(price.timestamp * 1000);
  const historicalPrices = getPricesForDate(timestamp);
  const VAT = state.value.PVMIncluded ? 1 : 1.21;

  return (Math.round(((((parseFloat(price.price) / 1000 * 1.21) + 
    (parseFloat(historicalPrices.systemCharges.VIAP) + 
     parseFloat(state.value.vendorMargin) +
     parseFloat(historicalPrices.systemCharges.distributionplus) + 
     getDistributionPrice(price.timestamp))) * 100) / VAT) * 100) / 100);
}
