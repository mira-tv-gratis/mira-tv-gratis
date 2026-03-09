const puppeteer = require('puppeteer');

async function sacarToken() {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: "new",
            // Forzamos la ruta del Chrome del sistema si existe
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
            ] 
        });

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
                process.stdout.write(url);
                // Cerramos y salimos con éxito
                browser.close().then(() => process.exit(0));
            }
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { 
            waitUntil: 'networkidle2'
        });

        // Espera de seguridad si no capturó el link rápido
        await new Promise(r => setTimeout(r, 25000)); 

} catch (e) {
        // CAMBIO: Esto nos dirá exactamente por qué falla
        console.error("DEBUG: Error capturado en el catch:", e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        process.exit(1);
    }
}

sacarToken();
