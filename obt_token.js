const puppeteer = require('puppeteer');

async function sacarToken() {
    // headless: "new" es necesario en versiones modernas de Puppeteer
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    page.on('request', request => {
        const url = request.url();
        // Buscamos la URL que contiene el playlist y el token
        if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
            // IMPORTANTE: Solo imprimimos la URL, nada más.
            console.log(url); 
            process.exit(0); 
        }
    });

    try {
        // Entramos a América TV
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        // Esperamos un tiempo prudencial para que el JS de la página actúe
        await new Promise(r => setTimeout(r, 20000)); 
    } catch (e) {
        // Si hay error, no imprimimos nada para que Rust sepa que falló
    }

    await browser.close();
    process.exit(1);
}

sacarToken();
