"""Strict, read-only report importer. No dispatch, scheduling or publishing."""
import argparse
import hashlib
import html
import re
from datetime import datetime, timezone
from pathlib import Path

HEADERS = ['Nr', 'Project', 'Stand', 'Laatste echte voortgang', 'Wat er mis is',
           'Volgende stap', 'Wie', 'Opdracht uitgezet?', 'Opgepakt?']


def cells(line):
    return [v.strip().replace(r'\|', '|') for v in re.split(r'(?<!\\)\|', line.strip())[1:-1]]


def parse(text):
    lines = text.splitlines()
    starts = [i for i, line in enumerate(lines) if line.startswith('|') and cells(line) == HEADERS]
    if len(starts) != 1:
        raise ValueError('Precies één projecttabel met de negen afgesproken kolommen vereist.')
    i = starts[0] + 1
    if i >= len(lines) or len(cells(lines[i])) != 9 or not all(re.fullmatch(r':?-{3,}:?', c) for c in cells(lines[i])):
        raise ValueError('Ongeldige tabelscheiding.')
    rows = []
    for line in lines[i + 1:]:
        if not line.startswith('|'):
            break
        row = cells(line)
        if len(row) != 9 or any(not c for c in row):
            raise ValueError('Elke projectrij vereist negen gevulde cellen; gebruik ONBEKEND.')
        if any(re.search(r'\bW[0-6]\b', c) for c in row):
            raise ValueError('W-codes zijn niet toegestaan.')
        rows.append(row)
    if [r[0] for r in rows] != [f'P{i:02}' for i in range(1, 18)]:
        raise ValueError('P01–P17 moeten precies eenmaal in volgorde voorkomen.')
    moments = re.findall(r'^meetmoment=(.+)$', text, re.M)
    if len(moments) != 1:
        raise ValueError('Eén expliciet meetmoment met tijdzone vereist.')
    moment = datetime.fromisoformat(moments[0].replace('Z', '+00:00'))
    if moment.tzinfo is None:
        raise ValueError('Meetmoment mist tijdzone.')
    if moment > datetime.now(timezone.utc):
        raise ValueError('Meetmoment ligt in de toekomst.')
    delta = next((line for line in lines if line.startswith('Δ ')), 'Δ niet aangeleverd.')
    return rows, moment.isoformat(), delta


def render(text):
    rows, measured, delta = parse(text)
    esc = html.escape
    headings = ''.join(f'<th scope="col">{esc(h)}</th>' for h in HEADERS)
    body = ''.join('<tr>' + ''.join(f'<td>{esc(c)}</td>' for c in row) + '</tr>' for row in rows)
    digest = hashlib.sha256(text.encode()).hexdigest()
    return TEMPLATE.replace('@@HEAD@@', headings).replace('@@ROWS@@', body).replace(
        '@@TIME@@', esc(measured)).replace('@@DELTA@@', esc(delta)).replace('@@HASH@@', digest)


