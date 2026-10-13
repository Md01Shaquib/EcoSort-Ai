# EcoSort AI — Smart Waste Classifier PWA

> AI-powered waste classification Progressive Web App that helps you identify household waste and dispose of it responsibly. Supporting **SDG 15: Life on Land**.

---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [AI Model Training](#ai-model-training)
- [Configuring the Model URL](#configuring-the-model-url)
- [How Camera Permissions Work](#how-camera-permissions-work)
- [Updating Waste Classes](#updating-waste-classes)
- [Updating Disposal Rules](#updating-disposal-rules)
- [Installing the PWA](#installing-the-pwa)
- [Deployment](#deployment)
- [Common Errors & Solutions](#common-errors--solutions)
- [Privacy & Limitations](#privacy--limitations)
- [Official References](#official-references)

---

## ✨ Features

- **AI Image Classification**: Identify waste items using a Google Teachable Machine model powered by TensorFlow.js
- **Real Camera Support**: Capture images using your device's camera (front and rear)
- **Image Upload**: Upload JPG, PNG, or WebP images for classification
- **Disposal Guidance**: Get step-by-step disposal instructions with India-focused regional rules
- **Location-Aware**: Auto-detect your city or select manually to see local waste collection rules
- **Dark Mode**: Toggle between light and dark themes
- **Scan History**: Track your recent scans with thumbnails and confidence scores
- **Statistics Dashboard**: View your scan counts by waste category
- **PWA Support**: Install on your device for a native-like experience
- **Offline Support**: App shell and guidance data cached for offline access
- **Accessibility**: Keyboard navigation, screen reader labels, and color contrast support
- **Manual Classification**: Select category manually when AI confidence is low

---

## 🛠 Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, Vanilla JavaScript (ES6+), CSS3 |
| Styling | Tailwind CSS v3 (CDN) + Custom CSS |
| AI Model | Google Teachable Machine Image Model |
| ML Runtime | TensorFlow.js |
| Icons | Lucide Icons |
| Camera | Browser MediaDevices API (getUserMedia) |
| PWA | Web App Manifest + Service Worker |
| Storage | LocalStorage |
| Location | Browser Geolocation API |

---

## 📁 Project Structure

```
ecosort-ai/
├── index.html              # Main HTML page
├── manifest.json           # PWA manifest
├── service-worker.js       # Service Worker for caching
├── README.md               # This file
├── assets/
│   ├── icons/
│   │   ├── icon-192.png    # PWA icon 192×192
│   │   └── icon-512.png    # PWA icon 512×512
│   └── images/
├── css/
│   └── styles.css          # Custom CSS (animations, components)
├── js/
│   ├── app.js              # Main application orchestrator
│   ├── camera.js           # Camera access and control
│   ├── classifier.js       # TensorFlow.js model loading and prediction
│   ├── disposal-rules.js   # Waste disposal rules engine
│   ├── history.js          # Scan history (LocalStorage)
│   ├── location.js         # Geolocation and city selection
│   ├── pwa.js              # PWA installation handling
│   └── ui.js               # Theme toggle, toasts, UI utilities
├── data/
│   └── waste-rules.json    # Waste disposal rules database
├── models/
│   └── README.md           # Model setup instructions
└── tests/
    └── manual-test-checklist.md
```

---

## 📦 Prerequisites

- A modern web browser: **Chrome 80+**, **Firefox 78+**, **Safari 14+**, or **Edge 80+**
- An internet connection (for initial load, CDN resources, and model download)
- **HTTPS or localhost** (required for camera access and service worker)
- A trained Teachable Machine image model (see [AI Model Training](#ai-model-training))

---

## 🚀 Local Setup

### Option 1: Using VS Code Live Server (Recommended)

1. Clone or download the project:
   ```bash
   git clone <your-repo-url>
   cd ecosort-ai
   ```

2. Open in VS Code:
   ```bash
   code .
   ```

3. Install the **Live Server** extension

4. Right-click `index.html` → **Open with Live Server**

5. The app opens at `http://127.0.0.1:5500` (camera works on localhost)

### Option 2: Using Python HTTP Server

```bash
cd ecosort-ai
python -m http.server 8080
```

Open `http://localhost:8080` in your browser.

### Option 3: Using Node.js (npx)

```bash
npx -y serve .
```

Open the URL shown in the terminal.

### Option 4: Using PHP

```bash
php -S localhost:8080
```

> **Important**: Camera access requires **HTTPS** or **localhost**. It will not work from `file://` URLs or plain HTTP on non-localhost domains.

---

## 🤖 AI Model Training

### Step-by-Step Guide

1. **Go to Teachable Machine**: Visit [teachablemachine.withgoogle.com/train/image](https://teachablemachine.withgoogle.com/train/image)

2. **Create classes** — Rename the default classes to match these categories:

   | Class Name | Examples |
   |---|---|
   | `Plastic Bottle` | Water bottles, soda bottles, PET containers |
   | `Cardboard` | Boxes, corrugated cardboard, packaging |
   | `Paper` | Newspapers, office paper, magazines |
   | `Metal Can` | Aluminium cans, tin cans, beverage cans |
   | `Glass Bottle` | Glass jars, glass bottles, glass containers |
   | `Fruit Peels` | Banana peels, orange peels, apple cores |
   | `Vegetable Scraps` | Veggie peels, kitchen scraps |
   | `Food Waste` | Leftover food, plate waste |
   | `Leaves` | Dry leaves, garden waste |
   | `Coffee Grounds` | Used coffee, tea leaves |
   | `Mobile Phone` | Old phones, smartphones |
   | `Charger` | USB cables, chargers, adapters |
   | `Circuit Board` | PCBs, motherboards, electronic parts |
   | `Battery` | AA batteries, lithium batteries, phone batteries |
   | `Plastic Bag` | Polythene bags, carry bags |
   | `Styrofoam` | Thermocol, foam packaging |

3. **Add training images** — For each class:
   - Click "Webcam" to capture images using your camera, OR
   - Click "Upload" to add existing images
   - **Aim for 50–200 images per class** for decent accuracy
   - Use different angles, lighting conditions, and backgrounds
   - Include items on different surfaces and in different orientations

4. **Train the model** — Click the "Train Model" button and wait for training to complete (usually 1–5 minutes)

5. **Test your model** — Use the preview panel to test with your webcam or uploaded images. Verify accuracy before exporting.

6. **Export the model**:
   - Click **"Export Model"**
   - Select the **"TensorFlow.js"** tab
   - Click **"Upload my model"**
   - Wait for the upload to complete
   - **Copy the shareable URL** (it looks like `https://teachablemachine.withgoogle.com/models/xxxxxxxx/`)

### Tips for Better Accuracy

- **Diverse images**: Include items in various lighting, angles, and backgrounds
- **Clean backgrounds**: Avoid cluttered backgrounds that distract from the item
- **Balanced classes**: Try to have a similar number of images for each class
- **Real-world conditions**: Take photos similar to how users will actually use the app
- **Negative examples**: Consider adding a "Background" or "Unknown" class with random non-waste images

---

## 🔗 Configuring the Model URL

### Method 1: In the App UI

1. Open the app in your browser
2. Find the **"Configure Your AI Model"** panel at the top
3. Paste your Teachable Machine model URL into the input field
4. Click **"Load Model"**
5. The URL is saved in your browser's LocalStorage for next time

### Method 2: In the Code

Edit `js/classifier.js` and set the `MODEL_URL` variable:

```javascript
let MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';
```

---

## 📷 How Camera Permissions Work

1. Camera access is **not requested** until you click **"Open Camera"**
2. Your browser will show a permission prompt — click **"Allow"**
3. The rear camera is preferred on mobile devices (`facingMode: "environment"`)
4. You can switch between front and rear cameras using the switch button
5. Camera tracks are **stopped** when you close the camera or leave the page
6. If permission is denied, you can still classify images by **uploading** photos

### Requirements

- **HTTPS** or **localhost** — Camera API is blocked on insecure origins
- On iOS Safari, camera access works in the browser but may behave differently in PWA mode

---

## ➕ Updating Waste Classes

When you add new classes to your Teachable Machine model:

1. Add corresponding entries in `data/waste-rules.json` under the `"items"` array
2. Each item needs:
   - `modelClasses`: Array of class names that your model might output
   - `category`: One of `"recyclable"`, `"organic"`, `"ewaste"`, `"non_recyclable"`
   - `disposalMethod`, `preparation`, `warnings`, etc.

Example:
```json
{
  "id": "tetra_pack",
  "names": ["Tetra Pack", "Juice Box"],
  "modelClasses": ["Tetra Pack", "tetra_pack"],
  "category": "recyclable",
  "disposalMethod": "Rinse and place in dry waste...",
  "preparation": ["Rinse the container", "Flatten"],
  "warnings": ["Multi-layer packaging requires specialized recycling"],
  "specialNotes": "...",
  "sources": [],
  "regionalRules": { "default": "Place in dry waste bin" },
  "lastVerified": "2026-10-01"
}
```

---

## 📍 Updating Disposal Rules

Edit `data/waste-rules.json` to:

- Add new **cities** under the `"cities"` array
- Add **regional rules** to specific items (`regionalRules` object)
- Update **general guidance** under `"generalGuidance"`
- Change the **confidence threshold** (`"confidenceThreshold"`)

All changes take effect on the next page load.

---

## 📱 Installing the PWA

### On Android (Chrome)

1. Open the app in Chrome
2. Tap the **"Install"** button in the navbar, OR
3. Tap the browser menu (⋮) → **"Add to Home Screen"** or **"Install App"**
4. Tap **"Install"** to confirm

### On Desktop (Chrome / Edge)

1. Open the app in Chrome or Edge
2. Click the **install icon** (⊕) in the address bar, OR
3. Click the **"Install"** button in the navbar
4. Click **"Install"** to confirm

### On iOS (Safari)

1. Open the app in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**

---

## 🌐 Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to **Settings** → **Pages**
3. Set Source to **main** branch, folder **/ (root)**
4. Click **Save** — your app will be live at `https://username.github.io/ecosort-ai/`

### Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Drag and drop the `ecosort-ai` folder onto the Netlify dashboard
3. Your site will be live instantly with a Netlify URL
4. Optionally configure a custom domain

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts — your site will be deployed

> All three options provide HTTPS automatically, which is required for camera and service worker functionality.

---

## ❗ Common Errors & Solutions

| Error | Cause | Solution |
|---|---|---|
| "Camera permission denied" | User blocked camera access | Go to browser settings → Site permissions → Camera → Allow |
| "No camera found" | Device has no camera or it's in use | Use the "Upload Image" option instead |
| "Camera requires HTTPS" | App served over HTTP | Use localhost, or deploy to HTTPS |
| "Model failed to load" | Invalid model URL or network error | Verify the URL, check internet connection |
| "Model files not found" | Wrong URL or model not uploaded | Re-export from Teachable Machine and upload |
| "Low confidence result" | Image quality or untrained item | Try better lighting/angle, or classify manually |
| Service Worker error | Browser doesn't support SW | Use a modern browser |
| PWA won't install | Not served over HTTPS | Deploy to GitHub Pages, Netlify, or Vercel |
| "Teachable Machine library not loaded" | CDN blocked or offline | Check internet connection and ad blockers |

---

## 🔒 Privacy & Limitations

### Privacy

- ✅ **All image processing happens locally** in your browser using TensorFlow.js
- ✅ **No images are uploaded** to any external server
- ✅ **No personal data is collected** — location data stays in your browser
- ✅ **History is stored locally** in your browser's LocalStorage

### Limitations

- ⚠️ **AI predictions are not guarantees** — always verify with local rules
- ⚠️ **Model accuracy depends on training data** — results improve with more diverse training images
- ⚠️ **Offline AI inference** only works if the model was previously cached by the service worker
- ⚠️ **Disposal rules** are general guidelines — actual rules vary by city and are subject to change
- ⚠️ **Recycling facility locations** are not included — please check official municipal websites
- ⚠️ The app does not fabricate recycling centre addresses, phone numbers, or collection schedules

---

## 🔗 Official References

- [Central Pollution Control Board (CPCB)](https://cpcb.nic.in/)
- [CPCB — E-Waste Management](https://cpcb.nic.in/e-waste/)
- [CPCB — Plastic Waste Management](https://cpcb.nic.in/plastic-waste-management/)
- [Ministry of Environment, Forest & Climate Change](https://moef.gov.in/)
- [Solid Waste Management Rules, 2016](https://moef.gov.in/)
- [E-Waste Management Rules, 2016 (amended 2022)](https://moef.gov.in/)
- [Battery Waste Management Rules, 2022](https://cpcb.nic.in/)
- [Google Teachable Machine](https://teachablemachine.withgoogle.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)

---

## 📄 License

This project is created for educational purposes. Use responsibly.

---

*Built with 🌿 for a cleaner planet.*
