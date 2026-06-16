const BASE = () => `https://${process.env.AMO_SUBDOMAIN}.amocrm.ru`;

const VERCEL_PROJECT_ID = 'prj_T2Rx3n6UfSWcZprMu001UH2oqmPy';
const VERCEL_TEAM_ID = 'team_nBi5Ny12iJtSF8duRZLEUBzk';
const ENV_IDS = {
  AMO_ACCESS_TOKEN: 'qgWlcOjG4vC6bCDu',
  AMO_REFRESH_TOKEN: 'CviidFJovDHWbV2H',
};

async function updateVercelEnv(key, value) {
  await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${ENV_IDS[key]}?teamId=${VERCEL_TEAM_ID}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    }
  );
}

async function refreshTokens() {
  console.log('Refreshing amoCRM tokens...');
  const res = await fetch(`${BASE()}/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AMO_CLIENT_ID,
      client_secret: process.env.AMO_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: process.env.AMO_REFRESH_TOKEN,
      redirect_uri: 'https://www.getpostman.com/oauth2/callback',
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);

  // Update in-process env vars for this request
  process.env.AMO_ACCESS_TOKEN = data.access_token;
  process.env.AMO_REFRESH_TOKEN = data.refresh_token;

  // Persist new tokens to Vercel so next cold start picks them up
  await Promise.all([
    updateVercelEnv('AMO_ACCESS_TOKEN', data.access_token),
    updateVercelEnv('AMO_REFRESH_TOKEN', data.refresh_token),
  ]);

  console.log('Tokens refreshed and saved to Vercel.');
  return data.access_token;
}

async function renameDeal(dealId, newName) {
  const doRequest = async (token) =>
    fetch(`${BASE()}/api/v4/leads/${dealId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    });

  let res = await doRequest(process.env.AMO_ACCESS_TOKEN);

  if (res.status === 401) {
    const newToken = await refreshTokens();
    res = await doRequest(newToken);
  }

  const text = await res.text();
  console.log('API response', res.status, text.slice(0, 100));

  if (!res.ok) throw new Error(`amoCRM ${res.status}: ${text}`);
  return JSON.parse(text);
}

function randomFourDigit() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

module.exports = { renameDeal, randomFourDigit };
