import requests
import re

def actualizar():
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        print("Intentando conectar a Panamericana...")
        response = requests.get("https://panamericana.pe/tvenvivo", headers=headers, timeout=15)
        
        # Guardamos lo que leemos para depurar
        print(f"Respuesta recibida. Tamaño del contenido: {len(response.text)} caracteres")
        
        # Buscamos el link .m3u8
        match = re.search(r'https://[^\s"\'<>]*\.m3u8', response.text)
        
        if match:
            nuevo_link = match.group(0)
            print(f"Link encontrado: {nuevo_link}")
            
            with open("lista.m3u", "r", encoding="utf-8") as f:
                contenido = f.read()

            patron = r'(#SOURCE:https://panamericana\.pe/tvenvivo\n)(https?://.*\.m3u8)'
            
            if re.search(patron, contenido):
                nuevo_contenido = re.sub(patron, rf"\1{nuevo_link}", contenido)
                with open("lista.m3u", "w", encoding="utf-8") as f:
                    f.write(nuevo_contenido)
                print("✅ Lista actualizada con éxito.")
            else:
                print("❌ No se encontró la etiqueta #SOURCE: en lista.m3u")
        else:
            print("❌ ERROR: No se encontró ningún link .m3u8 en la página web.")
    except Exception as e:
        print(f"Error detectado: {e}")

if __name__ == "__main__":
    actualizar()
