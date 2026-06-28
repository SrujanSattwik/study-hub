const SK_MATERIAL = `
<div class="sk-material">
    <div class="sk sk-material__img"></div>
    <div class="sk-material__body">
        <div class="sk sk-material__title"></div>
        <div class="sk sk-material__desc"></div>
        <div class="sk sk-material__desc-2"></div>
        <div class="sk-material__footer">
            <div class="sk sk-material__author"></div>
            <div class="sk sk-material__btn"></div>
        </div>
    </div>
</div>`;

function showMaterialsSkeletons() {
    const container = document.getElementById('materials-container');
    if (container && (!container.children.length || container.querySelector('.no-materials'))) {
        container.innerHTML = SK_MATERIAL.repeat(6);
    }
}

// Fetch and render materials with SWR caching & skeletons
async function loadMaterials(filters = {}) {
    const container = document.getElementById('materials-container');
    showMaterialsSkeletons();

    try {
        const params = new URLSearchParams(filters);
        const url = `/api/materials?${params}`;
        const cacheKey = `materials:${params.toString()}`;

        // 1. SWR Instant Cache Render
        if (window.SWRCache) {
            const cachedData = SWRCache.get(cacheKey);
            if (cachedData) {
                const materials = cachedData.materials || cachedData;
                renderMaterials(materials);
            }
        }

        // 2. Fetch Fresh Data (background revalidate or fresh)
        let data;
        if (window.SWRCache) {
            data = await SWRCache.fetch(cacheKey, url, {
                staleMs: 15_000,
                onRevalidate: (freshData) => {
                    const materials = freshData.materials || freshData;
                    renderMaterials(materials);
                }
            });
        } else {
            const response = await AuthSession.fetchWithAuth(url);
            if (!response.ok) throw new Error('Failed to fetch materials');
            data = await response.json();
        }

        const materials = data.materials || data;
        renderMaterials(materials);
    } catch (error) {
        console.error('Error loading materials:', error);
        if (container && !container.querySelectorAll('.material-card').length) {
            container.innerHTML = '<p class="no-materials">Failed to load materials. Please refresh.</p>';
        }
    }
}

// Render materials as cards
function renderMaterials(materials) {
    const container = document.getElementById('materials-container');
    if (!container) return;

    if (!materials || materials.length === 0) {
        container.innerHTML = '<p class="no-materials">No materials found. Be the first to add one!</p>';
        return;
    }

    container.innerHTML = materials.map(material => `
        <div class="material-card" data-type="${material.type || material.category || ''}" data-category="${material.category || material.type || ''}" data-difficulty="${(material.difficulty || '').toLowerCase()}" data-title="${escapeHtml(material.title).toLowerCase()}" data-description="${escapeHtml(material.description || '').toLowerCase()}">
            <img src="${material.thumbnailUrl || material.thumbnail || 'https://via.placeholder.com/400x250/6366f1/ffffff?text=Study+Material'}" alt="${escapeHtml(material.title)}" class="thumbnail" loading="lazy" onerror="this.src='https://via.placeholder.com/400x250/6366f1/ffffff?text=Study+Material'">
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
    
    if (typeof applyReveal === 'function') {
        applyReveal(container);
    } else if (window.applyReveal) {
        window.applyReveal(container);
    }
}

// Handle download action (Optimistic UI)
async function handleDownload(materialId, link) {
    const countElement = document.getElementById(`download-count-${materialId}`);
    let prevCount = 0;
    if (countElement) {
        const match = countElement.textContent.match(/\d+/);
        prevCount = match ? parseInt(match[0], 10) : 0;
        countElement.innerHTML = `<i class="fas fa-download"></i> ${prevCount + 1}`;
    }

    // Immediately trigger view/download
    if (link && link !== '#') {
        window.open(link, '_blank');
    }

    try {
        const response = await AuthSession.fetchWithAuth(`/api/materials/${materialId}/download`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (countElement && typeof data.downloadCount !== 'undefined') {
                countElement.innerHTML = `<i class="fas fa-download"></i> ${data.downloadCount}`;
            }
            if (window.SWRCache) SWRCache.invalidatePrefix('materials:');
        } else if (countElement) {
            countElement.innerHTML = `<i class="fas fa-download"></i> ${prevCount}`;
        }
    } catch (error) {
        console.error('Error updating download count:', error);
        if (countElement) {
            countElement.innerHTML = `<i class="fas fa-download"></i> ${prevCount}`;
        }
    }
}

// Submit new material
async function submitMaterial(formData) {
    try {
        const response = await AuthSession.fetchWithAuth('/api/materials', {
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
        if (window.SWRCache) SWRCache.invalidatePrefix('materials:');
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
