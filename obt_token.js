const puppeteer = require('puppeteer');

async function sacarToken() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    const page = await browser.newPage();

    // 1. Bloqueamos publicidad y scripts de seguimiento para que la web no se bloquee
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        const url = req.url();
        // Bloquear todo lo que no sea necesario para el stream
        if (['image', 'stylesheet', 'font', 'media'].includes(type) || 
            url.includes('google-analytics') || url.includes('googletagservices')) {
            req.abort();
        } else if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
            process.stdout.write(url);
            browser.close();
            process.exit(0);
        } else {
            req.continue();
        }
    });

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 25000));
    } catch (e) {
        process.exit(1);
    }
    await browser.close();
    process.exit(1);
}

sacarToken();
