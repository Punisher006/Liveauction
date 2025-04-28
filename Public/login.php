<?php
require_once('db_config.php');
require_once('functions.php');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "user_management";

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Function to log errors to a file
function logError($message) {
    $logFile = "error_log.txt";
    $date = date("Y-m-d H:i:s");
    file_put_contents($logFile, "[$date] $message" . PHP_EOL, FILE_APPEND);
}

// Check if the request is POST and process login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // Validate credentials
    $query = "SELECT * FROM users WHERE username = ?";
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");;
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
            throw new Exception('Invalid username or password');

        // Verify the password
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id']; // Store user info in session
            $_SESSION['username'] = $user['username'];

            // Return success response
            echo json_encode(['success' => true]);
        } else {
            // Incorrect password
            echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        }
    } else {
        // User not found
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
    $stmt->close();
    $conn->close();
} else {
    // Redirect to the login page for non-POST requests (i.e. if directly accessing login.php without POST)
    header('Location: login.html');
    exit;
}
?>