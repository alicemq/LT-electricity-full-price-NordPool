<?php
header('Content-Type: application/json');
default_timezone_set('Europe/Vilnius');

function get_param($key, $default = null) {
    return isset($_GET[$key]) ? $_GET[$key] : $default;
}

$zone = get_param('zone');
$plan = get_param('plan');
$vendor_margin = get_param('vendor_margin');
if (!$zone || !$plan || !$vendor_margin) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters: zone, plan, vendor_margin']);
    exit;
}
$date = get_param('date', date('Y-m-d'));
$vat = get_param('vat', 'yes') === 'yes';
$threshold = get_param('threshold', null);

// Get today and next day
$dates = [$date, date('Y-m-d', strtotime($date . ' +1 day'))];
$hours = [];
foreach ($dates as $d) {
    $base_prices = array_map(function($h) { return 0.07 + 0.01 * ($h % 3); }, range(0, 23));
    foreach ($base_prices as $hour => $price) {
        $final_price = $price + floatval($vendor_margin);
        if ($vat) $final_price *= 1.21;
        $classification = $final_price < 0.09 ? 'cheap' : ($final_price > 0.10 ? 'expensive' : 'average');
        $hours[] = [
            'date' => $d,
            'hour' => $hour,
            'price' => round($final_price, 3),
            'classification' => $classification
        ];
    }
}
$response = [
    'timestamp' => strtotime($date),
    'date' => $date,
    'hours' => $hours,
    'priceClassification' => 'mostly-cheap' // Placeholder
];
echo json_encode($response); 