"""Build favicon from the official Techspian brand-mark polygons.

Extracts the <polygon> elements from techspian-logo-nav.svg (which IS the
brand mark — same vector geometry that renders in the site header),
recolors them to v2 lime, and rasterizes onto a rounded ink square at
the standard favicon sizes.

Pure vector source → crisp at every size, no LANCZOS upscale blur.
"""
import os
import re
import cairosvg

SRC_SVG = "/home/user/workspace/techspian_v2/assets/techspian-logo-nav.svg"
OUT_DIR = "/home/user/workspace/techspian_v2/assets"

LIME = "#BFFF51"
INK = "#0E0E10"
PADDING_RATIO = 0.18      # padding inside the rounded square
RADIUS_RATIO = 0.22       # corner radius as fraction of size


def build_favicon_svg() -> str:
    with open(SRC_SVG) as f:
        svg = f.read()

    polygons = re.findall(r"<polygon[^>]*?>", svg)
    if not polygons:
        raise RuntimeError("No <polygon> elements found in source SVG")

    # Recolor each polygon to lime, ensure self-closing
    cleaned = []
    for poly in polygons:
        p = re.sub(r'class="[^"]*"', f'fill="{LIME}"', poly)
        if not p.endswith("/>"):
            p = p[:-1] + "/>"
        cleaned.append(p)

    # Compute bounding box of the mark from all polygon points
    xs, ys = [], []
    for poly in polygons:
        m = re.search(r'points="([^"]+)"', poly)
        nums = [float(n) for n in m.group(1).replace(",", " ").split()]
        xs.extend(nums[0::2])
        ys.extend(nums[1::2])
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    w, h = maxx - minx, maxy - miny

    inner = 100 * (1 - 2 * PADDING_RATIO)
    scale = inner / max(w, h)
    tx = (100 - w * scale) / 2 - minx * scale
    ty = (100 - h * scale) / 2 - miny * scale

    inner_svg = "\n      ".join(cleaned)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="geometricPrecision">
  <defs>
    <clipPath id="rsq"><rect x="0" y="0" width="100" height="100" rx="22" ry="22"/></clipPath>
  </defs>
  <g clip-path="url(#rsq)">
    <rect width="100" height="100" fill="{INK}"/>
    <g transform="translate({tx:.3f} {ty:.3f}) scale({scale:.6f})">
      {inner_svg}
    </g>
  </g>
</svg>'''


def main():
    svg = build_favicon_svg()
    for size, name in [
        (32, "favicon-32.png"),
        (180, "favicon-180.png"),
        (192, "favicon-192.png"),
        (512, "favicon-512.png"),
    ]:
        out = os.path.join(OUT_DIR, name)
        cairosvg.svg2png(
            bytestring=svg.encode(), output_width=size, output_height=size, write_to=out
        )
        print(f"wrote {out} ({size}x{size})")


if __name__ == "__main__":
    main()
