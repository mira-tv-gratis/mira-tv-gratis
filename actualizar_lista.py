import requests
import json

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}

def verificar_link(url):
    try:
        # Hacemos una prueba real de conexión
        respuesta = requests.head(url, headers=HEADERS, timeout=10)
        return respuesta.status_code == 200
    except:
        return False

def actualizar():
    with open("canales.json", "r", encoding="utf-8") as f:
        datos = json.load(f)

    for canal in datos:
        print(f"Verificando {canal['nombre']}...", end=" ")
        
        # Si el link no funciona, avísame YA
        if not verificar_link(canal['stream_url']):
            print("❌ CAÍDO")
            # AQUÍ es donde el robot debería intentar buscar un nuevo link
            # Pero primero, dime: ¿cuál de todos los canales es el que te da más problemas?
        else:
            print("✅ OK")

if __name__ == "__main__":
    actualizar()
