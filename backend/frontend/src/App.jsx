import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { createCampaignId, formatCurrency, getProgressPercent, initialCampaigns } from './lib/appData';

function App() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [pledges, setPledges] = useState([]);
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    confirmPassword: '',
    role: 'backer',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const response = await fetch('/campaigns');
        const data = await response.json();
        if (Array.isArray(data) && data.length) {
          setCampaigns(data);
        }
      } catch (error) {
        console.error('Failed to load campaigns', error);
      }
    };

    const loadPledges = async () => {
      try {
        const email = auth?.user?.email;
        const url = `/campaigns/pledges/all${email ? `?backerEmail=${encodeURIComponent(email)}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) setPledges(data);
      } catch (error) {
        console.error('Failed to load pledges', error);
      }
    };

    loadCampaigns();
    loadPledges();
  }, [auth]);

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (auth?.user) {
      localStorage.setItem('userData', JSON.stringify(auth.user));
      localStorage.setItem('authToken', auth.token);
    } else if (!stored) {
      localStorage.removeItem('authToken');
    }
  }, [auth]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const hay = `${campaign.title} ${campaign.shortDescription} ${campaign.description}`.toLowerCase();
      const matchesSearch = hay.includes((search || '').toLowerCase());
      const matchesCategory = !category || category === 'all' || String(campaign.category || '').toLowerCase() === String(category || '').toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [campaigns, category, search]);

  const categories = useMemo(() => {
    const set = new Set();
    campaigns.forEach((c) => { if (c.category) set.add(String(c.category)); });
    return ['all', ...Array.from(set)];
  }, [campaigns]);

  const sortedCampaigns = useMemo(() => {
    const items = filteredCampaigns.slice();
    if (sort === 'recent') {
      items.sort((a, b) => new Date(b.createdAt || b._createdAt || 0) - new Date(a.createdAt || a._createdAt || 0));
    } else if (sort === 'most_funded') {
      items.sort((a, b) => (b.fundedAmount || 0) - (a.fundedAmount || 0));
    } else if (sort === 'ending_soon') {
      items.sort((a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0));
    } else if (sort === 'trending') {
      items.sort((a, b) => ((b.backerCount || 0) + (b.fundedAmount || 0)/1000) - ((a.backerCount || 0) + (a.fundedAmount || 0)/1000));
    }
    return items;
  }, [filteredCampaigns, sort]);

  const stats = useMemo(() => {
    const totalRaised = campaigns.reduce((sum, campaign) => sum + Number(campaign.fundedAmount || 0), 0);
    const activeCount = campaigns.length;
    const backers = new Set(pledges.map((pledge) => pledge.backerEmail)).size + campaigns.reduce((sum, campaign) => sum + Number(campaign.backerCount || 0), 0);
    return { totalRaised, activeCount, backers };
  }, [campaigns, pledges]);

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const resetMessage = () => setMessage({ type: '', text: '' });

  const persistAuth = (user, token) => {
    const payload = {
      ...user,
      email: String(user.email || '').trim().toLowerCase(),
    };
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(payload));
    setAuth({ token, user: payload });
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    resetMessage();
    if (formState.password !== formState.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (formState.password.length < 6) {
      setMessage({ type: 'error', text: 'Password should be at least 6 characters.' });
      return;
    }

    const payload = {
      username: formState.username,
      firstName: formState.firstName,
      email: formState.email,
      password: formState.password,
      role: formState.role,
    };

    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');
      persistAuth(data.user, data.token);
      setMessage({ type: 'success', text: 'Account created successfully.' });
      navigate('/');
    } catch (error) {
      const fallbackUser = {
        id: `local-${Date.now()}`,
        username: payload.username,
        firstName: payload.firstName,
        email: payload.email,
        role: payload.role,
      };
      persistAuth(fallbackUser, `local-${Date.now()}`);
      setMessage({ type: 'success', text: 'Account created locally. You can continue using the app.' });
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    resetMessage();
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      persistAuth(data.user, data.token);
      setMessage({ type: 'success', text: 'Logged in successfully.' });
      navigate('/');
    } catch (error) {
      const storedUser = JSON.parse(localStorage.getItem('userData') || 'null');
      if (storedUser && storedUser.email === formState.email.trim().toLowerCase()) {
        persistAuth(storedUser, `local-${Date.now()}`);
        setMessage({ type: 'success', text: 'Signed in using your saved session.' });
        navigate('/');
        return;
      }
      setMessage({ type: 'error', text: error.message || 'Login failed. Please try again.' });
    }
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newCampaign = {
      title: formData.get('title'),
      shortDescription: formData.get('shortDescription'),
      description: formData.get('description'),
      category: formData.get('category'),
      fundingGoal: Number(formData.get('fundingGoal')),
      fundedAmount: Number(formData.get('fundedAmount') || 0),
      backerCount: Number(formData.get('backerCount') || 0),
      thumbnail: formData.get('thumbnail') || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
      videoPitchUrl: formData.get('videoPitchUrl') || '',
      endDate: formData.get('endDate'),
      creatorName: auth?.user?.firstName || 'You',
      creatorRole: auth?.user?.role || 'Creator',
      createdBy: auth?.user?.email || 'you@example.com',
      rewards: [
        { amount: Number(formData.get('rewardAmount') || 1000), title: formData.get('rewardTitle') || 'Supporter Reward' },
      ],
    };

    try {
      const response = await fetch('/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.message || 'Campaign creation failed');
      setCampaigns((current) => [created, ...current]);
      setMessage({ type: 'success', text: 'Campaign created successfully.' });
      event.currentTarget.reset();
      navigate('/discover');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handlePledge = async (campaignId) => {
    if (!auth?.user) {
      setMessage({ type: 'error', text: 'Please log in to support a campaign.' });
      navigate('/login');
      return;
    }
    const selectedCampaign = campaigns.find((campaign) => campaign._id === campaignId || campaign.id === campaignId);
    if (!selectedCampaign) return;
    const pledgeValue = window.prompt(`Enter your pledge amount for ${selectedCampaign.title}`);
    if (!pledgeValue) return;
    const amount = Number(pledgeValue);
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    try {
      const response = await fetch(`/campaigns/${campaignId}/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backerEmail: auth.user.email, amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pledge failed');
      setPledges((current) => [...current, data.pledge]);
      setCampaigns((current) => current.map((campaign) => campaign._id === campaignId ? data.campaign : campaign));
      setMessage({ type: 'success', text: `Pledge of ${formatCurrency(amount)} received.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/discover', label: 'Discover' },
    { to: '/create', label: 'Start a Campaign' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-container">
          <Link className="logo" to="/">
            <h1>⚡ Crowdspark</h1>
          </Link>
          <ul className="nav-menu">
            {navLinks.map((link) => (
              <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
            ))}
            {auth?.user ? (
              <>
                <li><Link to="/dashboard">Hi, {auth.user.firstName || auth.user.username || auth.user.email}</Link></li>
                <li><button className="btn btn-second" onClick={handleLogout}>Logout</button></li>
              </>
            ) : (
              <li><Link to="/login">Login</Link></li>
            )}
          </ul>
        </div>
      </nav>

      {message.text ? <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>{message.text}</div> : null}

      <Routes>
        <Route path="/" element={<Home campaigns={campaigns} stats={stats} onPledge={handlePledge} />} />
        <Route path="/discover" element={<Discover campaigns={sortedCampaigns} search={search} setSearch={setSearch} category={category} setCategory={setCategory} categories={categories} sort={sort} setSort={setSort} onPledge={handlePledge} />} />
        <Route path="/create" element={auth?.user ? <CreateCampaign onCreate={handleCreateCampaign} /> : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={auth?.user ? <Dashboard campaigns={campaigns} pledges={pledges} auth={auth} /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage type="login" formState={formState} onChange={handleAuthChange} onSubmit={handleLogin} />} />
        <Route path="/signup" element={<AuthPage type="signup" formState={formState} onChange={handleAuthChange} onSubmit={handleSignup} />} />
      </Routes>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About</h4>
            <p>Crowdspark connects creators with backers worldwide to bring innovative ideas to life.</p>
          </div>
          <div className="footer-section">
            <h4>Links</h4>
            <ul>
              <li><Link to="/discover">Discover</Link></li>
              <li><Link to="/create">Start a Campaign</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Home({ campaigns, stats, onPledge }) {
  const featured = campaigns.slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Bring Your Ideas to Life</h1>
          <p>Connect with creators and backers in a seamless crowdfunding experience.</p>
          <div className="hero-buttons">
            <Link className="btn btn-primary" to="/discover">Explore Campaigns</Link>
            <Link className="btn btn-second" to="/create">Create Campaign</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat"><h3>{stats.activeCount}</h3><p>Active Campaigns</p></div>
          <div className="stat"><h3>{formatCurrency(stats.totalRaised)}</h3><p>Funds Raised</p></div>
          <div className="stat"><h3>{stats.backers}</h3><p>Community Members</p></div>
        </div>
      </section>

      <section>
        <h2>Trending Now</h2>
        <div className="campaigns-grid">
          {featured.map((campaign) => (
            <CampaignCard key={campaign._id || campaign.id} campaign={campaign} onPledge={onPledge} />
          ))}
        </div>
      </section>
    </>
  );
}

function Discover({ campaigns, search, setSearch, category, setCategory, categories = [], sort, setSort, onPledge }) {
  return (
    <section>
      <h2>Discover Campaigns</h2>
      <div className="filters-section">
        <input className="search-box" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaigns" />
        <select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((c) => (<option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>))}
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Most Recent</option>
          <option value="trending">Trending</option>
          <option value="ending_soon">Ending Soon</option>
          <option value="most_funded">Most Funded</option>
        </select>
      </div>
      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign._id || campaign.id} campaign={campaign} onPledge={onPledge} />
        ))}
      </div>
    </section>
  );
}

function CreateCampaign({ onCreate }) {
  return (
    <section className="create-campaign">
      <h2>Start a Campaign</h2>
      <form className="campaign-form" onSubmit={onCreate}>
        <div className="form-group"><label>Campaign Title</label><input name="title" required /></div>
        <div className="form-group"><label>Short Description</label><input name="shortDescription" required /></div>
        <div className="form-group"><label>Description</label><textarea name="description" required /></div>
        <div className="form-group"><label>Category</label><select name="category"><option value="technology">Technology</option><option value="art">Art</option><option value="design">Design</option><option value="games">Games</option><option value="music">Music</option><option value="food">Food</option></select></div>
        <div className="form-group"><label>Funding Goal</label><input name="fundingGoal" type="number" min="1000" required /></div>
        <div className="form-group"><label>Current Amount Raised</label><input name="fundedAmount" type="number" min="0" defaultValue="0" /></div>
        <div className="form-group"><label>End Date</label><input name="endDate" type="date" required /></div>
        <div className="form-group"><label>Thumbnail URL</label><input name="thumbnail" /></div>
        <div className="form-group"><label>Video Pitch URL</label><input name="videoPitchUrl" /></div>
        <div className="form-group"><label>Reward Title</label><input name="rewardTitle" /></div>
        <div className="form-group"><label>Reward Amount</label><input name="rewardAmount" type="number" min="100" /></div>
        <button className="btn btn-primary full-width" type="submit">Launch Campaign</button>
      </form>
    </section>
  );
}

function Dashboard({ campaigns, pledges, auth }) {
  const myCampaigns = campaigns.filter((campaign) => campaign.createdBy === auth.user.email);
  const myPledges = pledges.filter((pledge) => pledge.backerEmail === auth.user.email);
  const totalBacked = myPledges.reduce((sum, pledge) => sum + Number(pledge.amount || 0), 0);
  const totalRaised = myCampaigns.reduce((sum, campaign) => sum + Number(campaign.fundedAmount || 0), 0);
  const openCampaigns = myCampaigns.filter((campaign) => Number(campaign.fundedAmount || 0) < Number(campaign.fundingGoal || 0)).length;

  return (
    <section className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card"><h3>My Campaigns</h3><p>{myCampaigns.length}</p></div>
        <div className="stat-card"><h3>My Pledges</h3><p>{myPledges.length}</p></div>
        <div className="stat-card"><h3>Backed Amount</h3><p>{formatCurrency(totalBacked)}</p></div>
        <div className="stat-card"><h3>Raised by My Campaigns</h3><p>{formatCurrency(totalRaised)}</p></div>
        <div className="stat-card"><h3>Open Campaigns</h3><p>{openCampaigns}</p></div>
      </div>
      <div className="tab-content active">
        <h3>Your Campaigns</h3>
        <div className="campaigns-grid">
          {myCampaigns.length ? myCampaigns.map((campaign) => <CampaignCard key={campaign._id || campaign.id} campaign={campaign} onPledge={() => {}} />) : <p>No campaigns yet.</p>}
        </div>
        <h3>Your Pledges</h3>
        <div className="campaigns-grid">
          {myPledges.length ? myPledges.map((pledge) => {
            const camp = campaigns.find((c) => String(c._id || c.id) === String(pledge.campaignId) || String(c.id) === String(pledge.campaignId));
            return (
              <div key={pledge._id || pledge.id} className="pledge-card" style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                <strong>{formatCurrency(pledge.amount)}</strong>
                <div>{camp ? camp.title : `Campaign ${pledge.campaignId}`}</div>
              </div>
            );
          }) : <p>No pledges yet.</p>}
        </div>

        <h3>Your Rewards</h3>
        <div className="campaigns-grid">
          {(() => {
            const rewardsEarned = [];
            myPledges.forEach((pledge) => {
              const camp = campaigns.find((c) => String(c._id || c.id) === String(pledge.campaignId) || String(c.id) === String(pledge.campaignId));
              if (!camp || !Array.isArray(camp.rewards) || !camp.rewards.length) return;
              // find highest reward amount <= pledge.amount
              const sorted = camp.rewards.slice().sort((a, b) => a.amount - b.amount);
              let earned = null;
              for (let i = 0; i < sorted.length; i++) {
                if (Number(pledge.amount) >= Number(sorted[i].amount)) earned = sorted[i];
              }
              if (earned) rewardsEarned.push({ campaign: camp, pledge, reward: earned });
            });
            if (!rewardsEarned.length) return <p>No rewards earned yet.</p>;
            return rewardsEarned.map((r) => (
              <div key={`${r.pledge.id || r.pledge._id}-${r.reward.title}`} className="reward-card" style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                <strong>{r.reward.title}</strong>
                <div>{r.campaign.title}</div>
                <div>Redeemable for pledge {formatCurrency(r.pledge.amount)}</div>
              </div>
            ));
          })()}
        </div>
      </div>
    </section>
  );
}

function AuthPage({ type, formState, onChange, onSubmit }) {
  const isSignup = type === 'signup';
  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignup ? 'Join Crowdspark and start making an impact.' : 'Login to your Crowdspark account.'}</p>
          <form onSubmit={onSubmit}>
            {isSignup ? (
              <>
                <div className="form-group"><label>Username</label><input name="username" value={formState.username} onChange={onChange} required /></div>
                <div className="form-group"><label>First Name</label><input name="firstName" value={formState.firstName} onChange={onChange} required /></div>
              </>
            ) : null}
            <div className="form-group"><label>Email</label><input type="email" name="email" value={formState.email} onChange={onChange} required /></div>
            <div className="form-group"><label>Password</label><input type="password" name="password" value={formState.password} onChange={onChange} required /></div>
            {isSignup ? (
              <>
                <div className="form-group"><label>Confirm Password</label><input type="password" name="confirmPassword" value={formState.confirmPassword} onChange={onChange} required /></div>
                <div className="form-group"><label>I want to be</label><select name="role" value={formState.role} onChange={onChange}><option value="backer">Support Projects</option><option value="creator">Create Campaigns</option></select></div>
              </>
            ) : null}
            <button className="btn btn-primary full-width" type="submit">{isSignup ? 'Create Account' : 'Login'}</button>
          </form>
          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : "Don't have an account?"} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Login here' : 'Sign up here'}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function CampaignCard({ campaign, onPledge }) {
  const campaignId = campaign._id || campaign.id;
  const progress = getProgressPercent(campaign);
  return (
    <article className="campaign-card">
      <img className="campaign-card-image" src={campaign.thumbnail} alt={campaign.title} />
      <div className="campaign-card-content">
        <h3>{campaign.title}</h3>
        <p>{campaign.shortDescription}</p>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        <p>{formatCurrency(campaign.fundedAmount)} raised of {formatCurrency(campaign.fundingGoal)}</p>
        <div className="campaign-card-footer">
          <span>{campaign.backerCount} backers</span>
          <button className="btn btn-primary" onClick={() => onPledge(campaignId)}>Support</button>
        </div>
      </div>
    </article>
  );
}

export default App;
