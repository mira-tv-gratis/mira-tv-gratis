const fs = require('fs');
const axios = require('axios');

const IPTV_ORG_URL = "https://iptv-org.github.io/iptv/countries/pe.m3u";

// 1. Scraper para webs directas (Panamericana, TV Perú)
async function extraer_link_generico(url_fuente) {
    try {
        const response = await axios.get(url_fuente, { timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (e) { return null; }
}

// 2. Buscador para IPTV-ORG
async function buscar_en_iptv_lista(tvg_id) {
    try {
        const response = await axios.get(IPTV_ORG_URL, { timeout: 20000 });
        const patron = new RegExp(`tvg-id="${tvg_id}".*?\\n(https://.*?\\.m3u8)`, 's');
        const match = response.data.match(patron);
        return match ? match[1].trim() : null;
    } catch (e) { return null; }
}

async function actualizar() {
    let datos = JSON.parse(fs.readFileSync('canales.json', 'utf8'));
    let cambios = false;

    for (let canal of datos) {
        // SI NO TIENE SOURCE, NO TOCAMOS NADA
        if (!canal.source) continue;

        let nuevo_link = null;

        // Decidimos qué método usar según la URL de source
        if (canal.source === IPTV_ORG_URL) {
            nuevo_link = await buscar_en_iptv_lista(canal.tvg_id);
        } else {
            nuevo_link = await extraer_link_generico(canal.source);
        }

        // Si encontramos un link nuevo, actualizamos
        if (nuevo_link && canal.stream_url !== nuevo_link) {
            canal.stream_url = nuevo_link;
            cambios = true;
            console.log(`✅ ${canal.nombre} actualizado.`);
        }
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("🚀 JSON actualizado correctamente.");
    }
}

actualizar();
