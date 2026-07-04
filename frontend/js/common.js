(function () {
  // Simple auth UI helpers and API base resolver
  function getApiUrl(path) {
    if (!path) return '';
    // try relative first (works when proxied), then fallback to localhost:5000
    if (path.startsWith('/')) return path;
    return path;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const user = JSON.parse(localStorage.getItem('userData') || 'null');

    if (user) {
      const displayName = user.username || user.firstName || (user.email && user.email.split('@')[0]) || 'Account';
      if (loginBtn) {
        loginBtn.textContent = `Hi, ${displayName}`;
        loginBtn.href = 'dashboard.html';
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
      if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.href = 'login.html';
      }
      if (logoutBtn) logoutBtn.style.display = 'none';
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.reload();
      });
    }
  });

  window.apiFetch = async function (path, opts = {}) {
    const headers = opts.headers || {};
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    opts.headers = headers;

    const candidates = [];
    if (path.startsWith('http')) {
      candidates.push(path);
    } else {
      // try relative (works when proxied) then explicit backend
      candidates.push(path);
      candidates.push('http://localhost:5000' + (path.startsWith('/') ? path : '/' + path));
    }

    let lastErr = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, opts);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          lastErr = new Error(text || ('API Error: ' + res.status));
          lastErr.status = res.status;
          continue;
        }
        // successful
        const text = await res.text();
        try { return JSON.parse(text); } catch (_) { return text; }
      } catch (err) {
        lastErr = err;
      }
    }

    throw lastErr || new Error('API request failed');
  };
})();
