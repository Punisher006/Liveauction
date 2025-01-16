<?php
include('db_config.php');
include('functions.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = sanitizeInput($_POST['email'], $conn);

    // Check if email exists
    $query = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $user = $result->fetch_assoc();
        
        // Generate reset token and expiry date (valid for 1 hour)
        $reset_token = bin2hex(random_bytes(50));
        $expiry = date("Y-m-d H:i:s", strtotime("+1 hour"));

        // Update reset token and expiry in the database
        $update_query = "UPDATE users SET password_reset_token = ?, reset_token_expiry = ? WHERE email = ?";
        $stmt = $conn->prepare($update_query);
        $stmt->bind_param("sss", $reset_token, $expiry, $email);
        
        if ($stmt->execute()) {
            // Send password reset email (e.g., to the user's email address)
            $reset_link = "http://yourwebsite.com/new_password.php?token=" . $reset_token;
            mail($email, "Password Reset", "Click the following link to reset your password: " . $reset_link);
            echo "Password reset link sent to your email!";
        } else {
            echo "Error: " . $stmt->error;
        }

        $stmt->close();
    } else {
        echo "No user found with that email.";
    }
}
?>

<form method="POST" action="reset_password.php">
    <input type="email" name="email" placeholder="Enter your email" required>
    <button type="submit">Request Password Reset</button>
</form>
