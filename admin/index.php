<?php
// 这里应该添加登录验证
session_start();
if (!isset($_SESSION['admin'])) {
    header('Location: login.php');
    exit;
}

// 数据库连接
try {
    $pdo = new PDO("mysql:host=localhost;dbname=your_database", "username", "password");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("连接失败: " . $e->getMessage());
}

// 获取设计列表
$stmt = $pdo->query("SELECT * FROM designs ORDER BY created_at DESC");
$designs = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>透卡设计管理后台</title>
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <div class="admin-container">
        <header>
            <h1>透卡设计管理后台</h1>
            <a href="logout.php" class="logout-btn">退出登录</a>
        </header>
        
        <main>
            <div class="design-list">
                <h2>设计列表</h2>
                <table>
                    <thead>
                        <tr>
                            <th>设计编号</th>
                            <th>创建时间</th>
                            <th>预览</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($designs as $design): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($design['design_id']); ?></td>
                            <td><?php echo date('Y-m-d H:i:s', strtotime($design['created_at'])); ?></td>
                            <td>
                                <img src="../designs/<?php echo date('Y/m/', strtotime($design['created_at'])) . $design['design_id'] . '.png'; ?>" 
                                     alt="预览图" class="preview-img">
                            </td>
                            <td>
                                <button onclick="viewDesign('<?php echo $design['design_id']; ?>')">查看详情</button>
                                <button onclick="downloadDesign('<?php echo $design['design_id']; ?>')">下载</button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <script>
        function viewDesign(designId) {
            window.open(`view-design.php?id=${designId}`, '_blank');
        }

        function downloadDesign(designId) {
            window.location.href = `download-design.php?id=${designId}`;
        }
    </script>
</body>
</html> 