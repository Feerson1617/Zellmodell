"""Browser checks against the working tree and the actual ZIP launch files.
Use --evidence to refresh the visual report deliberately.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
from threading import Thread
from zipfile import ZipFile

from playwright.sync_api import sync_playwright
from build import ROOT


def run(save):
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *_):
            pass
    server = ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT))
    Thread(target=server.serve_forever,daemon=True).start()
    base = 'http://127.0.0.1:'+str(server.server_port)
    checks, errors, external = [], [], []
    evidence = ROOT/'docs/pruefung'

    def passed(text):
        checks.append(text)
        print('OK',text,flush=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=None if os.environ.get('PLAYWRIGHT_BUNDLED') else shutil.which('chromium'),
            args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = browser.new_context(viewport={'width':1440,'height':900},accept_downloads=False)
        page = ctx.new_page()
        def monitor(p):
            p.on('pageerror',lambda e: errors.append(str(e)))
            p.on('console',lambda m: errors.append(m.text) if m.type=='error' else None)
            p.on('request',lambda r: external.append(r.url) if r.url.startswith(('http:','https:')) and not r.url.startswith(base+'/') else None)
        monitor(page)
        def snap(name):
            if save:
                page.screenshot(path=evidence/(name+'.jpg'),quality=85)
        def frame():
            page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
        def render(p):
            p.wait_for_function('Number(document.querySelector("canvas")?.dataset.drawCalls)>0')
        def click(selector):
            page.locator(selector).click()
        def choose(cell):
            click('[data-cell='+cell+']')
            frame()
        def inspect(org):
            click('#catalog');click('[data-select='+org+']');click('[data-action=enter]');frame()
        page.goto(base);render(page)
        gpu=page.locator('canvas').evaluate("""c=>{const gl=c.getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return [gl.getParameter(gl.VERSION),e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unbekannt']}""")
        assert page.locator('#scene').evaluate('c=>c.clientHeight*c.clientWidth/(innerHeight*innerWidth)')>.85
        passed('WebGL 2 zeichnet mit positiver Draw-Call-Zahl, Modellfläche am Desktop >85 %')
        for cell,name in [('animal','tierzelle'),('plant','pflanzenzelle'),('ciliate','pantoffeltierchen')]:
            choose(cell);snap(name)
            click('#catalog')
            expected=page.evaluate("(c)=>AtlasData.cells[c][4].split(' ').length",cell)
            assert page.locator('.rowname').count()==expected
            click('#close')
        passed('Zellwechsel und vollständige Strukturverzeichnisse aller drei Zelltypen')
        choose('animal')
        cut=page.locator('canvas').screenshot()
        click('#whole');frame()
        assert cut!=page.locator('canvas').screenshot()
        assert page.locator('.label').all_text_contents()==['Zellmembran']
        click('#cut');click('#names');assert page.locator('.label').count()==0
        click('#names');click('#catalog');click('[data-toggle=nucleus]')
        assert page.locator('[data-toggle=nucleus]').get_attribute('aria-pressed')=='false'
        assert not page.locator('.label[data-id=nucleus]').count()
        hidden=page.locator('canvas').screenshot()
        click('[data-action=all]');frame()
        assert hidden!=page.locator('canvas').screenshot()
        click('#close')
        passed('Schnitt/Ganzmodell, Beschriftungen, individuelle Sichtbarkeit und Alle einblenden mit Pixelvergleich')
        click('.label[data-id=nucleus]');click('[data-action=focus]');frame()
        assert page.locator('#magnification').inner_text()=='185 %'
        click('#reset')
        canvas=page.locator('#scene');canvas.focus()
        before=canvas.screenshot();page.keyboard.press('ArrowRight');frame();assert before!=canvas.screenshot()
        page.keyboard.press('Home');frame()
        rect=canvas.bounding_box();x=rect['width']*.49;y=rect['y']+rect['height']*.48
        page.mouse.click(x,y);assert page.locator('#drawer').is_visible()
        page.keyboard.press('Escape')
        click('#full');assert page.evaluate('!!document.fullscreenElement');click('#full')
        passed('Modell-Picking, Fokussieren, Tastaturrotation, Reset, Escape und Vollbild')
        for cell,org,part,name in [('animal','nucleus','nucleolus','zellkern'),('animal','mito','crista','mitochondrium'),('plant','chloro','grana','chloroplast')]:
            choose(cell);inspect(org);snap(name)
            click('#catalog');click('[data-select='+part+']')
            if org=='nucleus':
                assert 'rRNA' in page.locator('#content').inner_text()
                snap('zellkern-information')
            click('[data-action=enter]')
            assert page.locator('#subtitle').inner_text()=='Feinstruktur im Einzelmodell'
            click('[data-action=back]');assert page.locator('#subtitle').inner_text()=='Bau und Funktion im Detail'
            click('[data-action=root]');assert page.locator('#crumbs').inner_text().lower()=='zellebene'
        passed('Zelle → Organell → isolierter Feinbau und Rückweg für Kern, Mitochondrium, Chloroplast')
        choose('animal');click('.label[data-id=mito]');click('#close')
        for _ in range(9):click('#plus')
        assert page.locator('#title').inner_text()=='Tierzelle'
        click('#reset');click('#help');page.locator('#autoZoom').check();click('#close')
        for _ in range(8):click('#plus')
        assert page.locator('#title').inner_text()=='Mitochondrium'
        page.wait_for_timeout(700)
        for _ in range(7):click('#minus')
        assert page.locator('#title').inner_text()=='Tierzelle'
        click('#sources');page.get_by_text('Endosymbiontentheorie',exact=True).click()
        assert 'Plastiden stammen' in page.locator('#content').inner_text();click('#close')
        passed('Optionaler Ebenenwechsel beim Zoomen in beide Richtungen, Quellen- und Theoriepanel')
        missing=page.evaluate("""()=>{const failures=[];for(const [cell,c] of Object.entries(AtlasData.cells)){
          const cm=AtlasModels.cell(cell,true);for(const id of c[4].split(' ')){
            if(!cm.children.some(n=>n.userData.organ===id))failures.push(cell+'/'+id);
            const om=AtlasModels.organ(id,true,true,cell),seen=new Set();om.traverse(o=>{if(o.isMesh)seen.add(o.userData.part)});
            for(const p of AtlasData.organs[id][5].split(' '))if(!(cell==='plant'&&p==='lamina')&&(!seen.has(p)||!AtlasData.parts[p]))failures.push(cell+'/'+id+'/'+p);
            AtlasModels.dispose(om);
          }AtlasModels.dispose(cm);
        }return failures}""")
        assert not missing,missing
        passed('Geometrien und Erläuterungen für sämtliche im jeweiligen Zelltyp angebotenen Einzelstrukturen')
        tablet=browser.new_context(viewport={'width':1180,'height':820},device_scale_factor=1,has_touch=True,is_mobile=True)
        tab=tablet.new_page();monitor(tab);tab.goto(base);render(tab)
        cdp=tablet.new_cdp_session(tab)
        def touch(kind,points):
            cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i} for i,x,y in points]})
        original=tab.locator('canvas').screenshot()
        touch('touchStart',[(1,600,420)]);touch('touchMove',[(1,660,442)]);touch('touchEnd',[])
        assert original!=tab.locator('canvas').screenshot()
        touch('touchStart',[(1,480,380),(2,670,380)]);touch('touchMove',[(1,438,375),(2,718,375)]);touch('touchEnd',[])
        assert tab.locator('#magnification').inner_text()!='100 %'
        assert tab.locator('#drawer').is_hidden()
        tab.touchscreen.tap(590,415);assert tab.locator('#drawer').is_visible();tab.locator('#close').tap()
        tab.locator('#reset').tap();tab.locator('[data-cell=plant]').tap()
        if save:tab.screenshot(path=evidence/'tablet-quer.jpg',quality=84)
        tab.set_viewport_size({'width':820,'height':1180});tab.locator('#catalog').tap()
        tab.locator('[data-select=chloro]').tap();tab.locator('[data-action=enter]').tap()
        tab.locator('#catalog').tap();tab.locator('[data-select=grana]').tap()
        assert tab.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if save:tab.screenshot(path=evidence/'tablet-hoch.jpg',quality=84)
        passed('Tablet-Emulation 1180×820 und 820×1180, echter Browser-Touchpfad für Drehen, Pinch, Tap und Drawer')
        tablet.close()
        # Two resource routes supply only the extracted ZIP members. Airplane mode blocks all other HTTP.
        zipdata={}
        for route,name,member in [('desktop','Desktop','Zellatlas.html'),('sco','SCORM12','index.html')]:
            with ZipFile(ROOT/('downloads/Zellatlas-'+name+'.zip')) as z:zipdata[route]=z.read(member)
        packaged=browser.new_context(offline=True)
        requests=[]
        def isolated(route):
            url=route.request.url
            if url==base+'/lms':
                route.fulfill(content_type='text/html',body="""<script>window.calls=[];window.API=new Proxy({}, {get:(_,k)=>v=>{calls.push([k,v]);return 'true'}})</script><iframe src="/sco"></iframe>""")
            elif url in [base+'/desktop',base+'/sco']:
                route.fulfill(content_type='text/html',body=zipdata[url.rsplit('/',1)[-1]])
            else:
                requests.append(url);route.abort()
        packaged.route('**/*',isolated)
        off=packaged.new_page();monitor(off);off.goto(base+'/desktop');render(off)
        off.locator('[data-cell=ciliate]').click();assert off.locator('#title').inner_text()=='Pantoffeltierchen'
        off.goto(base+'/lms');sco=next(f for f in off.frames if f.url.endswith('/sco'));render(sco)
        sco.locator('[data-cell=plant]').click()
        assert sco.evaluate('localStorage.length+sessionStorage.length')==0
        assert not packaged.cookies()
        off.locator('iframe').evaluate("f=>f.src='about:blank'")
        off.wait_for_function('window.calls.length===2')
        assert off.evaluate('calls')==[['LMSInitialize',''],['LMSFinish','']]
        assert not requests,requests
        passed('Beide ZIP-Startdateien im Offline-Browser, kein Nachladen; LMS-Mock empfängt exakt Initialize und Finish')
        fb=ctx.new_page();monitor(fb)
        fb.add_init_script("""const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t==='webgl2'?null:get.call(this,t,...a)}""")
        fb.goto(base);assert fb.locator('#status').inner_text()=='2D-Ersatzansicht'
        fb.locator('[data-cell=plant]').click();assert fb.locator('#fallback svg').is_visible()
        fb.locator('#catalog').click();fb.locator('[data-select=chloro]').click()
        assert 'Chloroplast' in fb.locator('#content').inner_text()
        passed('Ausdrücklich gekennzeichnete 2D-Ersatzansicht und Texte bei fehlendem WebGL 2')
        assert not errors,errors
        assert not external,external
        passed('Keine Browserfehler oder externen Laufzeitanfragen')
        result={'browser':'Chromium '+browser.version,'renderer':gpu,'desktop':[1440,900],'emulated_tablet':[[1180,820],[820,1180]],'checks':checks,'errors':errors,'external_requests':external}
        if save:(evidence/'browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        browser.close()
    server.shutdown()


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--evidence',action='store_true')
    run(parser.parse_args().evidence)
