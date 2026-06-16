const { renameDeal, randomFourDigit } = require('../lib/amocrm');

function extractLeadIds(body) {
  const ids = [];
  for (const key of Object.keys(body)) {
    if (/^leads\[(add|status)\]\[\d+\]\[id\]$/.test(key)) {
      ids.push(body[key]);
    }
  }
  return ids;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const log = { step: 'start' };

  try {
    const body = req.body || {};
    log.bodyKeys = Object.keys(body);
    log.step = 'extracted_body';

    const leadIds = extractLeadIds(body);
    log.leadIds = leadIds;
    log.step = 'extracted_ids';

    if (leadIds.length === 0) {
      log.result = 'skipped';
      console.log(JSON.stringify(log));
      return res.status(200).json({ skipped: true, log });
    }

    log.fetchAvailable = typeof fetch !== 'undefined';
    log.subdomain = process.env.AMO_SUBDOMAIN;
    log.tokenPrefix = process.env.AMO_ACCESS_TOKEN
      ? process.env.AMO_ACCESS_TOKEN.slice(0, 8)
      : 'MISSING';
    log.step = 'before_rename';

    const results = await Promise.all(
      leadIds.map(async (id) => {
        const newName = randomFourDigit();
        await renameDeal(id, newName);
        return { id, newName };
      })
    );

    log.results = results;
    log.step = 'done';
    console.log(JSON.stringify(log));
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    log.error = err.message;
    log.step = 'error';
    console.log(JSON.stringify(log));
    return res.status(200).json({ error: err.message, log });
  }
};
