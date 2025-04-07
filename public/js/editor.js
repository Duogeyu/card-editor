// 初始化Fabric.js画布
let canvas; // 将canvas变量声明为let而不是const，以便在initCanvas中重新赋值

// 全局变量
let isTransparentBg = false;
let isCroppingMode = false;
let cropRect = null;
let cropFabric = null; // 裁剪模式的canvas实例
let cropSourceObject = null; // 要裁剪的原始图像对象
let cropSourceImage = null; // 裁剪canvas中的图像
let currentLayerId = 1;
let backgroundImage = null; // 存储背景图像
let currentTemplate = null;
let uploadedImages = [];
let isRulerVisible = false; // 添加标尺可见性变量
let previewZoom = 1; // 添加预览缩放变量
let isWindowVisible = true; // 添加窗口可见性标志

// 全局变量 - 添加材料相关变量
let materials = {
    stickers: [],
    backgrounds: [],
    shapes: [],
    templates: []
};

// 预设图像占位符
const placeholderImage = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="%23999" text-anchor="middle" dominant-baseline="middle">预览图</text></svg>';

// 预设数据
const presetTemplates = [
    {
        id: 1,
        name: '默认模板',
        url: placeholderImage,
        canvasSize: { width: 800, height: 600 },
        isBackground: false
    }
];

const presetDesigns = [];

// 初始化 - 从服务器加载模板和素材
async function initFromServer() {
    try {
        const [templatesResponse, designsResponse] = await Promise.all([
            fetch('/api/templates'),
            fetch('/api/designs')
        ]);

        if (!templatesResponse.ok || !designsResponse.ok) {
            throw new Error('加载失败');
        }

        const templatesData = await templatesResponse.json();
        const designsData = await designsResponse.json();

        if (!templatesData.success || !designsData.success) {
            throw new Error('加载失败');
        }

        initTemplates(templatesData.templates);
        initDesigns(designsData.designs);
    } catch (error) {
        console.error('加载失败:', error);
        alert('加载失败: ' + error.message);
        // 使用预设数据
        initTemplates(presetTemplates);
        initDesigns(presetDesigns);
    }
}

// 初始化模板列表
function initTemplates(templates) {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;
    
    templateList.innerHTML = '';
    
    templates.forEach(template => {
        const div = document.createElement('div');
        div.className = 'template-item';
        div.innerHTML = `
            <img src="${template.previewUrl || placeholderImage}" alt="${template.name}">
            <div class="template-info">
                <span>${template.name}</span>
                <span class="template-size">${template.width || template.canvasSize?.width || 800}x${template.height || template.canvasSize?.height || 600}</span>
            </div>
        `;
        
        div.onclick = () => loadTemplate(template);
        templateList.appendChild(div);
    });
}

// 初始化设计列表
function initDesigns(designs) {
    const designList = document.getElementById('designList');
    if (!designList) return;
    
    designList.innerHTML = '';
    
    designs.forEach(design => {
        const div = document.createElement('div');
        div.className = 'template-item';
        div.innerHTML = `
            <img src="${design.previewUrl || placeholderImage}" alt="${design.name}">
            <div class="template-info">
                <span>${design.name}</span>
                <span class="template-size">${design.width || design.canvasSize?.width || 800}x${design.height || design.canvasSize?.height || 600}</span>
            </div>
        `;
        
        div.onclick = () => loadDesign(design);
        designList.appendChild(div);
    });
}

// 从服务器加载模板
async function loadTemplate(templateId) {
    try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
            throw new Error('加载模板失败');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '加载模板失败');
        }
        
        currentTemplate = result.template;
        console.log('成功加载模板:', currentTemplate);
        
        // 更新页面标题
        document.title = `编辑模板: ${currentTemplate.name}`;
        
        return currentTemplate;
    } catch (error) {
        console.error('加载模板失败:', error);
        alert('加载模板失败: ' + error.message);
        throw error;
    }
}

// 加载模板设计数据
function loadTemplateDesign(templateData) {
    // 加载所有对象
    templateData.objects.forEach(objData => {
        fabric.util.enlivenObjects([objData], (objects) => {
            objects.forEach(obj => {
                // 确保对象可编辑
                obj.selectable = true;
                obj.evented = true;
                obj.hasControls = true;
                obj.hasBorders = true;
                obj.hasRotatingPoint = true;
                canvas.add(obj);
            });
            canvas.renderAll();
        });
    });
}

// 更新工具栏状态
function updateToolbarState() {
    const transparentBtn = document.getElementById('transparentBg');
    if (transparentBtn) {
        transparentBtn.classList.toggle('active', isTransparentBg);
    }
}

// 切换透明背景
function toggleTransparentBg() {
    isTransparentBg = !isTransparentBg;
    updateCanvasTransparency();
}

// 更新画布透明度
function updateCanvasTransparency() {
    const containerEl = document.getElementById('canvas-container');
    if (!containerEl) return;
    
    // 更新按钮状态
    const transparentBtn = document.getElementById('transparentBg');
    if (transparentBtn) {
        transparentBtn.classList.toggle('active', isTransparentBg);
    }
    
    console.log('更新透明背景状态:', isTransparentBg);
    
    // 处理透明背景
    if (isTransparentBg) {
        // 设置背景为透明
        canvas.backgroundColor = null;
        canvas.renderAll();
        
        // 检查是否已存在棋盘格背景元素
        let gridPattern = document.getElementById('transparent-grid-pattern');
        
        if (!gridPattern) {
            // 创建棋盘格背景并添加到DOM
            gridPattern = document.createElement('div');
            gridPattern.id = 'transparent-grid-pattern';
            gridPattern.className = 'transparent-grid-pattern';
            
            // 添加到容器中，放在canvas前面
            containerEl.insertBefore(gridPattern, containerEl.firstChild);
            console.log('创建了新的透明背景棋盘格元素');
        } else {
            // 显示已存在的棋盘格
            gridPattern.style.display = 'block';
            console.log('显示已存在的透明背景棋盘格元素');
        }
        
        // 立即更新棋盘格尺寸和位置
        setTimeout(updateGridPatternSize, 0);
        
        // 添加事件监听器
        window.addEventListener('resize', updateGridPatternSize);
        canvas.on('after:render', function() {
            setTimeout(updateGridPatternSize, 0);
        });
    } else {
        // 设置回白色背景
        canvas.backgroundColor = 'white';
        canvas.renderAll();
        
        // 隐藏棋盘格
        const gridPattern = document.getElementById('transparent-grid-pattern');
        if (gridPattern) {
            gridPattern.style.display = 'none';
        }
        
        // 移除事件监听器
        window.removeEventListener('resize', updateGridPatternSize);
        canvas.off('after:render');
    }
}

// 更新棋盘格大小和位置
function updateGridPatternSize() {
    const gridPattern = document.getElementById('transparent-grid-pattern');
    if (!gridPattern || gridPattern.style.display === 'none') return;
    
    const containerEl = document.getElementById('canvas-container');
    if (!containerEl) return;
    
    const canvasEl = canvas.getElement();
    if (!canvasEl) return;
    
    try {
        // 获取canvas元素和容器的位置和尺寸
        const canvasRect = canvasEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
        
        // 确保棋盘格覆盖整个canvas区域
        gridPattern.style.position = 'absolute';
        gridPattern.style.width = `${canvasRect.width}px`;
        gridPattern.style.height = `${canvasRect.height}px`;
        gridPattern.style.left = `${canvasRect.left - containerRect.left}px`;
        gridPattern.style.top = `${canvasRect.top - containerRect.top}px`;
        gridPattern.style.zIndex = '-1';
        
        console.log('更新棋盘格尺寸和位置:', {
            width: canvasRect.width,
            height: canvasRect.height,
            left: canvasRect.left - containerRect.left,
            top: canvasRect.top - containerRect.top
        });
    } catch (error) {
        console.error('更新棋盘格尺寸出错:', error);
    }
}

// 更新棋盘格位置
function updateCheckerboardPosition(forceUpdate = false) {
    // 这个函数已被updateGridPatternSize取代，保留此函数避免引用错误
    return updateGridPatternSize();
}

// 初始化素材列表
function initMaterials(materials) {
    const materialList = document.getElementById('materialList');
    materialList.innerHTML = '';
    materials.forEach(material => {
        const materialElement = document.createElement('div');
        materialElement.className = 'material-item';
        materialElement.innerHTML = `
            <img src="${material.url}" alt="${material.name}">
            <span>${material.name}</span>
        `;
        materialElement.draggable = true;
        materialElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('material', JSON.stringify(material));
        });
        materialElement.addEventListener('click', () => {
            addMaterial(material);
        });
        materialList.appendChild(materialElement);
    });
}

// 添加素材到画布
function addMaterial(material) {
    fabric.Image.fromURL(material.url, (img) => {
        img.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
            name: material.name,
            id: generateLayerId()
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        updateLayerPanel();
    });
}

// 处理拖放
function setupDragDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    // 显示上传区域高亮效果
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });
    
    // 移除高亮效果
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });
    
    // 处理图片拖放上传
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        
        // 检查是否有文件
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        // 处理拖放的文件
        for (const file of files) {
            if (!file.type.match('image.*')) continue;
            
            try {
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('上传失败');
                }
                
                const result = await response.json();
                if (result.success) {
                    // 添加图片到画布
                    addImage(result.url);
                    
                    // 添加到已上传图片列表
                    const imageObj = {
                        name: file.name,
                        url: result.url
                    };
                    
                    uploadedImages.push(imageObj);
                    updateUploadedImagesList();
                } else {
                    throw new Error(result.error || '上传失败');
                }
            } catch (error) {
                console.error('处理图片失败:', error);
                alert('处理图片失败: ' + error.message);
            }
        }
    });
    
    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => {
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.click();
        }
    });
}

// 更新已上传图片列表
function updateUploadedImagesList() {
    const uploadedList = document.getElementById('uploadedList');
    if (!uploadedList) return;
    
    uploadedList.innerHTML = '';
    
    if (uploadedImages.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'no-images';
        emptyMessage.textContent = '暂无上传图片';
        uploadedList.appendChild(emptyMessage);
        return;
    }
    
    // 添加上传的图片
    uploadedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'material-item';
        div.innerHTML = `<img src="${img.url}" alt="${img.name}">`;
        
        div.addEventListener('click', () => {
            addImage(img.url);
        });
        
        uploadedList.appendChild(div);
    });
}

// 设置图片上传
function setupImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    if (!imageUpload) return;
    
    imageUpload.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0]; // 目前只处理一个文件
        if (!file.type.match('image.*')) {
            alert('请选择图片文件');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            // 显示上传中状态
            const uploadedList = document.getElementById('uploadedList');
            if (uploadedList) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'loading';
                loadingDiv.id = 'uploadLoading';
                uploadedList.appendChild(loadingDiv);
            }
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            // 移除上传中状态
            document.getElementById('uploadLoading')?.remove();
            
            if (!response.ok) {
                throw new Error('上传失败');
            }
            
            const result = await response.json();
            if (result.success) {
                // 添加图片到画布
                addImage(result.url);
                
                // 添加到已上传图片列表
                const imageObj = {
                    name: file.name,
                    url: result.url
                };
                
                uploadedImages.push(imageObj);
                updateUploadedImagesList();
                
                // 清空文件输入，以便再次选择同一文件
                imageUpload.value = '';
            } else {
                throw new Error(result.error || '上传失败');
            }
        } catch (error) {
            console.error('上传图片失败:', error);
            alert('上传图片失败: ' + error.message);
        }
    });
}

// 添加文本
function addText() {
    const text = new fabric.Textbox('双击编辑文本', {
        left: canvas.width / 2,
        top: canvas.height / 2,
        width: 200,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#333333',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        editable: true,
        name: '文本',
        id: generateLayerId()
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    updateLayerPanel();
}

// 添加矩形
function addRect() {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 80,
        fill: '#3498db',
        opacity: 0.8,
        name: '矩形',
        id: generateLayerId()
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    updateLayerPanel();
}

// 添加圆形
function addCircle() {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: '#e74c3c',
        opacity: 0.8,
        name: '圆形',
        id: generateLayerId()
    });
    
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    updateLayerPanel();
}

// 添加三角形
function addTriangle() {
    const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: '#2ecc71',
        opacity: 0.8,
        name: '三角形',
        id: generateLayerId()
    });
    
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
    updateLayerPanel();
}

// 删除选中对象
function deleteSelection() {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    // 如果是多选
    if (activeObject.type === 'activeSelection') {
        // 确认删除
        if (activeObject._objects && activeObject._objects.length > 1 && 
            !confirm(`确定要删除这 ${activeObject._objects.length} 个对象吗？`)) {
            return;
        }
        
        // 删除所有选中对象
        const objects = activeObject._objects ? [...activeObject._objects] : [];
        canvas.discardActiveObject(); // 先清除选中状态
        
        // 遍历删除所有选中对象
        objects.forEach(obj => {
            canvas.remove(obj);
        });
    } else {
        // 单个对象删除
        canvas.remove(activeObject);
    }
    
    canvas.requestRenderAll();
    updateLayerPanel();
}

// 图层上移
function bringForward() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.bringForward(activeObject);
        canvas.renderAll();
        updateLayerPanel();
    }
}

// 图层下移
function sendBackward() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.sendBackwards(activeObject);
        canvas.renderAll();
        updateLayerPanel();
    }
}

