import requests
import re

def actualizar():
    try:
        # Ahora apuntamos directo al "corazón" del video
        url_embed = "https://iblups.com/embed/panamericanape"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
        
        print(f"Entrando a {url_embed}...")
        response = requests.get(url_embed, headers=headers, timeout=20)
        
        # Buscamos el link .m3u8 dentro de este código
        patron = r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8'
        match = re.search(patron, response.text)
        
        if match:
            nuevo_link = match.group(0)
            print(f"✅ LINK ENCONTRADO: {nuevo_link}")
            
            with open("lista.m3u", "r", encoding="utf-8") as f:
                contenido = f.read()
            
            # Reemplazamos
            nuevo_contenido = re.sub(r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8', nuevo_link, contenido)
            
            with open("lista.m3u", "w", encoding="utf-8") as f:
                f.write(nuevo_contenido)
            print("🚀 ARCHIVO ACTUALIZADO CORRECTAMENTE.")
        else:
            print("❌ Seguimos sin extraerlo. Aquí está lo que leemos del embed:")
            print(response.text[:300]) # Veamos qué hay dentro del embed

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    actualizar()
