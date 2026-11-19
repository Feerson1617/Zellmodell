"""Offline package structure and equivalence checks. No third-party dependencies."""
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from build import ROOT, inline


def check():
    html = inline()
    assert html == (ROOT/'standalone/Zellmodell_3D_eine_Datei.html').read_text()
    with ZipFile(ROOT/'downloads/Zellatlas-Desktop.zip') as package:
        assert package.testzip() is None
        assert package.read('Zellatlas.html').decode() == html
        assert 'Sichtpruefung/Anleitung.txt' in package.namelist()
        for image in ('tierzelle','pflanzenzelle','pantoffeltierchen','zellkern','mitochondrium','chloroplast'):
            assert len(package.read('Sichtpruefung/'+image+'.jpg')) > 10_000
    with ZipFile(ROOT/'downloads/Zellatlas-SCORM12.zip') as package:
        assert package.testzip() is None
        root = ET.fromstring(package.read('imsmanifest.xml'))
        ns = {'s':'http://www.imsproject.org/xsd/imscp_rootv1p1p2'}
        orgs = root.find('s:organizations',ns)
        org = orgs.find("s:organization[@identifier='%s']" % orgs.get('default'),ns)
        item = org.find('s:item',ns)
        resource = root.find(".//s:resource[@identifier='%s']" % item.get('identifierref'),ns)
        assert resource.get('{http://www.adlnet.org/xsd/adlcp_rootv1p2}scormtype') == 'sco'
        assert root.findtext('s:metadata/s:schemaversion',namespaces=ns) == '1.2'
        for file in resource.findall('s:file',ns):
            assert file.get('href') in package.namelist()
        sco = package.read(resource.get('href')).decode()
        session = (ROOT/'scorm/session.js').read_text()
        assert sco.replace('<script>'+session+'</script>\n','') == html
        for mode in ['LMSSetValue','LMSCommit','LMSGetValue','localStorage','sessionStorage','document.cookie','indexedDB']:
            assert mode not in session
        for name in root.get('{http://www.w3.org/2001/XMLSchema-instance}schemaLocation').split()[1::2]:
            assert name in package.namelist()
    print('OK: HTML, Desktop-ZIP mit sechs Ansichten, Manifest, SCO, Ressourcen und Sitzungsadapter')


if __name__ == '__main__':
    check()
