const puppeteer = require('puppeteer');

async function sacarToken() {
    // Configuramos el navegador con flags de alto rendimiento para servidores
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Evita fallos de memoria en contenedores
            '--disable-gpu'            // Acelera la carga en Linux
        ] 
    });

    try {
        const page = await browser.newPage();
        
        // Bloqueamos recursos innecesarios (CSS, Imágenes, Fuentes) para cargar volando
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                const url = req.url();
                // Captura inmediata del token
                if (url.includes('mdstrm.com/live-stream-playlist') && url.includes('access_token')) {
                    // Usamos stdout.write para asegurar que no haya saltos de línea extraños
                    process.stdout.write(url); 
                    browser.close().then(() => process.exit(0));
                }
                req.continue();
            }
        });

        // User Agent real para evitar bloqueos
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Entramos a la web
        await page.goto('https://tvgo.americatv.com.pe/canalesenvivo', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Espera máxima de 30 segundos si el evento del token no ha saltado aún
        await new Promise(r => setTimeout(r, 30000)); 

    } catch (e) {
        // Silencio total en error para no ensuciar el JSON
    } finally {
        if (browser) await browser.close();
        process.exit(1);
    }
}

sacarToken();
