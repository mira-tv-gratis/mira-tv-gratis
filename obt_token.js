const puppeteer = require('puppeteer');

async function sacarToken() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        // Estos flags son VITALES para que no falle en GitHub Actions
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ] 
    });

    try {
        const page = await browser.newPage();
        
        // Bloqueamos lo innecesario para que no pese la carga
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                const url = req.url();
                if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
                    process.stdout.write(url);
                    browser.close().then(() => process.exit(0));
                }
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Vamos a la web y esperamos a que el reproductor intente cargar
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Damos 20 segundos extra por si el internet de GitHub está lento
        await new Promise(r => setTimeout(r, 20000)); 

    } catch (e) {
        // Si hay error, salimos con código 1 para que el motor sepa que falló
    } finally {
        if (browser) await browser.close();
        process.exit(1);
    }
}

sacarToken();