// 工具栏功能
function setupToolbar() {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) {
        console.error('找不到工具栏元素');
        return;
    }
    
    // 添加文本按钮
    const addTextBtn = toolbar.querySelector('[data-action="add-text"]');
    if (addTextBtn) {
        addTextBtn.addEventListener('click', addText);
    }
    
    // 删除按钮
    const deleteBtn = toolbar.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteSelection);
    }
    
    // 置顶按钮
    const bringToFrontBtn = toolbar.querySelector('[data-action="bring-to-front"]');
    if (bringToFrontBtn) {
        bringToFrontBtn.addEventListener('click', bringToFront);
    }
    
    // 置底按钮
    const sendToBackBtn = toolbar.querySelector('[data-action="send-to-back"]');
    if (sendToBackBtn) {
        sendToBackBtn.addEventListener('click', sendToBack);
    }
    
    // 透明背景按钮
    const transparentBgBtn = toolbar.querySelector('[data-action="transparent-bg"]');
    if (transparentBgBtn) {
        transparentBgBtn.addEventListener('click', toggleTransparentBg);
    }
    
    // 组合按钮
    const groupBtn = toolbar.querySelector('[data-action="group"]');
    if (groupBtn) {
        groupBtn.addEventListener('click', groupSelected);
    }
    
    // 取消组合按钮
    const ungroupBtn = toolbar.querySelector('[data-action="ungroup"]');
    if (ungroupBtn) {
        ungroupBtn.addEventListener('click', ungroupSelected);
    }
    
    // 复制按钮
    const duplicateBtn = toolbar.querySelector('[data-action="duplicate"]');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', duplicateSelected);
    }
    
    // 裁剪按钮
    const cropBtn = toolbar.querySelector('[data-action="crop"]');
    if (cropBtn) {
        cropBtn.addEventListener('click', startCropping);
    }
    
    // 保存按钮
    const saveBtn = toolbar.querySelector('[data-action="save"]');
    if (saveBtn) {
        saveBtn.addEventListener('click', showSaveDialog);
    }
    
    // 添加形状按钮
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const shapeType = btn.getAttribute('data-shape');
            addShape(shapeType);
        });
    });
    
    // 设置缩放控制
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            // 获取当前缩放比例
            const zoom = canvas.getZoom();
            // 计算新的缩放比例，最大放大到3倍
            const newZoom = Math.min(zoom * 1.2, 3);
            // 应用新的缩放比例，以画布中心为缩放点
            const center = { x: canvas.width / 2, y: canvas.height / 2 };
            canvas.zoomToPoint(center, newZoom);
            canvas.renderAll();
            
            // 更新缩放显示
            if (zoomResetBtn) {
                zoomResetBtn.textContent = Math.round(newZoom * 100) + '%';
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            // 获取当前缩放比例
            const zoom = canvas.getZoom();
            // 计算新的缩放比例，最小缩小到0.5倍
            const newZoom = Math.max(zoom * 0.8, 0.5);
            // 应用新的缩放比例，以画布中心为缩放点
            const center = { x: canvas.width / 2, y: canvas.height / 2 };
            canvas.zoomToPoint(center, newZoom);
            canvas.renderAll();
            
            // 更新缩放显示
            if (zoomResetBtn) {
                zoomResetBtn.textContent = Math.round(newZoom * 100) + '%';
            }
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            // 重置缩放比例为1
            canvas.setZoom(1);
            // 重置视口变换
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvas.renderAll();
            
            // 更新缩放显示
            zoomResetBtn.textContent = '100%';
        });
    }
}

// 添加形状
function addShape(shapeType) {
    switch(shapeType) {
        case 'rect':
            addRect();
            break;
        case 'circle':
            addCircle();
            break;
        case 'triangle':
            addTriangle();
            break;
        case 'star':
            addStar();
            break;
        case 'heart':
            addHeart();
            break;
        case 'polygon':
            addPolygon();
            break;
    }
}

// 添加星形
function addStar() {
    const points = 5;
    const outerRadius = 50;
    const innerRadius = 20;
    
    const star = new fabric.Polygon(createStarPoints(points, outerRadius, innerRadius), {
        left: 100,
        top: 100,
        fill: '#f1c40f',
        stroke: '#f39c12',
        strokeWidth: 2,
        name: '星形',
        id: generateLayerId()
    });
    
    canvas.add(star);
    canvas.setActiveObject(star);
    canvas.renderAll();
    updateLayerPanel();
}

// 创建星形点
function createStarPoints(points, outerRadius, innerRadius) {
    const angleStep = Math.PI / points;
    const path = [];
    
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = radius * Math.cos(i * angleStep);
        const y = radius * Math.sin(i * angleStep);
        path.push({ x, y });
    }
    
    return path;
}

// 添加心形
function addHeart() {
    // 使用路径创建心形
    const heartPath = new fabric.Path('M 0 0 C -55,-25 -75,10 -75,30 C -75,60 -55,80 0,120 C 55,80 75,60 75,30 C 75,10 55,-25 0,0 z');
    
    heartPath.set({
        left: 100,
        top: 100,
        fill: '#e74c3c',
        stroke: '#c0392b', 
        strokeWidth: 2,
        scaleX: 1,
        scaleY: 1,
        name: '心形',
        id: generateLayerId()
    });
    
    canvas.add(heartPath);
    canvas.setActiveObject(heartPath);
    canvas.renderAll();
    updateLayerPanel();
}

// 添加多边形
function addPolygon() {
    const sides = 6; // 六边形
    const radius = 50;
    const points = [];
    
    for (let i = 0; i < sides; i++) {
        const angle = i * 2 * Math.PI / sides;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        points.push({ x, y });
    }
    
    const polygon = new fabric.Polygon(points, {
        left: 100,
        top: 100,
        fill: '#9b59b6',
        stroke: '#8e44ad',
        strokeWidth: 2,
        name: '多边形',
        id: generateLayerId()
    });
    
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    canvas.renderAll();
    updateLayerPanel();
}

// 应用裁剪
function applyCrop() {
    try {
        console.log('应用裁剪...');
        
        // 检查是否在裁剪模式
        if (!cropFabric || !cropRect || !cropSourceObject) {
            console.error('没有处于裁剪模式或缺少必要的裁剪对象:', {
                cropFabric: !!cropFabric,
                cropRect: !!cropRect,
                cropSourceObject: !!cropSourceObject
            });
            alert('裁剪失败：缺少必要的裁剪对象');
            return;
        }
        
        // 获取原始图像信息
        const originalImgElement = cropSourceObject.getElement();
        if (!originalImgElement) {
            console.error('无法获取原始图像元素');
            alert('裁剪失败：无法获取原始图像');
            return;
        }
        
        const originalWidth = originalImgElement.naturalWidth || cropSourceObject.width;
        const originalHeight = originalImgElement.naturalHeight || cropSourceObject.height;
        console.log('原始图像尺寸:', originalWidth, 'x', originalHeight);
        
        // 获取裁剪矩形的位置和尺寸
        const scaleX = originalWidth / cropFabric.width;
        const scaleY = originalHeight / cropFabric.height;
        
        // 获取裁剪框的实际尺寸和位置
        const cropLeft = cropRect.left;
        const cropTop = cropRect.top;
        const cropWidth = cropRect.width * cropRect.scaleX;
        const cropHeight = cropRect.height * cropRect.scaleY;
        
        // 裁剪原始图像 - 需要转换回原始尺寸坐标
        const cropX = Math.round(cropLeft * scaleX);
        const cropY = Math.round(cropTop * scaleY);
        const cropRealWidth = Math.round(cropWidth * scaleX);
        const cropRealHeight = Math.round(cropHeight * scaleY);
        
        console.log('裁剪区域 (显示尺寸):', cropLeft, cropTop, cropWidth, cropHeight);
        console.log('裁剪区域 (原始尺寸):', cropX, cropY, cropRealWidth, cropRealHeight);
        
        // 创建临时canvas进行裁剪
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropRealWidth;
        tempCanvas.height = cropRealHeight;
        const ctx = tempCanvas.getContext('2d');
        
        // 在临时canvas上绘制裁剪区域
        try {
            ctx.drawImage(
                originalImgElement,
                cropX, cropY, cropRealWidth, cropRealHeight,
                0, 0, cropRealWidth, cropRealHeight
            );
            
            // 获取裁剪后的图像数据
            const croppedImageURL = tempCanvas.toDataURL('image/png');
            
            if (!croppedImageURL || croppedImageURL === 'data:,') {
                throw new Error('无法生成裁剪后的图像数据');
            }
            
            // 创建新的Fabric图像对象
            fabric.Image.fromURL(croppedImageURL, function(img) {
                if (!img) {
                    console.error('无法创建裁剪后的图像对象');
                    alert('裁剪失败：无法创建裁剪后的图像');
                    return;
                }
                
                // 设置新图像位置与原图像相同
                img.set({
                    left: cropSourceObject.left,
                    top: cropSourceObject.top,
                    scaleX: cropSourceObject.scaleX,
                    scaleY: cropSourceObject.scaleY,
                    angle: cropSourceObject.angle,
                    originX: cropSourceObject.originX,
                    originY: cropSourceObject.originY,
                    id: generateLayerId(),
                    selectable: true,
                    hasControls: true
                });
                
                // 添加到画布并选中
                canvas.add(img);
                canvas.setActiveObject(img);
                
                // 移除原始图像
                canvas.remove(cropSourceObject);
                
                // 更新图层面板
                updateLayerPanel();
                
                console.log('裁剪完成，新图像已添加');
            });
            
            // 结束裁剪模式
            endCroppingMode();
        } catch (drawError) {
            console.error('绘制裁剪图像时出错:', drawError);
            alert('裁剪过程出错: ' + drawError.message);
            endCroppingMode();
        }
    } catch (error) {
        console.error('应用裁剪时出错:', error);
        alert('裁剪过程中发生错误: ' + error.message);
        endCroppingMode();
    }
}

// 取消裁剪
function cancelCrop() {
    console.log('取消裁剪');
    endCroppingMode();
}

