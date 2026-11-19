"""Open the actual extracted desktop document with networking disabled."""
import argparse
import json
import os
import re
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from playwright.sync_api import sync_playwright
from build import ROOT


def check(engine, headed, evidence):
    with TemporaryDirectory() as tmp, sync_playwright() as pw:
        with ZipFile(ROOT/'downloads/Zellatlas-Desktop.zip') as archive:
            document = Path(archive.extract('Zellatlas.html',tmp))
        browser = getattr(pw,engine).launch(headless=not headed, timeout=30000, executable_path=os.environ.get('ZELLATLAS_BROWSER_PATH'))
        # Linux WPE also rejects file: navigations in Playwright's offline emulation.
        # Deny every HTTP(S) request explicitly in that engine.
        ctx = browser.new_context(offline=engine != 'webkit',viewport={'width':1280,'height':800})
        ctx.route(re.compile(r'^https?://'), lambda route: route.abort())
        page = ctx.new_page()
        external, errors = [], []
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.on('request',lambda r: external.append(r.url) if r.url.startswith(('https:','http:')) else None)
        page.goto(document.as_uri(),timeout=30000)
        page.locator('[data-cell=plant]').click()
        page.locator('#catalog').click()
        page.locator('[data-select=chloro]').click()
        page.locator('[data-action=enter]').click()
        assert page.locator('h1').inner_text()=='Chloroplast'
        mode = page.locator('#status').inner_text()
        if mode=='WebGL 2':
            page.wait_for_function('Number(document.querySelector("canvas").dataset.drawCalls)>0')
        assert not external and not errors,(external,errors)
        result = dict(engine=engine,version=browser.version,mode=mode,scheme='file',network='HTTP(S) blocked' if engine=='webkit' else 'offline',selection='Chloroplast',errors=errors,external_requests=external)
        print(json.dumps(result,ensure_ascii=False),flush=True)
        if evidence:
            (ROOT/'docs/pruefung'/('dateistart-'+engine+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        browser.close()


if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--engine',choices=('webkit','firefox'),default='firefox')
    ap.add_argument('--headed',action='store_true')
    ap.add_argument('--evidence',action='store_true')
    args=ap.parse_args()
    check(args.engine,args.headed,args.evidence)
