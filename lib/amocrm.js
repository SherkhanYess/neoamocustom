const BASE = () => `https://${process.env.AMO_SUBDOMAIN}.amocrm.ru`;

async function renameDeal(dealId, newName) {
  const token = process.env.AMO_ACCESS_TOKEN;
  const url = `${BASE()}/api/v4/leads/${dealId}`;
  console.log('PATCH', url, '| token:', token ? token.slice(0, 8) + '...' : 'MISSING');

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newName }),
  });

  const text = await res.text();
  console.log('API response', res.status, text.slice(0, 200));

  if (!res.ok) {
    throw new Error(`amoCRM ${res.status}: ${text}`);
  }

  return JSON.parse(text);
}

function randomFourDigit() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

module.exports = { renameDeal, randomFourDigit };
