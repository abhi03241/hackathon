# 🧘 Yoga Pose Assessment — NG Yoga Studio

> **AI-powered real-time yoga pose checker** built with MediaPipe Pose (33 landmarks).  
> Upload a photo or use your webcam — get skeleton overlay, joint angles, accuracy score, and plain-English corrections for **15 yoga poses**.

---

## 🔴 Live Demo — Real People, Real Feedback

These are **actual results** from testing our friends' poses through the system. Green dots = joint within correct range. Red dots = needs correction. Numbers = measured angles in degrees.

### Tree Pose (Vrikshasana) — Skeleton Overlay
![Tree Pose Skeleton](shr.jpg)
> **All joints green** — arms raised correctly at 158°/157°, hip alignment at 171°. System detected form as accurate.

### Warrior II (Virabhadrasana II) — Corrections Highlighted
![Warrior II Skeleton](tej.jpg)
> **Red joints** = corrections needed. Right shoulder at 108° (aim ~90°), left hip at 139° (aim ~165°). System flags exactly what to fix.

---

## 📱 Streamlit App — What It Looks Like

### Warrior II — 93% Accuracy with Feedback
![Streamlit App - Warrior II](WhatsApp%20Image%202026-10-24%20at%2000.11.06.jpeg)
> Pose detected: **Warrior II — 93% accuracy**  
> Feedback given:
> - *"Bend your right knee more (now 123°, aim for ~90°)"*
> - *"Open your left hip — lengthen the line from shoulder to knee (now 139°, aim for ~165°)"*
> - *"Straighten your left knee (now 163°, aim for ~180°)"*
> - *"Lower your right arm (now 108°, aim for ~90°)"*

### Warrior I — 89% Accuracy with Feedback
![Streamlit App - Warrior I](WhatsApp%20Image%202026-10-24%20at%2000.11.33.jpeg)
> Pose detected: **Warrior I — 89% accuracy**  
> Feedback given:
> - *"Straighten your right elbow (now 140°, aim for ~180°)"*
> - *"Bend your left knee more (now 119°, aim for ~90°)"*

---

## 📸 Sample Test Images

Below are the reference test images used for pose validation. Each pose has 2 reference photos.

### Front-View Poses

| Mountain Pose | Tree Pose | Chair Pose |
|:---:|:---:|:---:|
| ![mountain_1](test_images/mountain_1.jpg) | ![tree_1](test_images/tree_1.jpg) | ![chair_1](test_images/chair_1.jpg) |
| `mountain_1.jpg` | `tree_1.jpg` | `chair_1.jpg` |
| ![mountain_2](test_images/mountain_2.jpg) | ![tree_2](test_images/tree_2.jpg) | ![chair_2](test_images/chair_2.jpg) |
| `mountain_2.jpg` | `tree_2.jpg` | `chair_2.jpg` |

| Goddess Pose | Warrior I | Warrior II |
|:---:|:---:|:---:|
| ![goddess_1](test_images/goddess_1.jpg) | ![warrior1_1](test_images/warrior1_1.jpg) | ![warrior2_1](test_images/warrior2_1.jpg) |
| `goddess_1.jpg` | `warrior1_1.jpg` | `warrior2_1.jpg` |
| ![goddess_2](test_images/goddess_2.jpg) | ![warrior1_2](test_images/warrior1_2.jpg) | ![warrior2_2](test_images/warrior2_2.jpg) |
| `goddess_2.jpg` | `warrior1_2.jpg` | `warrior2_2.jpg` |

| Triangle Pose | | |
|:---:|:---:|:---:|
| ![triangle_1](test_images/triangle_1.jpg) | ![triangle_2](test_images/triangle_2.jpg) | |
| `triangle_1.jpg` | `triangle_2.jpg` | |

---

### Side-View Poses

| Low Lunge | Downward Dog | Upward Dog |
|:---:|:---:|:---:|
| ![lunge_1](test_images/lunge_1.jpg) | ![downdog_1](test_images/downdog_1.jpg) | ![updog_1](test_images/updog_1.jpg) |
| `lunge_1.jpg` | `downdog_1.jpg` | `updog_1.jpg` |
| ![lunge_2](test_images/lunge_2.jpg) | ![downdog_2](test_images/downdog_2.jpg) | ![updog_2](test_images/updog_2.jpg) |
| `lunge_2.jpg` | `downdog_2.jpg` | `updog_2.jpg` |

| Cobra Pose | Plank | Bridge Pose |
|:---:|:---:|:---:|
| ![cobra_1](test_images/cobra_1.jpg) | ![plank_1](test_images/plank_1.jpg) | ![bridge_1](test_images/bridge_1.jpg) |
| `cobra_1.jpg` | `plank_1.jpg` | `bridge_1.jpg` |
| ![cobra_2](test_images/cobra_2.jpg) | ![plank_2](test_images/plank_2.jpg) | ![bridge_2](test_images/bridge_2.jpg) |
| `cobra_2.jpg` | `plank_2.jpg` | `bridge_2.jpg` |

| Boat Pose | Child's Pose | |
|:---:|:---:|:---:|
| ![boat_1](test_images/boat_1.jpg) | ![child_1](test_images/child_1.jpg) | |
| `boat_1.jpg` | `child_1.jpg` | |
| ![boat_2](test_images/boat_2.jpg) | ![child_2](test_images/child_2.jpg) | |
| `boat_2.jpg` | `child_2.jpg` | |

---

## 🗂️ Project Structure

