<?php
session_start();
include('db_config.php');
include('functions.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = sanitizeInput($_POST['username'], $conn);
    $password = $_POST['password'];

    // Query to check if user exists
    $loginQuery = "SELECT * FROM users WHERE username = ?";
    $stmt = $conn->prepare($loginQuery);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $user = $result->fetch_assoc();
        
        // Verify the password
        if (verifyPassword($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo "Login successful!";
            header("Location: home.php"); // Redirect to home page
            exit;
        } else {
            echo "Invalid password.";
        }
    } else {
        echo "No user found with that username.";
    }

    $stmt->close();
}
?>

<form method="POST" action="login.php">
    <input type="text" name="username" placeholder="Username" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Login</button>
</form>
