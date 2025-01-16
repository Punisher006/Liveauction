<?php
session_start();
include('db_config.php');
include('functions.php');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Fetch user data
$user_id = $_SESSION['user_id'];
$query = "SELECT * FROM users WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $new_email = sanitizeInput($_POST['email'], $conn);
    $new_password = $_POST['password'];
    
    // Optionally hash the new password
    $hashed_password = hashPassword($new_password);

    // Update user info
    $update_query = "UPDATE users SET email = ?, password = ? WHERE id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("ssi", $new_email, $hashed_password, $user_id);
    
    if ($stmt->execute()) {
        echo "Profile updated successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }
    $stmt->close();
}
?>

<h2>Update Profile</h2>
<form method="POST" action="profile.php">
    <input type="email" name="email" value="<?php echo $user['email']; ?>" required>
    <input type="password" name="password" placeholder="New Password">
    <button type="submit">Update Profile</button>
</form>
