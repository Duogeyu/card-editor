<?php
// 检查PHP版本
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    die('需要PHP 7.4.0或更高版本');
}

// 检查必要的PHP扩展
$required_extensions = ['pdo', 'pdo_mysql', 'gd', 'json'];
foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        die("需要PHP {$ext} 扩展");
    }
}

// 检查目录权限
$directories = [
    '../designs',
    '../templates',
    '../materials',
    '../config'
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        if (!mkdir($dir, 0777, true)) {
            die("无法创建目录: {$dir}");
        }
    }
    if (!is_writable($dir)) {
        die("目录不可写: {$dir}");
    }
}

// 导入数据库
$sql = file_get_contents(__DIR__ . '/init_db.sql');
try {
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->exec($sql);
    echo "数据库初始化成功！\n";
} catch (PDOException $e) {
    die("数据库初始化失败: " . $e->getMessage());
}

// 创建默认模板和素材目录
$default_templates = [
    'template1.jpg' => 'https://example.com/template1.jpg',
    'template2.jpg' => 'https://example.com/template2.jpg'
];

$default_materials = [
    'material1.png' => 'https://example.com/material1.png',
    'material2.png' => 'https://example.com/material2.png'
];

// 下载默认模板
foreach ($default_templates as $filename => $url) {
    $filepath = '../templates/' . $filename;
    if (!file_exists($filepath)) {
        $content = file_get_contents($url);
        if ($content) {
            file_put_contents($filepath, $content);
            echo "下载模板: {$filename}\n";
        }
    }
}

// 下载默认素材
foreach ($default_materials as $filename => $url) {
    $filepath = '../materials/' . $filename;
    if (!file_exists($filepath)) {
        $content = file_get_contents($url);
        if ($content) {
            file_put_contents($filepath, $content);
            echo "下载素材: {$filename}\n";
        }
    }
}

echo "\n安装完成！\n";
echo "默认管理员账号: admin\n";
echo "默认管理员密码: admin123\n";
echo "\n请及时修改默认密码！\n"; 