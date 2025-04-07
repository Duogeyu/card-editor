const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 应用中间件
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 确保上传目录存在
async function ensureUploadDir() {
    try {
        await fs.promises.access('public/uploads');
    } catch {
        await fs.promises.mkdir('public/uploads', { recursive: true });
    }
}

// 初始化数据文件
async function initDataFiles() {
    try {
        await fs.promises.access('data');
    } catch {
        await fs.promises.mkdir('data', { recursive: true });
    }

    try {
        await fs.promises.access('data/templates.json');
    } catch {
        await fs.promises.writeFile('data/templates.json', JSON.stringify([]));
    }

    try {
        await fs.promises.access('data/designs.json');
    } catch {
        await fs.promises.writeFile('data/designs.json', JSON.stringify([]));
    }
}

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    initServer();
});

// 加载模板数据
function loadTemplates() {
    try {
        const templatesPath = path.join(__dirname, 'data', 'templates.json');
        
        // 检查文件是否存在
        if (!fs.existsSync(templatesPath)) {
            // 如果文件不存在，返回空数组
            console.log('模板数据文件不存在，创建新文件');
            
            // 确保目录存在
            const dataDir = path.join(__dirname, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // 创建空的模板文件
            fs.writeFileSync(templatesPath, JSON.stringify([], null, 2));
            return [];
        }
        
        // 读取文件内容
        const templatesData = fs.readFileSync(templatesPath, 'utf8');
        
        // 解析JSON
        return JSON.parse(templatesData);
    } catch (error) {
        console.error('加载模板数据失败:', error);
        return [];
    }
}

// 加载设计数据
function loadDesigns() {
    try {
        const designsPath = path.join(__dirname, 'data', 'designs.json');
        
        // 检查文件是否存在
        if (!fs.existsSync(designsPath)) {
            // 如果文件不存在，返回空数组
            console.log('设计数据文件不存在，创建新文件');
            
            // 确保目录存在
            const dataDir = path.join(__dirname, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // 创建空的设计文件
            fs.writeFileSync(designsPath, JSON.stringify([], null, 2));
            return [];
        }
        
        // 读取文件内容
        const designsData = fs.readFileSync(designsPath, 'utf8');
        
        // 解析JSON
        return JSON.parse(designsData);
    } catch (error) {
        console.error('加载设计数据失败:', error);
        return [];
    }
}

// 确保必要的目录存在
function ensureDirectories() {
    const dirs = [
        path.join(__dirname, 'data'),
        path.join(__dirname, 'public', 'uploads'),
        path.join(__dirname, 'public', 'designs'),
        path.join(__dirname, 'public', 'templates'),
        path.join(__dirname, 'public', 'materials')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`创建目录: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// 初始化服务器
function initServer() {
    // 确保必要的目录存在
    ensureDirectories();
    
    // 加载数据
    templates = loadTemplates();
    designs = loadDesigns();
    
    // 确保材料目录结构存在
    ensureMaterialsStructure();
    
    console.log(`加载了 ${templates.length} 个模板`);
    console.log(`加载了 ${designs.length} 个设计`);
}

// 确保材料目录结构
function ensureMaterialsStructure() {
    // 创建材料分类目录
    const materialsBaseDir = path.join(__dirname, 'public', 'materials');
    const categories = ['stickers', 'backgrounds', 'shapes', 'templates'];
    
    categories.forEach(category => {
        const categoryPath = path.join(materialsBaseDir, category);
        if (!fs.existsSync(categoryPath)) {
            console.log(`创建材料分类目录: ${categoryPath}`);
            fs.mkdirSync(categoryPath, { recursive: true });
        }
    });
    
    // 创建或更新材料索引文件
    const materialsIndexPath = path.join(materialsBaseDir, 'index.json');
    let materialsIndex = {
        categories: []
    };
    
    if (fs.existsSync(materialsIndexPath)) {
        try {
            const indexData = fs.readFileSync(materialsIndexPath, 'utf8');
            materialsIndex = JSON.parse(indexData);
        } catch (error) {
            console.error('读取材料索引失败，将创建新索引', error);
        }
    }
    
    // 确保所有分类都在索引中
    let indexUpdated = false;
    categories.forEach(category => {
        if (!materialsIndex.categories.find(c => c.id === category)) {
            materialsIndex.categories.push({
                id: category,
                name: getCategoryDisplayName(category),
                items: []
            });
            indexUpdated = true;
        }
    });
    
    // 保存更新后的索引
    if (indexUpdated) {
        fs.writeFileSync(materialsIndexPath, JSON.stringify(materialsIndex, null, 2));
        console.log('材料索引已更新');
    }
}

// 获取分类显示名称
function getCategoryDisplayName(categoryId) {
    const displayNames = {
        'stickers': '贴纸',
        'backgrounds': '背景',
        'shapes': '形状',
        'templates': '模板'
    };
    
    return displayNames[categoryId] || categoryId;
}

// 辅助函数：加载材料索引
function loadMaterialsIndex() {
    try {
        const indexPath = path.join(__dirname, 'public', 'materials', 'index.json');
        
        // 如果索引文件不存在，则创建一个空的索引
        if (!fs.existsSync(indexPath)) {
            console.log('材料索引文件不存在，创建新文件');
            
            // 确保目录存在
            const materialsDir = path.join(__dirname, 'public', 'materials');
            if (!fs.existsSync(materialsDir)) {
                fs.mkdirSync(materialsDir, { recursive: true });
            }
            
            // 创建默认索引
            const defaultIndex = {
                categories: [
                    { id: 'stickers', name: '贴纸', items: [] },
                    { id: 'backgrounds', name: '背景', items: [] },
                    { id: 'shapes', name: '形状', items: [] },
                    { id: 'templates', name: '模板', items: [] }
                ]
            };
            
            fs.writeFileSync(indexPath, JSON.stringify(defaultIndex, null, 2));
            return defaultIndex;
        }
        
        // 读取并解析JSON
        const indexData = fs.readFileSync(indexPath, 'utf8');
        return JSON.parse(indexData);
    } catch (error) {
        console.error('加载材料索引失败:', error);
        
        // 返回空索引结构
        return {
            categories: [
                { id: 'stickers', name: '贴纸', items: [] },
                { id: 'backgrounds', name: '背景', items: [] },
                { id: 'shapes', name: '形状', items: [] },
                { id: 'templates', name: '模板', items: [] }
            ]
        };
    }
}

// 辅助函数：保存材料索引
function saveMaterialsIndex(materialsIndex) {
    try {
        const indexPath = path.join(__dirname, 'public', 'materials', 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify(materialsIndex, null, 2));
    } catch (error) {
        console.error('保存材料索引失败:', error);
        throw error;
    }
}

// API: 获取所有材料分类
app.get('/api/materials/categories', (req, res) => {
    try {
        const materialsIndex = loadMaterialsIndex();
        res.json({
            success: true,
            categories: materialsIndex.categories.map(c => ({
                id: c.id,
                name: c.name
            }))
        });
    } catch (error) {
        console.error('获取材料分类失败:', error);
        res.status(500).json({
            success: false,
            error: '获取材料分类失败'
        });
    }
});

// API: 获取特定分类的材料列表
app.get('/api/materials/categories/:categoryId', (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const materialsIndex = loadMaterialsIndex();
        
        const category = materialsIndex.categories.find(c => c.id === categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: '分类不存在'
            });
        }
        
        res.json({
            success: true,
            category: {
                id: category.id,
                name: category.name,
                items: category.items || []
            }
        });
    } catch (error) {
        console.error('获取材料列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取材料列表失败'
        });
    }
});

// API: 上传材料
app.post('/api/materials/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '未提供文件'
            });
        }
        
        const { category, name, description } = req.body;
        
        if (!category || !name) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        // 检查分类是否有效
        const materialsIndex = loadMaterialsIndex();
        const categoryObj = materialsIndex.categories.find(c => c.id === category);
        
        if (!categoryObj) {
            return res.status(400).json({
                success: false,
                error: '无效的分类'
            });
        }
        
        // 生成唯一ID
        const materialId = Date.now().toString();
        
        // 将上传的文件移动到对应分类目录
        const originalPath = req.file.path;
        const targetDir = path.join(__dirname, 'public', 'materials', category);
        const fileExtension = path.extname(req.file.originalname);
        const filename = `${materialId}${fileExtension}`;
        const targetPath = path.join(targetDir, filename);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 移动文件
        fs.renameSync(originalPath, targetPath);
        
        // 更新索引
        const materialItem = {
            id: materialId,
            name: name,
            description: description || '',
            url: `/materials/${category}/${filename}`,
            createdAt: new Date().toISOString()
        };
        
        if (!categoryObj.items) {
            categoryObj.items = [];
        }
        
        categoryObj.items.push(materialItem);
        saveMaterialsIndex(materialsIndex);
        
        res.json({
            success: true,
            material: materialItem
        });
    } catch (error) {
        console.error('上传材料失败:', error);
        res.status(500).json({
            success: false,
            error: '上传材料失败'
        });
    }
});

// API: 删除材料
app.delete('/api/materials/:categoryId/:materialId', (req, res) => {
    try {
        const { categoryId, materialId } = req.params;
        
        // 加载索引
        const materialsIndex = loadMaterialsIndex();
        const category = materialsIndex.categories.find(c => c.id === categoryId);
        
        if (!category || !category.items) {
            return res.status(404).json({
                success: false,
                error: '分类不存在'
            });
        }
        
        // 查找材料
        const materialIndex = category.items.findIndex(item => item.id === materialId);
        if (materialIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '材料不存在'
            });
        }
        
        const material = category.items[materialIndex];
        
        // 删除文件
        const materialFilePath = path.join(__dirname, 'public', material.url);
        if (fs.existsSync(materialFilePath)) {
            fs.unlinkSync(materialFilePath);
            console.log(`删除材料文件: ${materialFilePath}`);
        }
        
        // 从索引中删除
        category.items.splice(materialIndex, 1);
        saveMaterialsIndex(materialsIndex);
        
        res.json({
            success: true,
            message: '材料删除成功'
        });
    } catch (error) {
        console.error('删除材料失败:', error);
        res.status(500).json({
            success: false,
            error: '删除材料失败'
        });
    }
});

// 辅助函数：保存模板列表
async function saveTemplates(templates) {
    try {
        await fs.promises.writeFile('data/templates.json', JSON.stringify(templates, null, 2));
    } catch (error) {
        console.error('保存模板文件失败:', error);
        throw error;
    }
}

// 辅助函数：保存设计列表
async function saveDesigns(designs) {
    try {
        await fs.promises.writeFile('data/designs.json', JSON.stringify(designs, null, 2));
    } catch (error) {
        console.error('保存设计文件失败:', error);
        throw error;
    }
}

// API路由
// 获取所有模板
app.get('/api/templates', (req, res) => {
    res.json({
        success: true,
        templates
    });
});

// 获取单个模板
app.get('/api/templates/:id', (req, res) => {
    const templateId = req.params.id;
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
        return res.status(404).json({
            success: false,
            error: '模板不存在'
        });
    }
    
    res.json({
        success: true,
        template
    });
});

// 添加新模板
app.post('/api/templates', (req, res) => {
    try {
        const { name, width, height, isBackgroundTemplate, objects, previewUrl } = req.body;
        
        // 验证必要字段
        if (!name) {
            return res.status(400).json({
                success: false,
                error: '缺少模板名称'
            });
        }
        
        // 创建模板ID
        const templateId = Date.now().toString();
        
        // 处理预览图（如果有）
        let templatePreviewUrl = null;
        if (previewUrl) {
            // 从base64数据中提取图像
            const base64Data = previewUrl.replace(/^data:image\/png;base64,/, '');
            
            // 确保模板目录存在
            const templatesDir = path.join(__dirname, 'public', 'templates');
            if (!fs.existsSync(templatesDir)) {
                fs.mkdirSync(templatesDir, { recursive: true });
            }
            
            // 保存预览图
            const previewPath = path.join('templates', `${templateId}.png`);
            const fullPreviewPath = path.join(__dirname, 'public', previewPath);
            
            // 写入文件
            fs.writeFileSync(fullPreviewPath, base64Data, 'base64');
            
            // 设置预览URL
            templatePreviewUrl = `/${previewPath}`;
        }
        
        // 创建新模板
        const newTemplate = {
            id: templateId,
            name,
            width: width || 600,
            height: height || 600,
            isBackground: !!isBackgroundTemplate,
            createdAt: new Date().toISOString(),
            previewUrl: templatePreviewUrl,
            objects: objects || []
        };
        
        // 加载现有模板
        const templates = loadTemplates();
        
        // 添加到模板列表
        templates.push(newTemplate);
        
        // 保存模板数据
        saveTemplates(templates);
        
        return res.json({
            success: true,
            template: newTemplate
        });
    } catch (error) {
        console.error('创建模板失败:', error);
        return res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
});

// 更新模板
app.put('/api/templates/:id', (req, res) => {
    try {
        const templateId = req.params.id;
        const { name, width, height, isBackgroundTemplate, objects, previewUrl } = req.body;
        
        // 加载现有模板
        const templates = loadTemplates();
        
        // 找到模板索引
        const templateIndex = templates.findIndex(t => t.id === templateId);
        
        if (templateIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '模板不存在'
            });
        }
        
        // 获取当前模板
        const template = templates[templateIndex];
        
        // 处理新的预览图（如果有）
        if (previewUrl && previewUrl.startsWith('data:image/')) {
            // 先删除旧的预览图（如果存在）
            if (template.previewUrl) {
                const oldPreviewPath = path.join(__dirname, 'public', template.previewUrl);
                try {
                    if (fs.existsSync(oldPreviewPath)) {
                        fs.unlinkSync(oldPreviewPath);
                    }
                } catch (error) {
                    console.error('删除旧预览图失败:', error);
                }
            }
            
            // 从base64数据中提取图像
            const base64Data = previewUrl.replace(/^data:image\/\w+;base64,/, '');
            
            // 确保模板目录存在
            const templatesDir = path.join(__dirname, 'public', 'templates');
            if (!fs.existsSync(templatesDir)) {
                fs.mkdirSync(templatesDir, { recursive: true });
            }
            
            // 保存新预览图
            const previewPath = path.join('templates', `${templateId}.png`);
            const fullPreviewPath = path.join(__dirname, 'public', previewPath);
            
            // 写入文件
            fs.writeFileSync(fullPreviewPath, base64Data, 'base64');
            
            // 更新预览URL
            template.previewUrl = `/${previewPath}`;
        }
        
        // 更新模板属性
        if (name) {
            template.name = name;
        }
        
        if (width && height) {
            template.width = width;
            template.height = height;
        }
        
        if (typeof isBackgroundTemplate !== 'undefined') {
            template.isBackground = !!isBackgroundTemplate;
        }
        
        if (objects && Array.isArray(objects)) {
            template.objects = objects;
        }
        
        // 保存模板数据
        saveTemplates(templates);
        
        return res.json({
            success: true,
            template: template
        });
    } catch (error) {
        console.error('更新模板失败:', error);
        return res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
});

// 删除模板
app.delete('/api/templates/:id', (req, res) => {
    try {
        const templateId = req.params.id;
        
        // 找到模板索引
        const templateIndex = templates.findIndex(t => t.id === templateId);
        
        if (templateIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '模板不存在'
            });
        }
        
        // 删除模板
        templates.splice(templateIndex, 1);
        
        // 保存模板数据
        const templatesPath = path.join(__dirname, 'data', 'templates.json');
        fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
        
        return res.json({
            success: true,
            message: '模板已删除'
        });
    } catch (error) {
        console.error('删除模板失败:', error);
        return res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
});

// 获取设计列表
app.get('/api/designs', async (req, res) => {
    try {
        const designs = await loadDesigns();
        res.json({ success: true, designs });
    } catch (error) {
        console.error('获取设计列表失败:', error);
        res.status(500).json({ error: '获取设计列表失败' });
    }
});

// 保存设计
app.post('/api/designs', async (req, res) => {
    try {
        const { name, width, height, previewUrl, isTransparentBg, templateId, objects } = req.body;
        
        if (!name || !previewUrl) {
            return res.status(400).json({ success: false, error: '缺少必要参数' });
        }
        
        // 为新设计创建ID
        const designId = Date.now().toString();
        
        // 创建设计专属文件夹
        const designFolderPath = path.join(__dirname, 'public', 'designs', designId);
        if (!fs.existsSync(designFolderPath)) {
            fs.mkdirSync(designFolderPath, { recursive: true });
        }
        
        // 创建设计专属资源文件夹
        const designAssetsPath = path.join(designFolderPath, 'assets');
        if (!fs.existsSync(designAssetsPath)) {
            fs.mkdirSync(designAssetsPath, { recursive: true });
        }
        
        // 获取base64图片数据
        const previewBase64Data = previewUrl.replace(/^data:image\/png;base64,/, '');
        
        // 保存预览图片
        const previewFilename = 'preview.png';
        const previewRelativePath = path.join('designs', designId, previewFilename);
        const previewFullPath = path.join(__dirname, 'public', previewRelativePath);
        
        fs.writeFileSync(previewFullPath, previewBase64Data, 'base64');
        
        // 保存完整图片（与预览图相同，但保持原始尺寸）
        const fullImageFilename = 'full.png';
        const fullImageRelativePath = path.join('designs', designId, fullImageFilename);
        const fullImageFullPath = path.join(__dirname, 'public', fullImageRelativePath);
        
        fs.writeFileSync(fullImageFullPath, previewBase64Data, 'base64');
        
        // 处理对象中的图片，将uploads目录下的图片复制到设计专属文件夹
        const processedObjects = Array.isArray(objects) ? [...objects] : (objects ? [objects] : []);
        
        for (let i = 0; i < processedObjects.length; i++) {
            const obj = processedObjects[i];
            
            // 检查是否存在src属性，且是否指向uploads目录
            if (obj.src && obj.src.includes('/uploads/')) {
                try {
                    // 提取文件名
                    const fileName = path.basename(obj.src);
                    
                    // 源文件路径
                    const srcFilePath = path.join(__dirname, 'public', obj.src.replace(/^http:\/\/localhost:\d+/, ''));
                    
                    // 目标文件路径（设计专属文件夹）
                    const targetFileName = `asset_${i}_${fileName}`;
                    const targetRelativePath = path.join('designs', designId, 'assets', targetFileName);
                    const targetFullPath = path.join(__dirname, 'public', targetRelativePath);
                    
                    // 复制文件
                    if (fs.existsSync(srcFilePath)) {
                        fs.copyFileSync(srcFilePath, targetFullPath);
                        console.log(`已将素材从 ${srcFilePath} 复制到 ${targetFullPath}`);
                        
                        // 更新对象中的src路径
                        processedObjects[i].src = `/${targetRelativePath.replace(/\\/g, '/')}`;
                    } else {
                        console.warn(`素材文件不存在: ${srcFilePath}`);
                    }
                } catch (copyError) {
                    console.error('复制素材文件失败:', copyError);
                }
            }
        }
        
        // 保存设计数据JSON文件
        const designDataFilename = 'design.json';
        const designDataPath = path.join(designFolderPath, designDataFilename);
        
        // 创建设计对象
        const newDesign = {
            id: designId,
            name,
            width,
            height,
            createdAt: new Date().toISOString(),
            folderPath: `/designs/${designId}/`,
            previewUrl: `/${previewRelativePath.replace(/\\/g, '/')}`,
            fullImageUrl: `/${fullImageRelativePath.replace(/\\/g, '/')}`,
            isTransparentBg: !!isTransparentBg,
            templateId: templateId || null,
            objects: processedObjects
        };
        
        // 将完整设计数据保存到设计文件夹中的JSON文件
        fs.writeFileSync(designDataPath, JSON.stringify(newDesign, null, 2));
        
        // 添加到设计列表
        const designs = await loadDesigns();
        designs.push(newDesign);
        
        // 保存设计索引数据到文件
        await saveDesigns(designs);
        
        return res.json({
            success: true,
            design: newDesign
        });
    } catch (error) {
        console.error('保存设计失败:', error);
        return res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
});

// 获取单个设计
app.get('/api/designs/:id', async (req, res) => {
    try {
        const designId = req.params.id;
        
        // 首先尝试从设计专属文件夹加载设计数据
        const designDataPath = path.join(__dirname, 'public', 'designs', designId, 'design.json');
        let design = null;
        
        if (fs.existsSync(designDataPath)) {
            // 如果设计JSON文件存在，直接从文件读取
            try {
                const designDataStr = fs.readFileSync(designDataPath, 'utf8');
                design = JSON.parse(designDataStr);
                console.log(`从设计文件夹加载设计数据: ${designId}`);
            } catch (error) {
                console.error('读取设计JSON文件失败:', error);
            }
        }
        
        // 如果从专属文件夹未能加载到设计，则尝试从设计索引中查找
        if (!design) {
            const designs = await loadDesigns();
            design = designs.find(d => d.id === designId);
            
            if (!design) {
                return res.status(404).json({ 
                    success: false,
                    error: '设计不存在' 
                });
            }
            
            console.log(`从设计索引加载设计数据: ${designId}`);
        }
        
        // 确保objects是数组
        if (!design.objects) {
            design.objects = [];
        } else if (!Array.isArray(design.objects)) {
            try {
                if (typeof design.objects === 'string') {
                    design.objects = JSON.parse(design.objects);
                    if (!Array.isArray(design.objects)) {
                        design.objects = [design.objects];
                    }
                } else {
                    design.objects = [design.objects];
                }
            } catch (e) {
                console.error('解析设计对象失败:', e);
                design.objects = [];
            }
        }
        
        // 如果设计使用了模板，添加模板信息（为兼容现有功能）
        if (design.templateId) {
            const templates = await loadTemplates();
            const template = templates.find(t => t.id === design.templateId);
            if (template) {
                design.template = template;
            }
        }
        
        res.json({
            success: true,
            design
        });
    } catch (error) {
        console.error('获取设计失败:', error);
        res.status(500).json({ 
            success: false,
            error: '获取设计失败' 
        });
    }
});

// 删除设计
app.delete('/api/designs/:id', async (req, res) => {
    try {
        const designs = await loadDesigns();
        const index = designs.findIndex(d => d.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: '设计不存在' });
        }
        
        // 获取设计
        const design = designs[index];
        
        // 删除设计文件夹及其内容
        const designFolderPath = path.join(__dirname, 'public', 'designs', design.id);
        
        if (fs.existsSync(designFolderPath)) {
            try {
                // 使用递归删除整个文件夹
                fs.rmdirSync(designFolderPath, { recursive: true });
                console.log('设计文件夹删除成功:', designFolderPath);
            } catch (error) {
                console.error('删除设计文件夹失败:', error);
            }
        }
        
        // 从列表中移除
        designs.splice(index, 1);
        await saveDesigns(designs);
        
        res.json({ 
            success: true,
            message: '设计删除成功' 
        });
    } catch (error) {
        console.error('删除设计失败:', error);
        res.status(500).json({ 
            success: false,
            error: '删除设计失败' 
        });
    }
});

// 文件上传API
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        res.json({
            success: true,
            url: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ error: '文件上传失败' });
    }
}); 