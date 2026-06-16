const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE = () => `https://${process.env.AMO_SUBDOMAIN}.amocrm.ru`;

async function renameDeal(dealId, newName) {
  const token = process.env.AMO_ACCESS_TOKEN;
  const url = `${BASE()}/api/v4/leads/${dealId}`;
  console.log('PATCH url:', url, '| token starts:', token ? token.slice(0, 10) : 'MISSING');
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`amoCRM API error ${res.status}: ${text}`);
  }

  return res.json();
}

function randomFourDigit() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

module.exports = { renameDeal, randomFourDigit };
