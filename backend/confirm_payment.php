<?php
session_start();
include 'db_config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Seller ID
$seller_id = $_SESSION['user_id'];

// Get the payment ID from the request (sent via AJAX)
$payment_id = $_POST['payment_id']; // The payment ID to confirm

// Update the payment status to confirmed
$query = "UPDATE payments SET status = 'confirmed' WHERE id = ? AND seller_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $payment_id, $seller_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['message' => 'Payment confirmed successfully.']);
} else {
    echo json_encode(['message' => 'Error confirming payment.']);
}

$stmt->close();
$conn->close();
?>
