function getEasterDates(year) {
    // ...existing Easter calculation code...
}

function getHolidayDatesForYear(year) {
    const easterDates = getEasterDates(year);
    return [
        "01-01", "02-16", "03-11", "05-01", "06-24",
        "07-06", "08-15", "11-01", "12-24", "12-25", "12-26",
        easterDates.easterSunday,
        easterDates.easterMonday
    ];
}

export function isHoliday(date) {
    const year = date.getFullYear();
    const monthDay = date.toISOString().slice(5, 10);
    return getHolidayDatesForYear(year).includes(monthDay);
}
