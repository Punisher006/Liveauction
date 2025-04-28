<?php
require_once('db_config.php');
require_once('functions.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $reset_token = $_POST['token'];
    $new_password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    if ($new_password !== $confirm_password) {
        echo "Passwords do not match.";
        exit;
    }

    $hashed_password = hashPassword($new_password);

    // Check if reset token is valid and not expired
    $query = "SELECT * FROM users WHERE password_reset_token = ? AND reset_token_expiry > NOW()";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $reset_token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        // Update password
        $update_query = "UPDATE users SET password = ?, password_reset_token = NULL, reset_token_expiry = NULL WHERE password_reset_token = ?";
        $stmt = $conn->prepare($update_query);
        $stmt->bind_param("ss", $hashed_password, $reset_token);

        if ($stmt->execute()) {
            echo "Password updated successfully!";
        } else {
            echo "Error: " . $stmt->error;
        }
    } else {
        echo "Invalid or expired reset token.";
    }

    $stmt->close();
}
?>

<form method="POST" action="new_password.php">
    <input type="password" name="password" placeholder="New Password" required>
    <input type="password" name="confirm_password" placeholder="Confirm Password" required>
    <input type="hidden" name="token" value="<?php echo $_GET['token']; ?>">
    <button type="submit">Set New Password</button>
</form>
