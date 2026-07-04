(function () {
    function showStep(n) {
        document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
        const s = document.getElementById('step-' + n);
        if (s) s.classList.add('active');
    }

    window.nextStep = function (n) { showStep(n); };
    window.prevStep = function (n) { showStep(n); };

    async function handleSubmit(event) {
        event.preventDefault();
        const form = document.getElementById('campaign-form');
        const data = new FormData(form);
        const obj = {
            title: data.get('title'),
            shortDescription: data.get('shortDescription'),
            description: data.get('description'),
            category: data.get('category'),
            fundingGoal: Number(data.get('fundingGoal') || 0),
            endDate: data.get('endDate'),
            thumbnail: data.get('thumbnail'),
            videoPitchUrl: data.get('videoPitchUrl'),
            rewards: []
        };

        // If single reward fields exist on the page, include them
        const rewardName = document.getElementById('reward-name')?.value;
        const rewardAmount = document.getElementById('reward-amount')?.value;
        const rewardDescription = document.getElementById('reward-description')?.value;
        if (rewardName && rewardAmount) {
            obj.rewards.push({ title: rewardName, amount: Number(rewardAmount), description: rewardDescription });
        }

        // Attach creator from localStorage if present
        const user = JSON.parse(localStorage.getItem('userData') || 'null');
        if (user && user.email) obj.createdBy = user.email;

        try {
            const res = await apiFetch('/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(obj)
            });
            // redirect to campaign detail or dashboard
            if (res && res._id) {
                window.location.href = `campaign-detail.html?id=${res._id}`;
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            alert('Error creating campaign: ' + (err.body || err.message));
            console.error(err);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('campaign-form');
        if (form) form.addEventListener('submit', handleSubmit);
    });
})();
