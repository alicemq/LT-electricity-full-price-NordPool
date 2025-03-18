function getEasterDates(year) {
    // Meeus/Jones/Butcher algorithm for calculating Easter
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    // Calculate Easter Sunday date
    const easterMonth = month;
    const easterDay = day;
    
    // Calculate Easter Monday (handle month rollover)
    let mondayMonth = easterMonth;
    let mondayDay = easterDay + 1;
    
    // Handle month transition
    if ((easterMonth === 3 && easterDay === 31) || // March 31
        (easterMonth === 4 && easterDay === 30)) { // April 30
        mondayMonth++;
        mondayDay = 1;
    }
    
    return {
        easterSunday: `${easterMonth.toString().padStart(2, '0')}-${easterDay.toString().padStart(2, '0')}`,
        easterMonday: `${mondayMonth.toString().padStart(2, '0')}-${mondayDay.toString().padStart(2, '0')}`
    };
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
