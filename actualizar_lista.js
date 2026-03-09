const fs = require('fs');
const axios = require('axios');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 1. Scraper para canales con página web propia
async function extraer_link_de_fuente(url_fuente) {
    try {
        const urlObj = new URL(url_fuente);
        const dominio = urlObj.hostname;
        const headers = {
            'User-Agent': USER_AGENT,
            'Referer': `https://${dominio}/`,
            'Origin': `https://${dominio}`
        };
        const response = await axios.get(url_fuente, { headers, timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (error) {
        return null;
    }
}

// 2. Buscador para canales en listas IPTV (ej. Latina)
async function buscar_en_iptv_lista(tvg_id, url_lista) {
    try {
        const response = await axios.get(url_lista, { timeout: 15000 });
        // Ajustado para capturar el link .m3u8 asociado al tvg-id
        const patron = new RegExp(`tvg-id="${tvg_id}".*?\\n(https://.*?\\.m3u8)`, 's');
        const match = response.data.match(patron);
        return match ? match[1].trim() : null;
    } catch (error) {
        return null;
    }
}

// 3. Verificación de estado
async function esta_vivo(url) {
    try {
        const headers = { 'User-Agent': USER_AGENT };
        const response = await axios.get(url, { headers, timeout: 8000 });
        return [200, 403].includes(response.status);
    } catch (error) {
        return error.response && [200, 403].includes(error.response.status);
    }
}

// 4. Motor global (Limpio de América TV)
async function actualizar() {
    let datos = JSON.parse(fs.readFileSync('canales.json', 'utf8'));
    let cambios = false;

    for (let canal of datos) {
        // Ignoramos América TV por completo
        if (canal.nombre === "América TV") continue;

        let nuevo_link = null;

        // A. Canales sin grupo (Listas IPTV)
        if (canal.group_title === "" && canal.source) {
            nuevo_link = await buscar_en_iptv_lista(canal.tvg_id, canal.source);
        } 
        // B. Canales generales con fuente web
        else if (canal.source) {
            nuevo_link = await extraer_link_de_fuente(canal.source);
        }

        if (nuevo_link && canal.stream_url !== nuevo_link) {
            canal.stream_url = nuevo_link;
            cambios = true;
            console.log(`✅ ${canal.nombre} actualizado.`);
        }

        // Verificación
        const vivo = await esta_vivo(canal.stream_url);
        console.log(vivo ? `✅ ${canal.nombre} OK.` : `❌ ${canal.nombre} está CAÍDO.`);
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("🚀 JSON ACTUALIZADO.");
    }
}

actualizar();
