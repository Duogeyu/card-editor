# 透卡设计器

一个基于Web的透卡设计工具，支持拖拽添加素材、上传图片、编辑和预览功能。通过灵活的画布编辑和透明背景支持，可轻松制作透明卡片效果。

## 功能特点

- **透明背景效果**：支持透明背景模式，以灰白棋盘格形式显示透明区域
- **图层管理**：直观的图层面板，支持拖拽排序、显示/隐藏、锁定等操作
- **裁剪功能**：内置图片裁剪工具，支持自定义裁剪区域
- **预设尺寸**：提供多种预设尺寸模板，也支持自定义画布尺寸
- **实时预览**：右侧预览面板实时显示设计效果，支持缩放预览
- **标尺功能**：提供精确的标尺指引，辅助设计
- **材料库**：内置多种贴纸、背景和形状素材
- **自定义上传**：支持上传自定义图片作为素材

## 系统要求

- Node.js 14.0.0 或更高版本
- npm 6.0.0 或更高版本
- 现代浏览器（Chrome、Firefox、Edge等）

## 本地安装步骤

1. 克隆或下载项目到本地
2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动服务器：
   ```bash
   node server.js
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

## 使用指南

### 基本操作

1. **创建新设计**：
   - 打开设计器后，可从预设尺寸中选择，或输入自定义尺寸
   - 点击"应用"按钮创建新画布

2. **添加素材**：
   - 从左侧素材库中选择贴纸、背景或形状
   - 点击素材将其添加到画布中
   - 或拖拽自己的图片到"我的素材"区域上传

3. **编辑对象**：
   - 选中对象后可拖拽移动、调整大小和旋转
   - 选中对象后右侧属性面板会显示相关编辑选项
   - 对于图片，可使用裁剪工具进行裁剪

4. **图层操作**：
   - 右侧图层面板显示所有对象
   - 拖拽图层项可调整层级顺序
   - 点击图层可选中对应对象

5. **透明背景**：
   - 点击工具栏中的"透明背景"按钮可切换背景模式
   - 透明模式下，背景显示为灰白相间的棋盘格

6. **保存设计**：
   - 点击"保存"按钮可将当前设计保存到服务器
   - 输入设计名称和描述后点击确认

### 工具栏功能

- **文本**：添加文本对象
- **透明背景**：切换透明/白色背景
- **置顶/置底**：调整选中对象的层级
- **标尺**：显示/隐藏标尺辅助线
- **组合/取消组合**：将多个对象组合或拆分
- **复制/删除**：复制或删除选中的对象
- **裁剪**：裁剪选中的图片
- **保存**：保存当前设计

## 技术实现

### 前端技术

- **Fabric.js**：用于画布操作和对象管理的JavaScript库
- **HTML5 Canvas**：实现高性能的图形渲染
- **CSS3**：实现界面样式和动画效果
- **JavaScript ES6+**：实现交互逻辑和功能模块

### 核心原理

1. **透明背景实现**：
   - 使用CSS的`linear-gradient`创建棋盘格背景
   - 通过设置Canvas的`backgroundColor = null`实现透明背景
   - 实时监听画布变化调整棋盘格位置和大小

2. **图层拖拽排序**：
   - 使用HTML5拖放API实现拖拽功能
   - 通过调整Canvas中对象的`canvas._objects`数组顺序改变层级
   - 使用`moveObjectTo`或`sendBackwards`/`bringForward`函数调整对象顺序

3. **裁剪功能**：
   - 创建独立的Fabric.js画布用于裁剪操作
   - 使用矩形对象定义裁剪区域
   - 通过Canvas导出裁剪区域为新图像
   - 替换原图像对象实现裁剪效果

4. **实时预览**：
   - 监听Canvas的`after:render`等事件
   - 将Canvas内容导出为图像数据
   - 更新预览区域的图像源

5. **标尺实现**：
   - 使用Canvas API绘制标尺刻度
   - 监听鼠标移动事件更新标尺指示器位置

## 目录结构

```
/
├── public/            # 静态文件
│   ├── css/          # 样式文件
│   │   └── style.css # 主样式文件
│   ├── js/           # JavaScript文件
│   │   └── editor.js # 编辑器核心代码
│   ├── templates/    # 模板文件
│   └── materials/    # 素材文件
│       ├── stickers/ # 贴纸素材
│       ├── backgrounds/ # 背景素材
│       └── shapes/   # 形状素材
├── uploads/          # 上传文件存储
├── server.js         # 服务器入口
└── package.json      # 项目配置
```

## 开发说明

### 核心模块

1. **Canvas管理**：
   - `initCanvas()`: 初始化Fabric.js画布
   - `updateCanvasSize()`: 调整画布尺寸
   - `updateCanvasTransparency()`: 处理透明背景

2. **对象操作**：
   - `addImage()`: 添加图片
   - `addText()`: 添加文本
   - `addShape()`: 添加形状
   - `deleteSelection()`: 删除选中对象

3. **图层管理**：
   - `updateLayerPanel()`: 更新图层面板
   - `updateCanvasObjectOrder()`: 调整对象顺序

4. **裁剪功能**：
   - `startCropping()`: 启动裁剪模式
   - `applyCrop()`: 应用裁剪
   - `cancelCrop()`: 取消裁剪

5. **预览功能**：
   - `updatePreview()`: 更新预览图像
   - `setupLivePreview()`: 设置实时预览

### API接口

1. **加载素材**：
   - `GET /api/materials/:category`: 获取指定分类的素材

2. **设计保存**：
   - `POST /api/designs`: 保存设计
   - `GET /api/designs`: 获取设计列表
   - `GET /api/designs/:id`: 获取指定设计

3. **素材上传**：
   - `POST /api/materials/upload`: 上传素材

## 常见问题解答

1. **Q: 为什么透明背景不显示？**
   - A: 确保点击了工具栏中的"透明背景"按钮，并检查CSS样式是否正确加载。

2. **Q: 裁剪功能报错怎么办？**
   - A: 确保选中的是图片对象，并检查浏览器控制台报错信息。

3. **Q: 如何调整图层顺序？**
   - A: 在右侧图层面板中拖拽图层项，或选中对象后使用"置顶"/"置底"按钮。

4. **Q: 上传图片大小有限制吗？**
   - A: 默认限制为50MB，可在服务器配置中调整。

## 注意事项

1. 确保服务器有足够的存储空间
2. 定期清理临时文件
3. 监控服务器资源使用情况
4. 建议使用CDN加速静态资源
5. 定期备份设计和素材数据

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