// 结束裁剪模式
function endCroppingMode() {
    // 隐藏裁剪覆盖层
    const overlay = document.getElementById('croppingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // 清理裁剪相关对象
    if (cropFabric) {
        cropFabric.dispose();
        cropFabric = null;
    }
    
    cropRect = null;
    cropSourceObject = null;
    cropSourceImage = null;
    
    console.log('已退出裁剪模式');
}

// 开始裁剪模式
function startCropping() {
    try {
        console.log('开始裁剪模式...');
        
        // 获取当前选中的图像
        const activeObject = canvas.getActiveObject();
        if (!activeObject) {
            alert('请先选择一张图片进行裁剪');
            return;
        }
        
        if (activeObject.type !== 'image') {
            alert('只能裁剪图片对象');
            return;
        }
        
        // 保存原始图片对象以供裁剪使用
        cropSourceObject = activeObject;
        
        // 获取原图的元素，用于获取原始尺寸
        const imgElement = activeObject.getElement();
        if (!imgElement) {
            alert('无法获取图像数据');
            return;
        }
        
        const originalWidth = imgElement.naturalWidth || activeObject.width;
        const originalHeight = imgElement.naturalHeight || activeObject.height;
        
        if (originalWidth <= 0 || originalHeight <= 0) {
            alert('图像尺寸无效');
            return;
        }
        
        console.log('原始图片尺寸:', originalWidth, 'x', originalHeight);
        
        // 检查裁剪覆盖层是否存在，不存在则创建
        let overlay = document.getElementById('croppingOverlay');
        if (!overlay) {
            console.log('创建裁剪覆盖层元素');
            overlay = document.createElement('div');
            overlay.id = 'croppingOverlay';
            overlay.className = 'cropping-overlay';
            
            // 创建裁剪canvas容器 - 添加一个包装元素
            const croppingCanvasContainer = document.createElement('div'); 
            croppingCanvasContainer.id = 'croppingCanvasContainer';
            croppingCanvasContainer.style.position = 'relative';
            croppingCanvasContainer.style.backgroundColor = 'white';
            croppingCanvasContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
            
            // 创建裁剪canvas
            const croppingCanvasEl = document.createElement('canvas');
            croppingCanvasEl.id = 'croppingCanvas';
            croppingCanvasContainer.appendChild(croppingCanvasEl);
            
            // 创建裁剪控制区域
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'cropping-controls';
            
            // 创建预览区域
            const previewDiv = document.createElement('div');
            previewDiv.className = 'cropping-preview';
            previewDiv.innerHTML = '<h4>裁剪预览</h4>';
            
            // 创建按钮
            const applyBtn = document.createElement('button');
            applyBtn.id = 'applyCropBtn';
            applyBtn.textContent = '确认裁剪';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelCropBtn';
            cancelBtn.textContent = '取消';
            
            // 组装DOM结构
            controlsDiv.appendChild(previewDiv);
            controlsDiv.appendChild(applyBtn);
            controlsDiv.appendChild(cancelBtn);
            
            overlay.appendChild(croppingCanvasContainer);
            overlay.appendChild(controlsDiv);
            
            // 添加到body
            document.body.appendChild(overlay);
        }
        
        // 显示裁剪覆盖层
        overlay.style.display = 'flex';
        
        // 获取裁剪canvas
        const croppingCanvasEl = document.getElementById('croppingCanvas');
        if (!croppingCanvasEl) {
            console.error('找不到裁剪canvas元素');
            alert('无法初始化裁剪界面');
            return;
        }
        
        // 计算显示尺寸（确保适应屏幕大小并保持原始宽高比）
        const maxWidth = window.innerWidth * 0.6;  // 调小一点，给预览区域留空间
        const maxHeight = window.innerHeight * 0.6;
        
        // 保持原始图像的宽高比
        const aspectRatio = originalWidth / originalHeight;
        let displayWidth, displayHeight;
        
        if (originalWidth > maxWidth || originalHeight > maxHeight) {
            const scaleWidth = maxWidth / originalWidth;
            const scaleHeight = maxHeight / originalHeight;
            const scale = Math.min(scaleWidth, scaleHeight);
            
            displayWidth = Math.round(originalWidth * scale);
            displayHeight = Math.round(originalHeight * scale);
        } else {
            displayWidth = originalWidth;
            displayHeight = originalHeight;
        }
        
        // 调整裁剪画布容器的尺寸
        const croppingCanvasContainer = document.getElementById('croppingCanvasContainer');
        if (croppingCanvasContainer) {
            croppingCanvasContainer.style.width = `${displayWidth}px`;
            croppingCanvasContainer.style.height = `${displayHeight}px`;
        }
        
        // 设置裁剪canvas大小
        croppingCanvasEl.width = displayWidth;
        croppingCanvasEl.height = displayHeight;
        
        // 创建裁剪fabric canvas实例
        if (cropFabric) {
            cropFabric.dispose();
        }
        
        cropFabric = new fabric.Canvas('croppingCanvas');
        cropFabric.setWidth(displayWidth);
        cropFabric.setHeight(displayHeight);
        
        // 获取图像源URL
        const imgSrc = activeObject.getSrc();
        if (!imgSrc) {
            console.error('无法获取图像URL');
            alert('无法获取图像数据');
            endCroppingMode();
            return;
        }
        
        // 加载图像到裁剪canvas
        fabric.Image.fromURL(imgSrc, function(img) {
            if (!img) {
                console.error('无法创建图像对象');
                alert('无法加载图像进行裁剪');
                endCroppingMode();
                return;
            }
            
            // 计算图像缩放以填充canvas，同时保持宽高比
            const imgRatio = img.width / img.height;
            
            // 设置图像大小以适应画布
            if (imgRatio > aspectRatio) {
                // 图像更宽，高度适应画布
                img.scaleToHeight(displayHeight);
                img.set({
                    left: (displayWidth - (img.width * img.scaleX)) / 2,
                    top: 0
                });
            } else {
                // 图像更高，宽度适应画布
                img.scaleToWidth(displayWidth);
                img.set({
                    left: 0,
                    top: (displayHeight - (img.height * img.scaleY)) / 2
                });
            }
            
            // 添加到裁剪canvas并且禁止操作
            cropFabric.add(img);
            img.selectable = false;
            img.evented = false;
            
            // 保存图像引用
            cropSourceImage = img;
            
            // 计算裁剪框尺寸（默认为图像显示尺寸的80%，但保持宽高比）
            const imgDisplayWidth = img.width * img.scaleX;
            const imgDisplayHeight = img.height * img.scaleY;
            
            // 创建裁剪矩形，确保裁剪框在图像内部
            const cropBoxWidth = imgDisplayWidth * 0.8;
            const cropBoxHeight = imgDisplayHeight * 0.8;
            
            cropRect = new fabric.Rect({
                left: img.left + (imgDisplayWidth - cropBoxWidth) / 2,
                top: img.top + (imgDisplayHeight - cropBoxHeight) / 2,
                width: cropBoxWidth,
                height: cropBoxHeight,
                fill: 'rgba(0,0,0,0.1)',
                stroke: 'rgba(25, 118, 210, 0.8)',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                transparentCorners: false,
                cornerColor: '#1976d2',
                cornerSize: 10,
                lockRotation: true, // 禁止旋转
                hasRotatingPoint: false,
                centeredScaling: false,
            });
            
            // 添加限制，确保裁剪框不会超出图像范围
            cropRect.setControlsVisibility({
                mt: true, 
                mb: true, 
                ml: true, 
                mr: true, 
                tl: true, 
                tr: true, 
                bl: true, 
                br: true
            });
            
            // 限制裁剪框移动范围
            cropFabric.on('object:moving', function(e) {
                if (e.target !== cropRect) return;
                
                const obj = e.target;
                const imgLeft = cropSourceImage.left;
                const imgTop = cropSourceImage.top;
                const imgWidth = cropSourceImage.width * cropSourceImage.scaleX;
                const imgHeight = cropSourceImage.height * cropSourceImage.scaleY;
                
                // 计算边界
                const minLeft = imgLeft;
                const minTop = imgTop;
                const maxLeft = imgLeft + imgWidth - obj.width * obj.scaleX;
                const maxTop = imgTop + imgHeight - obj.height * obj.scaleY;
                
                // 限制移动
                if (obj.left < minLeft) obj.set('left', minLeft);
                if (obj.top < minTop) obj.set('top', minTop);
                if (obj.left > maxLeft) obj.set('left', maxLeft);
                if (obj.top > maxTop) obj.set('top', maxTop);
            });
            
            cropFabric.add(cropRect);
            cropFabric.setActiveObject(cropRect);
            
            // 设置裁剪预览更新
            cropFabric.on('object:modified', updateCropPreview);
            cropFabric.on('object:moving', updateCropPreview);
            cropFabric.on('object:scaling', updateCropPreview);
            
            // 初始化显示裁剪预览
            updateCropPreview();
            
            console.log('裁剪模式初始化完成，显示尺寸:', displayWidth, 'x', displayHeight);
        });
        
        // 确保裁剪确认按钮只绑定一次事件
        const applyCropBtn = document.getElementById('applyCropBtn');
        const cancelCropBtn = document.getElementById('cancelCropBtn');
        
        if (applyCropBtn) {
            applyCropBtn.onclick = applyCrop;
        }
        
        if (cancelCropBtn) {
            cancelCropBtn.onclick = cancelCrop;
        }
    } catch (error) {
        console.error('启动裁剪模式出错:', error);
        alert('启动裁剪模式时发生错误: ' + error.message);
        endCroppingMode();
    }
}

// 更新裁剪预览
function updateCropPreview() {
    try {
        console.log('更新裁剪预览...');
        
        // 检查裁剪模式是否有效
        if (!cropFabric || !cropRect || !cropSourceImage) {
            console.error('裁剪模式无效或缺少必要的裁剪对象:', {
                cropFabric: !!cropFabric,
                cropRect: !!cropRect,
                cropSourceImage: !!cropSourceImage
            });
            return;
        }
        
        // 获取裁剪矩形的位置和尺寸
        const cropLeft = cropRect.left;
        const cropTop = cropRect.top;
        const cropWidth = cropRect.width * cropRect.scaleX;
        const cropHeight = cropRect.height * cropRect.scaleY;
        
        // 确保裁剪区域在有效范围内
        if (cropWidth <= 0 || cropHeight <= 0) {
            console.warn('裁剪区域尺寸无效:', cropWidth, cropHeight);
            return;
        }
        
        // 找到预览容器
        const previewContainer = document.querySelector('.cropping-preview');
        if (!previewContainer) return;
        
        // 查找或创建预览图像元素
        let previewImg = previewContainer.querySelector('img');
        if (!previewImg) {
            previewImg = document.createElement('img');
            previewImg.style.maxWidth = '100%';
            previewImg.style.maxHeight = '100%';
            previewImg.style.border = '1px solid #ccc';
            previewImg.style.marginTop = '10px';
            previewContainer.appendChild(previewImg);
        }
        
        // 从裁剪canvas中提取裁剪区域
        try {
            // 创建临时canvas用于预览
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = cropWidth;
            tempCanvas.height = cropHeight;
            const ctx = tempCanvas.getContext('2d');
            
            // 获取裁剪区域的像素数据
            const cropImageData = cropFabric.toCanvasElement({
                left: cropLeft,
                top: cropTop,
                width: cropWidth,
                height: cropHeight
            });
            
            // 绘制到临时canvas
            ctx.drawImage(cropImageData, 0, 0);
            
            // 设置预览图像源
            previewImg.src = tempCanvas.toDataURL('image/png');
            
            console.log('更新裁剪预览完成');
        } catch (error) {
            console.error('生成裁剪预览时出错:', error);
            
            // 使用备用方法尝试生成预览
            try {
                const cropData = cropFabric.toDataURL({
                    left: cropLeft,
                    top: cropTop,
                    width: cropWidth,
                    height: cropHeight,
                    format: 'png'
                });
                
                if (cropData && cropData !== 'data:,') {
                    previewImg.src = cropData;
                    console.log('使用备用方法更新裁剪预览');
                }
            } catch (backupError) {
                console.error('备用预览方法也失败:', backupError);
            }
        }
    } catch (error) {
        console.error('更新裁剪预览时出错:', error);
    }
}

// 更新图层面板
function updateLayerPanel() {
    console.log('开始更新图层面板...');
    
    const layerList = document.getElementById('layerList');
    if (!layerList) {
        console.error('找不到图层面板元素');
        return;
    }
    
    // 清空现有图层
    layerList.innerHTML = '';
    
    // 获取所有对象并按图层ID排序
    const objects = canvas.getObjects().slice().sort((a, b) => {
        const layerA = a.layerId || 0;
        const layerB = b.layerId || 0;
        return layerB - layerA; // 从后往前排序
    });
    
    console.log(`找到 ${objects.length} 个对象`);
    
    if (objects.length === 0) {
        layerList.innerHTML = '<div class="no-layers">暂无图层</div>';
        return;
    }
    
    // 创建图层项
    objects.forEach((obj, index) => {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.setAttribute('data-layer-id', obj.layerId || 0);
        layerItem.setAttribute('draggable', 'true');
        
        if (obj === canvas.getActiveObject()) {
            layerItem.classList.add('active');
        }
        
        // 获取对象类型名称
        const typeName = getObjectTypeName(obj);
        
        // 创建图层内容
        layerItem.innerHTML = `
            <div class="layer-drag-handle">⋮⋮</div>
            <div class="layer-name" title="${typeName}">${typeName}</div>
            <div class="layer-controls">
                <span class="layer-visibility ${obj.visible ? '' : 'hidden'}" title="显示/隐藏">👁</span>
                <span class="layer-lock ${obj.locked ? 'locked' : ''}" title="锁定/解锁">🔒</span>
                <span class="layer-delete" title="删除">🗑</span>
            </div>
        `;
        
        // 添加事件监听器
        layerItem.addEventListener('click', () => {
            canvas.setActiveObject(obj);
            canvas.renderAll();
            updateLayerPanel();
        });
        
        // 显示/隐藏按钮
        const visibilityBtn = layerItem.querySelector('.layer-visibility');
        visibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            visibilityBtn.classList.toggle('hidden');
            canvas.renderAll();
        });
        
        // 锁定/解锁按钮
        const lockBtn = layerItem.querySelector('.layer-lock');
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            obj.locked = !obj.locked;
            lockBtn.classList.toggle('locked');
            canvas.renderAll();
        });
        
        // 删除按钮
        const deleteBtn = layerItem.querySelector('.layer-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('确定要删除这个图层吗？')) {
                canvas.remove(obj);
                canvas.renderAll();
                updateLayerPanel();
            }
        });
        
        layerList.appendChild(layerItem);
    });
    
    // 设置拖放排序功能
    setupLayerDragSort();
    
    console.log('图层面板更新完成');
}

// 设置图层拖放排序
function setupLayerDragSort() {
    const layerItems = document.querySelectorAll('.layer-item');
    const layerList = document.getElementById('layerList');
    
    let draggedItem = null;
    
    layerItems.forEach(item => {
        // 拖动开始
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            setTimeout(() => {
                item.classList.add('dragging');
            }, 0);
        });
        
        // 拖动结束
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
            
            // 更新画布对象的层次
            updateCanvasObjectOrder();
        });
        
        // 拖动经过其他项
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            if (!draggedItem || draggedItem === item) return;
            
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                // 在当前项之前
                if (item.previousElementSibling !== draggedItem) {
                    layerList.insertBefore(draggedItem, item);
                }
            } else {
                // 在当前项之后
                if (item.nextElementSibling !== draggedItem) {
                    layerList.insertBefore(draggedItem, item.nextElementSibling);
                }
            }
        });
    });
}

// 根据图层面板顺序更新画布对象的层次
function updateCanvasObjectOrder() {
    try {
        // 获取图层面板中的所有项
        const layerItems = Array.from(document.querySelectorAll('.layer-item'));
        
        // 反转顺序，因为图层列表是从上到下显示的，而画布是从下到上渲染的
        const orderedLayerItems = [...layerItems].reverse();
        
        // 跟踪当前选中的对象，稍后恢复选择
        const activeObject = canvas.getActiveObject();
        
        // 获取当前画布上的所有对象
        const currentObjects = canvas.getObjects();
        
        // 保存当前选择状态
        const wasSelected = activeObject ? true : false;
        
        // 准备新的对象数组，按照图层面板的顺序
        const orderedObjects = [];
        
        // 创建一个映射，通过layerId快速查找对象
        const objectMap = {};
        currentObjects.forEach(obj => {
            const id = obj.layerId || 0;
            objectMap[id] = obj;
        });
        
        // 按照图层面板的顺序添加对象
        orderedLayerItems.forEach(item => {
            const layerId = parseInt(item.getAttribute('data-layer-id'));
            const obj = objectMap[layerId];
            
            if (obj) {
                orderedObjects.push(obj);
            }
        });
        
        // 如果没有找到任何对象，直接返回避免清空画布
        if (orderedObjects.length === 0) {
            console.warn('没有找到图层项对应的对象');
            return;
        }
        
        console.log(`重新排序 ${orderedObjects.length} 个对象（总共 ${currentObjects.length} 个对象在画布上）`);
        
        // 临时保存所有对象以防万一
        const backupObjects = [...currentObjects];
        
        // 先清除事件监听，避免更新过程中触发额外的更新
        canvas.off('object:added');
        
        // 安全地移除所有对象（不触发图层面板更新）
        canvas.clear();
        
        // 按新顺序添加所有对象
        orderedObjects.forEach(obj => {
            canvas.add(obj);
        });
        
        // 如果有之前选中的对象，重新设置为活动对象
        if (wasSelected && activeObject) {
            const newActiveObj = canvas.getObjects().find(o => o.id === activeObject.id);
            if (newActiveObj) {
                canvas.setActiveObject(newActiveObj);
            }
        }
        
        // 重新绑定事件监听
        canvas.on('object:added', updateLayerPanel);
        
        // 渲染画布
        canvas.renderAll();
        
        console.log('已更新画布对象顺序，对象数量:', canvas.getObjects().length);
    } catch (error) {
        console.error('更新画布对象顺序时出错:', error);
    }
}

// 获取对象类型名称
function getObjectTypeName(obj) {
    if (obj instanceof fabric.Textbox) return '文本';
    if (obj instanceof fabric.Text) return '文本';
    if (obj instanceof fabric.Image) return '图片';
    if (obj instanceof fabric.Rect) return '矩形';
    if (obj instanceof fabric.Circle) return '圆形';
    if (obj instanceof fabric.Triangle) return '三角形';
    return '图形';
}

// 锁定/解锁对象
function toggleLock(obj) {
    const locked = !obj.lockMovementX;
    obj.lockMovementX = locked;
    obj.lockMovementY = locked;
    obj.lockRotation = locked;
    obj.lockScalingX = locked;
    obj.lockScalingY = locked;
    obj.hasControls = !locked;
    obj.selectable = !locked;
    obj.hoverCursor = locked ? 'default' : 'move';
    return locked;
}

