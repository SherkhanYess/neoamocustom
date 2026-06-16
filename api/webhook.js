const { renameDeal, randomFourDigit } = require('../lib/amocrm');

function extractLeadIds(body) {
  const ids = [];

  // Flat keys like leads[add][0][id] (amoCRM form-encoded)
  for (const key of Object.keys(body)) {
    if (/^leads\[add\]\[\d+\]\[id\]$/.test(key)) {
      ids.push(body[key]);
    }
  }

  return ids;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    console.log('body:', JSON.stringify(body));

    const leadIds = extractLeadIds(body);
    console.log('leadIds:', leadIds);

    if (leadIds.length === 0) {
      return res.status(200).json({ skipped: true });
    }

    const results = await Promise.all(
      leadIds.map(async (id) => {
        const newName = randomFourDigit();
        await renameDeal(id, newName);
        return { id, newName };
      })
    );

    console.log('renamed:', results);
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
