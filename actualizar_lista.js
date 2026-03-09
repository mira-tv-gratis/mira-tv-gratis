const fs = require('fs');
const axios = require('axios');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 1. Scraper para canales generales
async function extraer_link_generico(url_fuente) {
    try {
        const headers = { 'User-Agent': USER_AGENT };
        const response = await axios.get(url_fuente, { headers, timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (e) { return null; }
}

// 2. Scraper EXCLUSIVO para Willax
async function extraer_link_willax(url_fuente) {
    try {
        const headers = {
            'User-Agent': USER_AGENT,
            'Referer': 'https://willax.pe/en-vivo/',
            'Origin': 'https://willax.pe'
        };
        const response = await axios.get(url_fuente, { headers, timeout: 20000 });
        
        // --- DIAGNÓSTICO ---
        // Si el match falla, imprimimos un poco del contenido para ver qué está pasando
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        if (!match) {
            console.log("DEBUG: No se encontró .m3u8. Primeros 500 caracteres de la respuesta:");
            console.log(response.data.substring(0, 500));
        }
        
        return match ? match[0] : null;
    } catch (e) { 
        console.log("DEBUG: Error al conectar con Willax:", e.message);
        return null; 
    }
}
// 3. Buscador para listas IPTV
async function buscar_en_iptv_lista(tvg_id, url_lista) {
    try {
        const response = await axios.get(url_lista, { timeout: 15000 });
        const patron = new RegExp(`tvg-id="${tvg_id}".*?\\n(https://.*?\\.m3u8)`, 's');
        const match = response.data.match(patron);
        return match ? match[1].trim() : null;
    } catch (e) { return null; }
}

// 4. Verificación de estado
async function esta_vivo(url) {
    try {
        const headers = { 'User-Agent': USER_AGENT };
        const response = await axios.get(url, { headers, timeout: 8000 });
        return [200, 403].includes(response.status);
    } catch (error) {
        return error.response && [200, 403].includes(error.response.status);
    }
}

// 5. Motor global
async function actualizar() {
    let datos = JSON.parse(fs.readFileSync('canales.json', 'utf8'));
    let cambios = false;

    for (let canal of datos) {
        if (canal.nombre === "América TV") continue;

        let nuevo_link = null;

        // Lógica separada por tipo de canal
        if (canal.nombre === "Willax TV") {
            nuevo_link = await extraer_link_willax(canal.source);
        } 
        else if (canal.group_title === "" && canal.source) {
            nuevo_link = await buscar_en_iptv_lista(canal.tvg_id, canal.source);
        }
        else if (canal.source) {
            nuevo_link = await extraer_link_generico(canal.source);
        }

        if (nuevo_link && canal.stream_url !== nuevo_link) {
            canal.stream_url = nuevo_link;
            cambios = true;
            console.log(`✅ ${canal.nombre} actualizado.`);
        }

        // Verificación de estado final
        const vivo = await esta_vivo(canal.stream_url);
        console.log(vivo ? `✅ ${canal.nombre} OK.` : `❌ ${canal.nombre} está CAÍDO.`);
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("🚀 JSON ACTUALIZADO.");
    }
}

actualizar().then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
