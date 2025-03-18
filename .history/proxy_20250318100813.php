<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Debug log
$debug = [];
$debug['time'] = date('Y-m-d H:i:s');

$start = $_GET['start'] ?? '';
$end = $_GET['end'] ?? '';

if (empty($start) || empty($end)) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing parameters']));
}

$url = "https://dashboard.elering.ee/api/nps/price?start={$start}&end={$end}";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'User-Agent: Mozilla/5.0'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Debug response
$debug['response'] = $response;
$debug['httpCode'] = $httpCode;
file_put_contents('debug.log', json_encode($debug) . "\n", FILE_APPEND);

if (curl_errno($ch)) {
    $error = curl_error($ch);
    curl_close($ch);
    http_response_code(500);
    die(json_encode(['error' => 'Curl error: ' . $error]));
}

curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    die(json_encode(['error' => 'API returned status ' . $httpCode]));
}

// Parse and validate JSON
$data = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    die(json_encode(['error' => 'Invalid JSON response: ' . json_last_error_msg()]));
}

// Validate data structure
if (!isset($data['data']) || !isset($data['data']['lt'])) {
    http_response_code(500);
    die(json_encode(['error' => 'Invalid API response structure']));
}

header('Content-Type: application/json');
echo json_encode($data);
?>
