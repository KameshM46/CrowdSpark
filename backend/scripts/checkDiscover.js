async function check() {
  try {
    const res = await fetch('http://localhost:5000/discover');
    console.log('Status', res.status);
    const text = await res.text();
    console.log('Body starts:', text.slice(0, 200));
  } catch (err) {
    console.error('Request failed', err.message || err);
  }
}
check();
