<script setup>
import { RouterLink, RouterView } from 'vue-router'
import axios from "axios";
import moment from 'moment-timezone';
import { useStorage, useGeolocation } from '@vueuse/core'
import { fetchWeatherApi } from 'openmeteo';

import { ref, computed, onMounted, onActivated, onBeforeUpdate, watch } from 'vue'

moment.tz.setDefault("Europe/Vilnius");

//default storage
const theDefault = {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0.02003',
  VIAP: 0,
  distributionplus: "0.00054",
  PVMIncluded: true
}
const state = useStorage('elecsettings', theDefault)

//check default plan

if (state.value.zone === "Four zones") {
  state.value.plan = "Smart"
} else {
  if (state.value.zone != "Four zones" && state.value.plan === "Smart") {
    state.value.plan = "Standart"
  }
}


let date = ref(new Date());
// console.log(date)
const minDate = ref(new Date("2012-07-01"))
let currentDate = moment(date).format('YYYY-MM-DD').toString()

let lastDay = moment(currentDate).subtract(1, 'days').format('YYYY-MM-DD')
let nextDay = moment().add(1, 'days').format('YYYY-MM-DD')
// let apiUrl = 'https://dashboard.elering.ee/api/nps/price?start=' + lastDay + 'T21%3A00%3A00.999Z&end=' + currentDate + 'T20%3A59%3A59.999Z'

async function getData(url) {
  let response = await axios.get(url)
  let data = response.data

  return data
}

// weather location data





let priceData = ref([])

