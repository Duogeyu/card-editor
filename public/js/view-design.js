// 全局变量
let canvas;
let currentDesign;
let isEditMode = false;
let isTransparentBg = false;
let layerCount = 0;

// 初始化画布
function initCanvas(width, height, backgroundColor) {
    // 创建Fabric.js画布
    canvas = new fabric.Canvas('designCanvas', {
        width: width || 600,
        height: height || 600,
        backgroundColor: backgroundColor || '#FFFFFF',
        selection: true,
        renderOnAddRemove: true
    });
    
    // 默认禁用所有编辑功能（查看模式）
    canvas.selection = false;
    canvas.interactive = false;
    
    // 添加事件监听
    canvas.on('object:added', function() {
        updateLayerPanel();
    });
    
    canvas.on('object:removed', function() {
        updateLayerPanel();
    });
    
    canvas.on('selection:created', function() {
        updatePropertiesPanel();
    });
    
    canvas.on('selection:updated', function() {
        updatePropertiesPanel();
    });
    
    canvas.on('selection:cleared', function() {
        clearPropertiesPanel();
    });
}

// 切换编辑模式
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    // 更新UI
    const editModeBtn = document.getElementById('editModeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const editToolbar = document.getElementById('editToolbar');
    const propertiesPanel = document.getElementById('propertiesPanel');
    const layerPanel = document.getElementById('layerPanel');
    
    if (isEditMode) {
        editModeBtn.textContent = '退出编辑模式';
        saveBtn.style.display = 'inline-block';
        editToolbar.style.display = 'block';
        propertiesPanel.style.display = 'block';
        layerPanel.style.display = 'block';
        
        // 启用画布交互
        enableCanvasEditing();
        
        // 更新图层面板
        updateLayerPanel();
    } else {
        editModeBtn.textContent = '进入编辑模式';
        saveBtn.style.display = 'none';
        editToolbar.style.display = 'none';
        propertiesPanel.style.display = 'none';
        layerPanel.style.display = 'none';
        
        // 禁用画布交互
        disableCanvasEditing();
    }
}

// 启用画布编辑功能
function enableCanvasEditing() {
    canvas.selection = true;
    canvas.interactive = true;
    
    // 允许对象被选中和移动
    canvas.forEachObject(function(obj) {
        obj.selectable = true;
        obj.evented = true;
    });
    
    canvas.renderAll();
}

// 禁用画布编辑功能
function disableCanvasEditing() {
    canvas.selection = false;
    canvas.interactive = false;
    
    // 禁止对象被选中和移动
    canvas.forEachObject(function(obj) {
        obj.selectable = false;
        obj.evented = false;
    });
    
    canvas.discardActiveObject();
    canvas.renderAll();
}

// 清空属性面板
function clearPropertiesPanel() {
    const propertyControls = document.getElementById('propertyControls');
    propertyControls.innerHTML = '<div class="no-selection">未选中对象</div>';
}

