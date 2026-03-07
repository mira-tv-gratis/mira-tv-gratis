const puppeteer = require('puppeteer');

async function sacarToken() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', // Vital para evitar bloqueos por memoria en Actions
            '--no-zygote'
        ] 
    });
    
    const page = await browser.newPage();

    // Añadimos los headers dinámicos que evitan bloqueos 403
    await page.setExtraHTTPHeaders({
        'Referer': 'https://tvgo.americatv.com.pe/',
        'Origin': 'https://tvgo.americatv.com.pe',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Intercepción de red
    page.on('request', request => {
        const url = request.url();
        if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
            process.stdout.write(url); // Imprimimos solo la URL
            browser.close();
            process.exit(0); // Terminamos con éxito
        }
    });

    try {
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { 
            waitUntil: 'networkidle2', 
            timeout: 50000 
        });
        
        // Espera de seguridad
        await new Promise(r => setTimeout(r, 15000)); 
    } catch (e) {
        // Error silencioso
    }

    await browser.close();
    process.exit(1); // Si llegamos aquí, no se encontró el link
}

sacarToken();
