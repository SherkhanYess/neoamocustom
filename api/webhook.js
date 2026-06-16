const { renameDeal, randomFourDigit } = require('../lib/amocrm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // amoCRM sends webhook as leads[add][0][id] (parsed by Vercel as nested object)
    const leads = body?.leads?.add;
    if (!leads || leads.length === 0) {
      return res.status(200).json({ skipped: true });
    }

    const results = await Promise.all(
      leads.map(async (lead) => {
        const newName = randomFourDigit();
        await renameDeal(lead.id, newName);
        return { id: lead.id, newName };
      })
    );

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