// 设置画布事件
function setupCanvasEvents() {
    if (!canvas) {
        console.error('Canvas未初始化，无法设置事件');
        return;
    }
    
    // 当选择对象时更新属性面板
    canvas.on('selection:created', function(e) {
        updatePropertiesPanel(e.selected);
        updateLayerPanel();
    });
    
    canvas.on('selection:updated', function(e) {
        updatePropertiesPanel(e.selected);
        updateLayerPanel();
    });
    
    canvas.on('selection:cleared', function() {
        clearPropertiesPanel();
        updateLayerPanel();
    });
    
    // 当对象改变时更新图层面板
    canvas.on('object:added', function() {
        updateLayerPanel();
    });
    
    canvas.on('object:removed', function() {
        updateLayerPanel();
    });
    
    canvas.on('object:modified', function() {
        updateLayerPanel();
    });
    
    // 当画布缩放或平移时，更新透明背景棋盘格位置
    canvas.on('mouse:wheel', function() {
        if (isTransparentBg) {
            // 延迟执行以等待缩放完成
            setTimeout(updateCheckerboardPosition, 50);
        }
    });
    
    canvas.on('mouse:up', function() {
        if (canvas.isDragging && isTransparentBg) {
            // 平移结束后更新棋盘格位置
            updateCheckerboardPosition();
        }
    });
    
    // 监听键盘事件
    document.addEventListener('keydown', function(e) {
        // 删除选中对象 (Delete 键)
        if (e.key === 'Delete' && canvas.getActiveObject()) {
            deleteSelection();
        }
        
        // Ctrl+G 组合对象
        if (e.ctrlKey && e.key === 'g' && canvas.getActiveObject() && canvas.getActiveObject().type === 'activeSelection') {
            groupSelected();
            e.preventDefault();
        }
        
        // Ctrl+Shift+G 取消组合
        if (e.ctrlKey && e.shiftKey && e.key === 'G' && canvas.getActiveObject() && canvas.getActiveObject().type === 'group') {
            ungroupSelected();
            e.preventDefault();
        }
        
        // Ctrl+D 复制
        if (e.ctrlKey && e.key === 'd' && canvas.getActiveObject()) {
            duplicateSelected();
            e.preventDefault();
        }
    });
    
    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 添加窗口焦点变化监听
    window.addEventListener('focus', () => {
        if (!isWindowVisible) {
            isWindowVisible = true;
            console.log('窗口获得焦点，恢复操作');
            setTimeout(() => {
                if (canvas) {
                    canvas.renderAll();
                    if (isTransparentBg) {
                        updateCheckerboardPosition(true);
                    }
                }
            }, 300);
        }
    });
    
    window.addEventListener('blur', () => {
        isWindowVisible = false;
        console.log('窗口失去焦点，暂停某些操作');
    });
    
    // 添加窗口大小变化处理，使其更稳定
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (canvas && isWindowVisible) {
                // 触发画布内容更新
                canvas.renderAll();
                
                // 如果是透明背景模式，更新棋盘格
                if (isTransparentBg) {
                    updateCheckerboardPosition(true);
                }
                
                // 更新预览
                if (typeof updatePreview === 'function') {
                    updatePreview();
                }
            }
        }, 300);
    });
}

// 生成唯一图层ID
function generateLayerId() {
    return currentLayerId++;
}

// 显示保存对话框
function showSaveDialog() {
    const saveDialog = document.getElementById('saveDialog');
    if (saveDialog) {
        // 确保透明背景选项与当前状态一致
        const transparentExport = document.getElementById('transparentExport');
        if (transparentExport) {
            transparentExport.checked = isTransparentBg;
        }
        
        saveDialog.style.display = 'flex';
    }
}

// 设置保存功能
function setupSave() {
    // 保存确认按钮
    document.getElementById('saveConfirm')?.addEventListener('click', saveDesign);
    
    // 取消保存按钮
    document.getElementById('saveCancel')?.addEventListener('click', () => {
        const saveDialog = document.getElementById('saveDialog');
        if (saveDialog) {
            saveDialog.style.display = 'none';
        }
    });
}

// 保存设计
function saveDesign() {
    if (!canvas) {
        alert('画布未初始化');
        return;
    }
    
    // 获取保存对话框
    const saveDialog = document.getElementById('saveDialog');
    const transparentExport = document.getElementById('transparentExport');
    
    // 确保所有必要的元素都存在
    if (!saveDialog) {
        console.error('找不到保存对话框元素');
        alert('保存对话框不可用，请刷新页面重试');
        return;
    }
    
    // 显示保存对话框
    saveDialog.style.display = 'flex';
    
    // 如果透明背景选项元素存在，设置其状态
    if (transparentExport) {
        transparentExport.checked = canvas.isTransparentBg || isTransparentBg;
    }
    
    // 获取保存和取消按钮
    const saveConfirmBtn = document.getElementById('saveConfirm');
    const saveCancelBtn = document.getElementById('saveCancel');
    
    if (!saveConfirmBtn || !saveCancelBtn) {
        console.error('找不到保存或取消按钮');
        return;
    }
    
    // 清除之前的事件监听器(如果有)
    const newSaveConfirmBtn = saveConfirmBtn.cloneNode(true);
    const newSaveCancelBtn = saveCancelBtn.cloneNode(true);
    saveConfirmBtn.parentNode.replaceChild(newSaveConfirmBtn, saveConfirmBtn);
    saveCancelBtn.parentNode.replaceChild(newSaveCancelBtn, saveCancelBtn);
    
    // 设置保存按钮点击事件
    newSaveConfirmBtn.addEventListener('click', function() {
        // 获取设计名称
        const designName = document.getElementById('designName').value.trim();
        if (!designName) {
            alert('请输入设计名称');
            return;
        }
        
        // 获取透明背景设置
        const isTransparentBackground = transparentExport ? transparentExport.checked : canvas.isTransparentBg;
        
        // 暂时应用透明背景设置（如果与当前设置不同）
        let originalBgColor = null;
        if (isTransparentBackground !== isTransparentBg) {
            originalBgColor = canvas.backgroundColor;
            canvas.backgroundColor = isTransparentBackground ? null : '#FFFFFF';
            canvas.renderAll();
        }
        
        // 准备预览图
        const scaleFactor = Math.min(1, 600 / Math.max(canvas.width, canvas.height));
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 0.7,
            multiplier: scaleFactor
        });
        
        // 创建完整尺寸图像（不缩放）
        const fullImageURL = canvas.toDataURL({
            format: 'png',
            quality: 0.9,
            multiplier: 1
        });
        
        console.log('准备保存设计，数据大小约:', Math.round(dataURL.length/1024) + 'KB');
        
        // 优化对象，移除不必要的属性
        const objects = canvas.toJSON([
            'id', 'name', 'materialId', 'materialType', 
            'selectable', 'evented', 'lockMovementX', 
            'lockMovementY', 'visible'
        ]).objects;
        
        // 恢复原始背景设置（如果有改变）
        if (originalBgColor !== null) {
            canvas.backgroundColor = originalBgColor;
            canvas.renderAll();
        }
        
        // 准备设计数据
        const designData = {
            name: designName,
            width: canvas.width,
            height: canvas.height,
            previewUrl: dataURL,
            fullImageUrl: fullImageURL,
            isTransparentBg: isTransparentBackground,
            objects: objects
        };
        
        console.log('发送设计数据...');
        
        // 发送设计数据到服务器
        fetch('/api/designs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(designData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('保存失败: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || '保存失败');
            }
            
            // 隐藏对话框
            saveDialog.style.display = 'none';
            
            // 设计ID
            const designId = data.design.id;
            
            // 只显示ID
            alert('设计保存成功！设计ID: ' + designId);
        })
        .catch(error => {
            console.error('保存设计失败:', error);
            alert('保存设计失败: ' + error.message);
        });
    });
    
    // 设置取消按钮点击事件
    newSaveCancelBtn.addEventListener('click', function() {
        saveDialog.style.display = 'none';
    });
}

// 画布对象选择事件
function setupCanvasEvents() {
    canvas.on('selection:created', () => {
        updateLayerPanel();
    });
    
    canvas.on('selection:updated', () => {
        updateLayerPanel();
    });
    
    canvas.on('selection:cleared', () => {
        updateLayerPanel();
    });
    
    canvas.on('object:modified', () => {
        updateLayerPanel();
    });
}

// 工具函数：将Data URL转换为Blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// 添加图片
function addImage(url) {
    if (!url) return;
    
    fabric.Image.fromURL(url, (img) => {
        // 调整图片大小保持比例
        const maxSize = 400;
        if (img.width > maxSize || img.height > maxSize) {
            if (img.width > img.height) {
                img.scaleToWidth(maxSize);
            } else {
                img.scaleToHeight(maxSize);
            }
        }
        
        img.set({
            left: 100,
            top: 100,
            name: '图片',
            id: generateLayerId()
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        updateLayerPanel();
    });
}

// 组合选中的对象
function groupSelected() {
    if (!canvas.getActiveObject()) {
        alert('请先选择多个对象');
        return;
    }
    
    if (canvas.getActiveObject().type !== 'activeSelection') {
        alert('请选择多个对象进行组合');
        return;
    }
    
    const activeSelection = canvas.getActiveObject();
    const group = activeSelection.toGroup();
    group.set('name', '组合');
    group.set('id', generateLayerId());
    canvas.renderAll();
    updateLayerPanel();
}

// 解组选中的组
function ungroupSelected() {
    if (!canvas.getActiveObject()) return;
    
    if (canvas.getActiveObject().type !== 'group') {
        alert('请选择一个组进行解组');
        return;
    }
    
    const activeGroup = canvas.getActiveObject();
    const items = activeGroup.getObjects();
    
    // 解除分组前获取组的位置和缩放信息
    const groupLeft = activeGroup.left;
    const groupTop = activeGroup.top;
    const groupScaleX = activeGroup.scaleX;
    const groupScaleY = activeGroup.scaleY;
    const groupAngle = activeGroup.angle;
    
    // 解除分组
    activeGroup.toActiveSelection();
    
    // 更新每个对象的属性
    canvas.getActiveObject().getObjects().forEach(obj => {
        // 确保对象有唯一ID和名称
        if (!obj.id) {
            obj.id = generateLayerId();
        }
        if (!obj.name) {
            obj.name = getObjectTypeName(obj);
        }
    });
    
    canvas.renderAll();
    updateLayerPanel();
}

// 复制选中的对象
function duplicateSelected() {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    // 克隆对象
    activeObject.clone(cloned => {
        // 为克隆对象设置新位置 (偏移一点)
        cloned.set({
            left: cloned.left + 20,
            top: cloned.top + 20,
            id: generateLayerId()
        });
        
        // 确保名称有 "副本" 标识
        if (cloned.name) {
            cloned.name = `${cloned.name}(副本)`;
        } else {
            cloned.name = `${getObjectTypeName(cloned)}(副本)`;
        }
        
        // 添加到画布
        canvas.add(cloned);
        
        // 清除当前选择并选中新对象
        canvas.discardActiveObject();
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        updateLayerPanel();
    });
}

// 图层置顶
function bringToFront() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.bringToFront(activeObject);
        canvas.renderAll();
        updateLayerPanel();
    }
}

// 图层置底
function sendToBack() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.sendToBack(activeObject);
        
        // 确保网格线在最底层
        canvas.getObjects().filter(obj => obj.type === 'grid').forEach(grid => {
            canvas.sendToBack(grid);
        });
        
        canvas.renderAll();
        updateLayerPanel();
    }
}

// 显示或隐藏网格
function toggleGrid() {
    const gridObjects = canvas.getObjects().filter(obj => obj.type === 'grid');
    
    if (gridObjects.length > 0) {
        const isVisible = gridObjects[0].visible !== false;
        
        gridObjects.forEach(obj => {
            obj.set('visible', !isVisible);
        });
        
        canvas.renderAll();
    }
}

