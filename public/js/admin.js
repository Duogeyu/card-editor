// 全局变量
let allMaterials = {
    stickers: [],
    backgrounds: [],
    shapes: [],
    templates: []
};
let designs = [];
let currentDeleteTarget = null;

// 预设图像占位符
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFHGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgZXhpZjpQaXhlbFhEaW1lbnNpb249IjIwMCIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjIwMCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTExLTAxVDEwOjIwOjEwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0xMS0wMVQxMDoyMDoyOSswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0xMS0wMVQxMDoyMDoyOSswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowYjk4OTdiZi04NjJkLTliNDQtOWU1Mi0xN2YxNjZjZDIwZWUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzU0YWIyYjEtNGJkMi0zNjQyLWI3NDctMWNmODI2NTQ4NTZhIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MzU0YWIyYjEtNGJkMi0zNjQyLWI3NDctMWNmODI2NTQ4NTZhIj4gPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MzU0YWIyYjEtNGJkMi0zNjQyLWI3NDctMWNmODI2NTQ4NTZhIiBzdEV2dDp3aGVuPSIyMDIzLTExLTAxVDEwOjIwOjEwKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjBiOTg5N2JmLTg2MmQtOWI0NC05ZTUyLTE3ZjE2NmNkMjBlZSIgc3RFdnQ6d2hlbj0iMjAyMy0xMS0wMVQxMDoyMDoyOSswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pg1n9dMAAAGCSURBVHja7d0xSkNBGIbh7xeDhdgk20hIkSY7yAKELMA2ZYrswz5dQDaQJlXKYAqdMhACgnZWwvMUp/Nw73v/mX+YSTdN06vneVH62fa7gP/9Tfsv+YCEBAICAgICEhAQEBAQkICAgICAgAQEBAQEBCQgICAgICAgIQEBAQEBAQkICAgICEhAQEBACkNE/vZBRDbnHiTy31NEnuceJCKvEXmaeZDvVjHGdpJBxnG8iYjbGKOdZJBu/ry91Yh4mHWQ7k8REQ/D0N/POoiQXMaHYXUXEa+1UZoigzy2bdsstm9jjJe2aa5jHKuqIE1/f6/l8Xkf44h1Rdpqg3R5dF9eht5HRG7Zbe6rjvFRdZBu2e13Ofbpb1evs7YquFX/Vf+TVguJkAjJ2ZBMNX9vRMYfJK+TDyIkQrJm/9gVEiEREiEREiEREiEREiEREiEREiEREiEREiERkvOHxBI1S1SXqC5RXaK6RPUHqSVq1cvHOcx22tjl412kTWGY/fwudOOfvw3zFGlz+EbMd08aJyLLVf/hAAAAAElFTkSuQmCC';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始加载
    refreshMaterials();
    refreshDesigns();
});

