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
    if (!url || url === "") return true; // Los tokens se asumen vivos hasta que fallen en el proxy
    try {
        const response = await cliente.head(url);
        return response.status === 200 || response.status === 403;
    } catch (e) { return false; }
}

async function extraer_de_github_web(url_fuente) {
    try {
        const response = await cliente.get(url_fuente);
        // Regex mejorada para capturar URLs m3u8 en el HTML
        const match = response.data.match(/https?:\/\/[^\s"\'<>]+?\.m3u8[^\s"\'<>]*/i);
        return match ? match[0] : null;
    } catch (e) { return null; }
}

async function buscar_en_iptv_org(tvg_id, lista_maestra) {
    if (!lista_maestra) return null;
    try {
        // Buscamos el bloque que contiene el id y extraemos la URL de la línea siguiente
        const patron = new RegExp(`tvg-id="${tvg_id}".*?\\n(https?://.*?\\.m3u8.*)`, 'i');
        const match = lista_maestra.match(patron);
        return match ? match[1].trim() : null;
    } catch (e) { return null; }
}

async function actualizar() {
    let datos = JSON.parse(fs.readFileSync('canales.json', 'utf8'));
    let cambios = false;
    
    // Descargamos la lista IPTV una sola vez para todos los que la necesiten
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

        let nueva_url = null;

        // --- LÓGICA SEGÚN get_m3u8 ---
        
        if (canal.get_m3u8 === "token") {
            // No hacemos nada, Rust/Puppeteer se encarga en tiempo real
            console.log(`   └─ ✅ Saltando (Manejado por Token/Proxy).`);
            continue; 
        } 
        
        else if (canal.get_m3u8 === "github") {
            // Buscamos el m3u8 en el código fuente de la web oficial (source)
            nueva_url = await extraer_de_github_web(canal.source);
        } 
        
        else if (canal.get_m3u8 === "iptv") {
            // Buscamos por tvg_id en la lista de IPTV-ORG
            nueva_url = await buscar_en_iptv_org(canal.tvg_id, lista_iptv_cache);
        }

        // --- APLICAR CAMBIOS ---
        
        if (nueva_url && canal.stream_url !== nueva_url) {
            console.log(`   └─ 🆕 Nueva URL detectada: ${nueva_url.substring(0, 50)}...`);
            canal.stream_url = nueva_url;
            cambios = true;
        }

        // --- VERIFICACIÓN DE SALUD ---
        const vivo = await esta_vivo(canal.stream_url);
        console.log(`   └─ Estado: ${vivo ? "[OK]" : "[CAÍDO o REVISAR]"}`);
    }

    if (cambios) {
        fs.writeFileSync('canales.json', JSON.stringify(datos, null, 2), 'utf8');
        console.log("\n🚀 canales.json actualizado y guardado.");
    } else {
        console.log("\n✨ No se detectaron cambios necesarios.");
    }
}

actualizar().catch(console.error);
