<script setup>
import { RouterLink, RouterView } from 'vue-router'
import axios from "axios";
import moment from 'moment-timezone';
import { useStorage, useMouse, usePreferredDark, containsProp } from '@vueuse/core'
// import { stringify } from '@vueuse/docs-utils'

import { ref, computed, onMounted, onActivated, onBeforeUpdate, watch } from 'vue'

//default storage
const theDefault = {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0',
  VIAP: '0',
  distributionplus: "0.00054"
}
const state = useStorage('elecsettings', theDefault)
// let date = ref(new Date());
// let minDate, currentDate, lastDay, nextDay, apiUrl, priceData, data,datax, response = ''
let date = ref(new Date());
const minDate = ref(new Date("2012-07-01"))
let currentDate = moment(date).tz("Europe/Vilnius").format('YYYY-MM-DD').toString()

// currentDate="2012-07-01"
let lastDay = moment(currentDate).subtract(1, 'days').tz("Europe/Vilnius").format('YYYY-MM-DD')
let nextDay = moment().add(1, 'days').tz("Europe/Vilnius").format('YYYY-MM-DD')
let apiUrl = 'https://dashboard.elering.ee/api/nps/price?start=' + lastDay + 'T21%3A00%3A00.999Z&end=' + currentDate + 'T20%3A59%3A59.999Z'



async function getData(url) {
  let response = await axios.get(url)
  let data = response.data

  return data
}


let priceData = ref([])

// onMounted(async () => {
//   let data = await getData(apiUrl)
//   priceData.value = data.data
// })

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
  // let newDate = new Date(moment.unix(time).tz("Europe/Vilnius"))
  let newDate = new moment(time).tz("Europe/Vilnius")
  let weekend = [0, 6].includes(newDate.day()) === false ? 'mondayToFriday' : 'weekend'
  let hour = moment(newDate).hour()
  let daylightSaving = (moment(time)).isDST() === false ? "wintertime" : "summertime"
  let zone = timeZones[state.value.zone]
  let plan = zone.values.tariffs[state.value.plan]
  let timetable = ''
  // let timetableDayTime = ''
  // let dayTime = ''

  //get timetable
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
  // let dayTimePrice = plan.dayTime[timetableDayTime]


  return plan['dayTime'][timetableDayTime]
}



watch(date, async (newValue, oldValue) => {
  let date = newValue;
  const minDate = ref(new Date("2012-07-01"))
  let currentDate = moment(date).tz("Europe/Vilnius").format('YYYY-MM-DD').toString()

  // currentDate="2012-07-01"
  let lastDay = moment(currentDate).subtract(1, 'days').tz("Europe/Vilnius").format('YYYY-MM-DD')
  let nextDay = moment().add(1, 'days').tz("Europe/Vilnius").format('YYYY-MM-DD')
  let apiUrl = 'https://dashboard.elering.ee/api/nps/price?start=' + lastDay + 'T21%3A00%3A00.999Z&end=' + currentDate + 'T20%3A59%3A59.999Z'


  // console.log(date)
  // console.log(apiUrl)
  let data = await getData(apiUrl)
  priceData.value = data.data
  // console.log('update calendar done')
}, { immediate: true })


</script>

<template>
  <VueDatePicker v-model="date" locale="lt" month-name-format="long" format="yyyy-MM-dd" auto-apply reverse-years
    :enable-time-picker="false" :max-date="nextDay" :min-date="minDate" prevent-min-max-navigation />

  <table class="table table-hover">
    <thead>
      <tr>
        <th scope="col" class="header">Hour</th>
        <th scope="col" class="header">Price ct/kWh</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="prices in priceData.lt">
        <td>{{ moment.unix(prices.timestamp).tz("Europe/Vilnius").format('HH:mm') }} - {{
          moment.unix(prices.timestamp).add(1, 'hour').tz("Europe/Vilnius").format('HH:mm') }}</td>
        <td>{{ (((prices.price / 1000 * 1.21) + (state.VIAP + state.vendorMargin +
          state.distributionplus + getDistributionPrice(prices.timestamp))) * 100).toFixed(4) }} ct €</td>
      </tr>

    </tbody>
  </table>

  <div class="input-group mb-3">
    <div class="form-check" v-for="zone in timeZones">
      <input class="form-check-input" type="radio" :id="zone.id" :value="zone.name" v-model="state.zone">
      <label class="form-check-label" :for="zone.id">
        {{ zone.name }}
      </label>
    </div>
  </div>
  <div>
    Available plans:

    <div class="input-group mb-3">
      <div class="form-check" v-for="plan in timeZones[state.zone].values.tariffs">

        <input class="form-check-input" type="radio" :id="plan.id" :value="plan.name" v-model="state.plan"
          :checked="plan.name === state.plan">
        <label class="form-check-label" :for="plan.id">
          {{ plan.name }}
        </label>
      </div>
    </div>
    <div class="mb-3">
      <label for="venmar" class="form-label">Vendor margin</label>
      <input type="number" class="form-control" name="vendorMargin" id="venmar" aria-describedby="helpId"
        :placeholder="state.vendorMargin" v-model="state.vendorMargin" />
      <small id="helpId" class="form-text text-muted">Enter vendor margin</small>
    </div>
    <div class="mb-3">
      <label for="VIAP" class="form-label">VIAP</label>
      <input type="number" class="form-control" name="VIAP" id="VIAP" aria-describedby="helpId"
        :placeholder="state.VIAP" v-model="state.VIAP" />
      <small id="helpId" class="form-text text-muted">Enter VIAP price</small>
    </div>
    <div class="mb-3">
      <label for="distributionplus" class="form-label">National distribution margin</label>
      <input type="number" class="form-control" name="distributionplus" id="distributionplus" aria-describedby="helpId"
        :placeholder="state.distributionplus" v-model="state.distributionplus" />
      <small id="helpId" class="form-text text-muted">Enter national distribution margin</small>
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
