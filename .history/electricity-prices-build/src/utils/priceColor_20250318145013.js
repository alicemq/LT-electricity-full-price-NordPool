export function getPriceClass(price, average, settings, isCurrent = false) {
  // Always apply fixed thresholds first
  if (price <= settings.cheapThreshold) {
    return isCurrent ? ['table-success', 'price-cheap-current'] : 'table-success';
  }
  if (price >= settings.expensiveThreshold) {
    return isCurrent ? ['table-danger', 'price-expensive-current'] : 'table-danger';
  }

  // Only check relative to average if price is between fixed thresholds
  const cheapLimit = average * (1 - settings.cheapRange / 100);
  const expensiveLimit = average * (1 + settings.expensiveRange / 100);

  if (price > settings.cheapThreshold && price <= cheapLimit) {
    return isCurrent ? ['table-success', 'price-cheap-current'] : 'table-success';
  }
  if (price < settings.expensiveThreshold && price >= expensiveLimit) {
    return isCurrent ? ['table-danger', 'price-expensive-current'] : 'table-danger';
  }

  return isCurrent ? 'price-current' : '';
}
