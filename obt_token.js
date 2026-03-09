const axios = require('axios');

async function obtenerToken() {
    // Definimos las cabeceras dinámicas como solicitaste
    const host = "https://tvgo.americatv.com.pe";
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${host}/canalesenvivo`,
        'Origin': host,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        console.log("Iniciando petición a América TV...");
        const response = await axios.get(`${host}/canalesenvivo`, { headers });
        
        // Aquí buscamos el patrón del token dentro del HTML o JSON devuelto
        // Normalmente el token está en un archivo de lista m3u8
        const regex = /(https:\/\/.*\/live-stream-playlist.*access_token.*\.m3u8)/;
        const match = response.data.match(regex);

        if (match) {
            console.log(match[0]); // Imprimimos solo la URL
            process.exit(0);
        } else {
            console.error("Token no encontrado en la respuesta.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error de conexión:", error.message);
        process.exit(1);
    }
}

obtenerToken();
