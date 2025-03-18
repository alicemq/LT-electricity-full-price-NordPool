<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$start = $_GET['start'] ?? '';
$end = $_GET['end'] ?? '';

$url = "https://dashboard.elering.ee/api/nps/price?start={$start}&end={$end}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
