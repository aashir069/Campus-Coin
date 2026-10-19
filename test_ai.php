<?php
require_once 'config/config.php';
require_once 'includes/functions.php';
require_once 'config/database.php';
require_once 'includes/tips.php';
require_once 'includes/AIService.php';

// Test with demo user id 2
$uid = 2;
$ym = date('Y-m');

echo "=== Testing insights table ===\n";
$insight = dbRow('SELECT summary, tip, generated_at FROM insights WHERE user_id = ? AND month = ?', [$uid, $ym]);
echo "Current insight for $ym: ";
var_dump($insight);

echo "\n=== Testing monthlySummary ===\n";
try {
    $summary = AIService::monthlySummary($uid, $ym);
    echo "Summary result:\n";
    print_r($summary);
} catch (Throwable $e) {
    echo "ERROR in monthlySummary: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Testing generateAndStore ===\n";
try {
    $result = AIService::generateAndStore($uid, $ym);
    echo "generateAndStore result:\n";
    print_r($result);
} catch (Throwable $e) {
    echo "ERROR in generateAndStore: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Testing suggestCategory ===\n";
try {
    $suggestion = AIService::suggestCategory($uid, 'Lunch at Campus Cafe');
    echo "Suggestion result:\n";
    print_r($suggestion);
} catch (Throwable $e) {
    echo "ERROR in suggestCategory: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Testing buildSavingTips ===\n";
try {
    $tips = buildSavingTips($uid);
    echo "Tips count: " . count($tips) . "\n";
    foreach ($tips as $i => $t) {
        echo "  [$i] [{$t['level']}] {$t['title']}\n";
    }
} catch (Throwable $e) {
    echo "ERROR in buildSavingTips: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Testing history query ===\n";
try {
    $history = dbAll('SELECT month, summary FROM insights WHERE user_id = ? AND month <> ? ORDER BY month DESC LIMIT 5', [$uid, $ym]);
    echo "History count: " . count($history) . "\n";
    foreach ($history as $h) {
        echo "  {$h['month']}: " . mb_strimwidth($h['summary'], 0, 80, '...') . "\n";
    }
} catch (Throwable $e) {
    echo "ERROR in history: " . $e->getMessage() . "\n";
}

echo "\n=== Verifying stored insight ===\n";
$stored = dbRow('SELECT summary, tip, generated_at FROM insights WHERE user_id = ? AND month = ?', [$uid, $ym]);
echo "Stored insight: ";
if ($stored) {
    echo "YES\n";
    echo "  Summary: " . mb_strimwidth($stored['summary'], 0, 120, '...') . "\n";
    echo "  Tip: " . mb_strimwidth($stored['tip'], 0, 120, '...') . "\n";
    echo "  Generated: " . $stored['generated_at'] . "\n";
} else {
    echo "NOT FOUND\n";
}
