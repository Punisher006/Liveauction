<?php
include 'db.php';

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please log in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['bid'])) {
    $user_id = $_SESSION['user_id'];
    $amount = $_POST['amount'];
    $period = $_POST['period'];

    $sql = "INSERT INTO bids (user_id, amount, period) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $amount, $period]);

    echo json_encode(['status' => 'success', 'message' => 'Bid placed successfully']);
}
?>
