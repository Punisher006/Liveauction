<?php
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