// 更新属性面板
function updatePropertiesPanel() {
    const propertiesPanel = document.getElementById('propertiesPanel');
    if (!propertiesPanel) return;
    
    const activeObject = canvas.getActiveObject();
    
    // 清空面板
    propertiesPanel.innerHTML = '';
    
    // 如果没有选中对象，隐藏面板
    if (!activeObject) {
        propertiesPanel.style.display = 'none';
        return;
    }
    
    // 显示面板
    propertiesPanel.style.display = 'block';
    
    // 创建标题
    const title = document.createElement('div');
    title.className = 'properties-title';
    title.textContent = `${activeObject.name || getObjectTypeName(activeObject)} 属性`;
    propertiesPanel.appendChild(title);
    
    // 添加通用属性
    addPropertyControl(propertiesPanel, '位置 X', 'number', activeObject.left, value => {
        activeObject.set('left', parseFloat(value));
        canvas.renderAll();
    });
    
    addPropertyControl(propertiesPanel, '位置 Y', 'number', activeObject.top, value => {
        activeObject.set('top', parseFloat(value));
        canvas.renderAll();
    });
    
    addPropertyControl(propertiesPanel, '旋转', 'number', Math.round(activeObject.angle), value => {
        activeObject.set('angle', parseFloat(value));
        canvas.renderAll();
    });
    
    addPropertyControl(propertiesPanel, '不透明度', 'range', activeObject.opacity * 100, value => {
        activeObject.set('opacity', parseFloat(value) / 100);
        canvas.renderAll();
    }, { min: 0, max: 100, step: 1 });
    
    // 根据对象类型添加特定属性
    if (activeObject.type === 'textbox' || activeObject.type === 'text') {
        // 文本特有属性
        addPropertyControl(propertiesPanel, '文本', 'text', activeObject.text, value => {
            activeObject.set('text', value);
            canvas.renderAll();
        });
        
        addPropertyControl(propertiesPanel, '字体大小', 'number', activeObject.fontSize, value => {
            activeObject.set('fontSize', parseFloat(value));
            canvas.renderAll();
        });
        
        addPropertyControl(propertiesPanel, '字体颜色', 'color', activeObject.fill, value => {
            activeObject.set('fill', value);
            canvas.renderAll();
        });
        
        const fontFamilies = ['Arial', 'Times New Roman', '微软雅黑', '宋体', '黑体', 'Comic Sans MS', 'Courier New'];
        addPropertyControl(propertiesPanel, '字体', 'select', activeObject.fontFamily, value => {
            activeObject.set('fontFamily', value);
            canvas.renderAll();
        }, { options: fontFamilies });
        
        const alignOptions = [
            { value: 'left', text: '左对齐' },
            { value: 'center', text: '居中' },
            { value: 'right', text: '右对齐' }
        ];
        
        addPropertyControl(propertiesPanel, '对齐', 'select', activeObject.textAlign, value => {
            activeObject.set('textAlign', value);
            canvas.renderAll();
        }, { options: alignOptions });
        
        addPropertyControl(propertiesPanel, '粗体', 'checkbox', activeObject.fontWeight === 'bold', value => {
            activeObject.set('fontWeight', value ? 'bold' : 'normal');
            canvas.renderAll();
        });
        
        addPropertyControl(propertiesPanel, '斜体', 'checkbox', activeObject.fontStyle === 'italic', value => {
            activeObject.set('fontStyle', value ? 'italic' : 'normal');
            canvas.renderAll();
        });
        
        addPropertyControl(propertiesPanel, '下划线', 'checkbox', activeObject.underline, value => {
            activeObject.set('underline', value);
            canvas.renderAll();
        });
    } 
    else if (activeObject.type === 'image') {
        // 图片特有属性
        addPropertyControl(propertiesPanel, '亮度', 'range', 0, value => {
            applyImageFilter(activeObject, 'Brightness', { brightness: parseFloat(value) / 100 });
        }, { min: -100, max: 100, step: 1 });
        
        addPropertyControl(propertiesPanel, '对比度', 'range', 0, value => {
            applyImageFilter(activeObject, 'Contrast', { contrast: parseFloat(value) / 100 });
        }, { min: -100, max: 100, step: 1 });
        
        addPropertyControl(propertiesPanel, '灰度', 'checkbox', false, value => {
            if (value) {
                applyImageFilter(activeObject, 'Grayscale');
            } else {
                removeImageFilter(activeObject, 'Grayscale');
            }
        });
        
        addPropertyControl(propertiesPanel, '翻转', 'select', 'none', value => {
            switch(value) {
                case 'horizontal':
                    activeObject.set('flipX', true);
                    activeObject.set('flipY', false);
                    break;
                case 'vertical':
                    activeObject.set('flipX', false);
                    activeObject.set('flipY', true);
                    break;
                case 'both':
                    activeObject.set('flipX', true);
                    activeObject.set('flipY', true);
                    break;
                default:
                    activeObject.set('flipX', false);
                    activeObject.set('flipY', false);
            }
            canvas.renderAll();
        }, { 
            options: [
                { value: 'none', text: '无' },
                { value: 'horizontal', text: '水平翻转' },
                { value: 'vertical', text: '垂直翻转' },
                { value: 'both', text: '水平和垂直' }
            ] 
        });
    }
    else if (activeObject.type === 'rect' || activeObject.type === 'circle' || 
             activeObject.type === 'triangle' || activeObject.type === 'polygon' ||
             activeObject.type === 'path') {
        // 形状特有属性
        addPropertyControl(propertiesPanel, '填充颜色', 'color', activeObject.fill, value => {
            activeObject.set('fill', value);
            canvas.renderAll();
        });
        
        // 添加边框属性
        addPropertyControl(propertiesPanel, '边框颜色', 'color', activeObject.stroke || '#000000', value => {
            activeObject.set('stroke', value);
            canvas.renderAll();
        });
        
        addPropertyControl(propertiesPanel, '边框宽度', 'number', activeObject.strokeWidth || 0, value => {
            activeObject.set('strokeWidth', parseFloat(value));
            canvas.renderAll();
        });
    }
}

// 添加属性控制
function addPropertyControl(container, label, type, value, onChange, options = {}) {
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property-item';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'property-label';
    labelSpan.textContent = label;
    
    const controlDiv = document.createElement('div');
    controlDiv.className = 'property-control';
    
    let control;
    
    switch(type) {
        case 'text':
        case 'number':
            control = document.createElement('input');
            control.type = type;
            control.value = value;
            control.addEventListener('input', e => onChange(e.target.value));
            break;
            
        case 'color':
            control = document.createElement('input');
            control.type = type;
            control.value = value;
            control.addEventListener('input', e => onChange(e.target.value));
            break;
            
        case 'range':
            control = document.createElement('input');
            control.type = type;
            control.min = options.min || 0;
            control.max = options.max || 100;
            control.step = options.step || 1;
            control.value = value;
            
            // 添加值显示
            const rangeValue = document.createElement('span');
            rangeValue.className = 'range-value';
            rangeValue.textContent = value;
            
            control.addEventListener('input', e => {
                const val = e.target.value;
                rangeValue.textContent = val;
                onChange(val);
            });
            
            controlDiv.appendChild(control);
            controlDiv.appendChild(rangeValue);
            control = null; // 防止重复添加
            break;
            
        case 'checkbox':
            control = document.createElement('input');
            control.type = type;
            control.checked = value;
            control.addEventListener('change', e => onChange(e.target.checked));
            break;
            
        case 'select':
            control = document.createElement('select');
            
            if (Array.isArray(options.options)) {
                options.options.forEach(option => {
                    const opt = document.createElement('option');
                    
                    if (typeof option === 'object') {
                        opt.value = option.value;
                        opt.textContent = option.text;
                    } else {
                        opt.value = option;
                        opt.textContent = option;
                    }
                    
                    if (opt.value === value) {
                        opt.selected = true;
                    }
                    
                    control.appendChild(opt);
                });
            }
            
            control.addEventListener('change', e => onChange(e.target.value));
            break;
    }
    
    if (control) {
        controlDiv.appendChild(control);
    }
    
    propertyDiv.appendChild(labelSpan);
    propertyDiv.appendChild(controlDiv);
    container.appendChild(propertyDiv);
}

// 应用图片滤镜
function applyImageFilter(imageObj, filterType, options = {}) {
    // 确保对象是图片
    if (!imageObj || imageObj.type !== 'image') return;
    
    // 初始化滤镜数组
    if (!imageObj.filters) {
        imageObj.filters = [];
    }
    
    // 查找现有滤镜
    let filter = imageObj.filters.find(f => f.type === filterType);
    
    // 如果滤镜不存在，创建新滤镜
    if (!filter) {
        filter = new fabric.Image.filters[filterType](options);
        imageObj.filters.push(filter);
    } 
    // 否则更新现有滤镜
    else {
        Object.assign(filter, options);
    }
    
    // 应用滤镜
    imageObj.applyFilters();
    canvas.renderAll();
}

// 移除图片滤镜
function removeImageFilter(imageObj, filterType) {
    // 确保对象是图片且有滤镜
    if (!imageObj || imageObj.type !== 'image' || !imageObj.filters) return;
    
    // 寻找和移除滤镜
    const filterIndex = imageObj.filters.findIndex(f => f.type === filterType);
    
    if (filterIndex !== -1) {
        imageObj.filters.splice(filterIndex, 1);
        imageObj.applyFilters();
        canvas.renderAll();
    }
}

// 保存为模板
async function saveAsTemplate() {
    try {
        // 获取用户输入的模板名称
        const templateName = prompt('请输入模板名称:');
        if (!templateName || templateName.trim() === '') {
            alert('模板名称不能为空');
            return;
        }
        
        // 准备模板数据
        const templateData = {
            name: templateName,
            width: canvas.width,
            height: canvas.height,
            isBackgroundTemplate: isTransparentBg,
            objects: canvas.toJSON(['id', 'name']).objects
        };
        
        // 发送请求保存模板
        const response = await fetch('/api/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
        });
        
        if (!response.ok) {
            throw new Error('保存模板失败');
        }
        
        const result = await response.json();
        if (result.success) {
            alert(`模板保存成功！模板ID: ${result.template.id}`);
        } else {
            throw new Error(result.error || '保存模板失败');
        }
    } catch (error) {
        console.error('保存模板失败:', error);
        alert('保存模板失败: ' + error.message);
    }
}

// 初始化画布
function initCanvas() {
    // 获取画布容器
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        console.error('找不到画布容器元素');
        return;
    }
    
    // 计算画布初始尺寸
    const defaultWidth = 600;
    const defaultHeight = 600;
    
    // 初始化fabric.js画布，使用已存在的canvas元素
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) {
        // 如果不存在，创建一个canvas元素
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'canvas';
        canvasContainer.appendChild(newCanvas);
        console.log('创建了新的canvas元素');
        
        // 初始化fabric.js画布
        canvas = new fabric.Canvas(newCanvas, {
            width: defaultWidth,
            height: defaultHeight,
            preserveObjectStacking: true,
            selection: true
        });
    } else {
        console.log('使用已存在的canvas元素');
        
        // 初始化fabric.js画布
        canvas = new fabric.Canvas(canvasEl, {
            width: defaultWidth,
            height: defaultHeight,
            preserveObjectStacking: true,
            selection: true
        });
    }
    
    // 设置画布样式
    canvas.selection = true;
    
    // 初始化画布背景
    canvas.backgroundColor = 'white';
    
    // 设置缩放/旋转控件样式
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#4CAF50';
    fabric.Object.prototype.cornerStyle = 'circle';
    fabric.Object.prototype.cornerSize = 10;
    fabric.Object.prototype.padding = 5;
    fabric.Object.prototype.borderColor = '#4CAF50';
    
    // 设置画布预设
    canvas.stopContextMenu = true;  // 禁用右键菜单
    
    // 设置选择样式
    canvas.selectionColor = 'rgba(76, 175, 80, 0.1)';
    canvas.selectionBorderColor = '#4CAF50';
    canvas.selectionLineWidth = 1;
    
    // 设置画布事件
    setupCanvasEvents();
    
    // 添加自定义控件
    setupLayerControls();
    
    // 更新属性面板
    updatePropertiesPanel();
    
    // 初始化图层面板
    updateLayerPanel();
    
    // 更新预览
    updatePreview();
    
    console.log('画布初始化完成，尺寸:', canvas.width, 'x', canvas.height);
    
    return canvas;
}

// 自定义调整画布尺寸
function customResizeCanvas(width, height) {
    // 保存当前的背景色和对象
    const bgColor = canvas.backgroundColor;
    const isTransparent = canvas.isTransparentBg;
    const objects = canvas.getObjects();
    
    // 调整画布尺寸
    canvas.setWidth(width);
    canvas.setHeight(height);
    
    // 更新画布容器尺寸
    updateCanvasSize(width, height);
    
    // 恢复背景设置
    if (isTransparent) {
        canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
    } else {
        canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));
    }
    
    // 更新网格
    if (canvas.showGrid) {
        addCanvasGrid();
    }
    
    // 重绘画布
    canvas.renderAll();
    
    console.log('Canvas resized to:', width, 'x', height);
}

// 更新画布容器尺寸
function updateCanvasSize(width, height) {
    const container = document.querySelector('.canvas-container');
    if (container) {
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.style.maxWidth = '100%';
        container.style.margin = '0 auto';
    }
}

// 防抖函数，避免频繁触发事件
function debounceEvent(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, arguments);
        }, wait);
    };
}

// 设置预设尺寸选择
function setupPresetSizes() {
    const presetSizes = document.querySelectorAll('.preset-size');
    
    presetSizes.forEach(preset => {
        preset.addEventListener('click', function() {
            // 移除其他尺寸的active类
            presetSizes.forEach(p => p.classList.remove('active'));
            // 添加当前尺寸的active类
            this.classList.add('active');
            
            // 获取新尺寸
            const width = parseInt(this.getAttribute('data-width'));
            const height = parseInt(this.getAttribute('data-height'));
            
            // 调整画布尺寸
            resizeCanvas(width, height);
        });
    });
}

// 清除属性面板
function clearPropertiesPanel() {
    const propertiesPanel = document.getElementById('propertiesPanel');
    if (propertiesPanel) {
        propertiesPanel.innerHTML = '';
        propertiesPanel.style.display = 'none';
    }
}

// 设置标签切换
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有标签页和按钮的active类
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // 激活当前标签页和按钮
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            const content = document.getElementById(target);
            if (content) {
                content.classList.add('active');
            }
        });
    });
}

// 加载贴纸素材
function loadStickers() {
    const stickerList = document.getElementById('stickerList');
    if (!stickerList) return;
    
    // 预设贴纸列表 - 使用占位图像
    const stickers = [
        { name: '贴纸1', url: placeholderImage },
        { name: '贴纸2', url: placeholderImage },
        { name: '贴纸3', url: placeholderImage }
    ];
    
    // 清空现有贴纸
    stickerList.innerHTML = '';
    
    // 添加贴纸到列表
    stickers.forEach(sticker => {
        const div = document.createElement('div');
        div.className = 'material-item';
        div.innerHTML = `<img src="${sticker.url}" alt="${sticker.name}">`;
        
        div.addEventListener('click', () => {
            addSticker(sticker);
        });
        
        stickerList.appendChild(div);
    });
    
    console.log('贴纸加载完成');
}

// 添加贴纸到画布
function addSticker(sticker) {
    fabric.Image.fromURL(sticker.url || placeholderImage, (img) => {
        // 调整图片大小保持比例
        const maxSize = 200;
        if (img.width > maxSize || img.height > maxSize) {
            if (img.width > img.height) {
                img.scaleToWidth(maxSize);
            } else {
                img.scaleToHeight(maxSize);
            }
        }
        
        img.set({
            left: 100,
            top: 100,
            name: sticker.name || '贴纸',
            id: generateLayerId()
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        updateLayerPanel();
    });
}

// 设置颜色选择器
function setupColorPicker() {
    // 设置预设颜色点击事件
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.getAttribute('data-color');
            if (color) {
                applyColorToSelection(color);
            }
        });
    });
    
    // 设置自定义颜色选择器
    const customColorPicker = document.getElementById('customColor');
    if (customColorPicker) {
        customColorPicker.addEventListener('input', (e) => {
            applyColorToSelection(e.target.value);
        });
    }
    
    // 设置透明度滑块
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            opacityValue.textContent = `${value}%`;
            applyOpacityToSelection(value / 100);
        });
    }
}

// 应用颜色到选中对象
function applyColorToSelection(color) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    if (activeObject.type === 'textbox' || activeObject.type === 'text') {
        activeObject.set('fill', color);
    } else {
        activeObject.set('fill', color);
    }
    
    canvas.renderAll();
}

// 应用透明度到选中对象
function applyOpacityToSelection(opacity) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    activeObject.set('opacity', opacity);
    canvas.renderAll();
}

// 设置清空画布
function setupClearCanvas() {
    const clearButton = document.getElementById('clearCanvas');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (confirm('确定要清空画布吗？此操作不可撤销。')) {
                clearCanvas();
            }
        });
    }
}

