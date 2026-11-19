// Schematische 2D-Abbildungen des Prototyps 0.2.
const AtlasFallback = (()=>{
 const g=(key,txt,x,y,extra='')=>`<g class="svg-part" data-part="${key}" role="button" tabindex="0" aria-label="${txt}" ${extra}>${x}</g><text class="lbl" x="${y[0]}" y="${y[1]}">${txt}</text>`;
 const base=`<defs>
 <radialGradient id="cellBody" cx="27%" cy="20%" r="90%"><stop stop-color="#83dfe2" stop-opacity=".74"/><stop offset=".55" stop-color="#3b9bab" stop-opacity=".50"/><stop offset="1" stop-color="#194968" stop-opacity=".35"/></radialGradient>
 <radialGradient id="membrane" cx="28%" cy="16%" r="87%"><stop stop-color="#a9eef5" stop-opacity=".84"/><stop offset=".6" stop-color="#3ab6cc" stop-opacity=".61"/><stop offset="1" stop-color="#155073" stop-opacity=".72"/></radialGradient>
 <radialGradient id="nuclear" cx="20%" cy="16%" r="86%"><stop stop-color="#d8cbf7"/><stop offset=".55" stop-color="#9d83d4"/><stop offset="1" stop-color="#473e87"/></radialGradient>
 <linearGradient id="green" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b1f7a8"/><stop offset=".58" stop-color="#4dae6f"/><stop offset="1" stop-color="#236d52"/></linearGradient>
 <radialGradient id="mito" cx="30%" cy="25%" r="78%"><stop stop-color="#fce7a8"/><stop offset=".6" stop-color="#f5a76a"/><stop offset="1" stop-color="#c65d47"/></radialGradient>
 <radialGradient id="vacuole" cx="27%" cy="16%" r="93%"><stop stop-color="#b5f4fb" stop-opacity=".79"/><stop offset=".66" stop-color="#3fc0cc" stop-opacity=".48"/><stop offset="1" stop-color="#0e6c85" stop-opacity=".51"/></radialGradient>
 <filter id="sh"><feGaussianBlur stdDeviation="8"/></filter>
 <filter id="rim"><feDropShadow dx="0" dy="12" stdDeviation="15" flood-opacity=".34"/></filter>
 </defs>`;
 const wrap=(content)=>`<svg viewBox="0 0 1000 700" role="img" aria-label="Zweidimensionale Ersatzabbildung. Auf Geräten mit WebGL 2 ist das Modell frei räumlich drehbar." xmlns="http://www.w3.org/2000/svg">${base}<ellipse cx="500" cy="605" rx="300" ry="35" fill="#090e1a" opacity=".26" filter="url(#sh)"/>${content}<text class="watermark" x="42" y="670">2D-Ersatzansicht · Die räumliche Darstellung benötigt WebGL 2</text></svg>`;
 const mito=(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})"><ellipse cx="0" cy="0" rx="89" ry="38" fill="url(#mito)" stroke="#ffd3a4" stroke-width="4"/><path d="M -63 -17 q 18 32 30 -4 q 17 34 34 -1 q 15 34 32 -1 q 18 33 35 -1" fill="none" stroke="#c65e46" stroke-width="6" stroke-linecap="round"/></g>`;
 const chloro=(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="103" ry="49" fill="url(#green)" stroke="#a8f2c6" stroke-width="5"/><ellipse rx="95" ry="41" fill="none" stroke="#216747" stroke-opacity=".65" stroke-width="2"/>${[-50,-16,18,52].map(a=>`<g transform="translate(${a} 1)">${[-17,-9,-1,7,15].map(b=>`<ellipse cy="${b}" rx="13" ry="4.5" fill="#246c4b" stroke="#b3fabb" stroke-width="1"/>`).join('')}</g>`).join('')}<path d="M-69 -23 Q 0 -38 68 -16 M-69 27 Q 0 35 72 20" stroke="#25674b" fill="none" stroke-width="3" opacity=".66"/></g>`;
 const golgi=(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${[0,1,2,3,4,5].map(i=>`<path d="M ${-68+i*7} ${-28+i*12} Q -13 ${-45+i*12} ${65-i*6} ${-20+i*12}" fill="none" stroke="${i%2?'#fcb9c9':'#e480b0'}" stroke-width="10" stroke-linecap="round"/>`).join('')}<circle cx="83" cy="21" r="11" fill="#d1f5f5"/><circle cx="96" cy="45" r="7" fill="#bfe8f5"/></g>`;
 const er=(x,y)=>`<g transform="translate(${x} ${y})" stroke="#a4e1ed" stroke-width="10" fill="none" stroke-linecap="round">${[0,1,2,3,4].map(i=>`<path d="M${-70+i*14} ${-52+i*20} C ${-26+i*11} ${-105+i*20},${35-i*3} ${5+i*8},${95-i*4} ${-36+i*20}" />`).join('')}</g>`;
 function plant(){return wrap(`<g filter="url(#rim)"><rect class="shell" x="136" y="126" width="732" height="464" rx="42" fill="url(#green)" fill-opacity=".32" stroke="#7fdcb1" stroke-width="18"/><rect class="shell" x="156" y="145" width="695" height="425" rx="32" fill="url(#cellBody)" stroke="#67d3d8" stroke-width="5"/></g>
 ${g('vacuole','Zentralvakuole','<path d="M 339 205 Q 520 160 704 230 Q 780 326 688 490 Q 520 535 342 459 Q 280 347 339 205Z" fill="url(#vacuole)" stroke="#a6f1f7" stroke-width="7"/>',[517,350])}
 ${g('nucleus','Zellkern','<ellipse cx="276" cy="275" rx="93" ry="86" fill="url(#nuclear)" stroke="#d8b5ed" stroke-width="5"/><circle cx="306" cy="285" r="25" fill="#df8cc2" opacity=".9"/>',[224,240])}
 ${g('mito','Mitochondrium',mito(685,529,-17),[670,583])}
 ${g('chloro','Chloroplast',chloro(785,252,64)+chloro(216,482,-42),[740,212])}
 ${g('golgi','Golgi-Apparat',golgi(727,170,-12),[749,131])}
 ${g('rough','ER',er(326,405),[285,382])}
 ${g('wall','Zellwand','<rect x="137" y="129" width="732" height="464" rx="42" fill="none" stroke="#d4f1a4" stroke-width="16" stroke-opacity=".15"/>',[464,119])}`);}
 function animal(){return wrap(`<g filter="url(#rim)"><path class="shell" d="M 178 359 C 156 218 325 145 472 126 C 610 100 808 188 843 339 C 904 510 702 584 522 570 C 331 590 205 518 178 359Z" fill="url(#cellBody)" stroke="#84d9ea" stroke-width="7"/></g>
 ${g('nucleus','Zellkern','<ellipse cx="448" cy="326" rx="140" ry="122" fill="url(#nuclear)" stroke="#d9c7fb" stroke-width="6"/><circle cx="496" cy="350" r="37" fill="#dfa1d9"/>',[434,312])}
 ${g('mito','Mitochondrien',mito(652,217,17)+mito(322,508,-35)+mito(715,468,26),[703,170])}
 ${g('golgi','Golgi-Apparat',golgi(638,346,-17),[733,354])}
 ${g('rough','Endoplasmatisches Reticulum',er(279,330),[243,252])}
 ${g('lyso','Lysosomen','<g fill="#efbc80" stroke="#f6e6b0" stroke-width="3"><circle cx="745" cy="315" r="31"/><circle cx="240" cy="402" r="22"/><circle cx="757" cy="404" r="19"/></g>',[732,287])}
 ${g('membrane','Zellmembran','<path d="M 178 359 C 156 218 325 145 472 126 C 610 100 808 188 843 339 C 904 510 702 584 522 570 C 331 590 205 518 178 359Z" fill="none" stroke="#b1fcf0" stroke-opacity=".25" stroke-width="14"/>',[480,606])}`);}
 function ciliate(){const strokes=Array.from({length:92},(_,i)=>{let a=i*2*Math.PI/92, x=500+312*Math.cos(a),y=349+154*Math.sin(a),xx=500+340*Math.cos(a),yy=349+177*Math.sin(a);return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${xx.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="#98ece1" stroke-width="2.3" stroke-linecap="round" opacity=".7"/>`;}).join('');return wrap(`<g filter="url(#rim)"><ellipse class="shell" cx="500" cy="349" rx="315" ry="158" fill="url(#cellBody)" stroke="#79d9db" stroke-width="7"/></g>
 ${g('cilia','Cilien (Wimpern)',`<g>${strokes}</g>`,[504,168])}
 ${g('macro','Großkern','<ellipse cx="437" cy="334" rx="95" ry="70" fill="url(#nuclear)" stroke="#c8b6f0" stroke-width="5"/>',[389,324])}
 ${g('micro','Kleinkern','<circle cx="544" cy="289" r="24" fill="#d9a8e9" stroke="#f5cdf8" stroke-width="4"/>',[566,263])}
 ${g('contractile','Kontraktile Vakuole','<circle cx="694" cy="284" r="47" fill="url(#vacuole)" stroke="#b4f1e8" stroke-width="4"/><g fill="none" stroke="#66dce6" stroke-width="6"><path d="M695 238v-29 M695 329v29 M647 284h-29 M741 284h30 M660 250l-21-21 M728 318l20 20"/></g>',[703,215])}
 ${g('food','Nahrungsvakuolen','<g fill="#f3aa72" stroke="#ffe2b7" stroke-width="4"><circle cx="584" cy="401" r="36"/><circle cx="312" cy="363" r="28"/><circle cx="716" cy="403" r="23"/></g>',[610,462])}
 ${g('oral','Mundfeld','<path d="M584 486 Q655 463 704 466" fill="none" stroke="#245d85" stroke-width="13" stroke-linecap="round"/>',[697,502])}
 ${g('mito','Mitochondrien',mito(353,250,-25).replace('rx="89"','rx="62"').replace('ry="38"','ry="28"'),[279,230])}`);}

return {animal, plant, ciliate};
})();