// 更新属性面板
function updatePropertiesPanel() {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
        clearPropertiesPanel();
        return;
    }
    
    const propertyControls = document.getElementById('propertyControls');
    propertyControls.innerHTML = '';
    
    // 通用属性
    addPropertyControl(propertyControls, '位置 X', 'number', activeObject.left, function(value) {
        activeObject.set('left', parseInt(value, 10));
        canvas.renderAll();
    });
    
    addPropertyControl(propertyControls, '位置 Y', 'number', activeObject.top, function(value) {
        activeObject.set('top', parseInt(value, 10));
        canvas.renderAll();
    });
    
    addPropertyControl(propertyControls, '旋转', 'number', activeObject.angle, function(value) {
        activeObject.set('angle', parseInt(value, 10));
        canvas.renderAll();
    });
    
    addPropertyControl(propertyControls, '透明度', 'range', activeObject.opacity * 100, function(value) {
        activeObject.set('opacity', parseInt(value, 10) / 100);
        canvas.renderAll();
    }, { min: 0, max: 100 });
    
    // 根据对象类型显示特定属性
    if (activeObject.type === 'textbox' || activeObject.type === 'i-text') {
        addPropertyControl(propertyControls, '文本', 'text', activeObject.text, function(value) {
            activeObject.set('text', value);
            canvas.renderAll();
        });
        
        addPropertyControl(propertyControls, '字体大小', 'number', activeObject.fontSize, function(value) {
            activeObject.set('fontSize', parseInt(value, 10));
            canvas.renderAll();
        });
        
        addPropertyControl(propertyControls, '颜色', 'color', activeObject.fill, function(value) {
            activeObject.set('fill', value);
            canvas.renderAll();
        });
    } else if (activeObject.type === 'rect' || activeObject.type === 'circle') {
        addPropertyControl(propertyControls, '填充颜色', 'color', activeObject.fill, function(value) {
            activeObject.set('fill', value);
            canvas.renderAll();
        });
        
        addPropertyControl(propertyControls, '边框颜色', 'color', activeObject.stroke, function(value) {
            activeObject.set('stroke', value);
            canvas.renderAll();
        });
        
        addPropertyControl(propertyControls, '边框宽度', 'number', activeObject.strokeWidth, function(value) {
            activeObject.set('strokeWidth', parseInt(value, 10));
            canvas.renderAll();
        });
    } else if (activeObject.type === 'image') {
        // 图片特有属性
    }
}

// 添加属性控件
function addPropertyControl(container, label, type, value, onChange, options = {}) {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'property-control';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    controlContainer.appendChild(labelElement);
    
    let inputElement;
    
    if (type === 'text') {
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = value || '';
    } else if (type === 'number') {
        inputElement = document.createElement('input');
        inputElement.type = 'number';
        inputElement.value = value || 0;
        if (options.min !== undefined) inputElement.min = options.min;
        if (options.max !== undefined) inputElement.max = options.max;
    } else if (type === 'color') {
        inputElement = document.createElement('input');
        inputElement.type = 'color';
        inputElement.value = value || '#000000';
    } else if (type === 'range') {
        inputElement = document.createElement('input');
        inputElement.type = 'range';
        inputElement.value = value || 0;
        inputElement.min = options.min || 0;
        inputElement.max = options.max || 100;
    } else if (type === 'checkbox') {
        inputElement = document.createElement('input');
        inputElement.type = 'checkbox';
        inputElement.checked = value || false;
    } else if (type === 'select') {
        inputElement = document.createElement('select');
        if (options.options) {
            options.options.forEach(function(option) {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                if (option.value === value) {
                    optionElement.selected = true;
                }
                inputElement.appendChild(optionElement);
            });
        }
    }
    
    if (inputElement) {
        inputElement.addEventListener('change', function() {
            let value;
            if (type === 'checkbox') {
                value = this.checked;
            } else {
                value = this.value;
            }
            onChange(value);
        });
        controlContainer.appendChild(inputElement);
    }
    
    container.appendChild(controlContainer);
}

// 更新图层面板
function updateLayerPanel() {
    const layerList = document.getElementById('layerList');
    layerList.innerHTML = '';
    
    if (!canvas || !canvas.getObjects().length) {
        layerList.innerHTML = '<div class="no-layers">暂无图层</div>';
        return;
    }
    
    // 反向遍历画布对象（从上到下）
    const objects = canvas.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        addLayerItem(layerList, obj, i);
    }
}

