const API_URL = 'http://localhost:3001/api/materials';

let currentMaterialType = 'textbook'; // Track current page type

// Initialize materials page with specific type
async function initMaterialsPage(materialType) {
    console.log(`🎯 Initializing ${materialType} materials page`);
    currentMaterialType = materialType;
    await loadMaterialsByType(materialType);
    setupUploadForm();
}

// Load materials filtered by type
async function loadMaterialsByType(type) {
    try {
        console.log(`📡 Fetching ${type} materials from API...`);
        const response = await fetch(`${API_URL}?type=${type}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const materials = data.materials || data;
        
        console.log(`✅ Loaded ${materials.length} ${type} materials`);
        renderMaterialsList(materials);
    } catch (error) {
        console.error('❌ Error loading materials:', error);
        showError();
    }
}

// Render materials in the list format
function renderMaterialsList(materials) {
    const container = document.getElementById('materialsList');
    
    if (!container) {
        console.error('❌ materialsList container not found');
        return;
    }
    
    if (materials.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No materials found in this category yet.</p>';
        return;
    }
    
    container.innerHTML = materials.map(material => {
        const createdDate = material.createdAt ? new Date(material.createdAt).toLocaleDateString() : 'N/A';
        
        // Determine icon based on material type
        let iconClass = 'fas fa-book-open';
        if (material.type === 'video') iconClass = 'fas fa-video';
        else if (material.type === 'audio') iconClass = 'fas fa-headphones';
        else if (material.type === 'textbook') iconClass = 'fas fa-book';
        else if (material.type === 'notes') iconClass = 'fas fa-file-alt';
        
        return `
        <div class="material-item" data-subject="${material.category || material.type}" data-level="undergraduate" data-title="${escapeHtml(material.title).toLowerCase()}" data-author="${escapeHtml(material.author || 'anonymous')}">
            <div class="material-thumbnail">
                ${material.thumbnail ? `<img src="${material.thumbnail}" alt="${escapeHtml(material.title)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="${iconClass}"></i>`}
            </div>
            <div class="material-info">
                <h3>${escapeHtml(material.title)}</h3>
                <p class="material-author">by ${escapeHtml(material.author || 'Anonymous')}</p>
                <p class="material-description">${escapeHtml(material.description || 'No description available')}</p>
                <div class="material-meta">
                    <span id="download-count-${material.id}"><i class="fas fa-download"></i> ${material.downloadCount || 0}</span>
                    <span><i class="fas fa-file-${material.format === 'pdf' ? 'pdf' : 'alt'}"></i> ${(material.format || 'link').toUpperCase()}</span>
                    <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                    <span><i class="fas fa-user"></i> ${escapeHtml(material.author || 'Anonymous')}</span>
                </div>
            </div>
            <div class="material-actions">
                <button class="btn btn-primary" onclick="handleMaterialDownload('${material.id}', '${escapeHtml(material.link || material.filePath || '#')}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-secondary" style="background: white; color: #6366f1; border: 1px solid #6366f1;" onclick="saveMaterial('${material.id}')">
                    <i class="fas fa-bookmark"></i> Save
                </button>
            </div>
        </div>
    `;
    }).join('');
    
    console.log(`✅ Rendered ${materials.length} materials`);
}

// Handle material download/view
async function handleMaterialDownload(materialId, link) {
    try {
        // Update download count
        const response = await fetch(`${API_URL}/${materialId}/download`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            // Update UI
            const countElement = document.getElementById(`download-count-${materialId}`);
            if (countElement) {
                countElement.innerHTML = `<i class="fas fa-download"></i> ${data.downloadCount}`;
            }
        }
        
        // Open link
        window.open(link, '_blank');
    } catch (error) {
        console.error('Error updating download count:', error);
        // Still open the link
        window.open(link, '_blank');
    }
}

// Save material
function saveMaterial(materialId) {
    // Get saved materials from localStorage
    let savedMaterials = JSON.parse(localStorage.getItem('saved_materials') || '[]');
    
    if (savedMaterials.includes(materialId)) {
        alert('Material already saved!');
        return;
    }
    
    savedMaterials.push(materialId);
    localStorage.setItem('saved_materials', JSON.stringify(savedMaterials));
    alert('Material saved successfully!');
}

// Show error message
function showError() {
    const container = document.getElementById('materialsList');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                <h3>Failed to load materials</h3>
                <p>Please make sure the backend server is running on port 3001</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Setup upload form handler
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const inputs = form.elements;
        
        // Get form values
        const title = inputs[0].value;
        const author = inputs[1].value;
        const subject = inputs[2]?.value || '';
        const description = inputs[3]?.value || inputs[4]?.value || '';
        
        console.log('📝 Form values:', { title, author, subject, description });
        
        // Check upload mode
        const fileInput = document.getElementById('fileInput');
        const linkInput = document.getElementById('fileLink') || document.getElementById('videoLink') || document.getElementById('audioLink') || document.getElementById('imageLink');
        const thumbnailInput = document.getElementById('thumbnailInput');
        const linkMode = document.getElementById('linkUploadSection').style.display !== 'none';
        
        if (linkMode) {
            // Link upload mode
            const link = linkInput?.value;
            if (!link) {
                alert('Please enter a file link');
                return;
            }
            
            formData.append('title', title);
            formData.append('author', author);
            formData.append('description', description);
            formData.append('link', link);
            formData.append('type', currentMaterialType);
            
            // Add thumbnail if provided
            if (thumbnailInput && thumbnailInput.files[0]) {
                formData.append('thumbnail', thumbnailInput.files[0]);
            }
        } else {
            // File upload mode
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select a file');
                return;
            }
            
            formData.append('title', title);
            formData.append('author', author);
            formData.append('description', description);
            formData.append('file', file);
            formData.append('type', currentMaterialType);
        }
        
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            alert('Material uploaded successfully!');
            form.reset();
            document.getElementById('fileName').textContent = '';
            if (document.getElementById('thumbnailName')) {
                document.getElementById('thumbnailName').textContent = '';
            }
            closeUploadModal();
            
            // Reload materials
            await loadMaterialsByType(currentMaterialType);
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload material. Please try again.');
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || '<i class="fas fa-upload"></i> Request to Upload';
        }
    });
}
