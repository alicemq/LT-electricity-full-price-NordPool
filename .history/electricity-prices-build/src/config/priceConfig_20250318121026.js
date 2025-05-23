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

export const priceHistory = {
    tariffs: {
        "2023-01-01": {
            "Four zones": {
                "Smart": {
                    morning: 0.06534,
                    day: 0.07986,
                    evening: 0.10648,
                    night: 0.05203
                }
            },
            "Two zones": {
                "Standart": { day: 0.09680, night: 0.05687 },
                "Home": { day: 0.07865, night: 0.04719 },
                "Home plus": { day: 0.07381, night: 0.04477 }
            },
            "Single zone": {
                "Standart": { day: 0.08470 },
                "Home": { day: 0.06897 },
                "Home plus": { day: 0.06534 }
            }
        },
        "2024-01-01": {
            "Four zones": {
                "Smart": {
                    morning: 0.07502,
                    day: 0.09438,
                    evening: 0.12826,
                    night: 0.05929
                }
            },
            "Two zones": {
                "Standart": { day: 0.11616, night: 0.06534 },
                "Home": { day: 0.09801, night: 0.05566 },
                "Home plus": { day: 0.09317, night: 0.05324 }
            },
            "Single zone": {
                "Standart": { day: 0.10043 },
                "Home": { day: 0.08470 },
                "Home plus": { day: 0.08107 }
            }
        },
        // Current prices (valid from 2025-01-01)
        "2025-01-01": {
            "Four zones": {
                "Smart": {
                    morning: 0.07381,
                    day: 0.09317,
                    evening: 0.12947,
                    night: 0.05566
                }
            },
            "Two zones": {
                "Standart": { day: 0.11616, night: 0.06292 },
                "Home": { day: 0.09801, night: 0.05324 },
                "Home plus": { day: 0.09317, night: 0.05082 }
            },
            "Single zone": {
                "Standart": { day: 0.10043 },
                "Home": { day: 0.08470 },
                "Home plus": { day: 0.08107 }
            }
        },
        "2025-07-01": {
            "Four zones": {
                "Standart": {
                    morning: 0.07381,
                    day: 0.09317,
                    evening: 0.12947,
                    night: 0.05566
                },
                "Effective": {
                    morning: 0.05687,
                    day: 0.07139,
                    evening: 0.10043,
                    night: 0.04356
                }
            },
            "Two zones": {
                "Standart": { day: 0.11616, night: 0.06292 },
                "Home": { day: 0.09801, night: 0.05324 },
                "Effective": { day: 0.08954, night: 0.04840 }
            },
            "Single zone": {
                "Standart": { day: 0.10043 },
                "Home": { day: 0.08470 },
                "Effective": { day: 0.07744 }
            }
        },
    },
    systemCharges: {
        "2024-01-01": {
            VIAP: 0.00,
            distributionplus: 0.00045
        },
        "2025-01-01": {
                VIAP: -0.00039,
                distributionplus: 0.000893
        }
    }
};