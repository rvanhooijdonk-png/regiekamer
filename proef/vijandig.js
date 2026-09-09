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
  }, (uit) => !uit.includes('fixture-besluit-drie-onparseerbaar')
      ? 'de onleesbare beslisregel verdween van het bord'
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
  }, (uit) => !uit.includes('fixture-besluit-drie-onparseerbaar')
      ? 'de onleesbare beslisregel verdween naast de geldige rij'
      : !uit.includes('geldig besluit') ? 'de geldige rij ging verloren'
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
  }, (uit) => !uit.includes('fixture-onleesbaar-EEN')
      ? 'de eerste onleesbare regel verdween'
      : !uit.includes('fixture-onleesbaar-TWEE')
        ? 'alleen de eerste onleesbare regel werd getoond — de rest verdween stil'
      : (uit.match(/ONLEESBAAR/g) || []).length < 2
        ? 'niet elke onleesbare regel kreeg zijn eigen markering'
      : !/jij beslist <b>2<\/b>/.test(uit)
        ? 'de teller telde niet beide onleesbare regels' : null],
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

async function keur(naam, data, extraKeuring) {
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
    new Function('document', 'fetch', 'setInterval', script)(
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
  if (/NaN/.test(uit)) problemen.push('NaN op het bord');
  if (/undefined/.test(uit)) problemen.push('undefined op het bord');
  if (/width:\s*(?!\d)/.test(uit)) problemen.push('balkbreedte is geen getal');
  // Sommige gevallen hebben een eigen, geval-specifieke eis bovenop de algemene.
  if (extraKeuring) { const extra = extraKeuring(uit); if (extra) problemen.push(extra); }
  if (problemen.length) { console.log(`  FAIL ${naam}: ${problemen.join('; ')}`); fouten++; }
  else console.log(`  PASS ${naam} (${uit.length} tekens gerenderd)`);
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
console.log(fouten ? `\nVIJANDIGE PROEF: FAIL (${fouten})` : '\nVIJANDIGE PROEF: PASS');
process.exit(fouten ? 1 : 0);
})();
