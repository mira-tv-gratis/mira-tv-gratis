import requests
import re
import json

def actualizar():
    try:
        # 1. Obtenemos el link nuevo
        url_embed = "https://iblups.com/embed/panamericanape"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
        
        print(f"Entrando a {url_embed}...")
        response = requests.get(url_embed, headers=headers, timeout=20)
        
        patron = r'https://live-stream\.iblups\.com/live/[a-zA-Z0-9-]+\.m3u8'
        match = re.search(patron, response.text)
        
        if match:
            nuevo_link = match.group(0)
            print(f"✅ LINK ENCONTRADO: {nuevo_link}")
            
            # 2. Abrimos y actualizamos el canales.json
            with open("canales.json", "r", encoding="utf-8") as f:
                datos = json.load(f)
            
            # Buscamos el canal de "Panamericana TV" y actualizamos su stream_url
            encontrado = False
            for canal in datos:
                if canal.get("nombre") == "Panamericana TV":
                    canal["stream_url"] = nuevo_link
                    encontrado = True
                    break
            
            if encontrado:
                # 3. Guardamos el JSON de vuelta
                with open("canales.json", "w", encoding="utf-8") as f:
                    json.dump(datos, f, indent=2, ensure_ascii=False)
                print("🚀 CANALES.JSON ACTUALIZADO CORRECTAMENTE.")
            else:
                print("❌ No se encontró el canal 'Panamericana TV' en el JSON.")
                
        else:
            print("❌ No se pudo extraer el link del embed.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    actualizar()
