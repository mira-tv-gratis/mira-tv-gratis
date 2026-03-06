import requests

def actualizar():
    # Esta URL es donde Panamericana guarda sus datos de video
    url = "https://panamericana.pe/tvenvivo"
    
    # Intentamos obtener la página
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    # Buscamos un fragmento que siempre está ahí
    if "iblups" in response.text:
        # Aquí buscaríamos el link, pero si falla, usaremos la fuerza bruta
        print("¡Encontrado! El link está escondido en el código.")
    else:
        print("La página está bloqueando a Python. Necesitamos otro camino.")

actualizar()