// 添加图层项
function addLayerItem(container, obj, index) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.dataset.index = index;
    
    // 如果是当前选中的对象，添加active类
    if (canvas.getActiveObject() === obj) {
        layerItem.classList.add('active');
    }
    
    // 图层可见性按钮
    const visibilityBtn = document.createElement('span');
    visibilityBtn.className = 'layer-visibility' + (obj.visible === false ? ' hidden' : '');
    visibilityBtn.innerHTML = obj.visible === false ? '👁️‍🗨️' : '👁️';
    visibilityBtn.title = obj.visible === false ? '显示' : '隐藏';
    visibilityBtn.onclick = function(e) {
        e.stopPropagation();
        obj.visible = !obj.visible;
        this.innerHTML = obj.visible ? '👁️' : '👁️‍🗨️';
        this.title = obj.visible ? '隐藏' : '显示';
        this.className = 'layer-visibility' + (obj.visible === false ? ' hidden' : '');
        canvas.renderAll();
    };
    
    // 图层名称
    const layerName = document.createElement('span');
    layerName.className = 'layer-name';
    layerName.textContent = getLayerName(obj);
    
    // 图层锁定按钮
    const lockBtn = document.createElement('span');
    lockBtn.className = 'layer-lock' + (obj.lockMovementX && obj.lockMovementY ? ' locked' : '');
    lockBtn.innerHTML = obj.lockMovementX && obj.lockMovementY ? '🔒' : '🔓';
    lockBtn.title = obj.lockMovementX && obj.lockMovementY ? '解锁' : '锁定';
    lockBtn.onclick = function(e) {
        e.stopPropagation();
        const locked = obj.lockMovementX && obj.lockMovementY;
        obj.lockMovementX = obj.lockMovementY = !locked;
        this.innerHTML = !locked ? '🔒' : '🔓';
        this.title = !locked ? '解锁' : '锁定';
        this.className = 'layer-lock' + (!locked ? ' locked' : '');
        canvas.renderAll();
    };
    
    // 图层删除按钮
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'layer-delete';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = '删除';
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirm('确定要删除这个图层吗？')) {
            canvas.remove(obj);
            canvas.renderAll();
            updateLayerPanel();
        }
    };
    
    // 点击图层项选中对应的对象
    layerItem.onclick = function() {
        canvas.discardActiveObject();
        canvas.setActiveObject(obj);
        canvas.renderAll();
        updateLayerPanel();
        updatePropertiesPanel();
    };
    
    layerItem.appendChild(visibilityBtn);
    layerItem.appendChild(layerName);
    layerItem.appendChild(lockBtn);
    layerItem.appendChild(deleteBtn);
    
    container.appendChild(layerItem);
}

// 获取图层名称
function getLayerName(obj) {
    if (obj.name) {
        return obj.name;
    }
    
    if (obj.type === 'textbox' || obj.type === 'i-text') {
        return '文本: ' + (obj.text.substring(0, 15) + (obj.text.length > 15 ? '...' : ''));
    } else if (obj.type === 'rect') {
        return '矩形';
    } else if (obj.type === 'circle') {
        return '圆形';
    } else if (obj.type === 'image') {
        return '图片';
    } else if (obj.type === 'group') {
        return '组合';
    } else {
        return '图层 ' + obj.id;
    }
}

