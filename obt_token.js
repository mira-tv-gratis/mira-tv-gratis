const puppeteer = require('puppeteer');

async function sacarToken() {
    console.error("DEBUG_JS: Iniciando puppeteer...");
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // Rastreo de errores en la consola del navegador
    page.on('console', msg => console.error('BROWSER_LOG:', msg.text()));

    await page.setExtraHTTPHeaders({
        'Referer': 'https://tvgo.americatv.com.pe/',
        'Origin': 'https://tvgo.americatv.com.pe',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    });

    page.on('request', request => {
        if (request.url().includes('mdstrm.com/live-stream-playlist')) {
            process.stdout.write(request.url());
            browser.close();
            process.exit(0);
        }
    });

    try {
        console.error("DEBUG_JS: Navegando a América TV...");
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { waitUntil: 'networkidle2', timeout: 50000 });
        console.error("DEBUG_JS: Navegación completada, esperando...");
        await new Promise(r => setTimeout(r, 20000));
    } catch (e) {
        console.error("DEBUG_JS: Error en navegación: " + e.message);
    }

    await browser.close();
    process.exit(1);
}

sacarToken();
