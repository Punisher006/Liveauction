<?php
// Database credentials
$servername = "localhost";  // Database server
$username = "root";         // Database username
$password = "";             // Database password (default is empty for XAMPP)
$database = "my_database";  // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error); // Handle connection error
}
?>