```
yoga-pose-assessment/
│
├── app.py              # Streamlit web app (upload / webcam)
├── live.py             # Webcam live mode (real-time feedback)
├── check_images.py     # Batch test a folder of images
├── pose_utils.py       # Core engine — MediaPipe + scoring + feedback
├── requirements.txt    # Python dependencies
│
├── test_images/        # 30 reference photos (2 per pose, Creative Commons)
│   ├── mountain_1.jpg
│   ├── mountain_2.jpg
│   ├── tree_1.jpg
│   ├── ... (all 15 poses × 2)
│   └── CREDITS.txt     # Image licences & sources
│
├── an.jpg              # Sample test photo
├── shr.jpg             # Sample test photo
└── tej.jpg             # Sample test photo
```

---

## ⚙️ Setup (Windows · Python 3.12)

```powershell
# Clone / navigate to the folder
cd yoga-pose-assessment

# Create a virtual environment (MediaPipe needs numpy < 2)
py -3.12 -m venv venv

# Install dependencies
venv\Scripts\python -m pip install -r requirements.txt
```

> ⚠️ **Keep this in its own venv** — MediaPipe 0.10.x is incompatible with `numpy >= 2`.

---

## ▶️ How to Run

### 1. Web App (Streamlit — Upload or Webcam)
```powershell
venv\Scripts\python -m streamlit run app.py
```
Opens at `http://localhost:8501` — upload a photo or click a live webcam shot, select your pose, and get instant feedback.

### 2. Live Webcam Mode
```powershell
venv\Scripts\python live.py --pose tree       # Real-time tree pose feedback
venv\Scripts\python live.py --pose warrior2   # Real-time warrior II
venv\Scripts\python live.py --list            # List all supported pose names
# Press Q to quit
```

### 3. Batch Test a Folder
```powershell
venv\Scripts\python check_images.py test_images
```
- Prints detected pose, accuracy score, and corrections for every image
- Writes annotated output images to `test_images/out/`
- If filename starts with a pose name (e.g., `tree_1.jpg`), also checks if auto-detect agreed

---

## 🧘 Supported Poses (15)

| # | Pose | Short Names | Camera Angle |
|---|---|---|---|
| 1 | Mountain Pose | `mountain`, `tadasana` | Front |
| 2 | Tree Pose | `tree`, `vrikshasana` | Front |
| 3 | Chair Pose | `chair`, `utkatasana` | Front |
| 4 | Goddess Pose | `goddess` | Front |
| 5 | Warrior I | `warrior1` | Front |
| 6 | Warrior II | `warrior2`, `warrior` | Front |
| 7 | Triangle Pose | `triangle`, `trikonasana` | Front |
| 8 | Low Lunge | `lunge`, `anjaneyasana` | Side |
| 9 | Downward Dog | `downdog` | Side |
| 10 | Upward Dog | `updog` | Side |
| 11 | Cobra Pose | `cobra`, `bhujangasana` | Side |
| 12 | Plank | `plank` | Side |
| 13 | Bridge Pose | `bridge` | Side |
| 14 | Boat Pose | `boat`, `navasana` | Side |
| 15 | Child's Pose | `child`, `balasana` | Side |

---

## 📐 How It Works

### Landmark Detection
- Uses **MediaPipe Pose** — 33 3D body landmarks extracted from a single photo
- Works on static images and live video frames

### Joint Angle Scoring
Each joint angle is measured between **3 landmarks** in 2D:
- **Elbow:** shoulder → elbow → wrist
- **Shoulder:** elbow → shoulder → hip
- **Hip:** shoulder → hip → knee
- **Knee:** hip → knee → ankle

| Score | Meaning |
|---|---|
| 100 | Joint is within tolerance of the target angle |
| 0–99 | Drops linearly as deviation grows (max penalty over ~60°) |

**Pose Score** = mean score over all joints where MediaPipe visibility ≥ 0.5

### Auto-Detect Mode
Ranks all 15 poses and flags **low confidence** when:
- Fewer than half the joints are clearly visible
- Runner-up pose is within 5 points
- Best score is under 60%

### Symmetry Support
Asymmetric poses are tested on **both sides** (`mirror=True`) and the better result is used.

---

## 📸 Photo Tips for Best Results

| ✅ Do | ❌ Avoid |
|---|---|
| Full body visible (head to feet) | Cropped limbs |
| Phone ~2–3 m away at hip height | Very close or tilted camera |
| Plain background, good lighting | Cluttered background, shadows |
| Fitted clothing | Baggy clothes hiding joints |
| **Face camera** for front-view poses | Wrong angle for the pose type |
| **Side-on** for floor/mat poses | Wrong angle for the pose type |

---

## 🔗 Integration with NG Yoga Studio

This module plugs into the **NG Yoga Studio clinical routing pipeline**:

- After a member is routed to a programme (via Health Intake R1–R6), they can use this tool to **self-assess their form** before attending class
- The **instructor (NG Gothane)** can use batch-test mode to review member submission photos
- Accuracy scores can feed back into the **Retention Triage** system — low scores trigger a WhatsApp nudge for an in-person alignment check

---

## ⚠️ Limitations

- Angles are measured in **2D**, so camera angle matters significantly
- Photos with **multiple people**, very small figures, silhouettes, or heavy noise may not detect correctly
- This is a **guide tool**, not professional medical or instructional advice
- Tune angle targets/tolerances in `pose_utils.py → POSES` to your own reference standards

---

## 📄 Image Credits

All images in `test_images/` are **Creative Commons** photos from Wikimedia Commons.  
Full source URLs and licence details: [`test_images/CREDITS.txt`](test_images/CREDITS.txt)

> For local testing only — check each licence before redistributing.
