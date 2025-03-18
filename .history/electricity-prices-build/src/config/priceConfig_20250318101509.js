export const timeZones = {
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

export const holidayDates = [
  "01-01", "02-16", "03-11", "05-01", "06-24",
  "07-06", "08-15", "11-01", "12-24", "12-25", "12-26"
];