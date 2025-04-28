<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle GET requests - redirect to registration page
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Location: register.html');
    exit;
}

// Include database configuration and functions
require_once('db_config.php');
require_once('functions.php');

// Set content type to JSON
header('Content-Type: application/json');

// Set CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Set the timezone to UTC
date_default_timezone_set('UTC');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "user_management";

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

// Enable full error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Block CLI execution (e.g., direct script access via terminal)
if (php_sapi_name() === 'cli' && empty($_SERVER['REQUEST_METHOD'])) {
}

// Validate request method
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Only POST requests are allowed.']));
}

// Validate required fields
$requiredFields = ['username', 'email', 'password', 'confirm_password'];
foreach ($requiredFields as $field) {
    if (empty($_POST[$field])) {
        http_response_code(400);
        die(json_encode(['error' => "Missing required field: $field"]));
    }
}

// Sanitize and validate inputs
$username = sanitizeInput($_POST['username']);
$email = sanitizeInput($_POST['email']);
$password = $_POST['password'];
$confirmPassword = $_POST['confirm_password'];

// Password validation
if ($password !== $confirmPassword) {
    http_response_code(400);
    die(json_encode(['error' => 'Passwords do not match.']));
}

if (strlen($password) < 8) {
    http_response_code(400);
    die(json_encode(['error' => 'Password must be at least 8 characters.']));
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid email format.']));
}

try {
    // Check for existing user
    $checkUserQuery = "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1";
    $stmt = $conn->prepare($checkUserQuery);
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(409); // Conflict
        die(json_encode(['error' => 'Username or email already exists.']));
    }

    // Hash password
    $hashedPassword = hashPassword($password);

    // Insert new user
    $insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("sss", $username, $email, $hashedPassword);

    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(['success' => 'Registration successful!']);
    } else {
        throw new Exception("Database error: " . $stmt->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log($e->getMessage()); // Log server errors
    die(json_encode(['error' => 'Registration failed. Please try again later.']));
} finally {

    // Always clean up
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();

// Redirect to the login page after successful registration
header('Location: login.php');
var_dump($_SERVER['REQUEST_METHOD'] ?? 'NOT SET');
var_dump($_POST); // Check if form data is received
exit;
}
?>
