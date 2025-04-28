<?php
require_once('db_config.php');
echo "Connected successfully!";
// Optional: List tables to verify database access
$result = $conn->query("SHOW TABLES");
while ($row = $result->fetch_array()) {
    print_r($row);
}
$conn->close();