// 初始化Fabric.js画布
const canvas = new fabric.Canvas('canvas', {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff'
});

// 预设背景模板
const templates = [
    { id: 1, name: '模板1', url: 'templates/template1.jpg' },
    { id: 2, name: '模板2', url: 'templates/template2.jpg' },
    // 可以添加更多模板
];

// 预设素材
const materials = [
    { id: 1, name: '素材1', url: 'materials/material1.png' },
    { id: 2, name: '素材2', url: 'materials/material2.png' },
    // 可以添加更多素材
];

// 初始化模板列表
function initTemplates() {
    const templateList = document.getElementById('templateList');
    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-item';
        templateElement.innerHTML = `
            <img src="${template.url}" alt="${template.name}">
            <span>${template.name}</span>
        `;
        templateElement.draggable = true;
        templateElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('template', JSON.stringify(template));
        });
        templateList.appendChild(templateElement);
    });
}

// 初始化素材列表
function initMaterials() {
    const materialList = document.getElementById('materialList');
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
        materialList.appendChild(materialElement);
    });
}

// 处理拖放
canvas.on('drop', (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('template') || e.dataTransfer.getData('material'));
    if (data) {
        fabric.Image.fromURL(data.url, (img) => {
            img.set({
                left: e.offsetX,
                top: e.offsetY,
                scaleX: 0.5,
                scaleY: 0.5
            });
            canvas.add(img);
            canvas.renderAll();
        });
    }
});

// 处理文件上传
document.getElementById('imageUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.set({
                    left: 100,
                    top: 100,
                    scaleX: 0.5,
                    scaleY: 0.5
                });
                canvas.add(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
    }
});

// 保存设计
document.getElementById('saveBtn').addEventListener('click', async () => {
    const designData = canvas.toJSON();
    try {
        const response = await fetch('/api/save-design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(designData)
        });
        const result = await response.json();
        if (result.success) {
            alert(`设计已保存，您的设计编号是：${result.designId}`);
        }
    } catch (error) {
        alert('保存失败，请重试');
    }
});

// 预览功能
document.getElementById('previewBtn').addEventListener('click', () => {
    const dataURL = canvas.toDataURL();
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <html>
            <head>
                <title>设计预览</title>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                    img { max-width: 100%; max-height: 100%; }
                </style>
            </head>
            <body>
                <img src="${dataURL}" alt="设计预览">
            </body>
        </html>
    `);
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTemplates();
    initMaterials();
}); 