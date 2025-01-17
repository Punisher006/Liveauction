<?php
header('Content-Type: application/json');

// Simulated database validation
$validUsername = 'admin';
$validPassword = 'password';

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // Validate credentials
    if ($username === $validUsername && $password === $validPassword) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} else {
    // Redirect to the login page for non-AJAX requests
    header('Location: login.html');
    exit;
}
?>
