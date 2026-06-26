const API_URL = 'http://localhost:3001/api/materials';

// Fetch and render materials
async function loadMaterials(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        console.log('🔍 Loading materials with filters:', filters);
        console.log('🌐 API URL:', `${API_URL}?${params}`);
        
        const response = await fetch(`${API_URL}?${params}`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error('Failed to fetch');
        }
        
        const data = await response.json();
        console.log('📦 Raw data received:', data);
        
        // Handle both paginated and non-paginated responses
        const materials = data.materials || data;
        console.log('✅ Materials array:', materials);
        console.log('📊 Total materials count:', materials.length);
        
        renderMaterials(materials);
    } catch (error) {
        console.error('💥 Error loading materials:', error);
        const container = document.getElementById('materials-container');
        if (container) container.innerHTML = '<p class="no-materials">Failed to load materials. Check console for details.</p>';
    }
}

// Render materials as cards
function renderMaterials(materials) {
    console.log('🎨 Rendering materials:', materials);
    const container = document.getElementById('materials-container');
    
    if (!container) {
        console.error('❌ Container not found: materials-container');
        return;
    }
    
    console.log('✅ Container found:', container);

    if (materials.length === 0) {
        console.log('⚠️ No materials to display');
        container.innerHTML = '<p class="no-materials">No materials found. Be the first to add one!</p>';
        return;
    }
    
    console.log(`📝 Rendering ${materials.length} material cards...`);

    container.innerHTML = materials.map(material => `
        <div class="material-card" data-type="${material.type || material.category || ''}" data-category="${material.category || material.type || ''}" data-difficulty="${(material.difficulty || '').toLowerCase()}" data-title="${escapeHtml(material.title).toLowerCase()}" data-description="${escapeHtml(material.description || '').toLowerCase()}">
            <img src="${material.thumbnailUrl || material.thumbnail || 'https://via.placeholder.com/400x250/6366f1/ffffff?text=Study+Material'}" alt="${escapeHtml(material.title)}" class="thumbnail" onerror="this.src='https://via.placeholder.com/400x250/6366f1/ffffff?text=Study+Material'">
            <div class="card-content">
                <h3>${escapeHtml(material.title)}</h3>
                <p class="desc">${escapeHtml(material.description || '')}</p>
                <div class="meta">
                    <span class="badge category">${escapeHtml(material.category || material.type || 'General')}</span>
                    ${material.difficulty ? `<span class="badge difficulty ${material.difficulty.toLowerCase()}">${material.difficulty}</span>` : ''}
                </div>
                ${material.tags && material.tags.length > 0 ? `<div class="tags">${material.tags.map(tag => `#${escapeHtml(tag)}`).join(' ')}</div>` : ''}
                <div class="card-footer">
                    <div class="footer-left">
                        <span class="author">By ${escapeHtml(material.author || 'Anonymous')}</span>
                        <span class="download-count" id="download-count-${material.id}"><i class="fas fa-download"></i> ${material.downloadCount || 0}</span>
                    </div>
                    <button class="btn-view" onclick="handleDownload('${material.id}', '${escapeHtml(material.link || material.filePath || '#')}')">View Resource</button>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Materials rendered successfully!');
}

// Handle download action
async function handleDownload(materialId, link) {
    console.log('Download clicked for material:', materialId);
    try {
        const response = await fetch(`${API_URL}/${materialId}/download`, {
            method: 'POST'
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error('Failed to update download count');
        }
        
        const data = await response.json();
        console.log('Download count updated:', data.downloadCount);
        
        // Update the download count in UI
        const countElement = document.getElementById(`download-count-${materialId}`);
        console.log('Count element found:', countElement);
        if (countElement) {
            countElement.innerHTML = `<i class="fas fa-download"></i> ${data.downloadCount}`;
            console.log('UI updated with count:', data.downloadCount);
        } else {
            console.error('Count element not found for ID:', `download-count-${materialId}`);
        }
        
        // Trigger the actual download/view
        window.open(link, '_blank');
    } catch (error) {
        console.error('Error updating download count:', error);
        // Still open the link even if count update fails
        window.open(link, '_blank');
    }
}

// Submit new material
async function submitMaterial(formData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit material');
        }

        const newMaterial = await response.json();
        showToast('Material added successfully!', 'success');
        return newMaterial;
    } catch (error) {
        console.error('Error submitting material:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMaterials();

    // Handle form submission
    const form = document.getElementById('add-material-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                title: form.title.value,
                description: form.description.value,
                category: form.category.value,
                author: form.author.value,
                difficulty: form.difficulty.value,
                tags: form.tags.value,
                thumbnailUrl: form.thumbnailUrl.value,
                link: form.link.value
            };

            try {
                await submitMaterial(formData);
                form.reset();
                closeModal();
                // Clear filters and reload
                const categoryFilter = document.getElementById('category-filter');
                const difficultyFilter = document.getElementById('difficulty-filter');
                if (categoryFilter) categoryFilter.value = '';
                if (difficultyFilter) difficultyFilter.value = '';
                await loadMaterials();
            } catch (error) {
                // Error already handled in submitMaterial
            }
        });
    }

    // Search functionality - main search box
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });
    }

    // Filter functionality
    const categoryFilter = document.getElementById('category-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFilters);
    }
});

// Apply all filters and search
function applyFilters() {
    const searchInput = document.querySelector('.search-box input');
    const categoryFilter = document.getElementById('category-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value.toLowerCase() : '';
    const selectedDifficulty = difficultyFilter ? difficultyFilter.value.toLowerCase() : '';
    
    const cards = document.querySelectorAll('.material-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const cardType = (card.dataset.type || '').toLowerCase();
        const cardCategory = (card.dataset.category || '').toLowerCase();
        const cardDifficulty = (card.dataset.difficulty || '').toLowerCase();
        const cardTitle = (card.dataset.title || '').toLowerCase();
        const cardDesc = (card.dataset.description || '').toLowerCase();
        
        // Match search in title and description
        const matchesSearch = !searchQuery || cardTitle.includes(searchQuery) || cardDesc.includes(searchQuery);
        
        // Match category - check both type and category fields
        const matchesCategory = !selectedCategory || cardType === selectedCategory || cardCategory === selectedCategory;
        
        // Match difficulty - if no difficulty, show when "All Levels" selected
        const matchesDifficulty = !selectedDifficulty || cardDifficulty === selectedDifficulty;
        
        if (matchesSearch && matchesCategory && matchesDifficulty) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show no results message if needed
    const container = document.getElementById('materials-container');
    if (container) {
        let noResultsMsg = container.querySelector('.no-materials.filter-message');
        if (visibleCount === 0 && cards.length > 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('p');
                noResultsMsg.className = 'no-materials filter-message';
                noResultsMsg.textContent = 'No materials match your filters.';
                container.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
}

// Modal functions
function openModal() {
    const modal = document.getElementById('add-material-modal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('add-material-modal');
    if (modal) modal.style.display = 'none';
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('add-material-modal');
    if (e.target === modal) closeModal();
});
