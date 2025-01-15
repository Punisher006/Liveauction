<?php
// Initialize session
session_start();

// Replace these with your actual database connection details
$host = 'localhost';
$username = 'root';
$password = '';
$dbname = 'your_database_name';

$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// If form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Collect form data
    $user = $_POST['username'];
    $pass = $_POST['password'];

    // Protect against SQL Injection
    $user = $conn->real_escape_string($user);
    $pass = $conn->real_escape_string($pass);

    // Check if the user exists in the database
    $sql = "SELECT * FROM users WHERE username = '$user' AND password = '$pass'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        // Start a session and store user data
        $_SESSION['username'] = $user;
        // Redirect to dashboard or homepage after successful login
        header("Location: dashboard.php");
        exit();
    } else {
        echo "<script>alert('Invalid username or password!');</script>";
    }
}

$conn->close();
?>
