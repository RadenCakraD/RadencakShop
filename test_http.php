<?php
$ch = curl_init('http://127.0.0.1:8000/api/vouchers');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Pass no auth header to see what happens
$res = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "Status: " . $http_status . "\n";
echo "Response: " . substr($res, 0, 200) . "\n";
