<?php
// Allow CORS for your frontend domain
header('Access-Control-Allow-Origin: https://elektra.teletigras.lt');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Only allow proxying to the /nps/price endpoint
$allowed_path = '/api/nps/price';
$elering_base = 'https://dashboard.elering.ee';

// Parse the requested path
$path = isset($_GET['path']) ? $_GET['path'] : '';
if ($path !== $allowed_path) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

// Build the Elering API URL
$query = $_SERVER['QUERY_STRING'];
// Remove 'path=...' from the query string
$query = preg_replace('/(^|&)path=[^&]*/', '', $query);
$query = ltrim($query, '&');
$elering_url = $elering_base . $allowed_path;
if ($query) {
    $elering_url .= '?' . $query;
}

// Debug: log the proxied URL
error_log('Proxying to: ' . $elering_url);

// Forward the GET request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $elering_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true); // Get headers + body
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json, text/javascript, */*; q=0.01',
    'Accept-Language: en-US,en;q=0.9',
    'Connection: keep-alive',
    'X-Requested-With: XMLHttpRequest'
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headers = substr($response, 0, $header_size);
$body = substr($response, $header_size);

// Log headers and body for debugging
error_log('Elering response headers: ' . $headers);
error_log('Elering response body: ' . substr($body, 0, 500)); // log first 500 chars

if ($content_type && strpos($content_type, 'application/json') !== false) {
    header('Content-Type: ' . $content_type);
    http_response_code($http_code);
    echo $body;
} else {
    header('Content-Type: application/json');
    http_response_code($http_code);
    echo json_encode([
        'error' => 'Non-JSON response from Elering',
        'headers' => $headers,
        'body' => substr($body, 0, 1000) // return first 1000 chars for inspection
    ]);
}
