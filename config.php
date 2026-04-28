<?php
// =============================================
// DATABASE CONFIGURATION
// =============================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');         // Apna MySQL username daalen
define('DB_PASS', '');             // Apna MySQL password daalen
define('DB_NAME', 'job_portal');

// Site Configuration
define('SITE_NAME', 'JobHive Portal');
define('SITE_URL', 'http://localhost/jobportal');
define('UPLOAD_DIR', __DIR__ . '/uploads/');

// Create DB Connection
function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// Start Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Helper Functions
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

function isEmployer() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'employer';
}

function redirect($url) {
    header("Location: $url");
    exit();
}

function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function formatSalary($min, $max, $type = 'Monthly') {
    if (!$min && !$max) return 'Not Disclosed';
    $curr = '₹';
    if ($min && $max) return $curr . number_format($min) . ' - ' . $curr . number_format($max) . '/' . strtolower($type);
    if ($min) return 'From ' . $curr . number_format($min) . '/' . strtolower($type);
    return 'Up to ' . $curr . number_format($max) . '/' . strtolower($month);
}

function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    if ($time < 60) return 'Just now';
    if ($time < 3600) return floor($time/60) . ' min ago';
    if ($time < 86400) return floor($time/3600) . ' hours ago';
    if ($time < 604800) return floor($time/86400) . ' days ago';
    return date('d M Y', strtotime($datetime));
}
?>
