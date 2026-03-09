const fs = require('fs');
const axios = require('axios');
const { execSync } = require('child_process');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';

// 1. Scraper para canales viejos
async function extraer_link_de_fuente(url_fuente) {
    const urlObj = new URL(url_fuente);
    const dominio = urlObj.hostname;
    const headers = {
        'User-Agent': USER_AGENT,
        'Referer': `https://${dominio}/`,
        'Origin': `https://${dominio}`
    };
    try {
        const response = await axios.get(url_fuente, { headers, timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (error) {
        return null;
    }
}

// 2. Buscador para canales nuevos (Latina)
async function buscar_en_iptv_lista(tvg_id, url_lista) {
    try {
        const response = await axios.get(url_lista, { timeout: 15000 });
        const patron = new RegExp(`tvg-id="${tvg_id}".*?\\n(https://.*?\\.m3u8)`, 's');
        const match = response.data.match(patron);
        return match ? match[1].trim() : null;
    } catch (error) {
        return null;
    }
}

// 3. Puppeteer para América TV
function obtener_token_america() {
    try {
        // Añadimos { stdio: 'pipe' } para capturar mejor si hay errores
        const resultado = execSync('node obt_token.js', { encoding: 'utf8', timeout: 90000 });
        const link = resultado.trim();
        return link.startsWith("http") ? link : null;
    } catch (error) {
        // Esto te dirá en el log de GitHub POR QUÉ falló Node
        console.log("DEBUG: Error detallado de Node:", error.stderr || error.message);
        return null;
    }
}

// 4. Verificación universal
async function esta_vivo(url) {
    try {
        const headers = { 'User-Agent': USER_AGENT };
        const response = await axios.get(url, { headers, timeout: 8000 });
        return [200, 403].includes(response.status);
    } catch (error) {
        // En axios, si da 403 lanza error, lo capturamos aquí
        if (error.response && [200, 403].includes(error.response.status)) {
            return true;
        }
        return false;
    }
}

// 5. Motor global
async function actualizar() {
    const rawData = fs.readFileSync('canales.json', 'utf8');
    let datos = JSON.parse(rawData);
    let cambios = false;

    for (let canal of datos) {
        let nuevo_link = null;

        // A. América TV (Puppeteer)
        if (canal["nombre"] === "América TV") {
            nuevo_link = obtener_token_america();
            if (nuevo_link && canal["stream_url"] !== nuevo_link) {
                canal["stream_url"] = nuevo_link;
                cambios = true;
                console.log("✅ América TV actualizado.");
            }
        }
        // B. Latina (Lista maestra)
        else if (canal["group_title"] === "") {
            nuevo_link = await buscar_en_iptv_lista(canal["tvg_id"], canal["source"]);
            if (nuevo_link && canal["stream_url"] !== nuevo_link) {
                canal["stream_url"] = nuevo_link;
                cambios = true;
            }
        }
        // C. Canales viejos (Scraper)
        else if (canal["source"]) {
            nuevo_link = await extraer_link_de_fuente(canal["source"]);
            if (nuevo_link && canal["stream_url"] !== nuevo_link) {
                canal["stream_url"] = nuevo_link;
                cambios = true;
            }
        }

        // Verificación final
        const vivo = await esta_vivo(canal["stream_url"]);
        if (vivo) {
            console.log(`✅ ${canal["nombre"]} OK.`);
        } else {
            console.log(`❌ ${canal["nombre"]} está CAÍDO.`);
        }
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("🚀 JSON ACTUALIZADO.");
    }
}

// Ejecución
actualizar();
