<?php
// Include database connection
require_once 'db.php';

// Start the session for storing login data (e.g., user session)
session_start();

// Function to register a new user
function registerUser($username, $email, $password) {
    global $conn;
    
    // Validate inputs (e.g., check if email and username are already taken)
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return "Username or Email already in use!";
    }
    
    // Password validation (ensure it meets the required criteria)
    if (strlen($password) < 8) {
        return "Password must be at least 8 characters long.";
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Insert user into database
    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $hashedPassword);
    $stmt->execute();

    return "User registered successfully!";
}

// Function to log in a user
function loginUser($email, $password) {
    global $conn;
    
    // Fetch user from the database by email
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    // Check if user exists
    if ($result->num_rows == 0) {
        return "No user found with that email.";
    }

    $user = $result->fetch_assoc();
    
    // Verify the password
    if (!password_verify($password, $user['password'])) {
        return "Incorrect password.";
    }

    // Start the session for this user
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];

    return "Login successful!";
}

// Check if the request is a POST request to register or login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'register') {
            $username = $_POST['username'];
            $email = $_POST['email'];
            $password = $_POST['password'];

            // Call the register function
            $result = registerUser($username, $email, $password);
            echo $result;  // You can return this message to the frontend

        } elseif ($_POST['action'] === 'login') {
            $email = $_POST['email'];
            $password = $_POST['password'];

            // Call the login function
            $result = loginUser($email, $password);
            echo $result;  // You can return this message to the frontend
        }
    }
}
?>
