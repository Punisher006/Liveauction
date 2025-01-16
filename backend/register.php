<?php
include('db_config.php');
include('functions.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = sanitizeInput($_POST['username'], $conn);
    $email = sanitizeInput($_POST['email'], $conn);
    $password = $_POST['password']; // Plain password, will be hashed later
    $confirmPassword = $_POST['confirm_password'];

    // Validate password
    if ($password !== $confirmPassword) {
        echo "Passwords do not match.";
        exit;
    }

    // Hash password
    $hashedPassword = hashPassword($password);

    // Check if user already exists (avoid duplicate username/email)
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

    // Insert new user into the database
    $insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("sss", $username, $email, $hashedPassword);

    if ($stmt->execute()) {
        echo "Registration successful!";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}
?>

<form method="POST" action="register.php">
    <input type="text" name="username" placeholder="Username" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Password" required>
    <input type="password" name="confirm_password" placeholder="Confirm Password" required>
    <button type="submit">Register</button>
</form>
