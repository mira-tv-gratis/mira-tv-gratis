const fs = require('fs');
const axios = require('axios');

const IPTV_ORG_URL = "https://iptv-org.github.io/iptv/countries/pe.m3u";

// Función de verificación de salud (Ping)
async function esta_vivo(url) {
    if (!url) return true;
    try {
        const response = await axios.head(url, { timeout: 5000 });
        return response.status === 200 || response.status === 403;
    } catch (e) { return false; }
}

async function extraer_link_generico(url_fuente) {
    try {
        const response = await axios.get(url_fuente, { timeout: 20000 });
        const match = response.data.match(/https:\/\/[^\s"\'<>]+?\.m3u8/);
        return match ? match[0] : null;
    } catch (e) { return null; }
}

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
        // 1. Actualización (solo si tiene source)
        if (canal.stream_url === "" || canal.stream_url.includes("envivo")) {
            // Es un canal de América o un canal que el Proxy debe manejar
            console.log(`⏩ ${canal.nombre}: Saltando actualización (Manejado por Proxy/Token).`);
        } 
        else if (canal.source) {
            let nuevo_link = (canal.source === IPTV_ORG_URL) ? 
                             await buscar_en_iptv_lista(canal.tvg_id) : 
                             await extraer_link_generico(canal.source);

            if (nuevo_link && canal.stream_url !== nuevo_link) {
                canal.stream_url = nuevo_link;
                cambios = true;
                console.log(`✅ ${canal.nombre} actualizado.`);
            }
        } else {
            console.log(`⏩ ${canal.nombre} (Proxy).`);
        }

        // 2. Verificación de salud (AHORA CON NOMBRE DEL CANAL)
        if (canal.stream_url === "") {
            console.log(`   └─ ${canal.nombre} está: [MODO DINÁMICO]`);
        } else {
            const vivo = await esta_vivo(canal.stream_url);
            console.log(`   └─ ${canal.nombre} está: ${vivo ? "[OK]" : "[CAÍDO]"}`);
        }
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("🚀 JSON actualizado.");
    }
}

actualizar().then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
