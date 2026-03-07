import requests
import re
import json
from urllib.parse import urlparse

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'

# 1. Scraper para los canales viejos (con group_title)
def extraer_link_de_fuente(url_fuente):
    dominio = urlparse(url_fuente).netloc
    headers = {'User-Agent': USER_AGENT, 'Referer': f'https://{dominio}/', 'Origin': f'https://{dominio}'}
    try:
        response = requests.get(url_fuente, headers=headers, timeout=20)
        match = re.search(r'https://[^\s"\'<>]+?\.m3u8', response.text)
        return match.group(0) if match else None
    except: return None

# 2. Buscador para canales nuevos (Latina, sin group_title)
def buscar_en_iptv_lista(tvg_id, url_lista):
    try:
        response = requests.get(url_lista, timeout=15)
        patron = rf'tvg-id="{tvg_id}".*?\n(https://.*?\.m3u8)'
        match = re.search(patron, response.text)
        return match.group(1) if match else None
    except: return None

# 3. Verificación universal (sin cambios, la que ya funcionaba)
def esta_vivo(url):
    try:
        # Usamos los headers de navegador, pero añadimos una excepción:
        # Si el servidor responde un 403 (Prohibido), el script debe entender 
        # que el canal está VIVO pero el servidor es estricto.
        headers = {'User-Agent': USER_AGENT}
        r = requests.get(url, headers=headers, timeout=8)
        
        # Consideramos "vivo" si responde 200 (OK) o 403 (Protegido pero existente)
        return r.status_code in [200, 403]
    except:
        return False

# 4. El motor global que recorre todo
def actualizar():
    with open("canales.json", "r", encoding="utf-8") as f:
        datos = json.load(f)

    cambios = False

    for canal in datos:
        # Si es Latina (vacío), usa la lista maestra
        if canal.get("group_title") == "":
            nuevo_link = buscar_en_iptv_lista(canal["tvg_id"], canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
        
        # Si es canal viejo, usa el scraper
        elif "source" in canal:
            nuevo_link = extraer_link_de_fuente(canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True

        # Verificación final para TODOS
        if esta_vivo(canal["stream_url"]):
            print(f"✅ {canal['nombre']} OK.")
        else:
            print(f"❌ {canal['nombre']} está CAÍDO.")

    if cambios:
        with open("canales.json", "w", encoding="utf-8") as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        print("🚀 JSON ACTUALIZADO.")

if __name__ == "__main__":
    actualizar()
