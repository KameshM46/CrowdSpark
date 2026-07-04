(function () {
    function qs(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function el(id) { return document.getElementById(id); }

    function formatCurrency(n) { return '₹' + (n || 0); }

    function daysLeft(endDate) {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    }

    async function loadCampaign() {
        const id = qs('id');
        if (!id) return;
        try {
            const c = await apiFetch('/campaigns/' + id);

            el('campaign-title').textContent = c.title || 'Campaign Title';
            el('campaign-image').src = c.thumbnail || 'https://via.placeholder.com/1200x400?text=Campaign';
            el('creator-name').textContent = c.creatorName || c.createdBy || 'Creator Name';
            el('creator-role').textContent = c.creatorRole || '';
            el('campaign-description').textContent = c.description || '';

            // video
            if (c.videoPitchUrl) {
                el('video-section').style.display = 'block';
                const iframe = el('campaign-video');
                iframe.src = c.videoPitchUrl;
            }

            const pct = c.fundingGoal ? Math.round((c.fundedAmount || 0) / c.fundingGoal * 100) : 0;
            el('progress-fill').style.width = pct + '%';
            el('funded-amount').textContent = formatCurrency(c.fundedAmount || 0);
            el('funding-goal').textContent = (pct || 0) + '%';
            el('backer-count').textContent = (c.backerCount || 0);
            el('days-left').textContent = daysLeft(c.endDate);
            el('min-pledge').textContent = 'Minimum pledge: ₹' + ((c.rewards && c.rewards[0] && c.rewards[0].amount) || 1);

            // rewards list
            const rewardsList = el('rewards-list');
            rewardsList.innerHTML = '';
            if (Array.isArray(c.rewards) && c.rewards.length) {
                c.rewards.forEach((r, idx) => {
                    const div = document.createElement('div');
                    div.className = 'reward-tier';
                    div.innerHTML = `<strong>₹${r.amount} - ${r.title}</strong><p>${r.description || ''}</p>`;
                    rewardsList.appendChild(div);
                });
            } else {
                rewardsList.innerHTML = '<p>No rewards specified.</p>';
            }

            // store campaign rewards for modal
            window.__campaignDetail = c;
        } catch (err) {
            console.error('Failed loading campaign', err);
        }
    }

    // Backing modal
    window.openBackingModal = function () {
        const modal = el('backing-modal');
        const sel = el('reward-selection');
        sel.innerHTML = '';
        const c = window.__campaignDetail || {};
        if (Array.isArray(c.rewards) && c.rewards.length) {
            c.rewards.forEach((r, i) => {
                const id = 'reward-' + i;
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `<label><input type="radio" name="reward" value="${i}" ${i===0? 'checked':''}> ₹${r.amount} - ${r.title}</label>`;
                sel.appendChild(wrapper);
            });
        } else {
            sel.innerHTML = '<p>No rewards to choose.</p>';
        }
        modal.style.display = 'block';
    };

    window.closeBackingModal = function () {
        const modal = el('backing-modal');
        modal.style.display = 'none';
    };

    window.copyCampaignLink = function () {
        const url = window.location.href;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
    };

    async function handleBacking(e) {
        e.preventDefault();
        const c = window.__campaignDetail;
        if (!c || !c._id) return alert('Campaign not loaded');
        const amount = Number(el('pledge-amount').value || 0);
        if (!amount || amount <= 0) return alert('Enter a pledge amount');
        const rewardIdx = (document.querySelector('input[name="reward"]:checked') || {}).value;
        const reward = (c.rewards && c.rewards[rewardIdx]) ? c.rewards[rewardIdx] : null;
        const message = el('backer-message').value || '';

        const user = JSON.parse(localStorage.getItem('userData') || 'null');
        const backerEmail = user?.email || 'guest@example.com';

        try {
            const payload = { amount, backerEmail, message, reward: reward ? { title: reward.title, amount: reward.amount } : undefined };
            await apiFetch(`/campaigns/${c._id}/pledge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            alert('Pledge successful');
            closeBackingModal();
            await loadCampaign();
        } catch (err) {
            console.error(err);
            alert('Pledge failed: ' + (err.body || err.message || err));
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadCampaign();
        const form = document.getElementById('backing-form');
        if (form) form.addEventListener('submit', handleBacking);
        // close modal when clicking outside
        window.addEventListener('click', (ev) => {
            const modal = el('backing-modal');
            if (ev.target === modal) modal.style.display = 'none';
        });
    });
})();
