const https = require('https');
const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR3RHqbegY5CT1ANmX4ubRMyahLmySZPRn8ZSGdu_6o49mkFavsPCUcQ83pOR_njRR_5dBzOlY1NtxZ/pub';

function fetchCSV(gid) {
    const url = `${SHEET_BASE}?gid=${gid}&single=true&output=csv&_t=${Date.now()}`;
    return new Promise((resolve, reject) => {
        const follow = (reqUrl, redirects) => {
            if (redirects > 5) return reject(new Error('Too many redirects'));
            https.get(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return follow(res.headers.location, redirects + 1);
                }
                if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        };
        follow(url, 0);
    });
}

module.exports = async (req, res) => {
    const gid = req.query.gid;
    if (!gid) { res.status(400).send('gid required'); return; }
    try {
        const csv = await fetchCSV(gid);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.status(200).send(csv);
    } catch (err) {
        res.status(502).send('Fetch error: ' + err.message);
    }
};
