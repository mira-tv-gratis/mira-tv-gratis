const puppeteer = require('puppeteer');

async function sacarToken() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    // Variable para los headers dinámicos
    const baseUrl = 'https://tvgo.americatv.com.pe';
    await page.setExtraHTTPHeaders({
        'Referer': `${baseUrl}/`,
        'Origin': baseUrl,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page.on('request', request => {
        const url = request.url();
        // Buscamos el playlist. Si aparece, imprimimos y cerramos
        if (url.includes('mdstrm.com') && url.includes('access_token')) {
            console.log(url); 
            process.exit(0); 
        }
    });

    try {
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        await new Promise(r => setTimeout(r, 15000)); 
    } catch (e) {
        // Log para saber qué pasó si falla
        console.error("Error en navegación:", e);
    }

    await browser.close();
    process.exit(1);
}

sacarToken();
