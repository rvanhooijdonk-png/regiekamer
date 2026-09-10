# Vaste projecttabel

Deze uitbreiding genereert één echte HTML-tabel uit het bestaande rapport,
zonder de Autocoding-controller, gedeelde werkbomen of huidige live-generator
te wijzigen. Geen dependencies buiten Python 3; dezelfde inline-HTML-aanpak
als de bestaande regiekamer/nu-generator, bruikbaar vanaf schijf en GitHub Pages.
De bestaande nu-generator selecteert panelen en laat ontbrekende bronnen weg;
deze afgebakende renderer vereist juist alle 17 projecten en negen kolommen.
Geen extra tabelbibliotheek nodig: native HTML behoudt de tabel op smalle schermen.

Uit de repositoryroot:

```sh
python3 -m unittest discover -s tools/projecttoezicht -v
python3 tools/projecttoezicht/generate.py --source /pad/naar/PROJECTTOEZICHT_TABEL_LAATSTE.md --output projecttoezicht/index.html
```

Publiceer uitsluitend een op openbare inhoud gecontroleerd bronrapport.
HTML-escaping voorkomt uitvoering van broninhoud, niet publicatie van privédata.
De generator publiceert zelf niets en wijzigt de bron niet. Het gegenereerde
bestand bevat bronclaims, geen eigen verificatie; ouderdom blijft zichtbaar.
GitHub Pages draait deze Python-generator niet zelf: de bestaande bevoegde
meet-/publicatieroute moet het HTML-bestand bijwerken na een nieuwe bronmeting.
Geen automatische vijfminutencyclus of onafhankelijke review is hiermee bewezen.

Acceptatie: 17 unieke geordende IDs, vaste 9 kolommen, verplichte tijdzone,
geen toekomstige meting, geen W-codes, veilige HTML-escaping. Ongeldige invoer
faalt met exit 1 zonder de bestaande output te overschrijven. Oude pagina's
blijven hun oorspronkelijke meettijd tonen en melden na 5 minuten veroudering.

Integratievoorstel: afzonderlijke /projecttoezicht/ route in dezelfde Pages-site.
Eerst onafhankelijke review en controle van de broninhoud. Daarna toevoegen aan
de bestaande geserialiseerde publisher, met diens claim/commit/push-mechanisme.
Geen tweede publisherproces en geen aanpassing van de lopende nu-generator.
