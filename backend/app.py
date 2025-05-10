from flask import Flask, request, send_file
from rembg import remove
from rembg.session_factory import new_session
from PIL import Image
import io
import threading
import time
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Sesión y temporizador globales
rembg_session = None
session_timer = None
SESSION_TIMEOUT = 20  # segundos (4 minutos)


from PIL import Image, ImageFilter, ImageEnhance

def clean_alpha_border(image: Image.Image, blur_radius=1.5, contrast_factor=1.8) -> Image.Image:
    """
    Limpia bordes oscuros aplicando blur y ajuste de contraste al canal alfa.

    :param image: Imagen RGBA con fondo transparente.
    :param blur_radius: Qué tan suave será el borde (1.5 a 2.5 suele funcionar bien).
    :param contrast_factor: Contraste del canal alfa (1.5–2 mejora bordes sin recortar).
    :return: Imagen RGBA con borde suavizado.
    """
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    r, g, b, a = image.split()

    # Desenfocar canal alfa para suavizar bordes
    a_blurred = a.filter(ImageFilter.GaussianBlur(blur_radius))

    # Ajustar contraste del alfa para que no quede “gris”
    a_contrasted = ImageEnhance.Contrast(a_blurred).enhance(contrast_factor)

    cleaned_image = Image.merge('RGBA', (r, g, b, a_contrasted))
    return cleaned_image


# Función para destruir la sesión
def destroy_session():
    global rembg_session, session_timer
    if rembg_session:
        rembg_session = None
        print("Rembg session destroyed.")
    session_timer = None

# Función para iniciar o reiniciar la sesión y su temporizador
def get_session():
    global rembg_session, session_timer

    if rembg_session is None:
        print("Creating rembg session...")
        rembg_session = new_session(model_path='models/model2.0.onnx', alpha_matting=False,
        alpha_matting_foreground_threshold=250-10,
        alpha_matting_background_threshold=30,
        alpha_matting_erode_size=1,
        only_mask=True)

    if session_timer:
        session_timer.cancel()

    session_timer = threading.Timer(SESSION_TIMEOUT, destroy_session)
    session_timer.start()

    return rembg_session

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return 'No image uploaded', 400

    input_file = request.files['image']
    input_bytes = input_file.read()

    session = get_session()

    output_bytes = remove(
        input_bytes,
        session=session,
        only_mask=True,
    )
    
    image = Image.open(io.BytesIO(output_bytes)).convert("RGBA")
    cleaned_image = clean_alpha_border(image)

    # Paso 3: convertir de vuelta a bytes
    byte_io = io.BytesIO()
    cleaned_image.save(byte_io, format="PNG")
    byte_io.seek(0)
    

    return send_file(
        byte_io,
        mimetype='image/png',
        as_attachment=True,
        download_name='output.png'
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)
