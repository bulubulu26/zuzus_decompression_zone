#!/usr/bin/env python3
"""Generate a pixel art watermelon slice and splatted watermelon slice PNGs."""
from PIL import Image, ImageDraw

def create_pixel_watermelon():
    # 16x16 pixel grid scaled to 160x160
    grid_size = 16
    scale = 10
    img = Image.new("RGBA", (grid_size, grid_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Color palette
    RIND_DARK = (24, 94, 38, 255)
    RIND_LIGHT = (52, 168, 77, 255)
    WHITE_RIND = (220, 245, 225, 255)
    FLESH_RED = (235, 45, 75, 255)
    FLESH_DARK = (195, 25, 55, 255)
    SEED = (30, 20, 25, 255)
    EYE_WHITE = (255, 255, 255, 255)
    EYE_BLACK = (20, 20, 20, 255)
    CHEEK = (255, 120, 150, 255)

    # Pixel layout for a cute triangular watermelon slice character
    # Rows 0..15, Cols 0..15
    pixels = [
        # (x, y, color)
        # Rind arc at bottom
        (2,12, RIND_DARK), (3,13, RIND_DARK), (4,14, RIND_DARK), (5,14, RIND_DARK),
        (6,14, RIND_DARK), (7,14, RIND_DARK), (8,14, RIND_DARK), (9,14, RIND_DARK),
        (10,14, RIND_DARK), (11,13, RIND_DARK), (12,12, RIND_DARK),

        (3,12, RIND_LIGHT), (4,13, RIND_LIGHT), (5,13, RIND_LIGHT), (6,13, RIND_LIGHT),
        (7,13, RIND_LIGHT), (8,13, RIND_LIGHT), (9,13, RIND_LIGHT), (10,13, RIND_LIGHT), (11,12, RIND_LIGHT),

        # White inner rind
        (3,11, WHITE_RIND), (4,12, WHITE_RIND), (5,12, WHITE_RIND), (6,12, WHITE_RIND),
        (7,12, WHITE_RIND), (8,12, WHITE_RIND), (9,12, WHITE_RIND), (10,12, WHITE_RIND), (11,11, WHITE_RIND),

        # Red flesh pyramid
        (7,2, FLESH_RED), (8,2, FLESH_RED),
        (6,3, FLESH_RED), (7,3, FLESH_RED), (8,3, FLESH_RED), (9,3, FLESH_RED),
        (6,4, FLESH_RED), (7,4, FLESH_RED), (8,4, FLESH_RED), (9,4, FLESH_RED),
        (5,5, FLESH_RED), (6,5, FLESH_RED), (7,5, FLESH_RED), (8,5, FLESH_RED), (9,5, FLESH_RED), (10,5, FLESH_RED),
        (5,6, FLESH_RED), (6,6, FLESH_RED), (7,6, FLESH_RED), (8,6, FLESH_RED), (9,6, FLESH_RED), (10,6, FLESH_RED),
        (4,7, FLESH_RED), (5,7, FLESH_RED), (6,7, FLESH_RED), (7,7, FLESH_RED), (8,7, FLESH_RED), (9,7, FLESH_RED), (10,7, FLESH_RED), (11,7, FLESH_RED),
        (4,8, FLESH_RED), (5,8, FLESH_RED), (6,8, FLESH_RED), (7,8, FLESH_RED), (8,8, FLESH_RED), (9,8, FLESH_RED), (10,8, FLESH_RED), (11,8, FLESH_RED),
        (3,9, FLESH_RED), (4,9, FLESH_RED), (5,9, FLESH_RED), (6,9, FLESH_RED), (7,9, FLESH_RED), (8,9, FLESH_RED), (9,9, FLESH_RED), (10,9, FLESH_RED), (11,9, FLESH_RED), (12,9, FLESH_RED),
        (3,10, FLESH_RED), (4,10, FLESH_RED), (5,10, FLESH_RED), (6,10, FLESH_RED), (7,10, FLESH_RED), (8,10, FLESH_RED), (9,10, FLESH_RED), (10,10, FLESH_RED), (11,10, FLESH_RED), (12,10, FLESH_RED),

        # Watermelon seeds
        (5,4, SEED), (10,4, SEED),
        (7,5, SEED), (8,5, SEED),
        (4,9, SEED), (11,9, SEED),

        # Big Cute Pixel Eyes
        (5,7, EYE_WHITE), (6,7, EYE_WHITE), (9,7, EYE_WHITE), (10,7, EYE_WHITE),
        (5,8, EYE_WHITE), (6,8, EYE_BLACK), (9,8, EYE_WHITE), (10,8, EYE_BLACK),

        # Cheeks
        (4,8, CHEEK), (11,8, CHEEK),

        # Mouth
        (7,8, EYE_BLACK), (8,8, EYE_BLACK)
    ]

    for x, y, col in pixels:
        img.putpixel((x, y), col)

    # Scale up with nearest neighbor
    img_scaled = img.resize((grid_size * scale, grid_size * scale), Image.NEAREST)
    img_scaled.save("./assets/images/watermelon_slice.png")
    print("✓ Created watermelon_slice.png")

    # Splat version (flattened / burst seeds)
    splat = img.copy()
    draw_splat = ImageDraw.Draw(splat)
    # add random red splats
    splat_pixels = [
        (1, 10, FLESH_RED), (0, 11, FLESH_RED), (2, 13, FLESH_RED),
        (13, 10, FLESH_RED), (14, 11, FLESH_RED), (15, 12, FLESH_RED),
        (7, 0, FLESH_RED), (8, 0, FLESH_RED), (6, 1, SEED), (9, 1, SEED)
    ]
    for x, y, col in splat_pixels:
        splat.putpixel((x, y), col)
    
    splat_scaled = splat.resize((grid_size * scale, grid_size * scale), Image.NEAREST)
    splat_scaled.save("./assets/images/watermelon_slice_splat.png")
    print("✓ Created watermelon_slice_splat.png")

if __name__ == "__main__":
    create_pixel_watermelon()