// 加载设计
async function loadDesign() {
    try {
        // 获取URL参数中的设计ID
        const urlParams = new URLSearchParams(window.location.search);
        const designId = urlParams.get('id');
        
        if (!designId) {
            throw new Error('未提供设计ID');
        }
        
        // 获取设计数据
        const response = await fetch(`/api/designs/${designId}`);
        if (!response.ok) {
            throw new Error('获取设计失败');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '获取设计失败');
        }
        
        currentDesign = result.design;
        isTransparentBg = currentDesign.isTransparentBg;
        
        // 更新设计信息
        document.getElementById('designName').textContent = currentDesign.name;
        document.getElementById('designCreatedAt').textContent = new Date(currentDesign.createdAt).toLocaleString();
        document.getElementById('designSize').textContent = `${currentDesign.width} × ${currentDesign.height}`;
        
        // 更新模板信息（如果有）
        if (currentDesign.template) {
            document.getElementById('designTemplate').textContent = currentDesign.template.name;
        } else {
            document.getElementById('designTemplate').textContent = '未使用模板';
        }
        
        console.log('加载设计数据:', currentDesign);
        
        // 使用设计的原始尺寸初始化画布
        initCanvas(currentDesign.width, currentDesign.height);
        
        // 处理透明背景
        if (currentDesign.isTransparentBg) {
            canvas.backgroundColor = null;
            const canvasContainer = document.querySelector('.canvas-container');
            canvasContainer.classList.add('transparent-bg');
            
            // 如果有透明背景按钮，更新其状态
            const transparentBgBtn = document.getElementById('transparentBgBtn');
            if (transparentBgBtn) {
                transparentBgBtn.classList.add('active');
            }
        } else {
            canvas.backgroundColor = '#FFFFFF';
        }
        
        // 确保objects是数组
        if (!Array.isArray(currentDesign.objects)) {
            console.error('设计对象格式不正确:', currentDesign.objects);
            try {
                // 尝试解析JSON字符串
                if (typeof currentDesign.objects === 'string') {
                    currentDesign.objects = JSON.parse(currentDesign.objects);
                    console.log('解析后的对象:', currentDesign.objects);
                }
            } catch (e) {
                console.error('解析设计对象失败:', e);
                alert('设计数据格式不正确，无法显示');
                return;
            }
        }
        
        // 准备画布状态对象
        const canvasData = {
            version: '5.3.0',
            objects: currentDesign.objects || [],
            background: canvas.backgroundColor,
            width: currentDesign.width,
            height: currentDesign.height
        };
        
        // 加载设计对象
        try {
            console.log('加载到画布的数据:', canvasData);
            canvas.loadFromJSON(canvasData, function() {
                console.log('加载完成，画布对象数量:', canvas.getObjects().length);
                
                // 默认视图模式，禁用所有对象的交互
                canvas.getObjects().forEach(obj => {
                    obj.selectable = false;
                    obj.evented = false;
                    // 确保每个对象都有ID
                    if (!obj.id) {
                        obj.id = obj.type + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    }
                    console.log('对象:', obj.type, obj.left, obj.top, obj.width, obj.height);
                });
                
                canvas.renderAll();
                
                // 创建响应式布局
                setupResponsiveCanvas();
            });
        } catch (err) {
            console.error('加载设计到画布失败:', err);
            alert('加载设计视图失败: ' + err.message);
        }
    } catch (error) {
        console.error('加载设计失败:', error);
        alert('加载设计失败: ' + error.message);
    }
}

// 创建响应式画布
function setupResponsiveCanvas() {
    // 获取容器尺寸
    const containerWidth = document.querySelector('.canvas-container').clientWidth - 40;
    const containerHeight = window.innerHeight * 0.6; // 使用视口高度的60%作为容器高度
    
    // 计算最佳缩放比例
    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1); // 不超过1:1
    
    console.log('容器尺寸:', containerWidth, containerHeight);
    console.log('设计尺寸:', canvas.width, canvas.height);
    console.log('缩放比例:', scale);
    
    // 使用CSS缩放，保持内部坐标不变
    const canvasEl = document.getElementById('designCanvas');
    canvasEl.style.transformOrigin = 'top left';
    canvasEl.style.transform = `scale(${scale})`;
    
    // 调整容器尺寸以适应缩放后的画布
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.width = (canvas.width * scale) + 'px';
    canvasContainer.style.height = (canvas.height * scale) + 'px';
    canvasContainer.style.margin = 'auto';
    
    // 窗口大小变化时重新调整
    window.addEventListener('resize', function() {
        setupResponsiveCanvas();
    });
}

// 下载设计
function downloadDesign() {
    try {
        if (!canvas) {
            throw new Error('画布未初始化');
        }
        
        // 将画布内容导出为图片
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        });
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = `${currentDesign.name || 'design'}.png`;
        
        // 触发下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('下载设计失败:', error);
        alert('下载设计失败: ' + error.message);
    }
}

