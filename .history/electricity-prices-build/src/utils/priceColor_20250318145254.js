export function getPriceClass(price, average, settings, isCurrent = false) {
  // Fixed thresholds take absolute priority
  if (price <= settings.cheapThreshold) {
    return isCurrent ? ['table-success', 'price-cheap-current'] : 'table-success';
  }
  if (price >= settings.expensiveThreshold) {
    return isCurrent ? ['table-danger', 'price-expensive-current'] : 'table-danger';
  }

  // Only apply relative thresholds for prices between fixed thresholds
  if (price > settings.cheapThreshold && price < settings.expensiveThreshold) {
    const cheapLimit = average * (1 - settings.cheapRange / 100);
    const expensiveLimit = average * (1 + settings.expensiveRange / 100);

    if (price <= cheapLimit) {
      return isCurrent ? ['table-success', 'price-cheap-current'] : 'table-success';
    }
    if (price >= expensiveLimit) {
      return isCurrent ? ['table-danger', 'price-expensive-current'] : 'table-danger';
    }
  }

  return isCurrent ? 'price-current' : '';
}
