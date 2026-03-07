import requests
import re
import json
from urllib.parse import urlparse

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'

def extraer_link_de_fuente(url_fuente):
    # Esta es TU función original, no la he tocado para no romper lo que ya funciona
    dominio = urlparse(url_fuente).netloc
    headers = {'User-Agent': USER_AGENT, 'Referer': f'https://{dominio}/', 'Origin': f'https://{dominio}'}
    try:
        response = requests.get(url_fuente, headers=headers, timeout=20)
        patron = r'https://[^\s"\'<>]+?\.m3u8'
        match = re.search(patron, response.text)
        return match.group(0) if match else None
    except:
        return None

def buscar_en_iptv_lista(tvg_id, url_lista):
    # Nueva función: solo se usa si group_title está vacío
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
        # NUEVA LÓGICA:
        # Si group_title está vacío o "", usamos la fuente maestra de iptv-org
        if not canal.get("group_title"):
            nuevo_link = buscar_en_iptv_lista(canal["tvg_id"], canal["source"])
        # Si tiene group_title, usamos tu método original de scraper
        elif "source" in canal:
            nuevo_link = extraer_link_de_fuente(canal["source"])
        else:
            continue

        if nuevo_link and canal["stream_url"] != nuevo_link:
            canal["stream_url"] = nuevo_link
            cambios = True
            print(f"✅ {canal['nombre']} actualizado.")
        
        # Verificación final
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