// 添加文本
function addText() {
    const text = new fabric.Textbox('双击编辑文本', {
        left: 50,
        top: 50,
        fontSize: 20,
        fill: '#000000',
        width: 200,
        editable: true,
        id: 'text_' + Date.now()
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    updateLayerPanel();
    updatePropertiesPanel();
}

// 添加矩形
function addRect() {
    const rect = new fabric.Rect({
        left: 50,
        top: 50,
        fill: '#4CAF50',
        width: 100,
        height: 100,
        strokeWidth: 0,
        id: 'rect_' + Date.now()
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    updateLayerPanel();
    updatePropertiesPanel();
}

// 添加圆形
function addCircle() {
    const circle = new fabric.Circle({
        left: 50,
        top: 50,
        fill: '#2196F3',
        radius: 50,
        strokeWidth: 0,
        id: 'circle_' + Date.now()
    });
    
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    updateLayerPanel();
    updatePropertiesPanel();
}

// 上传图片
function uploadImage() {
    const input = document.getElementById('imageUpload');
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgObj = new Image();
            imgObj.src = event.target.result;
            imgObj.onload = function() {
                const image = new fabric.Image(imgObj, {
                    left: 50,
                    top: 50,
                    angle: 0,
                    id: 'image_' + Date.now()
                });
                
                // 缩放图片以适应画布
                const maxDimension = Math.max(image.width, image.height);
                const scaleFactor = maxDimension > 300 ? 300 / maxDimension : 1;
                image.scale(scaleFactor);
                
                canvas.add(image);
                canvas.setActiveObject(image);
                canvas.renderAll();
                updateLayerPanel();
                updatePropertiesPanel();
            };
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

// 删除选中对象
function deleteSelection() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        if (confirm('确定要删除选中的对象吗？')) {
            canvas.remove(activeObject);
            canvas.renderAll();
            updateLayerPanel();
            clearPropertiesPanel();
        }
    } else {
        alert('请先选择要删除的对象');
    }
}

// 上移一层
function bringForward() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.bringForward(activeObject);
        canvas.renderAll();
        updateLayerPanel();
    } else {
        alert('请先选择要操作的对象');
    }
}

// 下移一层
function sendBackward() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.sendBackward(activeObject);
        canvas.renderAll();
        updateLayerPanel();
    } else {
        alert('请先选择要操作的对象');
    }
}

// 复制选中对象
function duplicateSelection() {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
        alert('请先选择要复制的对象');
        return;
    }
    
    activeObject.clone(function(cloned) {
        cloned.set({
            left: cloned.left + 20,
            top: cloned.top + 20,
            id: cloned.type + '_' + Date.now()
        });
        
        if (cloned.type === 'group') {
            // 处理组合对象
            cloned.forEachObject(function(obj) {
                obj.id = obj.type + '_' + Date.now();
            });
        }
        
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        updateLayerPanel();
        updatePropertiesPanel();
    });
}

// 组合选中对象
function groupSelection() {
    if (!canvas.getActiveObject()) {
        alert('请先选择要组合的对象');
        return;
    }
    
    if (canvas.getActiveObject().type !== 'activeSelection') {
        alert('请选择多个对象进行组合');
        return;
    }
    
    const group = canvas.getActiveObject().toGroup();
    group.id = 'group_' + Date.now();
    canvas.renderAll();
    updateLayerPanel();
    updatePropertiesPanel();
}

// 取消组合
function ungroupSelection() {
    if (!canvas.getActiveObject()) {
        alert('请先选择要取消组合的对象');
        return;
    }
    
    if (canvas.getActiveObject().type !== 'group') {
        alert('请选择一个组合对象');
        return;
    }
    
    const activeGroup = canvas.getActiveObject();
    activeGroup.toActiveSelection();
    canvas.renderAll();
    updateLayerPanel();
    updatePropertiesPanel();
}

// 切换透明背景
function toggleTransparentBg() {
    isTransparentBg = !isTransparentBg;
    
    if (isTransparentBg) {
        canvas.backgroundColor = null;
        document.querySelector('.canvas-container').classList.add('transparent-bg');
        document.getElementById('transparentBgBtn').classList.add('active');
    } else {
        canvas.backgroundColor = '#FFFFFF';
        document.querySelector('.canvas-container').classList.remove('transparent-bg');
        document.getElementById('transparentBgBtn').classList.remove('active');
    }
    
    canvas.renderAll();
}

