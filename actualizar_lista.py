import requests
import re

def actualizar():
    try:
        # Headers configurados profesionalmente para Panamericana
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.0.0 Safari/537.36',
            'Referer': 'https://panamericana.pe/',
            'Origin': 'https://panamericana.pe'
        }
        
        url = "https://panamericana.pe/tvenvivo"
        response = requests.get(url, headers=headers, timeout=15)
        
        # BUSCAMOS EL PATRÓN EXACTO QUE VIMOS EN TU INSPECCIÓN
        # Este regex busca cualquier cadena que empiece por live-stream.iblups.com y termine en .m3u8
        match = re.search(r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9]+\.m3u8', response.text)
        
        if match:
            nuevo_link = match.group(0)
            print(f"✅ LINK ENCONTRADO: {nuevo_link}")
            
            # Leemos tu lista actual
            with open("lista.m3u", "r", encoding="utf-8") as f:
                contenido = f.read()

            # Reemplazamos el link viejo (que empieza por live-stream.iblups.com) por el nuevo
            patron = r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9]+\.m3u8'
            nuevo_contenido = re.sub(patron, nuevo_link, contenido)
            
            with open("lista.m3u", "w", encoding="utf-8") as f:
                f.write(nuevo_contenido)
            print("🚀 LISTA ACTUALIZADA CON ÉXITO.")
        else:
            print("❌ EL SCRIPT NO ENCUENTRA EL LINK.")
            # Si falla, esto nos dirá por qué (imprimimos un pedazo del código fuente)
            print("Fragmento de página:", response.text[:200])

    except Exception as e:
        print(f"Error técnico: {e}")

if __name__ == "__main__":
    actualizar()
