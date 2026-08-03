import os
import sys
from pathlib import Path
import logging
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from pdf2image import convert_from_path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Constants
BASE_DIR = Path(__file__).parent.parent.parent.resolve()
RAW_DATA_DIR = BASE_DIR / "raw_data"
OUTPUT_DIR = BASE_DIR / "rawdata2markdown"
MODEL_PATH = Path(__file__).parent / "model"

def init_model():
    """Initialize the GLM-OCR model and processor."""
    logger.info(f"Loading model from {MODEL_PATH}...")
    try:
        processor = AutoProcessor.from_pretrained(str(MODEL_PATH), trust_remote_code=True)
        model = AutoModelForImageTextToText.from_pretrained(
            str(MODEL_PATH),
            torch_dtype=torch.bfloat16,
            device_map="cpu",
            trust_remote_code=True
        )
        return processor, model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

import traceback

# ... imports ...

def process_image(processor, model, image_path, output_path, user_prompt):
    """Process a single image and save the Markdown output."""
    logger.info(f"Processing image: {image_path}")
    
    try:
        # Load image
        image = Image.open(image_path).convert("RGB")
        
        # Resize if too large
        max_size = 768
        if max(image.size) > max_size:
            logger.info(f"Resizing image from {image.size} to max {max_size}...")
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
        logger.info(f"Image size: {image.size}, Model device: {model.device}")

        # Prepare messages
        # GLM-OCR official usage:
        # User message contains image and the task instruction (e.g. "Table Recognition:")
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": image
                    },
                    {
                        "type": "text",
                        "text": user_prompt
                    }
                ]
            }
        ]

        # Prepare inputs
        inputs = processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        ).to(model.device)

        # Generate
        # remove token_type_ids if present (as per README example)
        inputs.pop("token_type_ids", None)
        
        with torch.no_grad():
            generated_ids = model.generate(**inputs, max_new_tokens=2048)
            
        # Decode
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

        # Save output
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output_text, encoding='utf-8')
        logger.info(f"Saved output to {output_path}")

    except Exception as e:
        logger.error(f"Error processing {image_path}: {e}")
        traceback.print_exc()


def process_pdf(processor, model, pdf_path, system_prompt):
    """Convert PDF to images and process each page."""
    logger.info(f"Processing PDF: {pdf_path}")
    
    pdf_output_dir = OUTPUT_DIR / f"{pdf_path.name}.nd"
    pdf_output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        images = convert_from_path(str(pdf_path))
        for i, image in enumerate(images):
            page_num = i + 1
            # Save temp image for processing (GLM-OCR pipeline expects file path or url usually, but let's check if we can pass PIL)
            # The README says "url": "path". Let's save a temp file to be safe and consistent.
            temp_img_path = pdf_output_dir / f"page-{page_num:03d}.jpg"
            image.save(temp_img_path, "JPEG")
            
            output_md_path = pdf_output_dir / f"page-{page_num:03d}.md"
            
            if output_md_path.exists():
                 logger.info(f"Skipping existing page: {output_md_path}")
                 continue

            process_image(processor, model, temp_img_path, output_md_path, system_prompt)
            
            # Optional: Remove temp image to save space, or keep it as debug/reference
            # temp_img_path.unlink() 

    except Exception as e:
        logger.error(f"Error processing PDF {pdf_path}: {e}")

def main():
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Init model
    processor, model = init_model()

    # Iterate over files in raw_data
    extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.pdf'}
    
    for file_path in RAW_DATA_DIR.rglob("*"):
        if file_path.suffix.lower() not in extensions:
            continue
            
        # Determine relative path for mirroring structure if needed, 
        # but for now we follow the simple logic:
        # Images -> OUTPUT_DIR / <filename>.md
        # PDFs -> OUTPUT_DIR / <filename>.nd / page-xxx.md
        
        # Use standard prompt for GLM-OCR
        # Official docs suggest "Table Recognition:" or "Text Recognition:"
        # Since medical reports are mostly tables, we use Table Recognition.
        system_prompt = "Table Recognition:" 
        
        if file_path.suffix.lower() == '.pdf':
            process_pdf(processor, model, file_path, system_prompt)
        else:
            # It's an image
            output_md_path = OUTPUT_DIR / f"{file_path.stem}.md"
            if output_md_path.exists():
                logger.info(f"Skipping existing file: {output_md_path}")
                continue
                
            process_image(processor, model, file_path, output_md_path, system_prompt)

if __name__ == "__main__":
    main()
