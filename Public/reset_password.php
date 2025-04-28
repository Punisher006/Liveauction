<?php
include('db_config.php');
include('functions.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = sanitizeInput($_POST['email']);
}
// FORGOT PASSWORD
if (isset($_POST['forgot_password'])) {
    $email = mysqli_real_escape_string($db, $_POST['email']);
    $new_password = mysqli_real_escape_string($db, $_POST['new_password']);
    $confirm_password = mysqli_real_escape_string($db, $_POST['confirm_password']);

    if (empty($email)) { array_push($errors, "Email is required"); }
    if (empty($new_password)) { array_push($errors, "New password is required"); }
    if ($new_password != $confirm_password) { array_push($errors, "Passwords do not match"); }

    if (empty($errors)) {
        $password = password_hash($new_password, PASSWORD_DEFAULT);
        $query = "UPDATE users SET password='$password' WHERE email='$email'";
        if (mysqli_query($db, $query)) {
            $_SESSION['success'] = "Password reset successfully!";
            header('location: login.html');
        } else {
            logError("Password reset error: " . mysqli_error($db));
            array_push($errors, "Failed to reset password.");
        }
    }
}
?>

<form method="POST" action="reset_password.php">
    <input type="email" name="email" placeholder="Enter your email" required>
    <button type="submit">Request Password Reset</button>
</form>