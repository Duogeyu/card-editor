<?php
header('Content-Type: application/json');

// 允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 获取POST数据
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => '无效的数据']);
    exit;
}

// 生成唯一的设计ID
$designId = uniqid('DESIGN_', true);

// 创建保存目录
$saveDir = '../designs/' . date('Y/m/');
if (!file_exists($saveDir)) {
    mkdir($saveDir, 0777, true);
}

// 保存设计数据
$designFile = $saveDir . $designId . '.json';
$previewFile = $saveDir . $designId . '.png';

// 保存JSON数据
file_put_contents($designFile, json_encode($data, JSON_PRETTY_PRINT));

// 如果有预览图数据，保存为PNG
if (isset($data['preview'])) {
    $previewData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $data['preview']));
    file_put_contents($previewFile, $previewData);
}

// 保存到数据库（这里需要根据您的数据库配置进行修改）
try {
    $pdo = new PDO("mysql:host=localhost;dbname=your_database", "username", "password");
    $stmt = $pdo->prepare("INSERT INTO designs (design_id, created_at) VALUES (?, NOW())");
    $stmt->execute([$designId]);
    
    echo json_encode([
        'success' => true,
        'designId' => $designId,
        'message' => '设计保存成功'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => '数据库错误：' . $e->getMessage()
    ]);
} 