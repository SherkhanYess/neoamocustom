const { renameDeal, randomFourDigit } = require('../lib/amocrm');

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(raw);
      const obj = {};
      for (const [key, value] of params.entries()) {
        obj[key] = value;
      }
      resolve(obj);
    });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(req);

    // amoCRM sends form-encoded keys like: leads[add][0][id]
    // Extract all lead IDs from flat keys
    const leadIds = [];
    for (const key of Object.keys(body || {})) {
      const match = key.match(/^leads\[add\]\[(\d+)\]\[id\]$/);
      if (match) {
        leadIds.push(body[key]);
      }
    }

    if (leadIds.length === 0) {
      return res.status(200).json({ skipped: true, body });
    }

    const results = await Promise.all(
      leadIds.map(async (id) => {
        const newName = randomFourDigit();
        await renameDeal(id, newName);
        return { id, newName };
      })
    );

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
