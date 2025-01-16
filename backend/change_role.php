<?php
session_start();
include('db_config.php');

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: login.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user_id = $_POST['user_id'];
    $new_role = $_POST['role'];

    // Update user role
    $update_query = "UPDATE users SET role = ? WHERE id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("si", $new_role, $user_id);
    
    if ($stmt->execute()) {
        echo "User role updated successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }
    $stmt->close();
}

// Fetch all users
$query = "SELECT id, username, role FROM users";
$stmt = $conn->prepare($query);
$stmt->execute();
$result = $stmt->get_result();
?>

<h2>Change User Role</h2>
<form method="POST" action="change_role.php">
    <select name="user_id">
        <?php while ($user = $result->fetch_assoc()) { ?>
            <option value="<?php echo $user['id']; ?>"><?php echo $user['username']; ?> (<?php echo $user['role']; ?>)</option>
        <?php } ?>
    </select>
    
    <select name="role">
        <option value="user">User</option>
        <option value="admin">Admin</option>
    </select>
    <button type="submit">Change Role</button>
</form>
