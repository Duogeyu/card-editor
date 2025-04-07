-- 创建数据库
CREATE DATABASE IF NOT EXISTS card_designer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE card_designer;

-- 创建设计表
CREATE TABLE IF NOT EXISTS designs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    design_id VARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'completed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员账号 (密码: admin123)
INSERT INTO admins (username, password) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); 