export function getPriceClass(price, average, settings, isCurrent = false) {
  // Always check fixed thresholds first
  if (parseFloat(price) <= parseFloat(settings.cheapThreshold)) {
    return isCurrent ? ['table-success', 'price-cheap-current'] : 'table-success';
  }
  if (parseFloat(price) >= parseFloat(settings.expensiveThreshold)) {
    return isCurrent ? ['table-danger', 'price-expensive-current'] : 'table-danger';
  }

  // Only then check relative to average
  const cheapLimit = average * (1 - settings.cheapRange / 100);
  const expensiveLimit = average * (1 + settings.expensiveRange / 100);

  if (parseFloat(price) <= cheapLimit) {
    return isCurrent ? ['table-success', 'price-cheap-current'] : 'table-success';
  }
  if (parseFloat(price) >= expensiveLimit) {
    return isCurrent ? ['table-danger', 'price-expensive-current'] : 'table-danger';
  }

  return isCurrent ? 'price-current' : '';
}
