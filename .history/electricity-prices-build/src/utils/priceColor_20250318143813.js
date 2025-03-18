export function getPriceClass(price, average, settings, isCurrent = false) {
  // Check absolute thresholds first
  if (price <= settings.cheapThreshold) {
    return isCurrent ? 'price-cheap-current' : 'price-cheap';
  }
  if (price >= settings.expensiveThreshold) {
    return isCurrent ? 'price-expensive-current' : 'price-expensive';
  }

  // Check relative to average
  const cheapLimit = average * (1 - settings.cheapRange / 100);
  const expensiveLimit = average * (1 + settings.expensiveRange / 100);

  if (price <= cheapLimit) {
    return isCurrent ? 'price-cheap-current' : 'price-cheap';
  }
  if (price >= expensiveLimit) {
    return isCurrent ? 'price-expensive-current' : 'price-expensive';
  }

  return isCurrent ? 'price-current' : '';
}
