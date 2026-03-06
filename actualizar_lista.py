import requests
import re

def actualizar():
    try:
        url = "https://panamericana.pe/tvenvivo"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=20)
        
        # En lugar de una expresión regular complicada, buscaremos el bloque que contiene el link
        # El link de iblups siempre está dentro de una estructura que menciona "m3u8"
        if "iblups.com" in response.text:
            # Buscamos el texto alrededor de 'iblups.com' para capturar la URL completa
            # Buscamos desde 'https' hasta '.m3u8'
            patron = r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8'
            match = re.search(patron, response.text)
            
            if match:
                nuevo_link = match.group(0)
                print(f"✅ LINK EXTRAÍDO: {nuevo_link}")
                
                # Actualizar lista.m3u
                with open("lista.m3u", "r", encoding="utf-8") as f:
                    contenido = f.read()
                
                # Reemplazamos el patrón
                nuevo_contenido = re.sub(r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8', nuevo_link, contenido)
                
                with open("lista.m3u", "w", encoding="utf-8") as f:
                    f.write(nuevo_contenido)
                print("🚀 ARCHIVO ACTUALIZADO.")
            else:
                # Si falló, imprimimos un poco más de texto para ver qué rodea al link
                pos = response.text.find("iblups.com")
                print(f"❌ FALLO AL EXTRAER. Fragmento cerca de iblups: {response.text[pos-50:pos+150]}")
        else:
            print("❌ No se encontró 'iblups.com' en la respuesta.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    actualizar()
