// use global fetch (Node 18+)
const data = {
  title: 'API Test Campaign',
  shortDescription: 'Test',
  description: 'Created by test',
  category: 'test',
  fundingGoal: 1000
};

(async () => {
  try {
    const res = await fetch('http://localhost:5000/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log('Status', res.status);
    const body = await res.text();
    console.log('Body', body);
  } catch (err) {
    console.error(err);
  }
})();
