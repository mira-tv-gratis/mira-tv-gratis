import requests
import re

def actualizar():
    try:
        # 1. Obtener el link nuevo de la web
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get("https://panamericana.pe/tvenvivo", headers=headers, timeout=15)
        # Regex más general para capturar el link
        match = re.search(r'https://[^\s"\'<>]*\.m3u8', response.text)
        
        if match:
            nuevo_link = match.group(0)
            
            # 2. Leer archivo y limpiar
            with open("lista.m3u", "r", encoding="utf-8") as f:
                contenido = f.read()

            # 3. Usar una Regex mucho más flexible que ignora espacios y formatos raros
            # Busca 'Panamericana TV', luego cualquier cosa hasta #SOURCE, y luego reemplaza el link
            patron = r'(tvg-id="Panamericana\.pe".*?\n#SOURCE:.*?\n)(https?://.*?\.m3u8)'
            
            if re.search(patron, contenido):
                nuevo_contenido = re.sub(patron, rf"\1{nuevo_link}", contenido)
                
                # 4. Guardar
                with open("lista.m3u", "w", encoding="utf-8") as f:
                    f.write(nuevo_contenido)
                print(f"✅ Éxito: Link actualizado a {nuevo_link}")
            else:
                print("❌ No encontré la sección de Panamericana. Verifica que el tvg-id sea exacto.")
        else:
            print("❌ No se encontró link .m3u8 en la web.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    actualizar()
