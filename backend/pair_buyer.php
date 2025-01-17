<?php
session_start();
include 'db_config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Seller ID
$seller_id = $_SESSION['user_id'];

// Get the bid ID and buyer ID from the request
$bid_id = $_POST['bid_id']; // The bid ID to pair
$buyer_id = $_POST['buyer_id']; // The buyer's ID to pair with

// Update the bid status to paired and assign the buyer to the bid
$query = "UPDATE bids SET buyer_id = ?, status = 'paired' WHERE id = ? AND seller_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("iii", $buyer_id, $bid_id, $seller_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['message' => 'Successfully paired with the buyer.']);
} else {
    echo json_encode(['message' => 'Error pairing the buyer.']);
}

$stmt->close();
$conn->close();
?>
