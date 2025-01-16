<?php
// Function to sanitize input and prevent SQL injection
function sanitizeInput($input, $conn) {
    return $conn->real_escape_string(trim($input));
}

// Function to hash the password
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Function to verify the password
function verifyPassword($password, $hashedPassword) {
    return password_verify($password, $hashedPassword);
}
?>
