"""Strip existing section-marquee blocks then re-run perkify."""
import re
from pathlib import Path

base = Path("/home/user/workspace/techspian_v2")
pages = ["about", "approach", "capabilities", "industries", "work"]

# Strip existing section-marquee divs
pattern = re.compile(
    r'\n?<div class="section-marquee section-marquee--(?:ink|lime|white)"[^>]*>\s*'
    r'<div class="marquee-track">.*?</div>\s*</div>\n?',
    re.DOTALL,
)

for name in pages:
    p = base / f"{name}.html"
    html = p.read_text()
    before = html.count('section-marquee')
    html2 = pattern.sub('\n', html)
    after = html2.count('section-marquee')
    p.write_text(html2)
    print(f"  {name}: stripped {before} -> {after} occurrences")
