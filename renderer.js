const searchInput = document.getElementById('searchInput');
const tagSelect = document.getElementById('tagSelect');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const imageModal = document.getElementById('imageModal');
const modalImg = imageModal.querySelector('img');
const modalClose = imageModal.querySelector('.modal-close');

// Load Tags
async function loadTags() {
    const tags = await window.api.getAllTags();
    tags.forEach(t => {
        const option = document.createElement('option');
        option.value = t.tag;
        option.textContent = t.tag;
        tagSelect.appendChild(option);
    });
}

// Search
async function performSearch() {
    const query = searchInput.value;
    const tag = tagSelect.value;
    
    resultsGrid.innerHTML = '<p>Loading...</p>';
    
    const results = await window.api.searchImages({ query, tag });
    
    resultsGrid.innerHTML = '';
    
    if (results.error) {
        resultsGrid.innerHTML = `<p style="color:red">Error: ${results.error}</p>`;
        return;
    }
    
    if (results.length === 0) {
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
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
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
loadTags();
performSearch(); // Load initial
