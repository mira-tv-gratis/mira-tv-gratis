import requests
import re
import json
import subprocess
from urllib.parse import urlparse

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'

# 1. Scraper para canales viejos
def extraer_link_de_fuente(url_fuente):
    dominio = urlparse(url_fuente).netloc
    headers = {'User-Agent': USER_AGENT, 'Referer': f'https://{dominio}/', 'Origin': f'https://{dominio}'}
    try:
        response = requests.get(url_fuente, headers=headers, timeout=20)
        match = re.search(r'https://[^\s"\'<>]+?\.m3u8', response.text)
        return match.group(0) if match else None
    except: return None

# 2. Buscador para canales nuevos (Latina)
def buscar_en_iptv_lista(tvg_id, url_lista):
    try:
        response = requests.get(url_lista, timeout=15)
        patron = rf'tvg-id="{tvg_id}".*?\n(https://.*?\.m3u8)'
        match = re.search(patron, response.text)
        return match.group(1) if match else None
    except: return None

# 3. Puppeteer para América TV
def obtener_token_america():
    print("DEBUG: Intentando ejecutar obt_token.js...")
    try:
        resultado = subprocess.run(['node', 'obt_token.js'], capture_output=True, text=True, timeout=90)
        print(f"DEBUG: Salida de node: {resultado.stdout}")
        print(f"DEBUG: Error de node: {resultado.stderr}")
        link = resultado.stdout.strip()
        return link if link.startswith("http") else None
    except Exception as e:
        print(f"DEBUG: Excepción en subprocess: {e}")
        return None

# 4. Verificación universal
def esta_vivo(url):
    try:
        headers = {'User-Agent': USER_AGENT}
        r = requests.get(url, headers=headers, timeout=8)
        return r.status_code in [200, 403]
    except:
        return False

# 5. Motor global
def actualizar():
    with open("canales.json", "r", encoding="utf-8") as f:
        datos = json.load(f)

    cambios = False

    for canal in datos:
        # A. América TV (Puppeteer)
        if canal["nombre"] == "América TV":
            nuevo_link = obtener_token_america()
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
                print("✅ América TV actualizado.")
        
        # B. Latina (Lista maestra)
        elif canal.get("group_title") == "":
            nuevo_link = buscar_en_iptv_lista(canal["tvg_id"], canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
        
        # C. Canales viejos (Scraper)
        elif "source" in canal:
            nuevo_link = extraer_link_de_fuente(canal["source"])
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True

        # Verificación final
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
