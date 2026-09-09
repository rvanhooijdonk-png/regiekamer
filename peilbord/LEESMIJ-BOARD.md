# peilbord/index.html — NIET met de hand herschrijven

`index.html` in deze map is een **vast sjabloon**. Het bevat geen cijfers, geen namen, geen
taken — alleen presentatie. Alle inhoud komt op leestijd uit `../regiekamer.json`.

## Wat BOARD wél doet

Één ding, elke tik:

```bash
bin/bouw-regiekamer-nu          # schrijft regiekamer.json
git add regiekamer.json
git commit -m "regiekamer: realtime beeld bijgewerkt (<ISO-tijd>)"
git push
```

Dat is de hele opdracht. Verandert de werkelijkheid, dan verandert het bord vanzelf — de
pagina haalt de JSON elke 60 s opnieuw op.

## Wat BOARD niet doet

- `index.html` niet openen, niet aanvullen, niet opnieuw genereren, geen "tik"-commits erop.
- Geen tekst, tabel of sectie hard in de HTML zetten. Staat iets niet op het bord terwijl het
  er wel op hoort, dan ontbreekt het **veld in de JSON** — dat is de plek om het te repareren.

**Grond:** tussen 2026-09-05 en 2026-09-09 is dit bestand 68 keer met de hand herschreven.
Het groeide naar 53 KB waarvan 36% opgeloste geschiedenis, terwijl de vier secties over
lopend werk (openstaand werk, parallelle sporen, alarmen, post-autocoding) leeg bleven. De
goed opgebouwde `regiekamer.json` — met herkomst, classificatie en NO_DATA-discipline — werd
door de pagina nooit geladen. Een presentatielaag die elke tik opnieuw wordt geschreven
drijft af; een sjabloon dat een gegevensbron leest niet.

## Nieuw veld op het bord

Voeg het eerst toe aan `regiekamer.json` (in `bin/bouw-regiekamer-nu`), en pas daarna aan
het sjabloon. Nooit andersom, en nooit alleen in de HTML.

## Wat het bord bewust niet toont

- Afgeronde taken en opgeloste problemen — die horen in een rapport, niet op een peilbord.
- Tijdschattingen: 86% van de taken heeft er geen, dus een tijdkolom zou grotendeels
  verzonnen zijn.
- Elk veld waarvoor de JSON `NO_DATA` meldt — liever een lege plek dan een verzonnen cijfer.
