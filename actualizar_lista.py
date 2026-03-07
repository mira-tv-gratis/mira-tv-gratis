import requests
import re
import json
from urllib.parse import urlparse

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'

def extraer_link_de_fuente(url_fuente):
    dominio = urlparse(url_fuente).netloc
    headers = {
        'User-Agent': USER_AGENT,
        'Referer': f'https://{dominio}/',
        'Origin': f'https://{dominio}'
    }
    try:
        response = requests.get(url_fuente, headers=headers, timeout=20)
        patron = r'https://[^\s"\'<>]+?\.m3u8'
        match = re.search(patron, response.text)
        return match.group(0) if match else None
    except:
        return None

def buscar_en_iptv_lista(tvg_id, url_lista):
    try:
        response = requests.get(url_lista, timeout=15)
        # Busca el tvg-id y captura el link en la línea siguiente
        patron = rf'tvg-id="{tvg_id}".*?\n(https://.*?\.m3u8)'
        match = re.search(patron, response.text)
        return match.group(1) if match else None
    except:
        return None

def esta_vivo(url):
    try:
        r = requests.head(url, headers={'User-Agent': USER_AGENT}, timeout=5)
        return r.status_code == 200
    except:
        return False

def actualizar():
    with open("canales.json", "r", encoding="utf-8") as f:
        datos = json.load(f)

    cambios = False

    for canal in datos:
        # Lógica: Si el grupo está vacío, buscamos en IPTV
        if canal.get("group_title") == "":
            print(f"🔍 Buscando {canal['nombre']} en lista maestra...")
            nuevo_link = buscar_en_iptv_lista(canal["tvg_id"], canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
                print(f"✅ {canal['nombre']} obtenido de lista.")
        
        # Lógica original: Si tiene grupo, usamos el scraper
        elif "source" in canal:
            print(f"🔄 Intentando scraper para {canal['nombre']}...")
            nuevo_link = extraer_link_de_fuente(canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
                print(f"✅ {canal['nombre']} actualizado por scraper.")

        # VERIFICACIÓN
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