// 清空画布
function clearCanvas() {
    // 清除所有可选择的对象
    const objects = canvas.getObjects().filter(obj => obj.selectable !== false);
    objects.forEach(obj => canvas.remove(obj));
    
    canvas.renderAll();
    updateLayerPanel();
}

// 初始化材料
async function initMaterials() {
    try {
        console.log('开始初始化素材库...');
        
        // 获取素材分类
        const response = await fetch('/api/materials/categories');
        if (!response.ok) {
            throw new Error('获取素材分类失败');
        }
        
        const data = await response.json();
        if (!data.success || !data.categories) {
            throw new Error('素材分类数据格式错误');
        }
        
        // 初始化素材对象
        materials = {};
        
        // 加载每个分类的素材
        for (const category of data.categories) {
            console.log(`正在加载分类: ${category.id}`);
            await loadMaterialsByCategory(category.id);
        }
        
        // 渲染所有素材
        renderMaterials();
        
        console.log('素材库初始化完成');
    } catch (error) {
        console.error('初始化素材库失败:', error);
        // 使用默认素材
        materials = {
            stickers: [
                { name: '贴纸1', url: placeholderImage },
                { name: '贴纸2', url: placeholderImage },
                { name: '贴纸3', url: placeholderImage }
            ],
            backgrounds: [],
            shapes: []
        };
        renderMaterials();
    }
}