let countries = [
  { name: "Estonia", value: "ee" },
  { name: "Latvia", value: "lv" },
  { name: "Lithuania", value: "lt" },
  { name: "Finland", value: "fi" }

]
const timeZones = {
  "Four zones": {
    name: "Four zones",
    id: "four",
    values: {
      tariffs: {
        "Smart": {
          id: "smart",
          name: "Smart",
          basePrice: 0,
          dayTime: {
            morning: 0.07502,
            day: 0.09438,
            evening: 0.12826,
            night: 0.05929
          }
        }
      },
      hours: {
        alltime: {
          mondayToFriday: ["night", "night", "night", "night", "night", "morning", "morning", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "evening", "evening", "evening", "evening", "evening", "night", "night"],
          weekend: ["night", "night", "night", "night", "night", "night", "night", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "night", "night"]
        }
      }
    }
  },
  "Two zones": {
    name: "Two zones",
    id: "two",
    values: {
      tariffs: {
        "Standart": {
          id: "standart",
          name: "Standart",
          basePrice: 0,
          dayTime: {
            day: 0.11616,
            night: 0.06534
          }
        },
        "Home": {
          id: "home",
          name: "Home",
          basePrice: 3,
          dayTime: {
            day: 0.09801,
            night: 0.05566
          }
        },
        "Home plus": {
          id: "homeplus",
          name: "Home plus",
          basePrice: 6,
          dayTime: {
            day: 0.09317,
            night: 0.05324
          }
        }
      },
      hours: {
        wintertime: {
          mondayToFriday: ["night", "night", "night", "night", "night", "night", "night", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "night"],
          weekend: ["night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night"]
        },
        summertime: {
          mondayToFriday: ["night", "night", "night", "night", "night", "night", "night", "night", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day"],
          weekend: ["night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night", "night"]
        }
      }
    }
  },
  "Single zone": {
    name: "Single zone",
    id: "one",
    values: {
      tariffs: {
        "Standart": {
          id: "standart",
          name: "Standart",
          basePrice: 0,
          dayTime: {
            day: 0.10043
          }
        },
        "Home": {
          id: "home",
          name: "Home",
          basePrice: 3,
          dayTime: {
            day: 0.08470
          }
        },
        "Home plus": {
          id: "homeplus",
          name: "Home plus",
          basePrice: 6,
          dayTime: {
            day: 0.08107
          }
        }

      },
      hours: {
        alltime: {
          mondayToFriday: ["day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day"],
          weekend: ["day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day", "day"]
        }
      }
    }
  }
}


//handle four zone and smart pairing
watch(state.value, async (newValue, oldValue) => {
  if (newValue.zone === "Four zones") {
    state.value.plan = "Smart"
  } else {
    if (newValue.zone != "Four zones" && newValue.plan === "Smart") {
      state.value.plan = "Standart"
    }
  }
})

// get data from distribution list
function getDistributionPrice(time) {
  let initDate = new Date(time * 1000)
  let newDate = new moment(initDate)
  let weekend = [0, 6].includes(newDate.day()) === false ? 'mondayToFriday' : 'weekend'
  let hour = moment(newDate).hour()
  let daylightSaving = (moment(time)).isDST() === false ? "wintertime" : "summertime"
  let zone = timeZones[state.value.zone]
  let plan = zone.values.tariffs[state.value.plan]
  let timetable = ''

  switch (zone.name) {
    case "Four zones":
      timetable = zone.values.hours['alltime'][weekend]
      break
    case "Two zones":
      timetable = zone.values.hours[daylightSaving][weekend]
      break
    case "Single zone":
      timetable = zone.values.hours['alltime'][weekend]
      break
  }
  let timetableDayTime = timetable[hour]
  let finalPrice = plan['dayTime'][timetableDayTime]
  // console.log("weekend: " + weekend)
  // console.log("initDate : " + initDate)
  // console.log("date: " + newDate)
  // console.log("hour: " + hour)
  // console.log("daylight saving: " + daylightSaving)
  // console.log("timetable: " + timetableDayTime)
  // console.log("distro price: " + finalPrice)

  return finalPrice

}
// on calendar and on load reload price data
watch(date, async (newValue, oldValue) => {
  let date = newValue;
  let currentDate = moment(date).format('YYYY-MM-DD').toString()
  let lastDay = moment(currentDate).subtract(1, 'days').format('YYYY-MM-DD')
  // console.log(date)
  let lastDayHour = lastDay.isDST ? 21 : 22
  let currentDayHour = currentDate.isDST ? 20 : 21
  let nextDay = moment().add(1, 'days').format('YYYY-MM-DD')
  let apiUrl = 'https://dashboard.elering.ee/api/nps/price?start=' + lastDay + 'T'+lastDayHour+'%3A00%3A00.999Z&end=' + currentDate + 'T'+currentDayHour+'%3A59%3A59.999Z'
  let data = await getData(apiUrl)
  priceData.value = data.data
},
  { immediate: true }
)

function countPrice(price) {
  let VAT = 1
  switch (state.value.PVMIncluded === true) {
    case true:
      VAT = 1
      break
    case false:
      VAT = 1.21
  }

  // console.log(parseFloat(state.value.VIAP))
  return (Math.round(((((parseFloat(price.price) / 1000 * 1.21) + (parseFloat(state.value.VIAP) + parseFloat(state.value.vendorMargin) +
    parseFloat(state.value.distributionplus) + getDistributionPrice(price.timestamp))) * 100) / VAT) * 100) / 100)
}

// onMounted(async () => {
//   let data = await getData(apiUrl)
//   priceData.value = data.data

// })

function priceHours(time, addHours) {
  let initDate = new Date(time * 1000)
  let newDate = new moment(initDate)
  let hour = newDate.add(0, 'hour').format('HH')
  let minute = newDate.add(0, 'hour').format('mm')
  let nextHour = newDate.add(addHours, 'hour').format('HH')
  let nextMinute = newDate.add(addHours, 'hour').format('mm')
  let timeString = hour + '<sup>' + minute + '</sup> - ' + nextHour + '<sup>' + nextMinute + '</sup>'
  return timeString
}

function markCurrentHour(time){
  let thisdate = new Date();
  let currDate = moment(thisdate).format('YYYY-MM-DD').toString()
  let priceDate = moment(time*1000).format('YYYY-MM-DD').toString()
  let priceHour = moment(time*1000).hour()
  let currentHour = moment(thisdate).hour()
  let colorRow = ""
 if(currDate === priceDate) {
  //get current hour and compare
  colorRow = (priceHour === currentHour ? "table-primary" : "")
 }
//  console.log(colorRow)
//  console.log(currDate)
//  console.log(currentHour)
//  console.log(priceDate)
//  console.log(priceHour)
//  console.log("price date and hour: " + moment(time*1000).format('YYYY-MM-DD HH:mm'))

 return colorRow
}

</script>

<template>
  <VueDatePicker v-model="date" locale="lt" month-name-format="long" format="yyyy-MM-dd" auto-apply reverse-years
    :enable-time-picker="false" :max-date="nextDay" :min-date="minDate" prevent-min-max-navigation />

  <table class="table table-hover table-striped table-sm">
    <thead class="table-dark">
      <tr>
        <th scope="col" class="header">Hour</th>
        <th scope="col" class="header">Price ct/kWh</th>
      </tr>
    </thead>
    <tbody class="table-group-divider">
      <tr v-for="prices in priceData.lt">
        <td v-html="priceHours(prices.timestamp, 1)" v-bind:class="markCurrentHour(prices.timestamp)"></td>
        <td v-bind:class="markCurrentHour(prices.timestamp)">{{ countPrice(prices) }}</td>
      </tr>

    </tbody>
  </table>
  <p>ESO time zone and plan</p>
  <div class="input-group mb-3">
    <div class="form-check" v-for="zone in timeZones">
      <input class="form-check-input" type="radio" :id="zone.id" :value="zone.name" v-model="state.zone">
      <label class="form-check-label" :for="zone.id">
        {{ zone.name }}
      </label>
    </div>
  </div>
  <div>

    <div class="input-group mb-3">
      <div class="form-check" v-for="plan in timeZones[state.zone].values.tariffs">

        <input class="form-check-input" type="radio" :id="plan.id" :value="plan.name" v-model="state.plan"
          :checked="plan.name === state.plan">
        <label class="form-check-label" :for="plan.id">
          {{ plan.name }}
        </label>
      </div>
    </div>

    <div class="form-check">
      <input class="form-check-input" type="radio" name="PVMIncludedYes" :id="state.PVMIncluded"
        v-model="state.PVMIncluded" :value="true" :checked="state.PVMIncluded === true" />
      <label class="form-check-label" :for="state.PVMIncluded"> With VAT</label>
    </div>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="PVMIncludedNo" :id="state.PVMIncluded"
        v-model="state.PVMIncluded" :value="false" :checked="state.PVMIncluded === false" />
      <label class="form-check-label" :for="state.PVMIncluded"> No VAT</label>
    </div>


    <div class="mb-3">
      <label for="venmar" class="form-label">Vendor margin</label>
      <input type="number" step="0.0001" class="form-control" name="vendorMargin" id="venmar" aria-describedby="helpId"
        :placeholder="state.vendorMargin" v-model="state.vendorMargin" />
      <small id="helpId" class="form-text text-muted">Enter vendor margin in € </small>
    </div>
    <div class="mb-3">
      <label for="VIAP" step="0.0001" class="form-label">VIAP</label>
      <input type="number" class="form-control" name="VIAP" id="VIAP" aria-describedby="helpId"
        :placeholder="state.VIAP" v-model="state.VIAP" />
      <small id="helpId" class="form-text text-muted">Enter VIAP price in € </small>
    </div>
    <div class="mb-3">
      <label for="distributionplus" class="form-label">National distribution margin</label>
      <input type="number" step="0.0001" class="form-control" name="distributionplus" id="distributionplus"
        aria-describedby="helpId" :placeholder="state.distributionplus" v-model="state.distributionplus" />
      <small id="helpId" class="form-text text-muted">Enter national distribution margin in € </small>
    </div>
  </div>

  <br>
  <br><br>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
}
</style>
