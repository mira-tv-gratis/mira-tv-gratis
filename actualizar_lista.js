const fs = require('fs');
const axios = require('axios');

const IPTV_ORG_URL = "https://iptv-org.github.io/iptv/countries/pe.m3u";

const cliente = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
});

// 1. VERIFICACIÓN DE SALUD DINÁMICA
async function esta_vivo(url) {
    if (!url || url === "") return false;
    try {
        const urlObj = new URL(url);
        const host = `${urlObj.protocol}//${urlObj.hostname}/`;
        
        const response = await cliente.head(url, {
            headers: { 'Referer': host } 
        });
        return response.status === 200 || response.status === 403 || response.status === 302;
    } catch (e) {
        if (e.response && e.response.status === 403) return true;
        return false;
    }
}

// 2. EXTRACCIÓN DINÁMICA (Para Iblups / Panamericana)
async function extraer_dinamico(url_iframe, url_referencia) {
    if (!url_iframe || !url_referencia) return null;
    try {
        const urlObj = new URL(url_referencia);
        const origin = `${urlObj.protocol}//${urlObj.hostname}`;

        const response = await cliente.get(url_iframe, {
            headers: { 
                'Referer': url_referencia,
                'Origin': origin
            }
        });

        const match = response.data.match(/https?:\/\/[^\s"\'<>]+?\.m3u8[^\s"\'<>]*/i);
        return match ? match[0] : null;
    } catch (e) { 
        return null; 
    }
}

// 3. BÚSQUEDA EN IPTV-ORG
async function buscar_en_iptv_org(tvg_id, lista_maestra) {
    if (!lista_maestra || !tvg_id) return null;
    try {
        const patron = new RegExp(`tvg-id="${tvg_id}"[^]*?(https?://[^#\\s]+?\\.m3u8[^#\\s]*)`, 'i');
        const match = lista_maestra.match(patron);
        return match ? match[1].trim() : null;
    } catch (e) { return null; }
}

async function actualizar() {
    let datos = JSON.parse(fs.readFileSync('canales.json', 'utf8'));
    let cambios = false;
    
    let lista_iptv_cache = null;
    if (datos.some(c => c.get_m3u8 === "iptv")) {
        console.log("📥 Descargando lista maestra de IPTV-ORG...");
        try {
            const res = await cliente.get(IPTV_ORG_URL);
            lista_iptv_cache = res.data;
        } catch (e) { console.log("⚠️ Error con IPTV-ORG."); }
    }

    for (let canal of datos) {
        console.log(`\n🔍 Procesando: ${canal.nombre} [Modo: ${canal.get_m3u8}]`);
        let nueva_url = null;

        // --- LÓGICA DE ACTUALIZACIÓN (SOLO MODOS VÁLIDOS) ---
        if (canal.get_m3u8 === "iblups") {
            nueva_url = await extraer_dinamico(canal.source, canal.referer_oficial);
        } else if (canal.get_m3u8 === "iptv") {
            nueva_url = await buscar_en_iptv_org(canal.tvg_id, lista_iptv_cache);
        }

        if (nueva_url && canal.stream_url !== nueva_url) {
            canal.stream_url = nueva_url;
            cambios = true;
            console.log(`    └─ 🆕 URL Actualizada.`);
        }

        // --- VERIFICACIÓN DE SALUD ---
        if (canal.get_m3u8 !== "token") {
            const vivo = await esta_vivo(canal.stream_url);
            if (!vivo && canal.stream_url !== "") {
                console.log(`    └─ ❌ CAÍDO. Limpiando.`);
                canal.stream_url = "";
                cambios = true;
            } else if (vivo) {
                console.log(`    └─ Estado: [OK]`);
            }
        }
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("\n🚀 canales.json actualizado.");
    } else {
        console.log("\n✨ Sin cambios.");
    }
}

actualizar().catch(console.error);