// 加载指定分类的材料
async function loadMaterialsByCategory(categoryId) {
    try {
        console.log(`正在加载分类: ${categoryId}...`);
        
        const response = await fetch(`/api/materials/categories/${categoryId}`);
        if (!response.ok) {
            throw new Error(`获取${categoryId}失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.category && Array.isArray(data.category.items)) {
            materials[categoryId] = data.category.items;
            console.log(`加载了 ${data.category.items.length} 个${categoryId}素材`);
            
            // 如果是贴纸分类，重新渲染贴纸
            if (categoryId === 'stickers') {
                renderStickers();
            }
        } else {
            // 如果API返回成功但没有素材，初始化为空数组
            materials[categoryId] = [];
            
            // 对于贴纸，如果为空使用默认占位贴纸
            if (categoryId === 'stickers' && materials[categoryId].length === 0) {
                console.log('使用默认贴纸占位图像');
                materials.stickers = [
                    { name: '贴纸1', url: placeholderImage },
                    { name: '贴纸2', url: placeholderImage },
                    { name: '贴纸3', url: placeholderImage }
                ];
            }
        }
    } catch (error) {
        console.error(`加载${categoryId}失败:`, error);
        
        // 如果是贴纸且加载失败，使用默认贴纸
        if (categoryId === 'stickers') {
            console.log('加载贴纸失败，使用默认贴纸占位图像');
            materials.stickers = [
                { name: '贴纸1', url: placeholderImage },
                { name: '贴纸2', url: placeholderImage },
                { name: '贴纸3', url: placeholderImage }
            ];
            
            // 重新渲染贴纸
            renderStickers();
        } else {
            // 其他分类初始化为空数组
            materials[categoryId] = [];
        }
    }
}

// 渲染材料到UI
function renderMaterials() {
    console.log('开始渲染素材...');
    
    // 渲染贴纸
    if (materials.stickers) {
        console.log(`渲染 ${materials.stickers.length} 个贴纸`);
        renderStickers();
    }
    
    // 渲染背景
    if (materials.backgrounds) {
        console.log(`渲染 ${materials.backgrounds.length} 个背景`);
        renderBackgrounds();
    }
    
    // 渲染形状
    if (materials.shapes) {
        console.log(`渲染 ${materials.shapes.length} 个形状`);
        renderShapes();
    }
    
    // 渲染模板
    if (materials.templates) {
        console.log(`渲染 ${materials.templates.length} 个模板`);
        renderTemplates();
    }
}

// 渲染贴纸
function renderStickers() {
    const stickersContainer = document.getElementById('stickers');
    if (!stickersContainer) {
        console.error('找不到贴纸容器元素');
        return;
    }
    
    // 清空现有内容
    stickersContainer.innerHTML = '';
    
    // 添加贴纸网格
    const stickersGrid = document.createElement('div');
    stickersGrid.className = 'materials-grid';
    
    // 渲染贴纸
    if (materials.stickers && materials.stickers.length > 0) {
        materials.stickers.forEach((sticker, index) => {
            const stickerElement = document.createElement('div');
            stickerElement.className = 'material-item';
            stickerElement.innerHTML = `
                <img src="${sticker.url}" alt="${sticker.name}" loading="lazy">
                <div class="material-name">${sticker.name}</div>
            `;
            stickerElement.addEventListener('click', () => addSticker(sticker));
            stickersGrid.appendChild(stickerElement);
        });
    } else {
        // 如果没有贴纸，显示提示信息
        const noStickers = document.createElement('div');
        noStickers.className = 'no-materials';
        noStickers.textContent = '暂无贴纸';
        stickersGrid.appendChild(noStickers);
    }
    
    stickersContainer.appendChild(stickersGrid);
}

// 渲染背景
function renderBackgrounds() {
    const backgroundsContainer = document.getElementById('backgrounds');
    if (!backgroundsContainer) {
        console.error('找不到背景容器元素');
        return;
    }
    
    // 清空现有内容
    backgroundsContainer.innerHTML = '';
    
    // 添加背景网格
    const backgroundsGrid = document.createElement('div');
    backgroundsGrid.className = 'materials-grid';
    
    // 渲染背景
    if (materials.backgrounds && materials.backgrounds.length > 0) {
        materials.backgrounds.forEach((background, index) => {
            const backgroundElement = document.createElement('div');
            backgroundElement.className = 'material-item';
            backgroundElement.innerHTML = `
                <img src="${background.url}" alt="${background.name}" loading="lazy">
                <div class="material-name">${background.name}</div>
            `;
            backgroundElement.addEventListener('click', () => setCanvasBackground(background.url));
            backgroundsGrid.appendChild(backgroundElement);
        });
    } else {
        // 如果没有背景，显示提示信息
        const noBackgrounds = document.createElement('div');
        noBackgrounds.className = 'no-materials';
        noBackgrounds.textContent = '暂无背景';
        backgroundsGrid.appendChild(noBackgrounds);
    }
    
    backgroundsContainer.appendChild(backgroundsGrid);
}

// 渲染形状
function renderShapes() {
    // 形状已经在HTML中定义，这里可以添加额外的逻辑
    console.log('渲染形状组件');
}

// 渲染模板
function renderTemplates() {
    const templatesContainer = document.getElementById('templates-container');
    if (!templatesContainer) return;
    
    templatesContainer.innerHTML = '';
    
    if (materials.templates.length === 0) {
        templatesContainer.innerHTML = '<div class="empty-message">暂无模板</div>';
        return;
    }
    
    materials.templates.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'material-item template-item';
        templateItem.innerHTML = `
            <img src="${template.url}" alt="${template.name}" title="${template.name}">
            <div class="template-name">${template.name}</div>
        `;
        
        templateItem.addEventListener('click', () => {
            applyTemplate(template);
        });
        
        templatesContainer.appendChild(templateItem);
    });
}

// 添加材料到画布
function addMaterialToCanvas(material) {
    fabric.Image.fromURL(material.url, function(img) {
        // 设置最大尺寸，保持比例
        const maxDimension = 200;
        if (img.width > maxDimension || img.height > maxDimension) {
            if (img.width > img.height) {
                img.scaleToWidth(maxDimension);
            } else {
                img.scaleToHeight(maxDimension);
            }
        }
        
        // 设置属性
        img.set({
            left: 50,
            top: 50,
            materialId: material.id,
            materialType: material.categoryId || 'material',
            name: material.name
        });
        
        // 添加到画布并设为活动对象
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        // 更新图层面板
        updateLayerPanel();
    });
}

// 设置画布背景
function setCanvasBackground(url) {
    // 如果当前是透明背景模式，先切换回普通模式
    if (isTransparentBg) {
        toggleTransparentBg();
    }
    
    fabric.Image.fromURL(url, function(img) {
        // 调整大小以适应画布
        img.scaleToWidth(canvas.width);
        
        // 应用为背景
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
}

// 应用模板
function applyTemplate(template) {
    if (confirm('应用模板将清除当前画布内容，确定继续吗？')) {
        // 清除当前画布
        canvas.clear();
        
        // 重置背景
        canvas.backgroundColor = '#FFFFFF';
        
        // 加载模板图像作为背景或对象
        fabric.Image.fromURL(template.url, function(img) {
            if (template.isBackground) {
                // 作为背景
                img.scaleToWidth(canvas.width);
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            } else {
                // 作为普通对象
                // 调整大小以适应画布，保持比例
                const maxDimension = Math.min(canvas.width, canvas.height) * 0.8;
                if (img.width > maxDimension || img.height > maxDimension) {
                    if (img.width > img.height) {
                        img.scaleToWidth(maxDimension);
                    } else {
                        img.scaleToHeight(maxDimension);
                    }
                }
                
                // 居中
                img.set({
                    left: canvas.width / 2 - (img.width * img.scaleX) / 2,
                    top: canvas.height / 2 - (img.height * img.scaleY) / 2,
                    materialId: template.id,
                    materialType: 'template',
                    name: template.name
                });
                
                canvas.add(img);
            }
            
            canvas.renderAll();
            
            // 更新图层面板
            updateLayerPanel();
        });
    }
}

// 设置上传材料功能
function setupMaterialUpload() {
    const uploadMaterialBtn = document.getElementById('uploadMaterialBtn');
    const materialUploadInput = document.getElementById('materialUpload');
    
    if (!uploadMaterialBtn || !materialUploadInput) {
        // 创建上传材料按钮
        const stickersContainer = document.getElementById('stickers');
        if (stickersContainer) {
            const uploadContainer = document.createElement('div');
            uploadContainer.className = 'upload-material-container';
            uploadContainer.innerHTML = `
                <input type="file" id="materialUpload" accept="image/*" style="display:none;">
                <button class="upload-btn" id="uploadMaterialBtn">上传贴纸</button>
            `;
            stickersContainer.insertBefore(uploadContainer, stickersContainer.firstChild);
            
            // 获取新创建的元素
            const newUploadBtn = document.getElementById('uploadMaterialBtn');
            const newUploadInput = document.getElementById('materialUpload');
            
            if (newUploadBtn && newUploadInput) {
                newUploadBtn.addEventListener('click', () => {
                    newUploadInput.click();
                });
                
                newUploadInput.addEventListener('change', uploadMaterial);
            }
        }
    } else {
        uploadMaterialBtn.addEventListener('click', () => {
            materialUploadInput.click();
        });
        
        materialUploadInput.addEventListener('change', uploadMaterial);
    }
}

// 上传材料到服务器
function uploadMaterial(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('请选择图片文件');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'stickers');
    formData.append('name', file.name.split('.')[0]);
    formData.append('description', '用户上传的贴纸');
    
    // 显示上传进度
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress';
    progressContainer.innerHTML = `
        <div class="progress-label">正在上传: ${file.name}</div>
        <div class="progress-bar">
            <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
    `;
    
    const stickersContainer = document.getElementById('stickers');
    if (stickersContainer) {
        stickersContainer.appendChild(progressContainer);
    }
    
    fetch('/api/materials/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('上传失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 更新贴纸列表
            if (!materials.stickers) {
                materials.stickers = [];
            }
            materials.stickers.push(data.material);
            renderStickers();
            
            // 移除进度条
            if (progressContainer) {
                progressContainer.remove();
            }
            
            alert('贴纸上传成功！');
        } else {
            throw new Error(data.error || '上传失败');
        }
    })
    .catch(error => {
        console.error('上传材料失败:', error);
        alert('上传材料失败: ' + error.message);
        
        // 移除进度条
        if (progressContainer) {
            progressContainer.remove();
        }
    });
    
    // 清空文件输入
    event.target.value = '';
}

// 修改DOMContentLoaded事件监听器，添加setupMaterialUpload
document.addEventListener('DOMContentLoaded', function() {
    // 初始化画布
    initCanvas();
    
    // 从服务器获取模板和设计
    initFromServer();
    
    // 初始化素材库
    initMaterials();
    
    // 加载贴纸
    loadStickers();
    
    // 设置拖放功能
    setupDragDrop();
    
    // 设置图片上传
    setupImageUpload();
    
    // 设置材料上传
    setupMaterialUpload();
    
    // 设置工具栏
    setupToolbar();
    
    // 设置颜色选择器
    setupColorPicker();
    
    // 设置保存功能
    setupSave();
    
    // 设置清空画布功能
    setupClearCanvas();
    
    // 设置标签切换
    setupTabs();
    
    // 设置预设尺寸选择
    setupPresetSizes();
    
    // 设置自定义尺寸功能
    setupCustomSize();
    
    // 设置实时预览功能
    setupLivePreview();
    
    // 设置自定义图层控件
    setupLayerControls();
    
    // 禁用鼠标滚轮缩放，防止画布被意外缩放
    disableMouseWheelZoom();
    
    // 更新透明背景状态
    setTimeout(() => {
        if (isTransparentBg) {
            updateCanvasTransparency();
        }
    }, 500);
});

// 设置实时预览功能
function setupLivePreview() {
    // 初始化预览缩放值
    previewZoom = 1;
    
    // 创建防抖计时器变量
    let debounceTimer = null;
    
    // 在画布渲染后更新预览
    canvas.on('after:render', function() {
        // 清除之前的防抖计时器
        clearTimeout(debounceTimer);
        
        // 设置新的防抖计时器
        debounceTimer = setTimeout(updatePreview, 300);
    });
    
    // 设置预览缩放按钮
    const previewZoomInBtn = document.getElementById('previewZoomIn');
    const previewZoomOutBtn = document.getElementById('previewZoomOut');
    const previewZoomValue = document.getElementById('previewZoomValue');
    
    if (previewZoomInBtn) {
        previewZoomInBtn.addEventListener('click', () => {
            previewZoom = Math.min(previewZoom * 1.2, 3.0);
            updatePreviewZoomDisplay();
            updatePreview();
        });
    }
    
    if (previewZoomOutBtn) {
        previewZoomOutBtn.addEventListener('click', () => {
            previewZoom = Math.max(previewZoom * 0.8, 0.5);
            updatePreviewZoomDisplay();
            updatePreview();
        });
    }
    
    // 添加预览面板的其他信息
    updatePreviewInfo();
    
    // 初始化预览
    setTimeout(updatePreview, 500);
}

// 添加预览信息更新函数
function updatePreviewInfo() {
    const previewTitle = document.querySelector('.preview-title');
    if (previewTitle) {
        // 创建或获取预览信息容器
        let previewInfo = document.querySelector('.preview-info');
        if (!previewInfo) {
            previewInfo = document.createElement('div');
            previewInfo.className = 'preview-info';
            previewTitle.parentNode.insertBefore(previewInfo, previewTitle.nextSibling);
        }
        
        // 更新预览信息内容
        previewInfo.innerHTML = `<div>画布尺寸: ${canvas.width} × ${canvas.height}px</div>
                               <div>对象数量: ${canvas.getObjects().length}</div>`;
    }
    
    // 监听对象添加和移除事件
    canvas.on('object:added object:removed', updatePreviewInfo);
    
    // 监听画布尺寸变化
    canvas.on('resize', updatePreviewInfo);
}

// 更新预览缩放显示
function updatePreviewZoomDisplay() {
    const previewZoomValue = document.getElementById('previewZoomValue');
    if (previewZoomValue) {
        previewZoomValue.textContent = Math.round(previewZoom * 100) + '%';
    }
}

// 修改updatePreview函数，考虑缩放
function updatePreview() {
    try {
        const previewImage = document.getElementById('previewImage');
        if (!previewImage) return;
        
        // 临时隐藏控件，以便生成干净的预览
        hideControls();
        
        // 临时关闭绘制后的事件监听，防止递归调用
        canvas.off('after:render');
        
        // 设置比例和质量
        const scaleFactor = 0.4 * previewZoom;
        const quality = 0.7;
        
        // 获取画布数据URL
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: quality,
            multiplier: scaleFactor
        });
        
        // 设置预览图像
        previewImage.src = dataURL;
        
        // 恢复控件
        showControls();
        
        // 重新添加事件监听
        setTimeout(() => {
            canvas.on('after:render', function() {
                clearTimeout(window.previewDebounce);
                window.previewDebounce = setTimeout(updatePreview, 300);
            });
        }, 100);
        
        // 更新预览信息
        updatePreviewInfo();
    } catch (error) {
        console.error('更新预览时出错:', error);
    }
}

// 隐藏所有选中对象的控件
function hideControls() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        // 保存当前状态，以便稍后恢复
        activeObject._wasSelected = true;
        
        // 暂时隐藏控件
        activeObject.hasControls = false;
        activeObject.hasBorders = false;
        activeObject.selectable = false;
        activeObject.hoverCursor = 'default';
        
        canvas.renderAll();
    }
}

// 恢复先前隐藏的控件
function showControls() {
    canvas.getObjects().forEach(obj => {
        if (obj._wasSelected) {
            // 恢复控件
            obj.hasControls = true;
            obj.hasBorders = true;
            obj.selectable = true;
            obj.hoverCursor = 'move';
            
            // 移除临时标记
            delete obj._wasSelected;
        }
    });
    
    canvas.renderAll();
}

// 设置自定义尺寸功能
function setupCustomSize() {
    const customWidthInput = document.getElementById('customWidth');
    const customHeightInput = document.getElementById('customHeight');
    const applyButton = document.getElementById('applyCustomSize');
    
    if (!customWidthInput || !customHeightInput || !applyButton) return;
    
    applyButton.addEventListener('click', () => {
        const width = parseInt(customWidthInput.value);
        const height = parseInt(customHeightInput.value);
        
        if (isNaN(width) || isNaN(height) || width < 100 || height < 100 || width > 2000 || height > 2000) {
            alert('请输入有效的尺寸（宽和高都必须在100-2000之间）');
            return;
        }
        
        // 应用新尺寸
        resizeCanvas(width, height);
        
        // 更新预设尺寸的选中状态
        document.querySelectorAll('.preset-size').forEach(preset => {
            preset.classList.remove('active');
        });
    });
    
    // 当画布尺寸变化时，更新输入框
    canvas.on('resize', () => {
        customWidthInput.value = canvas.width;
        customHeightInput.value = canvas.height;
    });
}

// 添加画布网格
function addCanvasGrid() {
    // 移除现有的网格线
    canvas.getObjects().forEach(obj => {
        if (obj.id === 'grid') {
            canvas.remove(obj);
        }
    });
    
    // 如果网格不显示，直接返回
    if (!canvas.showGrid) {
        return;
    }
    
    // 网格大小
    const gridSize = 20;
    const width = canvas.width;
    const height = canvas.height;
    
    // 创建网格组
    const gridLines = [];
    
    // 添加垂直线
    for (let i = 0; i <= width; i += gridSize) {
        gridLines.push(new fabric.Line([i, 0, i, height], {
            stroke: '#ccc',
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            id: 'grid'
        }));
    }
    
    // 添加水平线
    for (let i = 0; i <= height; i += gridSize) {
        gridLines.push(new fabric.Line([0, i, width, i], {
            stroke: '#ccc',
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            id: 'grid'
        }));
    }
    
    // 将所有线条添加到画布
    gridLines.forEach(line => {
        canvas.add(line);
        canvas.sendToBack(line);
    });
    
    canvas.renderAll();
}

// 切换网格显示
function toggleGrid() {
    canvas.showGrid = !canvas.showGrid;
    
    // 更新按钮状态
    const gridBtn = document.getElementById('toggle-grid');
    if (gridBtn) {
        gridBtn.classList.toggle('active', canvas.showGrid);
    }
    
    // 更新网格
    addCanvasGrid();
}

// 初始化标尺
function initRuler() {
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    if (!rulerH || !rulerV) {
        console.error('找不到标尺元素');
        return;
    }
    
    // 默认隐藏标尺
    rulerH.style.display = 'none';
    rulerV.style.display = 'none';
    document.querySelector('.ruler-corner').style.display = 'none';
    
    // 绘制标尺刻度
    drawRulerMarkings();
    
    // 监听画布鼠标移动，显示当前位置
    canvas.on('mouse:move', function(options) {
        if (!isRulerVisible) return;
        
        const pointer = canvas.getPointer(options.e);
        showRulerPosition(pointer.x, pointer.y);
    });
    
    // 处理画布缩放和平移
    canvas.on('mouse:wheel', function() {
        if (isRulerVisible) {
            drawRulerMarkings();
        }
    });
}

// 绘制标尺刻度
function drawRulerMarkings() {
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    if (!rulerH || !rulerV) return;
    
    // 水平标尺
    rulerH.innerHTML = '';
    // 垂直标尺
    rulerV.innerHTML = '';
    
    // 获取画布缩放比例
    const zoom = canvas.getZoom();
    
    // 计算标尺间距（每20像素一个刻度，随缩放变化）
    const spacing = 20 * zoom;
    
    // 水平标尺刻度
    for (let i = 0; i <= canvas.width; i += 50) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        mark.style.position = 'absolute';
        mark.style.left = (i * zoom) + 'px';
        mark.style.top = '0';
        mark.style.borderLeft = '1px solid #999';
        mark.style.height = i % 100 === 0 ? '10px' : '5px';
        
        if (i % 100 === 0) {
            const label = document.createElement('span');
            label.className = 'ruler-label';
            label.style.position = 'absolute';
            label.style.left = (i * zoom + 2) + 'px';
            label.style.top = '10px';
            label.style.fontSize = '9px';
            label.textContent = i.toString();
            rulerH.appendChild(label);
        }
        
        rulerH.appendChild(mark);
    }
    
    // 垂直标尺刻度
    for (let i = 0; i <= canvas.height; i += 50) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        mark.style.position = 'absolute';
        mark.style.top = (i * zoom) + 'px';
        mark.style.left = '0';
        mark.style.borderTop = '1px solid #999';
        mark.style.width = i % 100 === 0 ? '10px' : '5px';
        
        if (i % 100 === 0) {
            const label = document.createElement('span');
            label.className = 'ruler-label';
            label.style.position = 'absolute';
            label.style.top = (i * zoom + 2) + 'px';
            label.style.left = '10px';
            label.style.fontSize = '9px';
            label.textContent = i.toString();
            rulerV.appendChild(label);
        }
        
        rulerV.appendChild(mark);
    }
}

// 显示标尺位置指示器
function showRulerPosition(x, y) {
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    
    if (!rulerH || !rulerV) return;
    
    // 移除之前的指示器
    document.querySelectorAll('.ruler-position-indicator').forEach(el => el.remove());
    
    // 计算位置，考虑缩放
    const zoom = canvas.getZoom();
    const posX = x * zoom;
    const posY = y * zoom;
    
    // 创建水平指示器
    const hIndicator = document.createElement('div');
    hIndicator.className = 'ruler-position-indicator';
    hIndicator.style.position = 'absolute';
    hIndicator.style.left = posX + 'px';
    hIndicator.style.top = '0';
    hIndicator.style.height = '20px';
    hIndicator.style.width = '1px';
    hIndicator.style.backgroundColor = 'red';
    hIndicator.style.zIndex = '10';
    rulerH.appendChild(hIndicator);
    
    // 创建垂直指示器
    const vIndicator = document.createElement('div');
    vIndicator.className = 'ruler-position-indicator';
    vIndicator.style.position = 'absolute';
    vIndicator.style.top = posY + 'px';
    vIndicator.style.left = '0';
    vIndicator.style.width = '20px';
    vIndicator.style.height = '1px';
    vIndicator.style.backgroundColor = 'red';
    vIndicator.style.zIndex = '10';
    rulerV.appendChild(vIndicator);
    
    // 显示坐标位置
    const corner = document.querySelector('.ruler-corner');
    if (corner) {
        corner.innerHTML = `<span style="font-size: 8px; color: #333;">${Math.round(x)},${Math.round(y)}</span>`;
    }
}

// 切换标尺显示状态
function toggleRuler() {
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    const corner = document.querySelector('.ruler-corner');
    const toggleRulerBtn = document.getElementById('toggleRuler');
    
    if (!rulerH || !rulerV || !corner || !toggleRulerBtn) {
        console.error('找不到标尺相关元素');
        return;
    }
    
    isRulerVisible = !isRulerVisible;
    
    if (isRulerVisible) {
        rulerH.style.display = 'block';
        rulerV.style.display = 'block';
        corner.style.display = 'block';
        toggleRulerBtn.classList.add('active');
        
        // 绘制标尺刻度
        drawRulerMarkings();
    } else {
        rulerH.style.display = 'none';
        rulerV.style.display = 'none';
        corner.style.display = 'none';
        toggleRulerBtn.classList.remove('active');
    }
}

// 添加图层上移下移按钮
function setupLayerControls() {
    // 创建上移图标
    const layerUpIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#1976d2" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
    const layerUpBlob = new Blob([layerUpIcon], { type: 'image/svg+xml;charset=utf-8' });
    const layerUpImg = new Image();
    layerUpImg.src = URL.createObjectURL(layerUpBlob);
    
    // 创建下移图标
    const layerDownIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#1976d2" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;
    const layerDownBlob = new Blob([layerDownIcon], { type: 'image/svg+xml;charset=utf-8' });
    const layerDownImg = new Image();
    layerDownImg.src = URL.createObjectURL(layerDownBlob);
    
    // 渲染图标的函数
    const renderIcon = function(icon) {
        return function(ctx, left, top, styleOverride, fabricObject) {
            const size = this.cornerSize;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(icon, -size/2, -size/2, size, size);
            ctx.restore();
        };
    };
    
    // 移动图层的函数
    const moveLayer = function(transform, forward) {
        const target = transform.target;
        const canvas = target.canvas;
        if (forward) {
            canvas.bringForward(target);
        } else {
            canvas.sendBackwards(target);
        }
        updateLayerPanel();
    };
    
    // 添加自定义控件
    fabric.Object.prototype.controls.layerUp = new fabric.Control({
        x: 0.5,
        y: 0,
        offsetX: 30,
        offsetY: -22,
        cursorStyle: 'pointer',
        mouseUpHandler: function(eventData, transform) { 
            moveLayer(transform, true);
            return true;
        },
        render: renderIcon(layerUpImg),
        cornerSize: 28
    });
    
    fabric.Object.prototype.controls.layerDown = new fabric.Control({
        x: 0.5,
        y: 0,
        offsetX: 30,
        offsetY: 22,
        cursorStyle: 'pointer',
        mouseUpHandler: function(eventData, transform) { 
            moveLayer(transform, false);
            return true;
        },
        render: renderIcon(layerDownImg),
        cornerSize: 28
    });
}

// 根据窗口大小自动调整画布
function resizeCanvas() {
    if (!canvas) return;
    
    // 计算画布大小以适应屏幕
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // 左右面板的宽度
    const leftPanelWidth = document.querySelector('.left-panel')?.offsetWidth || 250;
    const rightPanelWidth = document.querySelector('.right-panel')?.offsetWidth || 250;
    
    // 计算画布最大可用空间
    const maxCanvasWidth = containerWidth - leftPanelWidth - rightPanelWidth - 60;
    const maxCanvasHeight = containerHeight - 100;
    
    // 获取画布当前大小
    const currentWidth = canvas.getWidth();
    const currentHeight = canvas.getHeight();
    
    // 如果当前画布大小超过最大可用空间，调整大小
    if (currentWidth > maxCanvasWidth || currentHeight > maxCanvasHeight) {
        // 保持宽高比
        const ratio = currentWidth / currentHeight;
        
        let newWidth, newHeight;
        
        if (currentWidth > maxCanvasWidth) {
            newWidth = maxCanvasWidth;
            newHeight = newWidth / ratio;
            
            if (newHeight > maxCanvasHeight) {
                newHeight = maxCanvasHeight;
                newWidth = newHeight * ratio;
            }
        } else {
            newHeight = maxCanvasHeight;
            newWidth = newHeight * ratio;
        }
        
        // 更新画布大小
        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);
        canvas.renderAll();
        
        // 更新canvas-container-wrapper高度
        const wrapper = document.querySelector('.canvas-container-wrapper');
        if (wrapper) {
            wrapper.style.height = `${maxCanvasHeight}px`;
        }
        
        // 更新标尺
        if (typeof drawRulerMarkings === 'function' && isRulerVisible) {
            drawRulerMarkings();
        }
        
        // 更新透明背景棋盘格位置
        if (isTransparentBg) {
            updateCheckerboardPosition();
        }
        
        console.log(`窗口大小变化，调整画布大小: ${newWidth}x${newHeight}`);
    }
    
    // 更新预览
    updatePreview();
}

// 更新透明背景棋盘格位置和大小
function updateCheckerboardPosition(forceUpdate = false) {
    if (!isTransparentBg) return;
    
    const gridPattern = document.getElementById('checker-pattern');
    if (!gridPattern) {
        console.error('找不到棋盘格背景元素');
        return;
    }
    
    // 获取canvas元素
    const lowerCanvas = document.querySelector('.lower-canvas');
    const upperCanvas = document.querySelector('.upper-canvas');
    if (!lowerCanvas || !upperCanvas) {
        console.error('找不到Fabric.js的上层或下层画布');
        return;
    }
    
    try {
        // 获取画布的实际尺寸和位置
        const canvasWidth = lowerCanvas.width;
        const canvasHeight = lowerCanvas.height;
        const canvasLeft = lowerCanvas.offsetLeft;
        const canvasTop = lowerCanvas.offsetTop;
        
        // 设置棋盘格的尺寸和位置，确保与画布完全匹配
        gridPattern.style.width = `${canvasWidth}px`;
        gridPattern.style.height = `${canvasHeight}px`;
        gridPattern.style.left = `${canvasLeft}px`;
        gridPattern.style.top = `${canvasTop}px`;
        
        // 获取当前缩放级别
        const zoom = canvas.getZoom();
        
        // 调整棋盘格图案的大小以适应缩放
        const patternSize = Math.max(5, Math.floor(20 / zoom));
        const halfSize = Math.floor(patternSize / 2);
        
        // 考虑平移位置
        const vpt = canvas.viewportTransform;
        const translateX = vpt[4] % patternSize;
        const translateY = vpt[5] % patternSize;
        
        // 更新棋盘格的背景图案大小和位置
        gridPattern.style.backgroundSize = `${patternSize}px ${patternSize}px`;
        gridPattern.style.backgroundPosition = 
            `${translateX}px ${translateY}px, 
             ${translateX}px ${translateY + halfSize}px, 
             ${translateX + halfSize}px ${translateY - halfSize}px, 
             ${translateX - halfSize}px ${translateY}px`;
        
        // 确保棋盘格始终位于最底层，但在背景之上
        gridPattern.style.zIndex = '-1';
        
        if (forceUpdate) {
            console.log('强制更新透明背景棋盘格 - 尺寸:', canvasWidth, 'x', canvasHeight, 
                        '位置:', canvasLeft, ',', canvasTop, '缩放:', zoom);
        } else {
            console.log('透明背景棋盘格位置已更新');
        }
    } catch (error) {
        console.error('更新棋盘格位置时出错:', error);
    }
}

// 调整画布大小
function resizeCanvas(width, height) {
    if (!width || !height) {
        console.error('调整画布大小时需要提供有效的宽度和高度');
        return;
    }
    
    try {
        // 记录当前的zoom和viewport transform
        const currentZoom = canvas.getZoom();
        const currentTranslateX = canvas.viewportTransform[4];
        const currentTranslateY = canvas.viewportTransform[5];
        
        // 获取原始尺寸
        const originalWidth = canvas.getWidth();
        const originalHeight = canvas.getHeight();
        
        // 计算比例因子
        const scaleX = width / originalWidth;
        const scaleY = height / originalHeight;
        
        // 记录所有对象的当前位置和尺寸
        const objects = canvas.getObjects();
        const activeObject = canvas.getActiveObject();
        
        // 调整画布大小
        canvas.setWidth(width);
        canvas.setHeight(height);
        
        // 根据新尺寸调整所有对象的位置
        objects.forEach(obj => {
            // 如果对象没有特定的位置属性，跳过
            if (obj.left === undefined || obj.top === undefined) {
                return;
            }
            
            // 调整对象位置，保持相对位置不变
            obj.set({
                left: obj.left * scaleX,
                top: obj.top * scaleY,
                scaleX: obj.scaleX * scaleX,
                scaleY: obj.scaleY * scaleY
            });
            
            // 设置新的原点位置，如果有的话
            if (obj.originX !== undefined && obj.originY !== undefined) {
                obj.setCoords();
            }
        });
        
        // 更新viewport transform以保持视图位置
        canvas.setViewportTransform([
            currentZoom, 0, 
            0, currentZoom, 
            currentTranslateX * scaleX, 
            currentTranslateY * scaleY
        ]);
        
        // 重新激活之前选择的对象
        if (activeObject) {
            canvas.setActiveObject(activeObject);
        }
        
        // 刷新画布
        canvas.renderAll();
        
        // 更新标尺（如果启用）
        if (typeof drawRulerMarkings === 'function' && isRulerVisible) {
            drawRulerMarkings();
        }
        
        // 更新预览
        updatePreview();
        
        // 如果透明背景启用，更新棋盘格位置
        if (isTransparentBg) {
            updateCheckerboardPosition();
        }
        
        // 更新预设尺寸的选中状态
        document.querySelectorAll('.preset-size').forEach(preset => {
            const presetWidth = parseInt(preset.getAttribute('data-width'));
            const presetHeight = parseInt(preset.getAttribute('data-height'));
            
            if (presetWidth === width && presetHeight === height) {
                preset.classList.add('active');
            } else {
                preset.classList.remove('active');
            }
        });
        
        // 更新自定义尺寸输入框
        const customWidthInput = document.getElementById('customWidth');
        const customHeightInput = document.getElementById('customHeight');
        
        if (customWidthInput && customHeightInput) {
            customWidthInput.value = width;
            customHeightInput.value = height;
        }
        
        console.log(`画布大小已调整为 ${width}x${height}`);
    } catch (error) {
        console.error('调整画布大小时出错:', error);
    }
}

// 初始化鼠标滚轮缩放和平移功能
function setupMouseWheelZoom() {
    // 移除之前可能存在的事件监听器
    canvas.off('mouse:wheel');
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    
    // 跟踪鼠标状态
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;
    let isSpacePressed = false;
    
    // 跟踪键盘空格键状态
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.keyCode === 32) {
            isSpacePressed = true;
            document.body.style.cursor = 'grab';
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.keyCode === 32) {
            isSpacePressed = false;
            document.body.style.cursor = 'default';
        }
    });
    
    // 滚轮缩放 - 默认行为是滚轮直接缩放整个画布，不需要按住Alt键
    canvas.on('mouse:wheel', function(opt) {
        try {
            const e = opt.e;
            if (!e) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // 获取当前缩放和鼠标位置
            const delta = e.deltaY;
            const zoom = canvas.getZoom();
            
            // 安全检查 - 确保canvas有正确的viewportTransform
            if (!canvas.viewportTransform) {
                console.error('滚轮缩放错误：canvas.viewportTransform未定义');
                return;
            }
            
            // 获取鼠标在canvas中的坐标
            const pointer = canvas.getPointer(e);
            const point = {
                x: pointer.x,
                y: pointer.y
            };
            
            // 计算新的缩放值
            let newZoom;
            const scaleFactor = 0.05; // 缩放步长
            
            // 根据滚轮方向计算新的缩放值
            if (delta < 0) {
                // 放大
                newZoom = Math.min(zoom * (1 + scaleFactor), 10.0);
            } else {
                // 缩小
                newZoom = Math.max(zoom * (1 - scaleFactor), 0.1);
            }
            
            if (newZoom !== zoom) {
                try {
                    // 使用zoomToPoint而不是setZoom，确保以鼠标位置为中心缩放
                    canvas.zoomToPoint(point, newZoom);
                    
                    // 更新缩放显示
                    updateZoomDisplay(newZoom);
                    
                    // 检查透明背景，更新棋盘格位置
                    if (isTransparentBg) {
                        requestAnimationFrame(updateCheckerboardPosition);
                    }
                    
                    // 更新标尺（如果启用）
                    if (isRulerVisible) {
                        requestAnimationFrame(drawRulerMarkings);
                    }
                    
                    // 触发自定义事件，通知其他组件缩放已更改
                    canvas.fire('zoom:changed', { zoom: newZoom });
                } catch (zoomError) {
                    console.error('应用缩放时出错:', zoomError);
                }
            }
        } catch (error) {
            console.error('鼠标滚轮事件处理出错:', error);
        }
    });
    
    // 鼠标按下，开始拖动
    canvas.on('mouse:down', function(opt) {
        const e = opt.e;
        
        // 如果选中了对象或者没有按空格键，不进行画布拖动
        if (canvas.getActiveObject() && !isSpacePressed) {
            return;
        }
        
        // 设置拖动状态
        if (isSpacePressed || !canvas.getActiveObject()) {
            isDragging = true;
            canvas.selection = false;
            lastPosX = e.clientX;
            lastPosY = e.clientY;
            document.body.style.cursor = 'grabbing';
        }
    });
    
    // 鼠标移动，更新画布位置
    canvas.on('mouse:move', function(opt) {
        if (isDragging) {
            const e = opt.e;
            const vpt = canvas.viewportTransform;
            
            // 计算位移
            const deltaX = e.clientX - lastPosX;
            const deltaY = e.clientY - lastPosY;
            
            // 更新画布视口变换矩阵
            vpt[4] += deltaX;
            vpt[5] += deltaY;
            
            // 应用变换
            canvas.setViewportTransform(vpt);
            
            // 保存当前位置
            lastPosX = e.clientX;
            lastPosY = e.clientY;
            
            // 如果有透明背景，更新棋盘格位置
            if (isTransparentBg) {
                updateCheckerboardPosition();
            }
            
            // 更新标尺位置（如果启用）
            if (isRulerVisible) {
                drawRulerMarkings();
            }
            
            // 防止选择对象
            if (opt.target) {
                opt.target.selectable = false;
            }
        }
    });
    
    // 鼠标释放，结束拖动
    canvas.on('mouse:up', function() {
        isDragging = false;
        canvas.selection = true;
        document.body.style.cursor = isSpacePressed ? 'grab' : 'default';
        
        // 恢复对象的可选择性
        canvas.getObjects().forEach(obj => {
            if (!obj.locked) {
                obj.selectable = true;
            }
        });
    });
    
    // 设置缩放按钮事件
    setupZoomButtons();
}

// 设置缩放按钮
function setupZoomButtons() {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            const zoom = canvas.getZoom();
            const newZoom = Math.min(zoom * 1.1, 10.0);
            
            // 以画布中心为缩放点
            const center = {
                x: canvas.width / 2,
                y: canvas.height / 2
            };
            
            canvas.zoomToPoint(center, newZoom);
            updateZoomDisplay(newZoom);
            
            // 更新透明背景和标尺
            if (isTransparentBg) updateCheckerboardPosition();
            if (isRulerVisible) drawRulerMarkings();
            
            canvas.fire('zoom:changed', { zoom: newZoom });
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            const zoom = canvas.getZoom();
            const newZoom = Math.max(zoom * 0.9, 0.1);
            
            // 以画布中心为缩放点
            const center = {
                x: canvas.width / 2,
                y: canvas.height / 2
            };
            
            canvas.zoomToPoint(center, newZoom);
            updateZoomDisplay(newZoom);
            
            // 更新透明背景和标尺
            if (isTransparentBg) updateCheckerboardPosition();
            if (isRulerVisible) drawRulerMarkings();
            
            canvas.fire('zoom:changed', { zoom: newZoom });
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', function() {
            // 重置缩放为1
            canvas.setZoom(1);
            
            // 重置视口变换，将画布居中
            const vpt = canvas.viewportTransform;
            vpt[4] = 0;
            vpt[5] = 0;
            canvas.setViewportTransform(vpt);
            
            updateZoomDisplay(1);
            
            // 更新透明背景和标尺
            if (isTransparentBg) updateCheckerboardPosition();
            if (isRulerVisible) drawRulerMarkings();
            
            canvas.fire('zoom:changed', { zoom: 1 });
        });
    }
}

// 更新缩放显示
function updateZoomDisplay(zoom) {
    const zoomResetBtn = document.getElementById('zoomReset');
    if (zoomResetBtn) {
        zoomResetBtn.textContent = Math.round(zoom * 100) + '%';
    }
}

// 处理页面可见性变化事件
function handleVisibilityChange() {
    if (document.hidden) {
        // 页面被最小化或切换到后台
        isWindowVisible = false;
        console.log('页面不可见，暂停某些操作');
    } else {
        // 页面恢复可见
        isWindowVisible = true;
        console.log('页面重新可见，恢复操作');
        
        // 重新初始化关键组件
        setTimeout(() => {
            try {
                // 如果画布存在，修复其状态
                if (canvas) {
                    // 强制刷新画布显示
                    canvas.renderAll();
                    
                    // 如果是透明背景模式，重新设置
                    if (isTransparentBg) {
                        // 尝试修复透明背景
                        updateCanvasTransparency();
                    }
                    
                    // 更新预览
                    if (typeof updatePreview === 'function') {
                        updatePreview();
                    }
                    
                    // 更新图层面板
                    if (typeof updateLayerPanel === 'function') {
                        updateLayerPanel();
                    }
                }
            } catch (error) {
                console.error('恢复页面可见性时出错:', error);
            }
        }, 300);
    }
}

// 禁用鼠标滚轮缩放功能
function disableMouseWheelZoom() {
    // 移除之前可能存在的鼠标滚轮事件监听器
    canvas.off('mouse:wheel');
    
    // 阻止鼠标滚轮在画布上触发缩放
    canvas.on('mouse:wheel', function(opt) {
        const e = opt.e;
        // 阻止默认行为，但不执行缩放
        e.preventDefault();
        e.stopPropagation();
    });
    
    // 重置画布缩放为1
    canvas.setZoom(1);
    
    // 重置视口变换，将画布居中
    const vpt = canvas.viewportTransform;
    if (vpt) {
        vpt[0] = 1;  // scaleX
        vpt[3] = 1;  // scaleY
        vpt[4] = 0;  // translateX
        vpt[5] = 0;  // translateY
        canvas.setViewportTransform(vpt);
        canvas.renderAll();
    }
    
    // 更新缩放显示
    const zoomResetBtn = document.getElementById('zoomReset');
    if (zoomResetBtn) {
        zoomResetBtn.textContent = '100%';
    }
    
    console.log('已禁用鼠标滚轮缩放功能');
}