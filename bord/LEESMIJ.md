# /bord/ — het vaste bord

Dit is een byte-identieke kopie van `peilbord/index.html`: hetzelfde sjabloon, dat
`regiekamer.json` op leestijd leest.

**Waarom het hier apart staat.** `peilbord/index.html` wordt door de BOARD-sessie
gemiddeld elke 14,9 minuten met de hand overschreven — gemeten op 2026-09-09, met de
instructie in `peilbord/LEESMIJ-BOARD.md` 16 keer genegeerd op één dag. Dit pad raakt
BOARD niet aan, dus deze URL blijft staan:

    https://rvanhooijdonk-png.github.io/regiekamer/bord/

**Niet met de hand bewerken.** Ontbreekt er een veld op het bord, dan repareer je
`~/Stack-Director/bin/regiekamer-generator` — die is de enige plek waar velden ontstaan.
De HTML is een sjabloon, geen pagina.
