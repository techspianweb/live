"""Inject Perk-style section marquees + sticky scroll into subpages.

Strategy:
- Insert alternating colored marquee dividers (ink, lime, white) between consecutive <section> tags
- Each marquee uses page-specific phrases
- Keep all existing content intact
"""
import re
import sys
from pathlib import Path

# Razor-sharp, content-mapped phrases pulled from each page's actual story.
PAGE_PHRASES = {
    "about": [
        # Why travel, why us
        ("AI-native before it was a slide", "Founded 2020 · Pune · Toronto", "Travel-only · always"),
        # Depth, organized (their five practices)
        ("AI · Distribution · Platform", "Revenue · Product", "Five practices · one team"),
        # Outcomes
        ("Outcomes over outputs", "100+ projects shipped", "10+ countries served"),
    ],
    "approach": [
        # Four steps
        ("Discover · Design · Build · Operate", "One team · zero handoffs", "The thesis is ours to defend"),
        # AI-native engineering posture
        ("Built for agents from day one", "Eval suites before launch", "Guardrails · not guesswork"),
        # Operate
        ("Ship in weeks · operate for years", "SLOs we sign for", "On-call from day one"),
    ],
    "capabilities": [
        # Three disciplines
        ("Strategy · Engineering · Operations", "Diagnose and deliver", "One accountable team"),
        # The deep stack
        ("NDC · EDIFACT · Offer-and-Order", "PSP · PCI · fraud", "Where travel actually breaks"),
        # AI-native engineering
        ("LLM eval suites", "RAG · agents · caching", "Production AI for travel commerce"),
    ],
    "industries": [
        # The six verticals (matches actual page sections)
        ("OTAs · Distribution · Destination", "Event Tech · Mobility · Loyalty", "Six verticals · one obsession"),
        # Hard problems (from H3s on page)
        ("Look-to-book at AI scale", "NDC migration, lived", "Capacity that actually sells"),
        # The operating reality
        ("Earn · burn · breakage", "One attendee record", "Multimodal in real time"),
    ],
    "work": [
        # Proof claims
        ("Proof, measured in production", "Outcomes · not adjectives", "Confirmed before publication"),
        # Actual scale signals
        ("40M+ users served", "14,000 agencies powered", "100+ projects shipped"),
        # Themes
        ("Legacy → AI-native", "Boardroom → live release", "Your numbers, moved in production"),
    ],
}

VARIANTS = ["ink", "lime", "white"]

def build_marquee(phrases, variant):
    spans = []
    # repeat the phrases twice so the marquee track has 50% overflow for seamless loop
    for _ in range(2):
        for i, phrase in enumerate(phrases):
            spans.append(f"<span>{phrase}</span>")
            spans.append('<span class="dot">+</span>')
    track = "".join(spans)
    return (
        f'<div class="section-marquee section-marquee--{variant}" aria-hidden="true">\n'
        f'  <div class="marquee-track">{track}</div>\n'
        f'</div>\n'
    )

def perkify(html_path: Path, page_name: str):
    html = html_path.read_text()
    phrases = PAGE_PHRASES[page_name]

    # Find all <section opening tags
    # We want to insert marquee dividers BETWEEN sections (after </section> and before next <section>)
    # except: skip inserting before the first section (which is the hero) and after the last (cta-band)

    # Strategy: find all </section> followed by whitespace then <section, insert between
    # Match </section> ... (optional whitespace + comments) ... <section
    section_close_open = re.compile(r'(</section>)(\s*(?:<!--.*?-->\s*)?)(<section\b)', re.DOTALL)
    matches = list(section_close_open.finditer(html))

    # We want to insert dividers between middle sections only (skip first transition into nav-following hero start, and skip into the final cta-band)
    # matches[0] = transition from hero -> section 2 (insert marquee #1)
    # matches[-1] = transition from last regular section -> cta-band (skip — keep cta-band clean)
    # So inject before all matches except the last one.

    # Build replacements from the end so offsets don't shift
    out = html
    inject_count = min(3, max(0, len(matches) - 1))
    if inject_count == 0:
        print(f"  {page_name}: no transitions to inject")
        return

    # Inject into the FIRST `inject_count` transitions (skip last)
    to_inject = matches[:inject_count]
    # process from end so string offsets remain valid
    for i, m in enumerate(reversed(to_inject)):
        variant = VARIANTS[(inject_count - 1 - i) % len(VARIANTS)]
        phrase_group = phrases[(inject_count - 1 - i) % len(phrases)]
        marquee = build_marquee(phrase_group, variant)
        # Insert AFTER </section> closing tag, before the whitespace + next <section>
        start, end = m.start(1), m.end(1)
        # Build: </section>\n<marquee>\n<whitespace><section
        out = out[:end] + "\n" + marquee + out[end:]

    html_path.write_text(out)
    print(f"  {page_name}: injected {inject_count} marquee dividers")

if __name__ == "__main__":
    base = Path("/home/user/workspace/techspian_v2")
    for name in ["about", "approach", "capabilities", "industries", "work"]:
        perkify(base / f"{name}.html", name)
