const fs = require('fs');
const axios = require('axios');

const IPTV_ORG_URL = "https://iptv-org.github.io/iptv/countries/pe.m3u";

// Configuración de Axios para ser más persistente y parecer un navegador
const cliente = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
});

async function esta_vivo(url) {
    if (!url || url === "") return false; // Si está vacío, devolvemos false para que sepa que no hay stream
    try {
        const response = await cliente.head(url);
        return response.status === 200 || response.status === 403;
    } catch (e) { return false; }
}

async function extraer_de_github_web(url_fuente) {
    try {
        const response = await cliente.get(url_fuente);
        const match = response.data.match(/https?:\/\/[^\s"\'<>]+?\.m3u8[^\s"\'<>]*/i);
        return match ? match[0] : null;
    } catch (e) { return null; }
}

async function buscar_en_iptv_org(tvg_id, lista_maestra) {
    if (!lista_maestra) return null;
    try {
        const patron = new RegExp(`tvg-id="${tvg_id}"[^]*?(https?://[^#\\s]+?\\.m3u8[^#\\s]*)`, 'i');
        const match = lista_maestra.match(patron);
        
        if (match) {
            return match[1].trim();
        }
        return null;
    } catch (e) { 
        console.log(`❌ Error buscando ID ${tvg_id}: ${e.message}`);
        return null; 
    }
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
        } catch (e) { console.log("⚠️ No se pudo descargar la lista de IPTV-ORG."); }
    }

    for (let canal of datos) {
        console.log(`\n🔍 Procesando: ${canal.nombre} [Modo: ${canal.get_m3u8}]`);

        // --- LÓGICA DE ACTUALIZACIÓN ---
        if (canal.get_m3u8 === "github") {
            const nueva_url = await extraer_de_github_web(canal.source);
            if (nueva_url && canal.stream_url !== nueva_url) {
                canal.stream_url = nueva_url;
                cambios = true;
                console.log(`   └─ 🆕 Nueva URL detectada.`);
            }
        } else if (canal.get_m3u8 === "iptv") {
            const nueva_url = await buscar_en_iptv_org(canal.tvg_id, lista_iptv_cache);
            if (nueva_url && canal.stream_url !== nueva_url) {
                canal.stream_url = nueva_url;
                cambios = true;
                console.log(`   └─ 🆕 Nueva URL detectada.`);
            }
        }

        // --- VERIFICACIÓN DE SALUD ---
        if (canal.get_m3u8 !== "token") {
            const vivo = await esta_vivo(canal.stream_url);
            if (!vivo) {
                if (canal.stream_url !== "") {
                    console.log(`   └─ ❌ ${canal.nombre} CAÍDO. Limpiando stream_url.`);
                    canal.stream_url = "";
                    cambios = true;
                } else {
                    console.log(`   └─ ⚠️ ${canal.nombre} SIN URL (Esperando próxima actualización).`);
                }
            } else {
                console.log(`   └─ Estado: [OK]`);
            }
        } else {
            console.log(`   └─ Estado: [MODO TOKEN - Sin verificar]`);
        }
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("\n🚀 canales.json actualizado y guardado.");
    } else {
        console.log("\n✨ No se detectaron cambios necesarios.");
    }
}

actualizar().catch(console.error);
