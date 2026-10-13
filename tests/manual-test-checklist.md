# EcoSort AI — Manual Test Checklist

**Test Date**: _______________  
**Tester**: _______________  
**Browser**: _______________  
**Device**: _______________  
**Model URL Configured**: Yes / No  

---

## 1. App Loading & UI

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 1.1 | Open index.html via a local server | Dashboard loads without console errors | | |
| 1.2 | Check page title | "EcoSort AI — Smart Waste Classifier" | | |
| 1.3 | Check navbar | Logo, theme toggle, and install button visible | | |
| 1.4 | Check hero section | Heading and subtitle displayed correctly | | |
| 1.5 | Check scanner card | "Open Camera" and "Upload Image" buttons present | | |
| 1.6 | Check waste category cards | 4 category cards (Recyclable, Organic, E-Waste, Non-Recyclable) visible | | |
| 1.7 | Check footer | Project info, environmental impact, privacy section visible | | |
| 1.8 | Responsive — mobile width (375px) | Layout adapts, no horizontal scroll, text readable | | |
| 1.9 | Responsive — tablet width (768px) | Grid layouts adjust properly | | |
| 1.10 | Responsive — desktop (1280px+) | Full layout with proper max-width containment | | |

---

## 2. Theme Toggle

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 2.1 | Click theme toggle button | Theme switches between light and dark | | |
| 2.2 | Refresh page after toggling | Theme preference is preserved | | |
| 2.3 | Check dark mode contrast | All text is readable against dark backgrounds | | |
| 2.4 | Check icon changes | Moon icon in light mode, Sun icon in dark mode | | |

---

## 3. Model Configuration

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 3.1 | App loads without model URL | Model setup panel is visible | | |
| 3.2 | Enter invalid URL and submit | Error toast and error status shown | | |
| 3.3 | Enter valid Teachable Machine URL | Model loads, success toast, setup panel hides | | |
| 3.4 | Refresh after model load | Model URL is restored from LocalStorage | | |
| 3.5 | Click "How to train your model" | Accordion expands with training instructions | | |

---

## 4. Camera Access

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 4.1 | Click "Open Camera" | Browser shows camera permission prompt | | |
| 4.2 | Allow camera permission | Live video feed appears in camera view | | |
| 4.3 | Check rear camera (mobile) | Rear camera is used by default | | |
| 4.4 | Click switch camera button | Switches between front and rear cameras | | |
| 4.5 | Click close camera button | Camera stream stops, returns to scanner card | | |
| 4.6 | Re-open camera after closing | Camera restarts without errors | | |
| 4.7 | Deny camera permission | Helpful error message shown, upload still works | | |
| 4.8 | Access from HTTP (non-localhost) | Clear error about HTTPS requirement | | |

---

## 5. Image Capture & Classification

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 5.1 | Click capture button | Frame captured, camera stops, classification starts | | |
| 5.2 | Model processes captured image | Loading spinner shown during classification | | |
| 5.3 | Classification result displayed | Result card shows detected item, category, confidence | | |
| 5.4 | Confidence bar animates | Green bar fills to the predicted percentage | | |
| 5.5 | Disposal instructions shown | Disposal method, preparation steps displayed | | |
| 5.6 | "Scan Another" button works | Returns to scanner card, ready for next scan | | |
| 5.7 | "Save to History" button works | Result saved, confirmation toast, button disabled | | |

---

## 6. Image Upload

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 6.1 | Click "Upload Image" | Native file picker opens | | |
| 6.2 | Select a JPG image | Image preview shown with classify/clear buttons | | |
| 6.3 | Select a PNG image | Image preview shown correctly | | |
| 6.4 | Select a WebP image | Image preview shown correctly | | |
| 6.5 | Select an invalid file (e.g., PDF) | Warning toast, file rejected | | |
| 6.6 | Select a very large image (>10MB) | Warning toast about file size | | |
| 6.7 | Click "Classify Image" | Classification runs, result displayed | | |
| 6.8 | Click "Clear" | Returns to scanner card | | |
| 6.9 | Upload another image without refresh | New upload and classification works | | |

---

## 7. Classification Results

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 7.1 | High-confidence recyclable item | Green result card with recycling instructions | | |
| 7.2 | High-confidence organic item | Amber/brown card with composting info | | |
| 7.3 | High-confidence e-waste item | Purple card with e-waste disposal warnings | | |
| 7.4 | Low-confidence result | "Low confidence" message with manual classify options | | |
| 7.5 | Manual classification buttons | Clicking a category shows appropriate instructions | | |
| 7.6 | Manual result flagged | Shows "Manually classified" badge | | |
| 7.7 | "View all predictions" expandable | Shows all model predictions with percentages | | |
| 7.8 | Warning section for hazardous items | Battery/e-waste shows hazard warnings | | |
| 7.9 | Source links | Reference links open in new tabs | | |
| 7.10 | Disclaimer text | "AI prediction, not a guarantee" text visible | | |

