<?php
include 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo "Authentication required. Please login.";
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'];
    $amount = $_POST['amount'];
    $period = $_POST['period'];

    $stmt = $pdo->prepare("INSERT INTO bids (user_id, amount, period) VALUES (?, ?, ?)");
    if ($stmt->execute([$user_id, $amount, $period])) {
        echo "Bid placed successfully!";
    } else {
        echo "Error placing bid.";
    }
}
?>
