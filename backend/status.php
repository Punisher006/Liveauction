<?php
include 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo "Authentication required. Please login.";
    exit;
}

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT * FROM bids WHERE user_id = ?");
$stmt->execute([$user_id]);
$bids = $stmt->fetchAll();

echo json_encode($bids);
?>
