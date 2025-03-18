<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

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
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'User-Agent: Mozilla/5.0'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    die(json_encode(['error' => 'Curl error: ' . curl_error($ch)]));
}

curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    die(json_encode(['error' => 'API returned status ' . $httpCode]));
}

echo $response;
?>