TEMPLATE = '''<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Projecttabel</title>
<style>
:root{color-scheme:light dark;--bg:#f4f6f8;--paper:#fff;--ink:#172434;--line:#dce3eb;--muted:#4d6074}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}
main{max-width:1900px;margin:auto;padding:28px}h1{font-size:30px;margin:0 0 5px}.sub{color:var(--muted);margin:0 0 20px}
.notice{padding:14px 18px;background:#fff2d5;color:#614400;border:1px solid #dfc178;border-radius:8px;margin-bottom:18px}
.tools{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:18px 0}input,button{font:inherit;padding:9px 12px;border:1px solid var(--line);border-radius:6px;background:var(--paper);color:var(--ink)}
.scroll{overflow:auto;border:1px solid var(--line);border-radius:10px;background:var(--paper);max-height:72vh}
table{border-collapse:separate;border-spacing:0;width:100%;min-width:1550px}caption{text-align:left;padding:12px 16px;color:var(--muted)}
th{position:sticky;top:0;background:#e9eff5;text-align:left;font-size:13px;z-index:2;white-space:nowrap}th,td{padding:14px 12px;border-bottom:1px solid var(--line);vertical-align:top}td{min-width:120px;max-width:310px;overflow-wrap:anywhere}td:first-child{min-width:55px;font-variant-numeric:tabular-nums}td:nth-child(2){font-weight:650}tr:last-child td{border-bottom:0}tbody tr:hover{background:#eef5fc}footer{color:var(--muted);margin-top:16px;overflow-wrap:anywhere}summary{cursor:pointer}details{margin-top:12px}
@media(prefers-color-scheme:dark){:root{--bg:#101821;--paper:#17232f;--ink:#edf2f7;--line:#334454;--muted:#acbdcf}th{background:#233346}tbody tr:hover{background:#243649}}
@media(max-width:700px){main{padding:14px}h1{font-size:25px}}
@media print{.scroll{overflow:visible;max-height:none}table{min-width:0;font-size:8px}td{min-width:0;padding:5px}.tools{display:none}th{position:static}}
</style></head><body><main>
<h1>Projecttabel</h1><p class="sub">Alle projecten in één vast overzicht. Ook op een smal scherm blijven het tabelrijen; schuif horizontaal.</p>
<div class="notice"><strong>Gerapporteerde stand — niet onafhankelijk geverifieerd.</strong>
De generator bewaakt de tabelvorm. Claims over uitvoering komen uit het aangeleverde rapport.</div>
<p>Meetmoment: <time id="measured" datetime="@@TIME@@">@@TIME@@</time> · <strong id="age">Ouderdom berekenen…</strong></p>
<div class="tools"><label>Zoek project of tekst <input id="search" type="search" placeholder="Bijvoorbeeld Keynote" autocomplete="off"></label>
<button id="reload" type="button">Pagina opnieuw laden</button><span id="count">17 van 17 projecten</span></div>
<div class="scroll" tabindex="0" role="region" aria-label="Projectoverzicht, horizontaal scrollbaar">
<table><caption>Vaste negen kolommen · P01–P17</caption><thead><tr>@@HEAD@@</tr></thead><tbody>@@ROWS@@</tbody></table></div>
<footer><p>@@DELTA@@</p><details><summary>Bron en beperkingen</summary>
<p>Bron: PROJECTTOEZICHT_TABEL_LAATSTE.md. SHA-256: @@HASH@@</p>
<p>Opnieuw laden haalt alleen een nieuw gepubliceerde pagina op. Deze pagina meet geen processen en start geen projecten.
Een recent bestand of een commit bewijst geen werkende applicatie. Ontbrekende bronmetingen moeten door de projecteigenaar worden aangevuld.</p></details></footer>
</main><script>
const rows=Array.from(document.querySelectorAll('tbody tr'));
document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase('nl');let n=0;rows.forEach(r=>{r.hidden=!r.textContent.toLocaleLowerCase('nl').includes(q);if(!r.hidden)n++});document.getElementById('count').textContent=`${n} van 17 projecten`});
document.getElementById('reload').addEventListener('click',()=>location.reload());
function age(){const m=Math.floor((Date.now()-Date.parse(document.getElementById('measured').dateTime))/60000);document.getElementById('age').textContent=m<0?'Ongeldig: meetmoment in toekomst':`${m} minuten oud${m>5?' — nieuwe meting nodig':''}`}
age();setInterval(age,30000);
</script></body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        parser.error('Bron mag niet worden overschreven.')
    try:
        page = render(args.source.read_text(encoding='utf-8'))
    except (ValueError, OSError) as exc:
        parser.exit(1, f'INVALID_REPORT: {exc}\n')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(page, encoding='utf-8')
    print('PROJECT_TABLE_RENDERED rows=17 columns=9 facts=SOURCE_REPORTED')


if __name__ == '__main__':
    main()
