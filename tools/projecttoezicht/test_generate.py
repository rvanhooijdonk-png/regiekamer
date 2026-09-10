import unittest
from html.parser import HTMLParser
from generate import HEADERS, parse, render


def report():
    return '\n'.join(['| ' + ' | '.join(HEADERS) + ' |', '|' + '---|' * 9] + [
        '| ' + ' | '.join([f'P{i:02}', f'Project {i}', 'ONBEKEND', 'Geen meting',
                           'Bron ontbreekt', 'Bron meten', 'IK', 'nee', 'nee']) + ' |'
        for i in range(1,18)] + ['', 'Δ geen eerdere meting', 'meetmoment=2026-01-01T00:00:00Z'])


class Tags(HTMLParser):
    def __init__(self):
        super().__init__(); self.counts = {}
    def handle_starttag(self, tag, attrs):
        self.counts[tag] = self.counts.get(tag, 0) + 1


class Tests(unittest.TestCase):
    def test_real_table_shape(self):
        tags = Tags(); tags.feed(render(report()))
        self.assertEqual(tags.counts['table'], 1)
        self.assertEqual(tags.counts['th'], 9)
        self.assertEqual(tags.counts['td'], 17 * 9)

    def test_missing_duplicate_and_reordered_ids(self):
        for bad in [report().replace('P17','P16'), report().replace('P01','P18')]:
            with self.assertRaises(ValueError): parse(bad)

    def test_vertical_and_wrong_headers_rejected(self):
        for bad in ['Nr: P01\nProject: METER', report().replace('Laatste echte voortgang','Commit')]:
            with self.assertRaises(ValueError): parse(bad)

    def test_codes_and_extra_columns_rejected(self):
        for bad in [report().replace('ONBEKEND','W6'), report().replace('Geen meting','Geen | meting')]:
            with self.assertRaises(ValueError): parse(bad)

    def test_dates_required_and_future_rejected(self):
        for date in ['', '2026-01-01', '2999-01-01T00:00:00Z']:
            with self.assertRaises(ValueError): parse(report().replace('2026-01-01T00:00:00Z',date))

    def test_untrusted_source_not_executable(self):
        page = render(report().replace('Geen meting','<img src=x onerror=alert(1)>'))
        self.assertNotIn('<img', page)
        self.assertIn('&lt;img', page)

    def test_escaped_pipe_remains_one_cell(self):
        rows, _, _ = parse(report().replace('Geen meting',r'Bron A \| Bron B'))
        self.assertEqual(rows[0][3], 'Bron A | Bron B')


if __name__ == '__main__': unittest.main()
