# peilbord/index.html — NIET met de hand herschrijven

`index.html` in deze map is een **vast sjabloon**. Het bevat geen cijfers, geen namen, geen
taken — alleen presentatie. Alle inhoud komt op leestijd uit `../regiekamer.json`.

## Wat BOARD op deze repo moet doen: niets

Dit is de belangrijkste regel en hij is gemeten, niet bedacht. `regiekamer.json` wordt
**automatisch** geschreven en gepusht door een launchd-job:

| Job | Interval | Wat het draait | Wat het schrijft |
|---|---|---|---|
| `com.rvh.regiekamer-generator` | 300 s | `Stack-Director/bin/regiekamer-runner` → `bin/regiekamer-generator` | `regiekamer.json`, `index.html`, `stack-ticker/` — en commit + pusht ze zelf |
| `com.rvh.regiekamer-nu` | 60 s | `bin/bouw-regiekamer-nu` | alleen `nu/index.html`; doet géén git |

De commits `regiekamer: realtime beeld bijgewerkt (<ISO>)` komen van die runner, niet van een
mens en niet van BOARD. Er is dus **geen tik-handeling** meer nodig om het bord bij te werken.
Verandert de werkelijkheid, dan verandert het bord vanzelf: de pagina haalt de JSON elke 60 s
opnieuw op.

## Wat BOARD niet doet

- `index.html` niet openen, niet aanvullen, niet opnieuw genereren, **geen `peilbord: tik HH:MM`
  commits erop**. Dat is de enige soort commit die BOARD op dit bestand nog maakte, en het is
  precies de soort die moet stoppen.
- Geen tekst, tabel of sectie hard in de HTML zetten. Staat iets niet op het bord terwijl het
  er wel op hoort, dan ontbreekt het **veld in de JSON**.

**Grond:** tussen 2026-09-05 en 2026-09-09 is dit bestand met de hand herschreven tot 67 KB,
waarvan een groot deel opgeloste geschiedenis, terwijl de secties over lopend werk leeg bleven.
Het sjabloon dat dit verving werd binnen enkele tikken opnieuw overschreven (17 KB → 67 KB).
Een presentatielaag die elke tik opnieuw wordt geschreven drijft af; een sjabloon dat een
gegevensbron leest niet. De bestandsgrootte is de controle: **±30 KB = sjabloon, 50 KB+ = handwerk.**

## Nieuw veld op het bord

Voeg het eerst toe aan `Stack-Director/bin/regiekamer-generator` (dus aan de JSON), draai
`governance/test_regiekamer_generator.sh`, en pas daarna het sjabloon aan. Nooit andersom,
en nooit alleen in de HTML.

## Wat het bord toont, en wat bewust niet

Toont wel:

- **Hoe staat de stack ervoor** — één oordeel (POSITIEF/GEMENGD/ZORGELIJK/SLECHT) met de
  losse gemeten punten eronder, elk met richting.
- **De route** — wat er tot autocoding nog moet gebeuren, per stap met receipt-voortgang, plus
  de sporen daarná uit `PROJECT_OVERZICHT.md` mét hun gemeten leeftijd.
- **Grote problemen én de oplossing die eraan hangt**, met of het is opgepakt, plus de laatste
  drie die zijn opgelost.
- **Wat er echt gebeurde** — het jongste receipt per taak, met verdict, of met de reden waarom
  een order nooit is uitgevoerd (`failure_category`).

Toont bewust niet:

- De stack-ticker. Die komt volledig van de supervisor en meldt alleen dát de lijst openstaande
  issues wijzigde; ruim 90% van de regels zijn levenstekens die zeggen dat er niets veranderde.
  Die issues staan al bij de problemen.
- Tijdschattingen op de takenlijst: ruim 80% van de taken heeft er geen, dus een tijdkolom zou
  grotendeels verzonnen zijn.
- Opgeloste problemen ouder dan de laatste drie.
- Elk veld waarvoor de JSON `NO_DATA` meldt — liever een lege plek met de bron erbij dan een
  verzonnen cijfer.
