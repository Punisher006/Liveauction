<?php
include('db_config.php');
include('functions.php');

// Function to sanitize input
function sanitizeInput($data) {
    return htmlspecialchars(stripslashes(trim($data)));
}

// Function to hash password securely
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize user inputs
    $username = sanitizeInput($_POST['username']);
    $email = sanitizeInput($_POST['email']);
    $password = $_POST['password']; // Plain password, will be hashed later
    $confirmPassword = $_POST['confirm_password'];

    // Validate password match
    if ($password !== $confirmPassword) {
        echo "Passwords do not match.";
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Invalid email format.";
        exit;
    }

    // Hash the password securely
    $hashedPassword = hashPassword($password);

    // Check if username or email already exists in the database
    $checkUserQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($checkUserQuery);
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo "Username or email already exists.";
        $stmt->close();
        exit;
    }

    // Insert the new user into the database
    $insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("sss", $username, $email, $hashedPassword);

    if ($stmt->execute()) {
        // Redirect to the login page upon successful registration
        header("Location: login.html");
        exit;
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>

<!-- Registration Form -->
<form method="POST" action="register.php">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Password" required>
    <input type="password" name="confirm_password" placeholder="Confirm Password" required>
    <button type="submit">Register</button>
</form>
