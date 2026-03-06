import requests
import re

print("Iniciando script de actualización...")

try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    url = "https://panamericana.pe/tvenvivo"
    print(f"Conectando a {url}...")
    response = requests.get(url, headers=headers, timeout=15)
    
    # Buscamos el link
    match = re.search(r'https://[^\s"\'<>]*\.m3u8', response.text)
    
    if match:
        nuevo_link = match.group(0)
        print(f"Link nuevo encontrado: {nuevo_link}")
        
        # Leemos y reemplazamos
        with open("lista.m3u", "r", encoding="utf-8") as f:
            contenido = f.read()
        
        # Esta parte busca específicamente la línea que empieza por https://live-stream.iblups.com
        # y la reemplaza por el nuevo link encontrado
        patron = r'(https://live-stream\.iblups\.com/live/.*\.m3u8)'
        
        if re.search(patron, contenido):
            nuevo_contenido = re.sub(patron, nuevo_link, contenido)
            with open("lista.m3u", "w", encoding="utf-8") as f:
                f.write(nuevo_contenido)
            print("¡Archivo lista.m3u actualizado exitosamente!")
        else:
            print("No se encontró el link viejo en lista.m3u para reemplazarlo.")
    else:
        print("No se encontró ningún link .m3u8 en la web.")

except Exception as e:
    print(f"Ocurrió un error: {e}")