// 应用颜色
function applyColor(color) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    if (activeObject.type === 'textbox' || activeObject.type === 'i-text') {
        activeObject.set('fill', color);
    } else {
        activeObject.set('fill', color);
    }
    
    canvas.renderAll();
    updatePropertiesPanel();
}

// 应用透明度
function applyOpacity(value) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    
    const opacity = parseInt(value, 10) / 100;
    activeObject.set('opacity', opacity);
    
    canvas.renderAll();
    updatePropertiesPanel();
}

// 保存设计
function saveDesign() {
    const saveDialog = document.getElementById('saveDialog');
    const saveDesignNameInput = document.getElementById('saveDesignName');
    const saveTransparentBgCheckbox = document.getElementById('saveTransparentBg');
    
    // 填充表单默认值
    saveDesignNameInput.value = currentDesign.name;
    saveTransparentBgCheckbox.checked = isTransparentBg;
    
    // 显示对话框
    saveDialog.style.display = 'flex';
}

// 确认保存设计
function confirmSaveDesign() {
    const saveDesignNameInput = document.getElementById('saveDesignName');
    const saveTransparentBgCheckbox = document.getElementById('saveTransparentBg');
    
    const designName = saveDesignNameInput.value.trim();
    if (!designName) {
        alert('请输入设计名称');
        return;
    }
    
    // 准备预览图
    const scaleFactor = Math.min(1, 600 / Math.max(canvas.width, canvas.height));
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.7,
        multiplier: scaleFactor
    });
    
    console.log('准备保存设计，数据大小约:', Math.round(dataURL.length/1024) + 'KB');
    
    // 优化对象，移除不必要的属性
    const objects = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'visible']).objects;
    
    // 准备设计数据
    const designData = {
        name: designName,
        width: canvas.width,
        height: canvas.height,
        previewUrl: dataURL,
        isTransparentBg: saveTransparentBgCheckbox.checked,
        templateId: currentDesign.templateId || null,
        objects: objects
    };
    
    console.log('发送设计数据...');
    
    // 发送到服务器
    fetch('/api/designs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(designData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('保存失败');
        }
        return response.json();
    })
    .then(data => {
        // 关闭对话框
        document.getElementById('saveDialog').style.display = 'none';
        
        // 显示成功消息
        alert('设计保存成功');
        
        // 刷新页面或重定向到新的设计页面
        if (data.design && data.design.id) {
            window.location.href = `/view-design.html?id=${data.design.id}`;
        } else {
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('保存设计失败:', error);
        alert('保存设计失败: ' + error.message);
    });
}

// 取消保存设计
function cancelSaveDesign() {
    document.getElementById('saveDialog').style.display = 'none';
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载设计
    loadDesign();
    
    // 设置工具事件监听
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const imgObj = new Image();
                imgObj.src = event.target.result;
                imgObj.onload = function() {
                    const image = new fabric.Image(imgObj, {
                        left: 50,
                        top: 50,
                        angle: 0,
                        id: 'image_' + Date.now()
                    });
                    
                    // 缩放图片以适应画布
                    const maxDimension = Math.max(image.width, image.height);
                    const scaleFactor = maxDimension > 300 ? 300 / maxDimension : 1;
                    image.scale(scaleFactor);
                    
                    canvas.add(image);
                    canvas.setActiveObject(image);
                    canvas.renderAll();
                    updateLayerPanel();
                };
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 键盘删除快捷键
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && isEditMode) {
            // 确保焦点不在表单元素上
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA' && 
                document.activeElement.tagName !== 'SELECT') {
                
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    if (confirm('确定要删除选中的对象吗？')) {
                        canvas.remove(activeObject);
                        canvas.renderAll();
                        updateLayerPanel();
                        clearPropertiesPanel();
                    }
                    e.preventDefault();
                }
            }
        }
    });
}); 