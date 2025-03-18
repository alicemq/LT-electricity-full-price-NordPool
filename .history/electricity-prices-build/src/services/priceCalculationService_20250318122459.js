import { useStorage } from '@vueuse/core';
import { ref } from 'vue';
import moment from 'moment-timezone';
import { timeZones, priceHistory, timeSchedules } from '../config/priceConfig';
import { isHoliday } from './holidayService';
import { logPriceCalculation } from './logService';

let state = ref(useStorage('elecsettings', {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0.02003',
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
  const plan = prices.tariffs[state.value.zone]?.[state.value.plan];
  
  let timetable;
  switch (zone.name) {
    case "Four zones":
      weekend = isHoliday(timestamp) ? 'weekend' : weekend;
      timetable = timeSchedules[zone.name]['alltime'][weekend];
      break;
    case "Two zones":
      timetable = timeSchedules[zone.name][daylightSaving][weekend];
      break;
    case "Single zone":
      timetable = timeSchedules[zone.name]['alltime'][weekend];
      break;
  }
  
  return plan[timetable[hour]];
}

export function calculatePrice(price) {
  const timestamp = new Date(price.timestamp * 1000);
  const historicalPrices = getPricesForDate(timestamp);
  const VAT = state.value.PVMIncluded ? 1 : 1.21;
  const originalPrice = parseFloat(price.price) / 1000;

  const modifiers = {
    VIAP: parseFloat(historicalPrices.systemCharges.VIAP),
    vendorMargin: parseFloat(state.value.vendorMargin),
    distributionplus: parseFloat(historicalPrices.systemCharges.distributionplus),
    distributionPrice: getDistributionPrice(price.timestamp),
    VAT: VAT,
    baseVAT: 1.21
  };

  const finalPrice = (Math.round(((((originalPrice * modifiers.baseVAT) + 
    (modifiers.VIAP + modifiers.vendorMargin + modifiers.distributionplus + 
     modifiers.distributionPrice)) * 100) / modifiers.VAT) * 100) / 100);

  logPriceCalculation(price.timestamp, originalPrice, finalPrice, modifiers);
  
  return finalPrice;
}
