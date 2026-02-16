import os
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from PIL import Image

from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Create Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL = "gemini-3-flash-preview"

# Create FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):

    try:
        # Read uploaded file
        contents = await file.read()

        # Convert to PIL Image
        image = Image.open(io.BytesIO(contents))

        # Convert PIL image to bytes (JPEG)
        img_byte_arr = io.BytesIO()
        image.convert("RGB").save(img_byte_arr, format="JPEG")
        img_bytes = img_byte_arr.getvalue()

        prompt = """
You are a high accuracy OCR engine.
Extract all handwritten and printed Hindi and English text.
Preserve exact spelling.
Output only extracted text.
"""

        # Proper Gemini image format
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=img_bytes,
                    mime_type="image/jpeg"
                )
            ]
        )

        return {"text": response.text}

    except Exception as e:
        return {"error": str(e)}