// 切换标签页
function switchTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 移除所有标签页的active类
    tabButtons.forEach(button => button.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // 激活选中的标签页
    document.querySelector(`.tab-button[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// 上传素材
async function uploadMaterial() {
    const form = document.getElementById('materialUploadForm');
    const formData = new FormData(form);
    
    const nameInput = document.getElementById('materialName');
    const categorySelect = document.getElementById('materialCategory');
    const fileInput = document.getElementById('materialFile');
    
    // 简单验证
    if (!nameInput.value) {
        alert('请输入素材名称');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('请选择要上传的文件');
        return;
    }
    
    try {
        const response = await fetch('/api/materials/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('素材上传成功');
            form.reset();
            refreshMaterials();
        } else {
            alert('上传失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('上传错误:', error);
        alert('上传出错，请查看控制台获取详细信息');
    }
}

// 刷新素材列表
async function refreshMaterials() {
    try {
        // 获取素材分类
        const categoriesResponse = await fetch('/api/materials/categories');
        const categoriesResult = await categoriesResponse.json();
        
        if (!categoriesResult.success) {
            throw new Error('获取分类失败');
        }
        
        // 逐个加载分类的素材
        for (const category of categoriesResult.categories) {
            const response = await fetch(`/api/materials/categories/${category.id}`);
            const result = await response.json();
            
            if (result.success) {
                allMaterials[category.id] = result.category.items || [];
            }
        }
        
        // 根据过滤器展示素材
        filterMaterials();
    } catch (error) {
        console.error('加载素材失败:', error);
        alert('加载素材失败');
    }
}

// 过滤素材
function filterMaterials() {
    const filterValue = document.getElementById('materialsFilter').value;
    const materialsGrid = document.getElementById('materialsGrid');
    
    // 清空现有内容
    materialsGrid.innerHTML = '';
    
    // 获取要显示的素材
    let materialsToShow = [];
    
    if (filterValue === 'all') {
        // 合并所有分类的素材
        Object.values(allMaterials).forEach(categoryItems => {
            materialsToShow = materialsToShow.concat(categoryItems);
        });
    } else {
        // 显示特定分类的素材
        materialsToShow = allMaterials[filterValue] || [];
    }
    
    // 创建素材项
    materialsToShow.forEach(material => {
        const materialElement = createMaterialElement(material);
        materialsGrid.appendChild(materialElement);
    });
    
    if (materialsToShow.length === 0) {
        materialsGrid.innerHTML = '<p>没有找到符合条件的素材</p>';
    }
}

// 创建素材项元素
function createMaterialElement(material) {
    const div = document.createElement('div');
    div.className = 'material-item';
    
    // 获取分类名称
    const categoryName = getCategoryName(material.url);
    
    div.innerHTML = `
        <img src="${material.url}" alt="${material.name}">
        <div class="info">
            <h3 class="name">${material.name}</h3>
            <p class="meta">分类: ${categoryName}</p>
            <p class="meta">上传时间: ${new Date(material.createdAt).toLocaleString()}</p>
        </div>
        <div class="actions">
            <button class="btn-danger" onclick="showDeleteDialog('${material.id}', '${categoryName.toLowerCase()}')">删除</button>
        </div>
    `;
    
    return div;
}

// 根据URL获取分类名称
function getCategoryName(url) {
    if (url.includes('/stickers/')) return '贴纸';
    if (url.includes('/backgrounds/')) return '背景';
    if (url.includes('/shapes/')) return '形状';
    if (url.includes('/templates/')) return '模板';
    return '未知';
}

// 获取分类ID
function getCategoryId(url) {
    if (url.includes('/stickers/')) return 'stickers';
    if (url.includes('/backgrounds/')) return 'backgrounds';
    if (url.includes('/shapes/')) return 'shapes';
    if (url.includes('/templates/')) return 'templates';
    return null;
}

// 显示删除确认对话框
function showDeleteDialog(id, type) {
    currentDeleteTarget = {
        id: id,
        type: type
    };
    
    document.getElementById('deleteDialog').style.display = 'flex';
}

// 确认删除
async function confirmDelete() {
    if (!currentDeleteTarget) return;
    
    try {
        if (currentDeleteTarget.type === 'design') {
            // 删除设计
            const response = await fetch(`/api/designs/${currentDeleteTarget.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('设计删除成功');
                refreshDesigns();
            } else {
                alert('删除失败: ' + (result.error || '未知错误'));
            }
        } else {
            // 删除素材
            const categoryId = currentDeleteTarget.type;
            const response = await fetch(`/api/materials/${categoryId}/${currentDeleteTarget.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('素材删除成功');
                refreshMaterials();
            } else {
                alert('删除失败: ' + (result.error || '未知错误'));
            }
        }
    } catch (error) {
        console.error('删除错误:', error);
        alert('删除出错，请查看控制台获取详细信息');
    } finally {
        cancelDelete();
    }
}

// 取消删除
function cancelDelete() {
    document.getElementById('deleteDialog').style.display = 'none';
    currentDeleteTarget = null;
}

// 刷新设计列表
async function refreshDesigns() {
    try {
        const response = await fetch('/api/designs');
        const result = await response.json();
        
        if (result.success) {
            designs = result.designs || [];
            renderDesigns();
        } else {
            throw new Error(result.error || '获取设计失败');
        }
    } catch (error) {
        console.error('加载设计失败:', error);
        alert('加载设计失败');
    }
}

// 渲染设计列表
function renderDesigns() {
    const designGrid = document.getElementById('designGrid');
    designGrid.innerHTML = '';
    
    if (designs.length === 0) {
        designGrid.innerHTML = '<p>没有找到任何设计</p>';
        return;
    }
    
    designs.forEach(design => {
        const designElement = createDesignElement(design);
        designGrid.appendChild(designElement);
    });
}

// 创建设计元素
function createDesignElement(design) {
    const div = document.createElement('div');
    div.className = 'template-item';
    
    div.innerHTML = `
        <div class="preview">
            <img src="${design.previewUrl}" alt="${design.name}">
        </div>
        <div class="info">
            <h3>${design.name}</h3>
            <p>尺寸: ${design.width}×${design.height}</p>
            <p>创建时间: ${new Date(design.createdAt).toLocaleString()}</p>
        </div>
        <div class="actions">
            <button onclick="window.location.href='index.html?design=${design.id}'" class="btn">编辑</button>
            <button class="btn-danger" onclick="showDeleteDialog('${design.id}', 'design')">删除</button>
        </div>
    `;
    
    return div;
} 