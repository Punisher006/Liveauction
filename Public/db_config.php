<?php
// db_config.php
// Database credentials
$servername = "localhost";  // Database server
$username = "root";         // Database username
$password = "";             // Database password (default is empty for XAMPP)
$database = "user_management";  // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to support special characters
$conn->set_charset("utf8mb4");

// Optional: Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration file
// This file contains the database connection settings and error handling
// Prevent direct access to this file
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    die("Direct access to this file is not allowed.");
}
// Include necessary functions
require_once('functions.php');

// Set content type to JSON
header('Content-Type: application/json');

// Set CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Set the timezone to UTC
date_default_timezone_set('UTC');

// Block CLI execution (e.g., direct script access via terminal)
if (php_sapi_name() === 'cli' && empty($_SERVER['REQUEST_METHOD'])) {
    die("This script cannot be run from the command line.");
}
// Enable full error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Prevent function redeclaration if this file is included multiple times
if (!function_exists('sanitizeInput')) {

    // Function to sanitize input for HTML and SQL safety
    function sanitizeInput($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
}
if (!function_exists('hashPassword')) {
    // Securely hash the password
    function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
}
if (!function_exists('verifyPassword')) {
    // Verify a plain password against its hashed version
    function verifyPassword($password, $hashedPassword) {
        return password_verify($password, $hashedPassword);
    }
}
if (!function_exists('sendJsonResponse')) {
    // Send JSON response (for AJAX use)
    function sendJsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
?>
