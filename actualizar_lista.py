import requests
import re
import json

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}

def extraer_link_de_fuente(url_fuente):
    """Aquí ponemos la lógica para sacar el .m3u8"""
    try:
        response = requests.get(url_fuente, headers=HEADERS, timeout=20)
        # Este patrón busca cualquier link que termine en .m3u8
        patron = r'https://[^\s"\'<>]+?\.m3u8'
        match = re.search(patron, response.text)
        return match.group(0) if match else None
    except:
        return None

def actualizar():
    with open("canales.json", "r", encoding="utf-8") as f:
        datos = json.load(f)

    cambios = False

    for canal in datos:
        # Solo procesamos si el canal tiene un campo "source"
        if "source" in canal:
            print(f"Actualizando: {canal['nombre']}...")
            nuevo_link = extraer_link_de_fuente(canal["source"])
            
            if nuevo_link and canal["stream_url"] != nuevo_link:
                canal["stream_url"] = nuevo_link
                cambios = True
                print(f"  ✅ Nuevo link aplicado.")

    if cambios:
        with open("canales.json", "w", encoding="utf-8") as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        print("🚀 JSON ACTUALIZADO AUTOMÁTICAMENTE.")
    else:
        print("✅ Todo al día.")

if __name__ == "__main__":
    actualizar()
