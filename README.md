# 透卡设计器

一个基于Web的透卡设计工具，支持拖拽添加素材、上传图片、编辑和预览功能。

## 系统要求

- Node.js 14.0.0 或更高版本
- npm 6.0.0 或更高版本

## 本地安装步骤

1. 克隆或下载项目到本地
2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动服务器：
   ```bash
   npm start
   ```
   或使用开发模式（自动重启）：
   ```bash
   npm run dev
   ```

4. 访问网站：
   - 前台设计器：http://localhost:3000
   - 后台管理：http://localhost:3000/admin
   - 默认管理员账号：admin
   - 默认管理员密码：admin123

## 部署到外网

### 方法1：使用内网穿透工具（推荐）

1. 使用frp进行内网穿透：
   ```bash
   # 下载frp
   wget https://github.com/fatedier/frp/releases/download/v0.38.0/frp_0.38.0_linux_amd64.tar.gz
   
   # 解压
   tar -zxvf frp_0.38.0_linux_amd64.tar.gz
   
   # 配置frpc.ini
   [common]
   server_addr = your_server_ip
   server_port = 7000
   token = your_token
   
   [web]
   type = http
   local_port = 3000
   custom_domains = your_domain.com
   ```

2. 启动frp客户端：
   ```bash
   ./frpc -c frpc.ini
   ```

### 方法2：使用云服务器

1. 将项目文件上传到云服务器
2. 安装Node.js和npm
3. 安装依赖并启动服务器
4. 配置SSL证书（推荐）
5. 配置防火墙规则

## 安全建议

1. 修改默认管理员密码
2. 配置SSL证书
3. 限制上传文件大小和类型
4. 定期备份数据库和设计文件
5. 设置适当的文件权限

## 目录结构

```
/
├── public/            # 静态文件
│   ├── css/          # 样式文件
│   ├── js/           # JavaScript文件
│   ├── templates/    # 模板文件
│   └── materials/    # 素材文件
├── uploads/          # 上传文件存储
├── server.js         # 服务器入口
└── package.json      # 项目配置
```

## 开发说明

- 前端使用Fabric.js进行画布操作
- 后端使用Express.js框架
- 数据库使用SQLite
- 文件上传使用multer中间件
- 预览功能使用Canvas导出

## 注意事项

1. 确保服务器有足够的存储空间
2. 定期清理临时文件
3. 监控服务器资源使用情况
4. 建议使用CDN加速静态资源 