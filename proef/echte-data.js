// Rendert het sjabloon één keer met de ECHTE regiekamer.json en toont wat een lezer
// werkelijk op het bord ziet. Geen mock: de bron is het bestand dat de generator zojuist
// heeft weggeschreven. Bedoeld om te controleren dat de takenlijst één lijst is, dat er
// niet meer dan MAX_KLAAR afgeronde taken in staan, en dat de teksten kort zijn.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'peilbord', 'index.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/rk.json', 'utf8'));
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1];

const knopen = {};
const maak = (id) => (knopen[id] = {id, className: '', textContent: '', innerHTML: '',
  addEventListener(){}, parentElement:{remove(){}}});
['lamp','versheid','tellers','main','voet'].forEach(maak);
const document = { getElementById: (id) => knopen[id] || null };
const fetch = async () => ({ ok: true, status: 200, json: async () => data });

new Function('document', 'fetch', 'setInterval', script)(document, fetch, () => {});

setTimeout(() => {
  const uit = knopen.main.innerHTML;
  const tekst = (s) => String(s)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(tr|div|section|table)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .split('\n').map(r => r.replace(/\s+/g, ' ').trim()).filter(Boolean);

  const regels = tekst(uit);
  const start = regels.findIndex(r => /^\d+ \| ?TAKENLIJST/i.test(r) || /TAKENLIJST/i.test(r));
  const eind  = regels.findIndex((r, i) => i > start && /KANALEN — BEZET OF VRIJ/i.test(r));

  console.log('== KOPBALK ==');
  console.log('  ' + knopen.versheid.textContent);
  console.log('  ' + tekst(knopen.tellers.innerHTML).join(' · '));

  console.log('\n== DE TAKENLIJST, zoals een lezer hem ziet ==');
  regels.slice(start, eind < 0 ? regels.length : eind).forEach(r => console.log('  ' + r));

  console.log('\n== KANALEN ==');
  regels.slice(eind < 0 ? regels.length : eind).forEach(r => console.log('  ' + r));

  console.log('\n== METINGEN ==');
  // alleen de takenlijst meten, niet de kanalentabel eronder
  const lijst = (uit.split('<h2>Takenlijst</h2>')[1] || '').split('<h2>Kanalen')[0];
  const rijen = (lijst.match(/<tr class="rij-/g) || []).length;
  const fases = [...uit.matchAll(/<tr class="fase"><td colspan="5"><b>([^<]+)<\/b>/g)].map(m => m[1]);
  // de grens van MAX_KLAAR geldt de fase NET KLAAR — een route-stap die af is, is af
  // en hoort gewoon in het routeoverzicht; die valt niet onder "gerede taken tonen".
  const netKlaar = (lijst.split('<b>NET KLAAR</b>')[1] || '');
  const klaarRijen = (netKlaar.match(/<span class="pil klaar">KLAAR</g) || []).length;
  const klaarElders = (lijst.match(/<span class="pil klaar">KLAAR</g) || []).length - klaarRijen;
  const vastRijen  = (lijst.match(/<span class="pil vast">VAST</g) || []).length;
  const secties = [...uit.matchAll(/<h2>([^<]+)<\/h2>/g)].map(m => m[1]);
  console.log('  secties op het bord      :', secties.length, '→', secties.join(' · '));
  console.log('  fase-koppen in de lijst  :', fases.join(' · '));
  console.log('  taakrijen totaal         :', rijen);
  console.log('  rijen met stand KLAAR    :', klaarRijen, klaarRijen <= 3 ? '(<= 3, zoals gevraagd)' : '(TE VEEL)');
  console.log('  rijen met stand VAST     :', vastRijen);
  console.log('  route-stappen die af zijn:', klaarElders, '(hoort in het routeoverzicht, valt niet onder de grens)');
  const cellen = [...lijst.matchAll(/<td class="taak">([\s\S]*?)<\/td>/g)].map(m => m[1].trim());
  const langste = cellen.reduce((a, b) => (a.length > b.length ? a : b), '');
  console.log('  langste taaknaam         :', langste.length, 'tekens →', langste);
  const acties = [...lijst.matchAll(/<td class="actie">([\s\S]*?)<\/td>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const langsteA = acties.reduce((a, b) => (a.length > b.length ? a : b), '');
  console.log('  langste actietekst       :', langsteA.length, 'tekens →', langsteA);
  console.log('  "wat er echt gebeurde"   :', /wat er echt gebeurde/i.test(uit) ? 'STAAT ER NOG' : 'weg');
  console.log('  slaagpercentages         :', /geslaagd \/ geblokkeerd/i.test(uit) ? 'STAAN ER NOG' : 'weg');
  console.log('  link naar stack-ticker   :', /stack-ticker/.test(knopen.voet.innerHTML) ? 'ja' : 'NEE');
}, 60);
