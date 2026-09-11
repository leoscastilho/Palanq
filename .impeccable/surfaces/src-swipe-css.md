---
version: 1
slug: "src-swipe-css"
primary_target: "src/swipe.css"
related_targets: ["src/swipe.js","src/swipe.html"]
---

# Palanq — tela de cartões (index.html)

Scope: the card screen (opening, cards, result, candidate sheet) built from src/swipe.css, src/swipe.js, src/swipe.html, shared footer. Mode: Operate (the visitor answers ~10–25 questions and reads a ranking).
Audience: Brazilian voters on a phone, 2026 presidential election. Job: answer one theme per card, understand the "inegociável" cost, read the result honestly (silence ≠ agreement).
Constraints: zero network requests (CSP default-src 'none'), single self-contained HTML, no framework, pt-BR copy untouched, all five actions and hold-to-confirm gestures preserved, no vote recommendation.
User-pinned direction: Tinder canon, executed straight (user named it). Products this sits beside: Tinder (web + app), Bumble. Their craft is the bar.

## Direction contract

THESIS: Answering is swiping. The card is the whole object — full-bleed theme color like a Tinder photo, question as the "bio" — and the five round actions float over its base. Refuses the editorial-paper questionnaire (cream ground, thin rules, boxed alerts).

OWN-WORLD: White / near-black ground; brand gradient coral→pink (#fd267a→#ff6036) on wordmark, progress, primary button, leader ring; action colors red #fd5068 (Discordo), green (Concordo), blue (Inegociável), gray (Não opinar). Card = OKLCH-tinted vertical gradient per theme hue, white type, 24px radius, soft offset shadow. Figtree variable, embedded. Round action buttons with colored icons that fill on press. Stamps LIKE/NOPE-style rotated uppercase.

STORY: "This is fast and playful, but it is counting my actual positions" → swipes with confidence → reads a ranking that shows silence as hatched, taps a name to see the quote.

FIRST VIEWPORT (phone): top bar 44px (wordmark, gradient progress, "faltam N", theme toggle); card fills remaining height minus 120px; action row overlaps card bottom by half a button; inegociável legend + "segure para encerrar" beneath. Desktop: same column, max 480px, centered.

FORM: Tinder canon (standing exit, user-pinned); no roll run. Signature interaction: drag with rotation, stamp fades in, back card scales up as the top card flies; button taps replay the same flight. Motion grammar: exponential ease-out, 280–360ms, reduced-motion honored.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
