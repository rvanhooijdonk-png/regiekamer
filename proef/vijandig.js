// Negatieve controle op de renderlaag: voer het sjabloon JSON die kwaadaardig of
// kapot is en eis dat het bord (a) niet omvalt, (b) geen HTML uit de bron doorlaat,
// (c) geen NaN/undefined toont. Elk geval hieronder komt uit een reviewbevinding.
// Het pad staat vast ten opzichte van dít bestand, niet ten opzichte van de map
// waaruit je hem start: de proef hoort bij het sjabloon en moet overal draaien.
const fs = require('fs');
const path = require('path');
const SJABLOON = path.join(__dirname, '..', 'peilbord', 'index.html');
const html = fs.readFileSync(SJABLOON, 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

const SPUIT = '"><img src=x onerror=alert(1)>';
// Precies wat het sjabloon van SPUIT hoort te maken: elk gevaarlijk teken één keer
// geëscapet, niet vaker. Bewust hier uitgeschreven en niet uit het sjabloon geleend —
// een toets die zijn verwachting uit de code haalt die hij toetst, toetst niets.
// Ronde 8, Codex: hiermee is de volledige weergegeven tekst gebonden, niet slechts
// een herkenbaar fragment ervan.
const SPUIT_ESC = '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;';

// Ronde 9, Codex: `<span hidden>${schoon(r.ruwe_regel)}</span>` bleef groen. De proef
// doorzocht de opmaak, niet wat de lezer ziet — en daarmee kwam de oorspronkelijke
// bevinding terug: de regel stond er wel, maar onzichtbaar.
//
// Ronde 10, Codex: mijn eerste antwoord daarop — de opmaak omrekenen naar zichtbare
// tekst — was een verloren wedloop. Codex mat vier manieren die er dwars doorheen
// liepen en groen bleven: visibility:hidden, een CSS-klasse, hidden="hidden", en een
// geneste lege span (de regex stopt bij de eerste sluittag). Elke reparatie van de
// benadering nodigt de volgende vorm uit. Een tekstbenadering van een browser blijft
// altijd achterlopen op de vindingrijkheid van wat ze moet betrappen.
//
// Daarom niet meer benaderen maar verbieden. Op DIT bord hoort niets onzichtbaar te
// zijn: alles wat gerenderd wordt is bedoeld om gelezen te worden, en het hele defect
// dat we bestrijden is "de informatie staat er wel maar Richard ziet haar niet". Een
// verbod op elke verbergconstructie is dus geen grofheid maar precies de eis. En anders
// dan een benadering is het niet te omzeilen door nesting of syntaxisvarianten: het
// patroon staat waar het staat, hoe je het ook inpakt.
const VERBERG_PATROON = /\shidden(?=[\s>=])|display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|font-size\s*:\s*0(?![.\d])|text-indent\s*:\s*-/i;

// De CSS-klasseroute loopt niet via de gerenderde uitvoer maar via de stylesheet, dus
// die wordt apart en eenmalig getoetst. Staat er geen enkele verbergregel in het
// sjabloon, dan bestaat de klasse waarmee verborgen zou kunnen worden simpelweg niet.
const STIJLBLOK = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

// De zichtbare tekst blijft nodig voor de andere helft van de eis: niet alleen dát de
// regel er staat, maar dat de lezer hem ongeschonden terugkrijgt. Te veel escapen laat
// hier de entiteit zien in plaats van het teken.
//
// &amp; wordt bewust als LAATSTE teruggedraaid. Anders zou "&amp;lt;" via "&lt;" alsnog
// "<" worden, en juist dat onderscheid is de hele toets: één keer escapen hoort de
// brontekst terug te geven, twee keer hoort de entiteit te tonen.
//
// Ronde 10, Codex: deze decoder is bewust onvolledig (&#60;, &#x3c; en &nbsp; blijven
// staan). Dat mag, omdat esc() in het sjabloon uitsluitend deze vijf entiteiten maakt.
// Zou het sjabloon ooit numerieke entiteiten gaan produceren, dan valt dat op doordat de
// bronvergelijking dan niet meer sluit.
function zichtbareTekst(html) {
  return String(html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

const GEVALLEN = [
  ['JSON-wortel is null', null],
  ['JSON-wortel is een lijst', [1, 2, 3]],
  ['accounts met null-gaten', { accounts: [null, 'los', { actor: 'claude1', status: 'BEZIG' }] }],
  ['HTML-injectie in elk tekstveld', {
    accounts: [{ actor: SPUIT, status: SPUIT, taak_id: SPUIT, sinds_minuten: SPUIT }],
    route: { status: 'OK', tik: SPUIT, leeftijd_seconden: SPUIT, bezig: SPUIT, huidige_stap: SPUIT,
      nu_op_de_rol: [SPUIT],
      stappen: [{ stap: SPUIT, status: SPUIT, met_receipt: SPUIT, taken_totaal: SPUIT,
                  geblokkeerd: SPUIT, laatste_activiteit: SPUIT }],
      na_autocoding: { status: 'OK', bron_pad: SPUIT, verouderd: true, leeftijd_seconden: SPUIT,
                       sporen: [{ nummer: SPUIT, spoor: SPUIT }] } },
    problemen: { status: 'OK', tik: SPUIT, open_count: SPUIT, opgelost_count: SPUIT,
      open: [{ ernst: SPUIT, opgepakt: SPUIT, probleem: SPUIT, oplossing: SPUIT }],
      opgelost_recent: [{ markering: SPUIT, probleem: SPUIT }] },
    gebeurtenissen: { status: 'OK', receipts_totaal: SPUIT,
      items: [{ tijd: SPUIT, actor: SPUIT, stap: SPUIT, taak: SPUIT, verdict: SPUIT,
                uitkomst: SPUIT, reden: SPUIT }] },
    capaciteit: { data: { meta: { receipt_bestanden_totaal: SPUIT, receipt_onparseerbaar: SPUIT },
      lanes: [{ actor: SPUIT, orders: 5, p50_duration_ms: SPUIT, geslaagd_pct: SPUIT,
                geblokkeerd_pct: SPUIT, overig_pct: SPUIT, laatste_activiteit: SPUIT }] } },
    beslisrij: { bron_pad: SPUIT, items: [{ nr: SPUIT, besluit: SPUIT, kost: SPUIT, ontgrendelt: SPUIT }] },
    werk: { status: 'OK', bezig: [{ status: SPUIT, taak: SPUIT, bewijs: SPUIT,
             loopt_seconden: SPUIT, verwacht_min: SPUIT }], open: [], klaar_recent: [] },
    taken_meta: { taken_zonder_schatting: SPUIT, taken_totaal: SPUIT },
  }],
  // Codex-bevinding 1: JSON.parse kan een object opleveren waarvan toString niet
  // aanroepbaar is. String()/Number() gooien daar een TypeError, en één throw
  // sloopt de hele render. Zowel een getalveld als een tekstveld getest.
  ['object met kapotte toString in een getalveld', {
    problemen: { status: 'OK', open_count: { toString: null }, opgelost_count: { toString: null }, open: [], opgelost_recent: [] },
    capaciteit: { data: { lanes: [{ actor: 'codex1', orders: { toString: null }, geslaagd_pct: { toString: null } }] } },
  }],
  ['object met kapotte toString in een tekstveld', {
    accounts: [{ actor: { toString: null }, status: { toString: null }, taak_id: { toString: null } }],
    gebeurtenissen: { status: 'OK', items: [{ tijd: { toString: null }, actor: { toString: null },
      taak: { toString: null }, verdict: { toString: null }, uitkomst: { toString: null } }] },
  }],
  // Codex-bevinding ronde 3: prim() laat getallen en booleans door, en Date.parse(1)
  // /new Date(true) leveren dan een echt ogende tijd op (1970/2001). Een verzonnen
  // klokstand is erger dan een streepje — een tijdstempel moet tekst zijn.
  ['tijdstempel die geen tekst is', {
    gebeurtenissen: { status: 'OK', items: [{ tijd: 1, actor: 'codex1', taak: 'T', verdict: 'GO' },
                                            { tijd: true, actor: 'codex2', taak: 'U', verdict: 'GO' }] },
    route: { status: 'OK', tik: 0, stappen: [{ stap: 'STAP1', status: 'BEZIG', laatste_activiteit: 1 }] },
  }, (uit) => /\b(00:00|01:00|02:00)\b/.test(uit) ? 'een niet-tekstuele tijdstempel werd een klokstand' : null],
  // Ronde 4, Codex: `gronden` gebruikte alleen Array.isArray, dus één null in de
  // lijst sloopte de render op g.richting.
  ['null in de grondenlijst van de analyse', {
    analyse: { status: 'OK', oordeel: 'GOED', kop: 'gaat goed', gronden: [null, 'los', { richting: 'SLECHT', punt: 'p', waarde: 'w' }] },
  }],
  // Ronde 4, Codex: de comparator las a.status rauw als objectsleutel — dezelfde
  // ToPrimitive-val als String(). Twéé accounts, anders sorteert er niets.
  ['kapotte toString in een status waarop gesorteerd wordt', {
    accounts: [{ actor: 'codex1', status: { toString: null }, sinds_minuten: 3 },
               { actor: 'codex2', status: 'BEZIG', sinds_minuten: 9 }],
  }],
  // Ronde 4, Codex: een ontbrekende beslisbron werd getoond als de geruststellende
  // conclusie "Niets dat op jou wacht." — het bord mag geen leegte concluderen uit
  // een bron die er niet is.
  ['ontbrekende beslisbron mag geen geruststelling worden', {
    beslisrij: { status: 'NO_DATA_BRON_ONTBREEKT', bron_pad: 'state/beslisrij.md' },
  }, (uit) => uit.includes('Niets dat op jou wacht')
      ? 'een ontbrekende bron werd als "niets te beslissen" gepresenteerd' : null],
  // Ronde 5, Codex: de generator geeft een onleesbare beslisregel bewust letterlijk
  // door (R2), maar het bord toonde alleen `items` — dus gooide de renderlaag weg wat
  // de generator juist bewaard had. Beide invoervormen: alleen onleesbare regels, en
  // een onleesbare regel naast geldige.
  // Ronde 6, Codex: het bestaan van de regel was gebonden, maar drie eigenschappen
  // ervan niet — de ONLEESBAAR-markering, de telling, en de escaping van de ruwe
  // tekst. Alle drie konden weggemuteerd worden terwijl de proef groen bleef. De
  // ruwe regel draagt daarom nu de injectiespuit: hij komt uit een markdownbestand
  // en is dus de enige plek waar bronbytes ongefilterd het bord in zouden lopen.
  ['onleesbare beslisregel als enige inhoud', {
    beslisrij: { status: 'OK', bron_pad: 'state/PROJECT_OVERZICHT.md', items: [],
      onparseerbaar_count: 1,
      onparseerbare_regels: [{ categorie: 'ONPARSEERBAAR', ruwe_regel: `| 3 | fixture-besluit-drie-onparseerbaar ${SPUIT}` }] },
  }, (uit, zichtbaar) => !uit.includes(`| 3 | fixture-besluit-drie-onparseerbaar ${SPUIT_ESC}`)
      ? 'de onleesbare regeltekst kwam niet volledig en correct geëscapet op het bord'
      : !zichtbaar.includes(`| 3 | fixture-besluit-drie-onparseerbaar ${SPUIT}`)
        ? 'de regel staat wel in de opmaak maar de lezer krijgt hem niet ongeschonden te zien'
      : uit.includes('Niets dat op jou wacht')
        ? 'een onleesbare beslisregel werd gepresenteerd als niets te beslissen'
      : !uit.includes('ONLEESBAAR')
        ? 'de regel werd getoond zonder de ONLEESBAAR-markering — onleesbaar las als een echt besluit'
      : !/jij beslist <b>1<\/b>/.test(uit)
        ? 'de onleesbare regel telde niet mee in "jij beslist"' : null],
  ['onleesbare beslisregel naast een geldige', {
    beslisrij: { status: 'OK', bron_pad: 'state/PROJECT_OVERZICHT.md',
      items: [{ nr: '1', besluit: 'geldig besluit', kost: '2 u', ontgrendelt: 'X' }],
      onparseerbaar_count: 1,
      onparseerbare_regels: [{ categorie: 'ONPARSEERBAAR', ruwe_regel: `| 3 | fixture-besluit-drie-onparseerbaar ${SPUIT}` }] },
  }, (uit, zichtbaar) => !uit.includes(`| 3 | fixture-besluit-drie-onparseerbaar ${SPUIT_ESC}`)
      ? 'de onleesbare regeltekst kwam niet volledig en correct geëscapet naast de geldige rij'
      : !zichtbaar.includes(`| 3 | fixture-besluit-drie-onparseerbaar ${SPUIT}`)
        ? 'de onleesbare regel staat wel in de opmaak maar is voor de lezer niet zichtbaar'
      : !zichtbaar.includes('geldig besluit') ? 'de geldige rij ging verloren'
      : !uit.includes('ONLEESBAAR')
        ? 'de regel werd getoond zonder de ONLEESBAAR-markering'
      : !/jij beslist <b>2<\/b>/.test(uit)
        ? 'de teller telde de geldige en de onleesbare rij niet samen op' : null],
  // Ronde 7, Codex: met één onleesbare regel per geval bleef "toon alleen de eerste"
  // groen. Een tweede regel is nodig om de lus zelf te binden — anders kan een
  // slice(0,1) ongemerkt de rest van de onleesbare besluiten laten verdwijnen, wat
  // precies de oorspronkelijke bevinding terugbrengt voor alles ná de eerste.
  ['twee onleesbare beslisregels', {
    beslisrij: { status: 'OK', bron_pad: 'state/PROJECT_OVERZICHT.md', items: [],
      onparseerbaar_count: 2,
      onparseerbare_regels: [
        { categorie: 'ONPARSEERBAAR', ruwe_regel: '| 3 | fixture-onleesbaar-EEN' },
        { categorie: 'ONPARSEERBAAR', ruwe_regel: `| 4 | fixture-onleesbaar-TWEE ${SPUIT}` }] },
  }, (uit, zichtbaar) => !uit.includes('| 3 | fixture-onleesbaar-EEN')
      ? 'de eerste onleesbare regel verdween of werd niet volledig getoond'
      : !uit.includes(`| 4 | fixture-onleesbaar-TWEE ${SPUIT_ESC}`)
        ? 'alleen de eerste onleesbare regel werd getoond — de rest verdween stil, of kwam niet volledig geëscapet door'
      : !zichtbaar.includes('| 3 | fixture-onleesbaar-EEN')
        || !zichtbaar.includes(`| 4 | fixture-onleesbaar-TWEE ${SPUIT}`)
        ? 'niet elke onleesbare regel is voor de lezer zichtbaar'
      : (uit.match(/ONLEESBAAR/g) || []).length < 2
        ? 'niet elke onleesbare regel kreeg zijn eigen markering'
      : !/jij beslist <b>2<\/b>/.test(uit)
        ? 'de teller telde niet beide onleesbare regels' : null],
  // Ronde 9, Codex + eigen meting: het algemene entiteitenverbod sloeg vals positief op
  // een bronregel die zélf "&lt;" bevat — correct één keer escapen maakt daar "&amp;lt;"
  // van, en dat werd afgekeurd. Een toets die goed gedrag afkeurt is erger dan geen
  // toets: hij dwingt een latere bouwer de escaping te breken om groen te worden. Dit
  // geval legt de goede kant vast, zodat die vals-positief niet stilletjes terug kan
  // komen; het blijft rood bij dubbel escapen, want dan leest er "&amp;lt;" op het bord.
  ['onleesbare regel met een letterlijke entiteit in de brontekst', {
    beslisrij: { status: 'OK', bron_pad: 'state/PROJECT_OVERZICHT.md', items: [],
      onparseerbaar_count: 1,
      onparseerbare_regels: [{ categorie: 'ONPARSEERBAAR', ruwe_regel: '| 3 | bron bevat letterlijk &lt; en &amp; als tekst' }] },
  }, (uit, zichtbaar) => !zichtbaar.includes('| 3 | bron bevat letterlijk &lt; en &amp; als tekst')
      ? 'de lezer krijgt de brontekst niet terug zoals hij in de bron stond'
      : !uit.includes('ONLEESBAAR')
        ? 'de regel werd getoond zonder de ONLEESBAAR-markering'
      : !/jij beslist <b>1<\/b>/.test(uit)
        ? 'de regel telde niet mee in "jij beslist"' : null],
  // Ronde 4, Gemini: prim() liet booleans door, dus Number(true)===1 maakte van een
  // boolean in een getalveld een echte duur ("<1 min" i.p.v. een streepje).
  ['boolean in een getalveld', {
    werk: { status: 'OK', bezig: [{ status: 'BEZIG', taak: 'T', bewijs: 'b', loopt_seconden: true, verwacht_min: true }], open: [], klaar_recent: [] },
  }, (uit) => /<1 min|1 min\b/.test(uit) ? 'een boolean werd als duur getoond' : null],
  ['percentages als tekst', {
    capaciteit: { data: { lanes: [{ actor: 'codex1', orders: '7', geslaagd_pct: '80',
      geblokkeerd_pct: 'tien', overig_pct: null, p50_duration_ms: 'lang' }] } },
    route: { status: 'OK', stappen: [{ stap: 'STAP1', status: 'BEZIG',
      met_receipt: '4', taken_totaal: '0', geblokkeerd: 'twee' }] },
  }],
];

let fouten = 0;
const tik = () => new Promise(r => setTimeout(r, 20));

async function keur(naam, data, extraKeuring, scriptOverride, stil) {
  // Ronde 10: het sjabloonscript is normaal het echte script; de negatieve controle
  // geeft er een opzettelijk verminkte versie voor in de plaats.
  const draaiScript = scriptOverride || script;
  const nodes = {};
  class Node {
    constructor() { this._html = ''; this._text = ''; this.className = ''; }
    set innerHTML(v) { this._html = v; } get innerHTML() { return this._html; }
    set textContent(v) { this._text = v; } get textContent() { return this._text; }
    addEventListener() {} remove() {}
    get parentElement() { return { remove() {} }; }
  }
  for (const id of ['lamp', 'versheid', 'tellers', 'main', 'voet', 'laadmelding']) nodes[id] = new Node();
  const omgeving = {
    document: { getElementById: (id) => nodes[id] || null },
    fetch: async () => ({ ok: true, status: 200, json: async () => data }),
    setInterval: () => 0,
  };
  try {
    new Function('document', 'fetch', 'setInterval', draaiScript)(
      omgeving.document, omgeving.fetch, omgeving.setInterval);
  } catch (e) {
    console.log(`  FAIL ${naam}: sjabloon wierp ${e.message}`); fouten++; return;
  }
  await tik();  // laad() is async — zonder wachten meet de proef een leeg bord
  const uit = nodes.main.innerHTML + nodes.tellers.innerHTML + nodes.voet.innerHTML;
  const problemen = [];
  if (!uit.length) problemen.push('er is niets gerenderd — de proef zou niets bewijzen');
  if (/class="fout"/.test(nodes.main.innerHTML)) problemen.push('render viel terug op de foutmelding');
  if (uit.includes('<img src=x')) problemen.push('HTML uit de bron kwam ongefilterd door');
  // Ronde 8: te wéinig escapen is een lek, te váák escapen is bederf — bij dubbele
  // escaping leest de lezer "&lt;img" waar de bron "<img" had staan.
  //
  // Ronde 9, Codex + eigen meting: de controle die hier stond ("nergens &amp;lt;")
  // was ONJUIST en is verwijderd. Een bronregel die zelf de tekst "&lt;" bevat wordt
  // correct tot "&amp;lt;" geëscapet, en werd dan afgekeurd terwijl het bord klopte.
  // De juiste toets is bronafhankelijk en staat nu per geval hieronder: wat de lezer
  // ziet moet gelijk zijn aan wat er in de bron stond — niet meer en niet minder.
  // Te weinig escapen valt op door de injectiecontrole hierboven, te veel escapen
  // doordat de zichtbare tekst dan de entiteit toont in plaats van het teken.
  const zichtbaar = zichtbareTekst(uit);
  // Ronde 10: het verbod, niet de benadering. Zie de toelichting bij VERBERG_PATROON.
  if (VERBERG_PATROON.test(uit))
    problemen.push('er wordt iets verborgen in de uitvoer — op dit bord hoort niets onzichtbaar te zijn');
  if (/NaN/.test(uit)) problemen.push('NaN op het bord');
  if (/undefined/.test(uit)) problemen.push('undefined op het bord');
  if (/width:\s*(?!\d)/.test(uit)) problemen.push('balkbreedte is geen getal');
  // Sommige gevallen hebben een eigen, geval-specifieke eis bovenop de algemene.
  if (extraKeuring) { const extra = extraKeuring(uit, zichtbaar); if (extra) problemen.push(extra); }
  // De negatieve controle hieronder draait keur() opzettelijk op een verminkt sjabloon
  // en moet dan een afkeuring zien. Die run mag niet meetellen als echte fout en niet
  // meepraten in het verslag — vandaar stil, met de uitslag als returnwaarde.
  if (stil) return problemen.length === 0;
  if (problemen.length) { console.log(`  FAIL ${naam}: ${problemen.join('; ')}`); fouten++; }
  else console.log(`  PASS ${naam} (${uit.length} tekens gerenderd)`);
  return problemen.length === 0;
}

(async () => {
console.log('== Vijandige rendercontrole ==');
for (const [naam, data, extra] of GEVALLEN) await keur(naam, data, extra);
// de laadfout moet oude cijfers wegvegen, niet laten staan
{
  const nodes = {};
  class Node {
    constructor() { this._html = 'OUD'; this._text = 'OUD'; this.className = ''; }
    set innerHTML(v) { this._html = v; } get innerHTML() { return this._html; }
    set textContent(v) { this._text = v; } get textContent() { return this._text; }
    addEventListener() {} get parentElement() { return { remove() {} }; }
  }
  for (const id of ['lamp', 'versheid', 'tellers', 'main', 'voet', 'laadmelding']) nodes[id] = new Node();
  new Function('document', 'fetch', 'setInterval', script)(
    { getElementById: (id) => nodes[id] || null },
    async () => { throw new Error('netwerk weg'); }, () => 0);
  await tik();
  const blijft = ['tellers', 'voet'].filter(id => nodes[id].innerHTML === 'OUD');
  if (blijft.length) { console.log(`  FAIL laadfout: ${blijft.join(', ')} bleef op oude data staan`); fouten++; }
  else console.log('  PASS laadfout wist tellers en voetnoot');
}
// Ronde 10, Codex: de stylesheet is de enige verbergroute die niet door de gerenderde
// uitvoer loopt. Codex' mutant met een klasse die display:none zet bleef daardoor groen.
// Bestaat er geen enkele verbergregel, dan bestaat de klasse om mee te verbergen niet.
{
  const verbergregels = STIJLBLOK.split('\n')
    .map((r, i) => [i + 1, r])
    .filter(([, r]) => /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|font-size\s*:\s*0(?![.\d])|text-indent\s*:\s*-/i.test(r));
  if (verbergregels.length) {
    console.log(`  FAIL stylesheet: ${verbergregels.length} verbergregel(s), o.a. regel ${verbergregels[0][0]}: ${verbergregels[0][1].trim()}`);
    console.log('        Op dit bord hoort niets onzichtbaar te zijn. Is dit bewust, dan moet de');
    console.log('        proef eerst leren de CSS door te rekenen — anders dekt hij het niet meer.');
    fouten++;
  } else console.log('  PASS stylesheet bevat geen enkele verbergregel');
}

// NEGATIEVE CONTROLE (ronde 10, Codex punt d).
// Codex verving alle zichtbaarheidseisen door `false` en de proef bleef groen op 17
// gevallen — óók met de verbergmutant erin. De eisen wérkten dus wel, maar niets
// bewaakte hun bestaan: wie ze weghaalt merkt niets. Dat is precies de fout die hier
// zes rondes lang terugkwam, nu toegepast op de reparatie zelf.
//
// Daarom toetst de proef zichzelf: hij verminkt het sjabloon in het geheugen op elke
// manier waarop je een regel onzichtbaar kunt maken, en eist dat hij dat afkeurt. Wie de
// bewaking sloopt, ziet deze controle rood worden.
{
  const RUW = '${schoon(r.ruwe_regel)}';
  const VERBERGVORMEN = [
    ['hidden-attribuut',        `<span hidden>${RUW}</span>`],
    ['hidden="hidden"',         `<span hidden="hidden">${RUW}</span>`],
    ['geneste lege span',       `<span hidden><span></span>${RUW}</span>`],
    ['visibility:hidden',       `<span style="visibility:hidden">${RUW}</span>`],
    ['display:none inline',     `<span style="display:none">${RUW}</span>`],
    ['display : none met spaties', `<span style="display : none">${RUW}</span>`],
    ['opacity:0',               `<span style="opacity:0">${RUW}</span>`],
  ];
  const geval = GEVALLEN.find(g => g[0] === 'onleesbare beslisregel als enige inhoud');
  const gemist = [];
  for (const [vorm, vervanging] of VERBERGVORMEN) {
    if (!script.includes(RUW)) { gemist.push(`${vorm} (ankertekst niet gevonden)`); continue; }
    const verminkt = script.replace(RUW, vervanging);
    const goedgekeurd = await keur(vorm, geval[1], geval[2], verminkt, true);
    if (goedgekeurd) gemist.push(vorm);
  }
  if (gemist.length) {
    console.log(`  FAIL negatieve controle: verborgen tekst werd goedgekeurd bij ${gemist.join(', ')}`);
    fouten++;
  } else console.log(`  PASS negatieve controle: alle ${VERBERGVORMEN.length} verbergvormen worden afgekeurd`);
}

console.log(fouten ? `\nVIJANDIGE PROEF: FAIL (${fouten})` : '\nVIJANDIGE PROEF: PASS');
process.exit(fouten ? 1 : 0);
})();
