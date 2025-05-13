<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
date_default_timezone_set('Europe/Vilnius');

function get_param($key, $default = null) {
    return isset($_GET[$key]) ? $_GET[$key] : $default;
}

$date_from = get_param('date_from', date('Y-m-d'));
$date_to = get_param('date_to', $date_from);
$vat = get_param('vat', 'yes') === 'yes';

$start = strtotime($date_from);
$end = strtotime($date_to);

$all_hours = [];
for ($d = $start; $d <= $end; $d += 86400) {
    $date_str = date('Y-m-d', $d);
    $base_prices = array_map(function($h) { return 0.073 + 0.005 * ($h % 4); }, range(0, 23));
    foreach ($base_prices as $hour => $price) {
        $final_price = $vat ? $price * 1.21 : $price;
        $all_hours[] = [
            'date' => $date_str,
            'hour' => $hour,
            'price' => round($final_price / 100, 5)
        ];
    }
}
$response = [
    'timestamp' => $start,
    'date' => $date_from,
    'hours' => $all_hours
];
echo json_encode($response); 