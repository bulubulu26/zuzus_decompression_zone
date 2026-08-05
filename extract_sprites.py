#!/usr/bin/env python3
"""Re-extract sprites with corrected mapping based on visual inspection."""
from PIL import Image
import xml.etree.ElementTree as ET
import os, shutil

SPRITESHEET = os.path.expanduser(
    "~/Downloads/Fruit and Vagetables pack/Spritesheets/sprites.png"
)
XML_FILE = os.path.expanduser(
    "~/Downloads/Fruit and Vagetables pack/Spritesheets/sprites.xml"
)
OUT_DIR = "./assets/images"
os.makedirs(OUT_DIR, exist_ok=True)

sheet = Image.open(SPRITESHEET).convert("RGBA")
tree = ET.parse(XML_FILE)
root = tree.getroot()

# Visual inspection shows:
# Line1 = yellow lemon face
# Line2 = green melon/apple face
# Line3 = purple eggplant face
# Line4 = PINK STRAWBERRY (red, correct!)
# Line5 = orange carrot face
# So strawberry=Line4, melon=Line2, orange=Line5 (carrot/orange), lemon=Line1 (bonus)

WANT = {
    # Whole fruits (bright colourful with outlines)
    "CharactersBright_Line4.png":  "strawberry.png",   # ✅ pink strawberry
    "CharactersBright_Line2.png":  "melon.png",        # ✅ green melon
    "CharactersBright_Line5.png":  "orange.png",       # ✅ orange carrot-like
    "CharactersBright_Line1.png":  "lemon.png",        # ✅ yellow lemon (bonus)
    # Splat / squished versions (NoLine variants look paler/flatter)
    "CharactersBright_NoLine4.png": "strawberry_splat.png",
    "CharactersBright_NoLine2.png": "melon_splat.png",
    "CharactersBright_NoLine5.png": "orange_splat.png",
    "CharactersBright_NoLine1.png": "lemon_splat.png",
    # Effects
    "Explosion.png": "explosion.png",
    # UI panels
    "PanalBig_LightBrown.png":   "panel_big.png",
    "PanalSmall_LightBrown.png": "panel_small.png",
    "PanalBig_DarkBrown.png":    "panel_big_dark.png",
}

extracted = []
for sub in root.findall("SubTexture"):
    name = sub.get("name")
    if name in WANT:
        x = int(sub.get("x"))
        y = int(sub.get("y"))
        w = int(sub.get("width"))
        h = int(sub.get("height"))
        crop = sheet.crop((x, y, x + w, y + h))
        out_path = os.path.join(OUT_DIR, WANT[name])
        # Scale up to at least 160px on longest side for crisp mobile display
        target = 160
        scale = max(target / max(w, h), 1.0)
        new_w = int(w * scale)
        new_h = int(h * scale)
        crop = crop.resize((new_w, new_h), Image.NEAREST)
        crop.save(out_path, "PNG")
        print(f"  ✓ {name} → {WANT[name]}  ({new_w}x{new_h})")
        extracted.append(WANT[name])

# Copy blink sparkle frames
BLINK_SRC = os.path.expanduser("~/Downloads/BlinkAnimation/PNG")
BLINK_FRAMES = [
    "BlinkBright_Line1.png",
    "BlinkBright_Line2.png",
    "BlinkBright_Line3.png",
    "BlinkBright_Line4.png",
    "BlinkBright_Line5.png",
]
for f in BLINK_FRAMES:
    src = os.path.join(BLINK_SRC, f)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(OUT_DIR, f))
        print(f"  ✓ Copied blink frame: {f}")

print(f"\nDone! {len(extracted)} sprites + blink frames extracted → {OUT_DIR}")
