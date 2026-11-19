"""Build the standalone HTML and both distributable ZIPs with Python 3."""
import base64
from pathlib import Path
import re
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]


def inline():
    html = (ROOT / 'index.html').read_text()
    css = (ROOT / 'style.css').read_text()
    def font(match):
        data = base64.b64encode((ROOT / match[1]).read_bytes()).decode()
        return 'url(data:font/woff2;base64,' + data + ')'
    css = re.sub(r'url\((vendor/[^)]+\.woff2)\)', font, css)
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
    def script(match):
        js = (ROOT / match[1]).read_text()
        return '<script>' + re.sub(r'</script', r'<\\/script', js, flags=re.I) + '</script>'
    html = re.sub(r'<script src="([^"]+)"></script>', script, html)
    licenses = '\n\n'.join(p.read_text() for p in sorted((ROOT/'vendor').glob('*.txt')))
    return html.replace('</body>', '<script type="text/plain" id="licenses">' + licenses + '</script>\n</body>')


def archive(name, files):
    directory = ROOT/'downloads'
    directory.mkdir(exist_ok=True)
    with ZipFile(directory/name, 'w') as out:
        for path, data in sorted(files.items()):
            info = ZipInfo(path, (2026, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            out.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)


def main():
    html = inline()
    (ROOT/'standalone/Zellmodell_3D_eine_Datei.html').write_text(html)
    desktop = {'Zellatlas.html': html, 'Sichtpruefung/Anleitung.txt': (ROOT/'docs/Sichtpruefung.txt').read_bytes()}
    desktop.update({'Sichtpruefung/'+p.name: p.read_bytes() for p in (ROOT/'docs/pruefung').glob('*.jpg')})
    archive('Zellatlas-Desktop.zip', desktop)
    scorm = {p.name: p.read_bytes() for p in (ROOT/'scorm').iterdir() if p.suffix in ('.xsd','.xml')}
    scorm['index.html'] = html.replace('</body>', '<script>' + (ROOT/'scorm/session.js').read_text() + '</script>\n</body>')
    archive('Zellatlas-SCORM12.zip', scorm)


if __name__ == '__main__':
    main()
