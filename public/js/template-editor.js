// 全局变量
let canvas;
let rulers = {horizontal: null, vertical: null};
let zoomLevel = 1;
let canvasOffset = {x: 0, y: 0};
let templateName = "";
let isBackground = false;
let currentTemplateId = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    setupCanvasSettings();
    setupRulers();
    setupZoomControls();
    setupEventListeners();
    
    // 检查URL是否包含模板ID
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('id');
    if (templateId) {
        loadTemplateById(templateId);
    }
});

// 初始化画布
function initCanvas() {
    const canvasElement = document.getElementById('canvas');
    if (!canvasElement) {
        console.error('未找到canvas元素');
        return;
    }
    
    // 初始化画布
    canvas = new fabric.Canvas('canvas', {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true
    });
    
    // 创建边框
    const border = new fabric.Rect({
        width: canvas.width,
        height: canvas.height,
        strokeWidth: 1,
        stroke: '#cccccc',
        fill: null,
        selectable: false,
        evented: false
    });
    
    canvas.add(border);
    canvas.renderAll();
}

// 设置画布设置
function setupCanvasSettings() {
    const widthInput = document.getElementById('canvasWidth');
    const heightInput = document.getElementById('canvasHeight');
    const bgCheckbox = document.getElementById('isBackground');
    const templateNameInput = document.getElementById('templateName');
    const bgColorInput = document.getElementById('bgColor');
    
    if (widthInput) {
        widthInput.value = canvas.width;
        widthInput.addEventListener('change', updateCanvasSize);
    }
    
    if (heightInput) {
        heightInput.value = canvas.height;
        heightInput.addEventListener('change', updateCanvasSize);
    }
    
    if (bgCheckbox) {
        bgCheckbox.addEventListener('change', (e) => {
            isBackground = e.target.checked;
            if (isBackground) {
                canvas.setBackgroundColor('transparent');
            } else {
                const color = bgColorInput ? bgColorInput.value : "#ffffff";
                canvas.setBackgroundColor(color);
            }
            canvas.renderAll();
        });
    }
    
    if (templateNameInput) {
        templateNameInput.addEventListener('input', (e) => {
            templateName = e.target.value;
        });
    }
    
    if (bgColorInput) {
        bgColorInput.addEventListener('change', (e) => {
            if (!isBackground) {
                canvas.setBackgroundColor(e.target.value);
                canvas.renderAll();
            }
        });
    }
}

// 更新画布大小
function updateCanvasSize() {
    const widthInput = document.getElementById('canvasWidth');
    const heightInput = document.getElementById('canvasHeight');
    
    if (!widthInput || !heightInput) return;
    
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        alert('请输入有效的宽度和高度');
        return;
    }
    
    canvas.setWidth(width);
    canvas.setHeight(height);
    
    // 更新边框
    const border = canvas.getObjects().find(obj => !obj.selectable && obj.type === 'rect');
    if (border) {
        border.set({
            width: width,
            height: height
        });
    }
    
    canvas.renderAll();
    updateRulers();
}

// 创建标尺
function setupRulers() {
    // 创建水平标尺
    rulers.horizontal = new fabric.Rect({
        width: canvas.width,
        height: 20,
        left: 0,
        top: -20,
        fill: '#f0f0f0',
        selectable: false,
        evented: false
    });
    
    // 创建垂直标尺
    rulers.vertical = new fabric.Rect({
        width: 20,
        height: canvas.height,
        left: -20,
        top: 0,
        fill: '#f0f0f0',
        selectable: false,
        evented: false
    });
    
    // 添加到画布
    canvas.add(rulers.horizontal);
    canvas.add(rulers.vertical);
    
    // 初始化标尺标记
    updateRulers();
}

// 更新标尺
function updateRulers() {
    // 移除旧的标尺标记
    canvas.getObjects().forEach(obj => {
        if (obj.isRulerMark) {
            canvas.remove(obj);
        }
    });
    
    const step = 50; // 标尺刻度间隔
    
    // 创建水平标尺刻度
    for (let x = 0; x < canvas.width; x += step) {
        const scaledX = x * zoomLevel;
        
        // 创建刻度线
        const line = new fabric.Line([x, -20, x, -5], {
            stroke: '#999999',
            selectable: false,
            evented: false,
            isRulerMark: true
        });
        
        // 创建刻度文本
        const text = new fabric.Text(x.toString(), {
            left: x,
            top: -20,
            fontSize: 10,
            fill: '#666666',
            originX: 'center',
            selectable: false,
            evented: false,
            isRulerMark: true
        });
        
        canvas.add(line);
        canvas.add(text);
    }
    
    // 创建垂直标尺刻度
    for (let y = 0; y < canvas.height; y += step) {
        const scaledY = y * zoomLevel;
        
        // 创建刻度线
        const line = new fabric.Line([-20, y, -5, y], {
            stroke: '#999999',
            selectable: false,
            evented: false,
            isRulerMark: true
        });
        
        // 创建刻度文本
        const text = new fabric.Text(y.toString(), {
            left: -10,
            top: y,
            fontSize: 10,
            fill: '#666666',
            originY: 'center',
            selectable: false,
            evented: false,
            isRulerMark: true
        });
        
        canvas.add(line);
        canvas.add(text);
    }
    
    canvas.renderAll();
}

// 设置缩放控制
function setupZoomControls() {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoomLevel = Math.min(zoomLevel + 0.1, 3);
            updateZoom();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
            updateZoom();
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            zoomLevel = 1;
            updateZoom();
        });
    }
}

