import requests
import re
import json
from urllib.parse import urlparse

# Headers base sin valores estáticos para evitar bloqueos
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
        # 1. Si tiene 'source', intentamos sacar un link nuevo
        if "source" in canal:
            nuevo_link = extraer_link_de_fuente(canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
                print(f"✅ {canal['nombre']} actualizado.")
        
        # 2. Verificamos si el stream final funciona
        if not esta_vivo(canal["stream_url"]):
            print(f"❌ {canal['nombre']} está CAÍDO.")
        else:
            print(f"✅ {canal['nombre']} OK.")

    if cambios:
        with open("canales.json", "w", encoding="utf-8") as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        print("🚀 JSON ACTUALIZADO.")

if __name__ == "__main__":
    actualizar()
