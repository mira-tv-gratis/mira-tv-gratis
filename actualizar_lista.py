import requests
import re

def actualizar():
    try:
        url = "https://panamericana.pe/tvenvivo"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=15)
        
        # Esta vez, usaremos una expresión regular muy precisa
        # Busca específicamente cualquier cosa que empiece por https://live-stream.iblups.com... y termine en .m3u8
        enlace_encontrado = re.findall(r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8', response.text)
        
        if enlace_encontrado:
            # Usamos el primer enlace que encuentre (suele ser el principal)
            nuevo_link = enlace_encontrado[0]
            print(f"✅ LINK PESCADO: {nuevo_link}")
            
            with open("lista.m3u", "r", encoding="utf-8") as f:
                contenido = f.read()
            
            # Reemplazo dinámico usando el patrón de iblups
            patron = r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8'
            nuevo_contenido = re.sub(patron, nuevo_link, contenido)
            
            with open("lista.m3u", "w", encoding="utf-8") as f:
                f.write(nuevo_contenido)
            print("🚀 LISTA ACTUALIZADA CORRECTAMENTE EN GITHUB.")
        else:
            print("❌ El link está en la página pero el buscador no pudo capturarlo.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    actualizar()
