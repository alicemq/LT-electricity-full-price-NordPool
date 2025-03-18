import { useStorage } from '@vueuse/core';
import moment from 'moment-timezone';
import { timeZones, holidayDates } from '../config/priceConfig';

const state = useStorage('elecsettings', {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0.02003',
  VIAP: 0,
  distributionplus: "0.00054",
  PVMIncluded: true
});

function getDistributionPrice(time) {
  const newDate = moment(new Date(time * 1000));
  let weekend = [0, 6].includes(newDate.day()) === false ? 'mondayToFriday' : 'weekend';
  const hour = newDate.hour();
  const daylightSaving = newDate.isDST() === false ? "wintertime" : "summertime";
  const zone = timeZones[state.value.zone];
  const plan = zone.values.tariffs[state.value.plan];
  
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
  
  return plan.dayTime[timetable[hour]];
}

export function calculatePrice(price) {
  const VAT = state.value.PVMIncluded ? 1 : 1.21;

  return (Math.round(((((parseFloat(price.price) / 1000 * 1.21) + 
    (parseFloat(state.value.VIAP) + 
     parseFloat(state.value.vendorMargin) +
     parseFloat(state.value.distributionplus) + 
     getDistributionPrice(price.timestamp))) * 100) / VAT) * 100) / 100);
}