---

## 8. Scan History

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 8.1 | Empty history state | "No scans yet" message shown | | |
| 8.2 | Save a classification result | Entry appears in history list | | |
| 8.3 | History shows thumbnail | Small thumbnail displayed if available | | |
| 8.4 | History shows metadata | Item name, category, confidence, timestamp | | |
| 8.5 | Delete single entry | Entry removed on hover → click X | | |
| 8.6 | Clear all history | Confirmation dialog, all entries removed | | |
| 8.7 | Refresh page | History persists from LocalStorage | | |
| 8.8 | Multiple entries | Up to 10 recent entries shown | | |

---

## 9. Statistics

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 9.1 | Initial state | Total scans = 0, all categories = 0 | | |
| 9.2 | After saving scans | Counts update correctly by category | | |
| 9.3 | Category bars | Proportional width bars rendered | | |
| 9.4 | Total counter animation | Number counts up smoothly | | |
| 9.5 | Disclaimer text | "Personal scan counts, not verified impact" shown | | |

---

## 10. Location & Regional Rules

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 10.1 | City dropdown populated | Shows list of Indian cities | | |
| 10.2 | Select a city | City info panel shows authority and rules | | |
| 10.3 | Click "Detect" location | Geolocation prompt appears | | |
| 10.4 | Allow location permission | City auto-detected and selected | | |
| 10.5 | Deny location permission | Friendly message, manual selection still works | | |
| 10.6 | Location preference saved | City selection preserved on refresh | | |
| 10.7 | Regional rules in results | Classification results show city-specific info | | |
| 10.8 | Privacy notice visible | "No data sent to server" note shown | | |

---

## 11. Disposal Guide

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 11.1 | Guides loaded | Composting, E-Waste, Plastic guides visible | | |
| 11.2 | Accordion expand/collapse | Details sections open and close | | |
| 11.3 | Official resource links | CPCB and MoEFCC links present | | |
| 11.4 | Category detail modals | Clicking category cards shows item list | | |

---

## 12. PWA & Service Worker

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 12.1 | Service Worker registers | "SW registered" in console (HTTPS/localhost) | | |
| 12.2 | Manifest loads | No manifest errors in Application tab | | |
| 12.3 | Install prompt (Chrome/Edge) | Install button appears or browser shows prompt | | |
| 12.4 | PWA installation | App installs and opens in standalone window | | |
| 12.5 | Offline static pages | App shell loads without internet after caching | | |
| 12.6 | Offline model inference | Only works if model was previously cached | | |

---

## 13. Error Handling

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 13.1 | No camera on device | Clear error, upload option highlighted | | |
| 13.2 | Invalid model URL | Descriptive error message | | |
| 13.3 | Network error during model load | "Check internet connection" message | | |
| 13.4 | Corrupt uploaded image | Graceful error, no crash | | |
| 13.5 | Console errors | No uncaught exceptions during normal use | | |
| 13.6 | Multiple camera opens | No duplicate streams | | |
| 13.7 | Page visibility change | Camera not lost on tab switch | | |

---

## 14. Accessibility

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 14.1 | Keyboard navigation | All buttons and controls focusable via Tab | | |
| 14.2 | ARIA labels | Interactive elements have aria-label | | |
| 14.3 | Color contrast | Text readable in both light and dark modes | | |
| 14.4 | Reduced motion | Animations disabled when OS setting is on | | |
| 14.5 | Screen reader compatibility | Main actions announced correctly | | |

---

## Summary

| Area | Tests Passed | Tests Failed | Total |
|---|---|---|---|
| App Loading & UI | | | 10 |
| Theme Toggle | | | 4 |
| Model Configuration | | | 5 |
| Camera Access | | | 8 |
| Image Capture | | | 7 |
| Image Upload | | | 9 |
| Classification Results | | | 10 |
| Scan History | | | 8 |
| Statistics | | | 5 |
| Location | | | 8 |
| Disposal Guide | | | 4 |
| PWA | | | 6 |
| Error Handling | | | 7 |
| Accessibility | | | 5 |
| **TOTAL** | | | **96** |

---

**Notes & Issues Found:**

_________________________________________________________________________________

_________________________________________________________________________________

_________________________________________________________________________________
