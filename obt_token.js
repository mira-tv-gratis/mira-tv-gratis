const puppeteer = require('puppeteer');

async function sacarToken() {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: "new",
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-zygote'
            ] 
        });

        const page = await browser.newPage();
        
        // Esta línea es la que nos dará el reporte real de errores
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('error', err => console.log('PAGE ERROR:', err));

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
                process.stdout.write(url);
                process.exit(0);
            }
            req.continue();
        });

        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { waitUntil: 'networkidle2', timeout: 50000 });
        await new Promise(r => setTimeout(r, 20000));
        
        throw new Error("No se encontró el token en 20 segundos.");

    } catch (e) {
        console.error("ERROR FINAL:", e.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
}

sacarToken();