// 更新缩放
function updateZoom() {
    canvas.setZoom(zoomLevel);
    canvas.setViewportTransform([zoomLevel, 0, 0, zoomLevel, canvasOffset.x, canvasOffset.y]);
    updateRulers();
}

// 设置事件监听
function setupEventListeners() {
    // 鼠标滚轮缩放
    canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        
        zoom = delta > 0 ? zoom - 0.05 : zoom + 0.05;
        zoom = Math.min(Math.max(0.5, zoom), 3);
        
        zoomLevel = zoom;
        updateZoom();
        
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });
    
    // 对象移动更新
    canvas.on('object:moving', () => {
        updateRulers();
    });
    
    // 选择对象
    canvas.on('selection:created', () => {
        updateObjectProperties();
    });
    
    canvas.on('selection:updated', () => {
        updateObjectProperties();
    });
}

// 更新对象属性
function updateObjectProperties() {
    const selectedObject = canvas.getActiveObject();
    if (!selectedObject) return;
    
    // 这里可以添加更新属性面板的代码
}

// 添加文本
function addText() {
    const text = new fabric.Textbox('双击编辑文本', {
        left: 100,
        top: 100,
        width: 200,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#333333',
        editable: true
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
}

// 添加图片
function addImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgURL = event.target.result;
            fabric.Image.fromURL(imgURL, (img) => {
                // 调整大小保持比例
                const maxSize = 300;
                if (img.width > maxSize || img.height > maxSize) {
                    if (img.width > img.height) {
                        img.scaleToWidth(maxSize);
                    } else {
                        img.scaleToHeight(maxSize);
                    }
                }
                
                img.set({
                    left: 100,
                    top: 100
                });
                
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        };
        
        reader.readAsDataURL(file);
    };
    
    fileInput.click();
}

// 添加矩形
function addRect() {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 80,
        fill: '#3498db',
        opacity: 0.8
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
}

// 添加圆形
function addCircle() {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: '#e74c3c',
        opacity: 0.8
    });
    
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
}

// 添加三角形
function addTriangle() {
    const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: '#2ecc71',
        opacity: 0.8
    });
    
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
}

// 删除选中对象
function deleteSelected() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
    }
}

// 保存模板
async function saveTemplate() {
    const name = document.getElementById('templateName').value.trim();
    if (!name) {
        alert('请输入模板名称');
        return;
    }
    
    const width = canvas.width;
    const height = canvas.height;
    const bgCheckbox = document.getElementById('isBackground');
    
    // 准备预览图
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1
    });
    
    // 过滤画布对象，只保留需要的属性，并清理无效值
    const filteredObjects = canvas.toJSON(['id', 'name']).objects
        .filter(obj => obj.selectable !== false) // 排除不可选对象，如边框
        .map(obj => {
            // 删除可能导致问题的属性
            delete obj.textBaseline; // 删除可能包含'alphabetical'的属性
            
            // 确保字体大小是数字
            if (obj.fontSize && typeof obj.fontSize !== 'number') {
                obj.fontSize = parseInt(obj.fontSize) || 20;
            }
            
            // 如果有其他可能导致问题的属性，可以继续处理
            return obj;
        });
    
    // 准备发送的数据
    const templateData = {
        name: name,
        width: width,
        height: height,
        isBackgroundTemplate: bgCheckbox.checked,
        objects: filteredObjects,
        previewUrl: dataURL
    };
    
    console.log('准备保存的模板数据，大小约:', Math.round(JSON.stringify(templateData).length/1024) + 'KB');
    
    try {
        let url = '/api/templates';
        let method = 'POST';
        
        // 如果是更新现有模板
        if (currentTemplateId) {
            url = `/api/templates/${currentTemplateId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
        });
        
        if (!response.ok) {
            throw new Error('保存失败');
        }
        
        const result = await response.json();
        if (result.success) {
            alert(`模板${currentTemplateId ? '更新' : '保存'}成功!`);
            window.location.href = '/admin.html';
        } else {
            throw new Error(result.error || '保存失败');
        }
    } catch (error) {
        console.error('保存模板失败:', error);
        alert('保存模板失败: ' + error.message);
    }
}

// 加载模板
async function loadTemplateById(templateId) {
    try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
            throw new Error('获取模板失败');
        }
        
        const data = await response.json();
        if (!data.success || !data.template) {
            throw new Error('模板数据无效');
        }
        
        const template = data.template;
        currentTemplateId = template.id;
        
        // 更新表单
        document.getElementById('templateName').value = template.name;
        document.getElementById('isBackground').checked = template.isBackground;
        
        // 更新画布尺寸
        if (template.width && template.height) {
            document.getElementById('canvasWidth').value = template.width;
            document.getElementById('canvasHeight').value = template.height;
            updateCanvasSize();
        }
        
        // 加载对象
        if (template.objects && Array.isArray(template.objects)) {
            // 清除现有对象（除了边框）
            const objectsToRemove = canvas.getObjects().filter(obj => obj.selectable !== false);
            objectsToRemove.forEach(obj => canvas.remove(obj));
            
            // 创建画布数据对象
            const canvasData = {
                version: '5.3.0',
                objects: template.objects,
                background: template.isBackground ? null : '#FFFFFF'
            };
            
            // 加载数据到画布
            canvas.loadFromJSON(canvasData, function() {
                console.log('模板加载完成，对象数量:', canvas.getObjects().length);
                canvas.renderAll();
            });
        }
        
        console.log('成功加载模板:', template.name);
    } catch (error) {
        console.error('加载模板失败:', error);
        alert('加载模板失败: ' + error.message);
    }
} 