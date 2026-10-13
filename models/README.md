# Model Setup — EcoSort AI

This directory is a placeholder for locally-hosted Teachable Machine models.

## Using a Cloud-Hosted Model (Recommended)

The simplest approach is to host your model on Google's Teachable Machine servers:

1. Train your model at [teachablemachine.withgoogle.com/train/image](https://teachablemachine.withgoogle.com/train/image)
2. Export → TensorFlow.js → Upload my model
3. Copy the URL and paste it into the app's model configuration panel

The URL will look like: `https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/`

## Self-Hosting a Model

If you prefer to host the model files yourself:

1. Train your model on Teachable Machine
2. Export → TensorFlow.js → **Download** (instead of Upload)
3. Extract the downloaded zip file
4. You'll get these files:
   - `model.json`
   - `metadata.json`
   - `weights.bin` (or multiple `.bin` files)
5. Place all files in this `models/` directory
6. Set the `MODEL_URL` to point to this directory (e.g., `./models/`)

### Important Notes for Self-Hosting

- The model files must be served over HTTP(S), not from `file://`
- Ensure your web server serves `.json` and `.bin` files with correct MIME types
- If using GitHub Pages, the model files should be committed to the repository
- Model files can be large (10–50 MB) — consider the impact on page load

## Model Files Reference

A typical Teachable Machine export contains:

| File | Description |
|---|---|
| `model.json` | Model architecture and configuration |
| `metadata.json` | Class labels and model metadata |
| `*.bin` | Model weight files (binary) |

## Recommended Model Classes

Train your model with these classes for best results with the built-in disposal rules:

- Plastic Bottle
- Cardboard
- Paper
- Metal Can
- Glass Bottle
- Fruit Peels
- Vegetable Scraps
- Food Waste
- Leaves
- Coffee Grounds
- Mobile Phone
- Charger
- Circuit Board
- Battery
- Plastic Bag
- Styrofoam

You can add more classes — just ensure you also add corresponding entries in `data/waste-rules.json`.
