(function () {
    const grid = document.getElementById('campaigns-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    let campaignsCache = [];

    function createCard(c) {
        const div = document.createElement('div');
        div.className = 'campaign-card';

        const img = document.createElement('img');
        img.className = 'campaign-card-image';
        img.src = c.thumbnail || 'https://via.placeholder.com/400x200?text=Campaign';
        img.alt = c.title || 'Campaign image';

        const content = document.createElement('div');
        content.className = 'campaign-card-content';

        const h3 = document.createElement('h3');
        h3.textContent = c.title || 'Untitled';

        const p = document.createElement('p');
        p.textContent = c.shortDescription || (c.description || '').slice(0, 120);

        const footer = document.createElement('div');
        footer.className = 'campaign-card-footer';

        const progressWrap = document.createElement('div');
        progressWrap.style.flex = '1';
        const progress = document.createElement('div');
        progress.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        const pct = c.fundingGoal ? Math.min(100, Math.round((c.fundedAmount || 0) / c.fundingGoal * 100)) : 0;
        fill.style.width = pct + '%';
        progress.appendChild(fill);
        progressWrap.appendChild(progress);

        const btn = document.createElement('a');
        btn.className = 'btn btn-primary';
        btn.textContent = 'View';
        btn.href = `campaign-detail.html?id=${c._id}`;

        footer.appendChild(progressWrap);
        footer.appendChild(btn);

        content.appendChild(h3);
        content.appendChild(p);
        content.appendChild(footer);

        div.appendChild(img);
        div.appendChild(content);

        return div;
    }

    function renderCampaigns(list) {
        if (!list || !Array.isArray(list) || list.length === 0) {
            grid.innerHTML = '<p>No campaigns found.</p>';
            return;
        }
        grid.innerHTML = '';
        list.forEach(c => grid.appendChild(createCard(c)));
    }

    function applyFilters() {
        const q = (searchInput && searchInput.value || '').trim().toLowerCase();
        const category = (categoryFilter && categoryFilter.value) || '';
        const sort = (sortFilter && sortFilter.value) || 'recent';

        let list = campaignsCache.slice();

        if (q) {
            list = list.filter(c => (c.title || '').toLowerCase().includes(q));
        }
        if (category) {
            list = list.filter(c => (c.category || '').toLowerCase() === category.toLowerCase());
        }

        // sorting
        if (sort === 'recent') {
            list.sort((a, b) => {
                const ta = new Date(a.createdAt || a.createdAt || 0).getTime() || 0;
                const tb = new Date(b.createdAt || b.createdAt || 0).getTime() || 0;
                return tb - ta;
            });
        } else if (sort === 'trending') {
            // trending: by percent funded desc
            list.sort((a, b) => {
                const pa = (a.fundedAmount || 0) / Math.max(1, (a.fundingGoal || 1));
                const pb = (b.fundedAmount || 0) / Math.max(1, (b.fundingGoal || 1));
                return pb - pa;
            });
        } else if (sort === 'ending_soon') {
            list.sort((a, b) => {
                const na = new Date(a.endDate || 0).getTime() || Infinity;
                const nb = new Date(b.endDate || 0).getTime() || Infinity;
                return na - nb;
            });
        } else if (sort === 'most_funded') {
            list.sort((a, b) => (b.fundedAmount || 0) - (a.fundedAmount || 0));
        }

        renderCampaigns(list);
    }

    function debounce(fn, wait = 250) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    async function fetchCampaigns() {
        grid.innerHTML = '<p>Loading campaigns...</p>';
        try {
            const data = await apiFetch('/campaigns');
            if (!data || !Array.isArray(data) || data.length === 0) {
                campaignsCache = [];
                grid.innerHTML = '<p>No campaigns found.</p>';
                return;
            }
            campaignsCache = data;
            applyFilters();
        } catch (err) {
            console.error('Failed to fetch campaigns', err);
            grid.innerHTML = '<p>Unable to load campaigns.</p>';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        fetchCampaigns();

        if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 250));
        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
        if (sortFilter) sortFilter.addEventListener('change', applyFilters);
    });
})();
