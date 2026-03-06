import requests
import re

def actualizar():
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get("https://panamericana.pe/tvenvivo", headers=headers, timeout=15)
        # Buscamos el link .m3u8 en el código de la página
        match = re.search(r'https://[^\s"\'<>]*\.m3u8', response.text)
        
        if match:
            nuevo_link = match.group(0)
            with open("lista.m3u", "r", encoding="utf-8") as f:
                contenido = f.read()

            # Reemplazamos el link viejo de Panamericana por el nuevo
            # Buscamos la línea que sigue a Panamericana TV
            patron = r"(Panamericana TV\n#SOURCE:.*\n)https?://.*\.m3u8"
            nuevo_contenido = re.sub(patron, rf"\1{nuevo_link}", contenido)

            with open("lista.m3u", "w", encoding="utf-8") as f:
                f.write(nuevo_contenido)
            print("✅ Lista actualizada con éxito.")
        else:
            print("❌ No se encontró link nuevo.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    actualizar()
