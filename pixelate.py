"""
pixelate.py — Generate pixelated avatar + favicon for Eric Alfonce's portfolio

Usage:
    python pixelate.py <your-photo.jpg>

Outputs:
    avatar.jpg      — 128×128 pixelated image (displayed in portfolio)
    favicon.png     — 32×32 pixelated favicon (shown on browser tab)

Requires:  pip install Pillow
"""

import sys
import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run:  pip install Pillow")
    sys.exit(1)


def pixelate(img: Image.Image, pixel_size: int) -> Image.Image:
    """Down-sample then up-scale to create visible pixel blocks."""
    w, h = img.size
    small = img.resize(
        (max(1, w // pixel_size), max(1, h // pixel_size)),
        Image.NEAREST
    )
    return small.resize((w, h), Image.NEAREST)


def crop_square(img: Image.Image) -> Image.Image:
    """Centre-crop the image to a square."""
    w, h = img.size
    side = min(w, h)
    left  = (w - side) // 2
    top   = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    src_path = Path(sys.argv[1])
    if not src_path.exists():
        print(f"ERROR: File not found — {src_path}")
        sys.exit(1)

    out_dir = src_path.parent

    print(f"Loading  : {src_path}")
    img = Image.open(src_path).convert("RGB")

    # ── Square crop ──────────────────────────────────────────────
    img = crop_square(img)
    print(f"Cropped  : {img.size[0]}×{img.size[1]} square")

    # ── avatar.jpg (128×128, pixel block = 8px → 16×16 grid) ────
    avatar_size = 128
    avatar_px   = 8
    avatar = img.resize((avatar_size, avatar_size), Image.LANCZOS)
    avatar = pixelate(avatar, avatar_px)
    avatar_path = out_dir / "avatar.jpg"
    avatar.save(avatar_path, "JPEG", quality=95)
    print(f"Saved    : {avatar_path}  ({avatar_size}×{avatar_size}, {avatar_px}px blocks)")

    # ── favicon.png (32×32, pixel block = 4px → 8×8 grid) ───────
    fav_size = 32
    fav_px   = 4
    fav = img.resize((fav_size, fav_size), Image.LANCZOS)
    fav = pixelate(fav, fav_px)
    fav_path = out_dir / "favicon.png"
    fav.save(fav_path, "PNG")
    print(f"Saved    : {fav_path}  ({fav_size}×{fav_size}, {fav_px}px blocks)")

    # ── favicon-96.png (96×96 for high-DPI) ─────────────────────
    hi_size = 96
    hi_px   = 8
    hi = img.resize((hi_size, hi_size), Image.LANCZOS)
    hi = pixelate(hi, hi_px)
    hi_path = out_dir / "favicon-96.png"
    hi.save(hi_path, "PNG")
    print(f"Saved    : {hi_path}  ({hi_size}×{hi_size}, high-DPI)")

    print("\nDone! Drop avatar.jpg and favicon.png into your portfolio folder.")
    print("Open index.html -- your pixelated face will appear automatically.")


if __name__ == "__main__":
    main()
