(function () {
    function el(id) { return document.getElementById(id); }

    function switchTab(name) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.toLowerCase().includes(name));
        if (btn) btn.classList.add('active');
        const tab = el(name);
        if (tab) tab.classList.add('active');
    }
    window.switchTab = switchTab;

    function formatCurrency(n) { return '₹' + (n || 0); }

    async function loadDashboard() {
        const user = JSON.parse(localStorage.getItem('userData') || 'null');
        const email = user?.email;

        try {
            const all = await apiFetch('/campaigns');
            // Overview stats (all time)
            const totalBacked = await apiFetch('/campaigns/pledges/all' + (email ? ('?backerEmail=' + encodeURIComponent(email)) : ''))
                .then(arr => Array.isArray(arr) ? arr.reduce((s,p)=>s+(p.amount||0),0) : 0)
                .catch(() => 0);

            el('total-backed').textContent = formatCurrency(totalBacked);

            // My campaigns
            const myList = el('my-campaigns-list');
            myList.innerHTML = '';
            const myCampaigns = email ? all.filter(c => c.createdBy === email) : [];
            if (myCampaigns.length === 0) myList.innerHTML = '<p>No campaigns found.</p>';
            myCampaigns.forEach(c => {
                const div = document.createElement('div');
                div.className = 'campaign-card';
                div.innerHTML = `<img class="campaign-card-image" src="${c.thumbnail||'https://via.placeholder.com/400x200'}"><div class="campaign-card-content"><h3>${c.title}</h3><p>${c.shortDescription||''}</p><a class="btn btn-primary" href="campaign-detail.html?id=${c._id}">Manage</a></div>`;
                myList.appendChild(div);
            });

            // My pledges
            const pledgesList = el('pledges-list');
            pledgesList.innerHTML = '';
            if (email) {
                const pledges = await apiFetch('/campaigns/pledges/all?backerEmail=' + encodeURIComponent(email)).catch(()=>[]);
                if (!pledges || pledges.length === 0) pledgesList.innerHTML = '<p>No pledges yet.</p>';
                (pledges||[]).forEach(p => {
                    const d = document.createElement('div');
                    d.className = 'stat-card';
                    d.innerHTML = `<h3>${formatCurrency(p.amount)}</h3><p>${p.campaignTitle || p.campaignId}</p>`;
                    pledgesList.appendChild(d);
                });
                el('campaigns-supported').textContent = (pledges||[]).length;
            } else {
                pledgesList.innerHTML = '<p>Login to see your pledges.</p>';
            }

        } catch (err) {
            console.error('Dashboard load failed', err);
        }
    }

    document.addEventListener('DOMContentLoaded', loadDashboard);
})();
