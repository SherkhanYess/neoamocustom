const { renameDeal, randomFourDigit } = require('../lib/amocrm');

function getRawBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk.toString(); });
    req.on('end', () => resolve(raw));
    req.on('error', () => resolve(''));
  });
}

function extractLeadIds(flatBody) {
  const ids = [];
  for (const key of Object.keys(flatBody)) {
    if (/^leads\[add\]\[\d+\]\[id\]$/.test(key)) {
      ids.push(flatBody[key]);
    }
  }
  return ids;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel may pre-parse body or leave it as stream — handle both
    let flatBody = {};
    if (req.body && typeof req.body === 'object') {
      flatBody = req.body;
    } else {
      const raw = typeof req.body === 'string' ? req.body : await getRawBody(req);
      console.log('raw body:', raw);
      const params = new URLSearchParams(raw);
      for (const [k, v] of params.entries()) flatBody[k] = v;
    }

    console.log('flatBody keys:', Object.keys(flatBody));

    const leadIds = extractLeadIds(flatBody);
    console.log('leadIds:', leadIds);

    if (leadIds.length === 0) {
      return res.status(200).json({ skipped: true, keys: Object.keys(flatBody) });
    }

    const results = await Promise.all(
      leadIds.map(async (id) => {
        const newName = randomFourDigit();
        await renameDeal(id, newName);
        return { id, newName };
      })
    );

    console.log('results:', results);
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
