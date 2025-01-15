<?php
include 'db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please log in']);
    exit;
}

$user_id = $_SESSION['user_id'];
$sql = "SELECT * FROM bids WHERE user_id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$user_id]);
$bids = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($bids);
?>

