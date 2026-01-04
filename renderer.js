const catalogSelect = document.getElementById('catalogSelect');
const tagSelect = document.getElementById('tagSelect');
const sortOrderSelect = document.getElementById('sortOrderSelect');
const limitInput = document.getElementById('limitInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const imageModal = document.getElementById('imageModal');
const modalImg = imageModal.querySelector('img');
const modalClose = imageModal.querySelector('.modal-close');

// Load Catalogs
async function loadCatalogs() {
    const { catalogs, current } = await window.api.getCatalogs();
    catalogSelect.innerHTML = '';
    catalogs.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        if (name === current) option.selected = true;
        catalogSelect.appendChild(option);
    });
}

// Load Tags
async function loadTags() {
    const tags = await window.api.getAllTags();
    // Clear existing tags except the first one (All Tags)
    tagSelect.innerHTML = '<option value="">All Tags</option>';
    tags.forEach(t => {
        const option = document.createElement('option');
        option.value = t.tag;
        option.textContent = t.tag;
        tagSelect.appendChild(option);
    });
}

// Search
async function performSearch() {
    const tag = tagSelect.value;
    const sortOrder = sortOrderSelect.value;
    const limit = parseInt(limitInput.value, 10);
    
    resultsGrid.innerHTML = '<p>Loading...</p>';
    
    const results = await window.api.searchImages({ tag, sortOrder, limit });
    
    resultsGrid.innerHTML = '';
    
    if (results.error) {
        resultsGrid.innerHTML = `<p style="color:red">Error: ${results.error}</p>`;
        return;
    }
    
    if (!results || results.length === 0) {
        resultsGrid.innerHTML = '<p>No results found.</p>';
        return;
    }
    
    results.forEach(img => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Use custom protocol
        const thumbUrl = `local-resource://thumbnail/${img.thumbnail_path}`;
        const vaultUrl = `local-resource://vault/${img.vault_path}`;
        
        const tagsHtml = img.tags ? img.tags.split(',').map(t => `<span class="tag">${t}</span>`).join('') : '';

        card.innerHTML = `
            <img src="${thumbUrl}" alt="${img.file_name}" loading="lazy">
            <div class="card-info">
                <div class="filename" title="${img.file_name}">${img.file_name}</div>
                <div class="tags">${tagsHtml}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            modalImg.src = vaultUrl;
            imageModal.classList.add('open');
        });
        
        resultsGrid.appendChild(card);
    });
}

// Event Listeners
searchBtn.addEventListener('click', performSearch);

catalogSelect.addEventListener('change', async () => {
    const name = catalogSelect.value;
    const result = await window.api.switchCatalog(name);
    if (result.success) {
        await loadTags();
        await performSearch();
    } else {
        alert('Failed to switch catalog: ' + result.error);
    }
});

modalClose.addEventListener('click', () => {
    imageModal.classList.remove('open');
    modalImg.src = '';
});

imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
        imageModal.classList.remove('open');
        modalImg.src = '';
    }
});

// Init
async function init() {
    await loadCatalogs();
    await loadTags();
    await performSearch();
}

init();
