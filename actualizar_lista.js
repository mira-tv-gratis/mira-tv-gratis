const fs = require('fs');
const axios = require('axios');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 1. Scraper para canales generales
async function extraer_link_generico(url_fuente) {
    try {
        const urlObj = new URL(url_fuente);
        const headers = { 'User-Agent': USER_AGENT };
        const response = await axios.get(url_fuente, { headers, timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (e) { return null; }
}

// 2. Scraper EXCLUSIVO para Willax (sin mezclar nada)
async function extraer_link_willax(url_fuente) {
    try {
        const headers = {
            'User-Agent': USER_AGENT,
            'Referer': 'https://willax.pe/en-vivo/',
            'Origin': 'https://willax.pe'
        };
        const response = await axios.get(url_fuente, { headers, timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (e) { return null; }
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

async function actualizar() {
    let datos = JSON.parse(fs.readFileSync('canales.json', 'utf8'));
    let cambios = false;

    for (let canal of datos) {
        if (canal.nombre === "América TV") continue;

        let nuevo_link = null;

        // SEPARACIÓN CLARA: Cada canal tiene su propio bloque
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
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("🚀 JSON ACTUALIZADO.");
    }
}

actualizar();
