/* Zellmodell 3D — quelltextoffener, externer-bibliothekenfreier WebGL2-Neubau.
   Die Canva-Anwendung ist nicht auslesbar; keine originalen Funktionen sind implizit zugesichert. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('scene'), panel = $('panel'), panelContent = $('panelContent');
const gl = canvas.getContext('webgl2', {antialias:true, alpha:true, powerPreference:'high-performance', preserveDrawingBuffer:false});
if (!gl) {startFallback();return;}
const VS = `#version 300 es
precision highp float;
in vec3 aPosition;in vec3 aNormal;
uniform mat4 uModel, uVP;uniform mat3 uNormal;
out vec3 vN, vW;
void main(){vec4 p=uModel*vec4(aPosition,1.0);vW=p.xyz;vN=normalize(uNormal*aNormal);gl_Position=uVP*p;}`;
const FS = `#version 300 es
precision highp float;
in vec3 vN, vW;out vec4 FragColor;
uniform vec3 uColor,uCamera;uniform float uOpacity,uRough,uEmissive,uDim;
void main(){
 vec3 N=normalize(vN),V=normalize(uCamera-vW);
 vec3 L1=normalize(vec3(-0.54,0.81,0.91)),L2=normalize(vec3(0.74,-0.21,-0.47));
 float dif=max(dot(N,L1),0.0),bounce=max(dot(N,L2),0.0);
 float fres=pow(1.0-max(dot(N,V),0.0),2.6);
 float specPower=mix(72.0,13.0,clamp(uRough,0.0,1.0));
 float spec=pow(max(dot(N,normalize(L1+V)),0.0),specPower)*(.17+.26*(1.0-uRough));
 float fill=0.43+0.57*dif+0.19*bounce;
 vec3 tint=mix(uColor,vec3(0.55,0.84,0.94),clamp(fres*.2,0.0,0.6));
 vec3 col=tint*fill + vec3(0.86,0.94,1.0)*spec + uColor*uEmissive*(.13+fres*.54);
 col=mix(col,vec3(dot(col,vec3(.30,.59,.11)))*.71,uDim);
 float alpha=clamp(uOpacity*(1.0+fres*.50),0.0,1.0);
 FragColor=vec4(col,alpha);
}`;
function shader(src,kind){const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
let program;try{program=gl.createProgram();gl.attachShader(program,shader(VS,gl.VERTEX_SHADER));gl.attachShader(program,shader(FS,gl.FRAGMENT_SHADER));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="position:fixed;top:30%;left:8%;max-width:84%;padding:18px;background:#261a24;color:#fff;z-index:20;white-space:pre-wrap">Grafikinitialisierung fehlgeschlagen: '+String(e)+'</pre>');return;}
const uniforms={};for(const name of ['uModel','uVP','uNormal','uColor','uCamera','uOpacity','uRough','uEmissive','uDim']) uniforms[name]=gl.getUniformLocation(program,name);
const aPosition=gl.getAttribLocation(program,'aPosition'),aNormal=gl.getAttribLocation(program,'aNormal');
function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
function add3(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function sub3(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function mul3(a,s){return [a[0]*s,a[1]*s,a[2]*s];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(a){const n=Math.hypot(...a)||1;return mul3(a,1/n);}
function eye(){return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);}
function matmul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function translate(x,y,z){const m=eye();m[12]=x;m[13]=y;m[14]=z;return m;}
function scale(x,y,z){const m=eye();m[0]=x;m[5]=y;m[10]=z;return m;}
function rx(t){const m=eye(),c=Math.cos(t),s=Math.sin(t);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;}
function ry(t){const m=eye(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;}
function rz(t){const m=eye(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;}
function model({pos=[0,0,0],size=[1,1,1],rot=[0,0,0]}={}){return matmul(translate(...pos),matmul(rz(rot[2]),matmul(ry(rot[1]),matmul(rx(rot[0]),scale(...size)))));}
function normalMatrix(m){const a=[m[0],m[1],m[2]],b=[m[4],m[5],m[6]],c=[m[8],m[9],m[10]];return new Float32Array([...cross(b,c),...cross(c,a),...cross(a,b)]);}
function vec4Mul(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12]*v[3],m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13]*v[3],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]*v[3],m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15]*v[3]];}
function perspective(fov,asp,n,f){const t=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m;}
function lookAt(eyePos,target){let f=norm(sub3(target,eyePos)),r=norm(cross(f,[0,1,0])),u=cross(r,f),m=eye();m[0]=r[0];m[4]=r[1];m[8]=r[2];m[1]=u[0];m[5]=u[1];m[9]=u[2];m[2]=-f[0];m[6]=-f[1];m[10]=-f[2];m[12]=-dot(r,eyePos);m[13]=-dot(u,eyePos);m[14]=dot(f,eyePos);return m;}
function geo(vertices,normals,indices){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.enableVertexAttribArray(aPosition);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,0,0);const n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);gl.enableVertexAttribArray(aNormal);gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,0,0);const i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(indices),gl.STATIC_DRAW);gl.bindVertexArray(null);return {vao,count:indices.length};}
function sphereGeo(seg=30,rows=20,p=1){const v=[],n=[],ind=[];const signedPow=(x,e)=>Math.sign(x)*Math.pow(Math.abs(x),e);for(let j=0;j<=rows;j++){const lat=-Math.PI/2+j*Math.PI/rows,cl=signedPow(Math.cos(lat),p),sl=signedPow(Math.sin(lat),p);for(let i=0;i<=seg;i++){const lon=i*2*Math.PI/seg;let x=cl*signedPow(Math.cos(lon),p),y=sl,z=cl*signedPow(Math.sin(lon),p);v.push(x,y,z);let nn=p===1?[x,y,z]:norm([Math.sign(x)*Math.pow(Math.abs(x)+.00001,2-p),Math.sign(y)*Math.pow(Math.abs(y)+.00001,2-p),Math.sign(z)*Math.pow(Math.abs(z)+.00001,2-p)]);n.push(...nn);}}
for(let j=0;j<rows;j++)for(let i=0;i<seg;i++){let a=j*(seg+1)+i,b=a+seg+1;ind.push(a,b,a+1,b,b+1,a+1);}return geo(v,n,ind);}
function cylinderGeo(seg=22){let v=[],n=[],ind=[];for(let j=0;j<2;j++){let y=j? .5:-.5;for(let i=0;i<=seg;i++){let a=i*2*Math.PI/seg,c=Math.cos(a),s=Math.sin(a);v.push(c,y,s);n.push(c,0,s);}}for(let i=0;i<seg;i++){let a=i,b=i+seg+1;ind.push(a,a+1,b,a+1,b+1,b);}for(let cap=0;cap<2;cap++){const y=cap?.5:-.5;const center=v.length/3;v.push(0,y,0);n.push(0,cap?1:-1);const start=v.length/3;for(let i=0;i<=seg;i++){let a=i*2*Math.PI/seg;v.push(Math.cos(a),y,Math.sin(a));n.push(0,cap?1:-1);}for(let i=0;i<seg;i++)ind.push(center,start+i+(cap?0:1),start+i+(cap?1:0));}return geo(v,n,ind);}
function torusGeo(seg=42,tube=9){let v=[],n=[],ind=[];for(let i=0;i<=seg;i++){let a=2*Math.PI*i/seg,ca=Math.cos(a),sa=Math.sin(a);for(let j=0;j<=tube;j++){let b=2*Math.PI*j/tube,cb=Math.cos(b),sb=Math.sin(b);v.push((1+.12*cb)*ca,.12*sb,(1+.12*cb)*sa);n.push(cb*ca,sb,cb*sa);}}for(let i=0;i<seg;i++)for(let j=0;j<tube;j++){let a=i*(tube+1)+j,b=a+tube+1;ind.push(a,a+1,b,a+1,b+1,b);}return geo(v,n,ind);}
function tubeGeo(points,r=.06,sides=6){let v=[],n=[],ind=[];for(let i=0;i<points.length;i++){const t=norm(sub3(points[Math.min(points.length-1,i+1)],points[Math.max(0,i-1)])),p=norm(cross(t,Math.abs(t[1])>.9?[1,0,0]:[0,1,0])),q=cross(t,p);for(let k=0;k<=sides;k++){const a=2*Math.PI*k/sides,nn=add3(mul3(p,Math.cos(a)),mul3(q,Math.sin(a)));v.push(...add3(points[i],mul3(nn,r)));n.push(...nn);}}
for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){let a=i*(sides+1)+k,b=a+sides+1;ind.push(a,b,a+1,a+1,b,b+1);}return geo(v,n,ind);}
function crescentGeo(){let v=[],n=[],ind=[],nx=32,ny=8;for(let side of [-1,1])for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){let u=(i/nx-.5)*2,w=(j/ny-.5)*2;v.push(u*.86,w*.19 + Math.sin((u+1)*2.8)*.14,side*(.035+Math.cos(u*2.2)*.04));n.push(0,-.25,side);}
let one=(nx+1)*(ny+1);for(let s=0;s<2;s++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let a=s*one+j*(nx+1)+i,b=a+nx+1;ind.push(a,b,a+1,b,b+1,a+1);}return geo(v,n,ind);}
const G={sphere:sphereGeo(),micro:sphereGeo(12,8),box:sphereGeo(40,28,.50),cell:sphereGeo(48,30),cylinder:cylinderGeo(),torus:torusGeo(),sheet:crescentGeo()};
const colors={wall:[.31,.74,.54],membrane:[.34,.79,.84],vacuole:[.30,.74,.79],nucleus:[.60,.51,.91],nucleolus:[.97,.60,.89],dna:[.96,.70,.94],mito:[1.0,.56,.31],crista:[.99,.77,.40],chloro:[.35,.82,.47],grana:[.15,.55,.30],golgi:[.98,.65,.82],er:[.47,.80,.87],ribo:[.98,.82,.65],vesicle:[.66,.90,.91],lyso:[.94,.70,.49],cytoskeleton:[.32,.64,.75],nucleoid:[.98,.69,.56],plasmid:[.89,.77,.53]};
let objs=[],groups={},current='plant',selected=null,showLabels=false,showEnvelope=true;
const defs={
 plant:{
 wall:['Zellwand','Die Zellwand liegt außerhalb der Zellmembran und gibt der Pflanzenzelle mechanische Stabilität.','Zellulosehaltige Zellwand; keine selektiv permeable Biomembran.','Die äußere Form ist stark vereinfacht.'],
 membrane:['Zellmembran','Begrenzt den Protoplasten und reguliert den Stoffaustausch.','Phospholipid-Doppelschicht mit Membranproteinen.','Die molekulare Doppelschicht ist hier nicht aufgelöst.'],
 vacuole:['Zentralvakuole','Großer, flüssigkeitsgefüllter Zellraum; wichtig für Speicherung und Turgor.','Der Tonoplast grenzt die Vakuole vom Cytoplasma ab.','Die Größe variiert zwischen Pflanzenzellen.'],
 nucleus:['Zellkern','Enthält den überwiegenden Teil der genetischen Information.','Kernhülle aus zwei Membranen mit Kernporen. Der Nucleolus bildet unter anderem ribosomale Untereinheiten.','Die DNA-Fäden dienen hier nur zur Veranschaulichung.'],
 mito:['Mitochondrien','Hier läuft ein wesentlicher Teil der aeroben Zellatmung ab; ATP wird bereitgestellt.','Innere und äußere Membran; die innere besitzt Einstülpungen (Cristae).','Cristae und Größenverhältnisse sind vereinfacht.'],
 chloro:['Chloroplasten','Ort der Fotosynthese in grünen Pflanzenzellen.','Zwei Hüllmembranen; das innere Thylakoidsystem trägt photosynthetische Membrankomplexe.','Dargestellt ist eine chloroplastenhaltige Blattzelle, nicht jede Pflanzenzelle.'],
 er:['Endoplasmatisches Reticulum','Membrannetzwerk für die Herstellung und Verarbeitung vieler Stoffe.','An Ribosomen des rauen ER entstehen vor allem Membran- und sekretorische Proteine; glattes ER ist unter anderem an der Lipidsynthese beteiligt.','Die räumliche Verzahnung mit der Kernhülle ist nicht maßstabsgerecht.'],
 golgi:['Golgi-Apparat','Verarbeitet, sortiert und verteilt unter anderem Proteine und Lipide.','Stapel abgeflachter membranbegrenzter Zisternen; Vesikel übernehmen Transportaufgaben.','Transportwege werden nicht animiert.'],
 ribo:['Ribosomen','Ort der Proteinbiosynthese.','Ribosomen sind nicht von einer eigenen Biomembran umgeben.','Die gezeigten Punkte sind stark vergrößert.']},
 animal:{
 membrane:['Zellmembran','Grenzt die Tierzelle ab und vermittelt gezielten Stoffaustausch.','Lipiddoppelschicht mit Proteinen und weiteren Bestandteilen.','Keine feste Zellwand vorhanden.'],
 nucleus:['Zellkern','Enthält den überwiegenden Teil der DNA.','Doppelte Kernhülle mit Kernporen, Chromatin und Nucleolus.','Vereinfachte Verteilung der DNA.'],
 mito:['Mitochondrien','Wichtige Orte der aeroben Zellatmung und ATP-Bereitstellung.','Zwei Hüllmembranen; innere Membran mit Cristae.','Nicht maßstabsgetreu.'],
 er:['Endoplasmatisches Reticulum','Membransystem für Synthese, Modifikation und Transport.','Raues ER trägt Ribosomen; glattes ER nicht.','Die Form ist schematisiert.'],
 golgi:['Golgi-Apparat','Modifiziert und verteilt Stoffe, die unter anderem aus dem ER kommen.','Gestapelte Membransäckchen und Vesikel.','Transportrichtungen im Modell nicht animiert.'],
 ribo:['Ribosomen','Hier werden Proteine hergestellt.','Membranlose ribonukleoproteinreiche Partikel.','Didaktisch stark vergrößert.'],
 lyso:['Lysosomen','Membranbegrenzte Räume mit abbauenden Enzymen.','Beteiligt am intrazellulären Stoffabbau.','Nicht jede Tierzelle besitzt gleich viele.'],
 vesicle:['Vesikel','Transportieren oder speichern Stoffe in membranumhüllten Räumen.','Können mit anderen Membranen fusionieren.','Momentaufnahme eines dynamischen Systems.']},
 ciliate:{
 membrane:['Zelloberfläche','Das Pantoffeltierchen wird von einer Zellmembran und einem stabilisierenden Zellcortex begrenzt.','Es besitzt keine starre pflanzliche Zellwand. Die Oberfläche trägt zahlreiche Cilien (Wimpern).','Als Beispiel wird ein Pantoffeltierchen vereinfacht modelliert. Nicht alle Einzeller sehen so aus.'],
 macronucleus:['Großkern (Makronucleus)','Der Großkern enthält DNA und steuert viele Vorgänge der aktiven Zelle.','Pantoffeltierchen besitzen einen großen Zellkern und zusätzlich mindestens einen Kleinkern.','Die Darstellung einzelner DNA-Bereiche ist schematisch.'],
 micronucleus:['Kleinkern (Mikronucleus)','Der Kleinkern ist vor allem für Prozesse der genetischen Weitergabe bei der Konjugation wichtig.','Er liegt oft in der Nähe des Großkerns.','Die Vererbungsvorgänge sind nicht dargestellt.'],
 cilia:['Cilien (Wimpern)','Viele bewegliche Zellfortsätze ermöglichen Fortbewegung und helfen, Nahrung heranzustrudeln.','Ihre Bewegung beruht auf einem komplexen Aufbau aus Mikrotubuli.','Anzahl, Bewegungsmuster und tatsächliche Feinstruktur sind stark vereinfacht.'],
 vacuole:['Kontraktile Vakuole','Sie sammelt überschüssiges Wasser und gibt es nach außen ab.','Sie ist an der Osmoregulation im Süßwasser beteiligt; Zuführungskanäle sind hier schematisch.','Ihre Füllung und Entleerung werden nicht zeitlich simuliert.'],
 food:['Nahrungsvakuolen','Aufgenommene Nahrung wird in membranumgrenzten Räumen verdaut.','Die Vakuolen bewegen sich durch das Zellinnere und werden während der Verdauung verändert.','Das Modell zeigt nur mehrere vereinfachte Zustände gleichzeitig.'],
 oral:['Mundfeld / Zellmund','In diesem Oberflächenbereich wird Nahrung aufgenommen.','Cilien bewegen Nahrungsteilchen zur Zellmundregion.','Die räumliche Vertiefung und der Aufnahmevorgang sind nur angedeutet.'],
 mito:['Mitochondrien','Auch das Pantoffeltierchen ist ein Eukaryot und besitzt Mitochondrien.','Die innere Membran bildet Cristae; hier findet ein großer Teil der aeroben Zellatmung statt.','Einzellige Eukaryoten sind in ihrer Ausstattung sehr vielfältig.']}

};
function register(id,center,radius){const d=defs[current][id];groups[id]={id,title:d[0],about:d[1],structure:d[2],limit:d[3],center,radius};}
function add(group,mesh,transform,opts={}){const m=model(transform),mat={...opts};objs.push({group,mesh,model:m,normal:normalMatrix(m),center:transform.pos||[0,0,0],color:mat.color||colors[group]||colors.membrane,alpha:mat.alpha===undefined?1:mat.alpha,rough:mat.rough===undefined?.47:mat.rough,emissive:mat.emissive||0,envelope:!!mat.envelope});}
function addTube(group,points,r,opts={},transform={}){const mesh=tubeGeo(points,r,7);add(group,mesh,{pos:transform.pos||[0,0,0],size:transform.size||[1,1,1],rot:transform.rot||[0,0,0]},opts);}
function ring(group,c,r,rot=[0,0,0],opts={}){add(group,G.torus,{pos:c,size:[r,.95*r,r],rot},opts);}
function addNucleus(c,s=1){register('nucleus',c,.9*s);
 add('nucleus',G.sphere,{pos:c,size:[.86*s,.84*s,.74*s]},{alpha:.26,rough:.37,color:colors.nucleus,emissive:.11});
 add('nucleus',G.sphere,{pos:c,size:[.79*s,.77*s,.67*s]},{alpha:.18,rough:.35,color:[.71,.62,.99]});
 add('nucleus',G.sphere,{pos:add3(c,[.15*s,-.07*s,.17*s]),size:[.24*s,.23*s,.22*s]},{color:colors.nucleolus,rough:.45,emissive:.11});
 for(let h=0;h<3;h++){let pts=[];for(let j=0;j<48;j++){let t=(j/47)*Math.PI*2.1;pts.push([Math.cos(t)*(.43+h*.04)*s,Math.sin(t)*(.31+h*.06)*s,Math.sin(t*2.6+h*1.7)*.19*s]);}addTube('nucleus',pts,.016*s,{color:colors.dna,alpha:.91,emissive:.14},{pos:c,rot:[h*.34,h*.6, h*.25]});}
 for(let k=0;k<21;k++){let a=k*2.4,el=Math.asin((k/21)*1.75-.88),x=Math.cos(el)*Math.cos(a),y=Math.sin(el),z=Math.cos(el)*Math.sin(a);add('nucleus',G.micro,{pos:add3(c,[x*.865*s,y*.84*s,z*.745*s]),size:[.045*s,.043*s,.045*s]},{color:[.84,.78,1],alpha:.8,emissive:.12});}
}
function addMito(c,scaleFactor=1,rot=[0,0,0]){const m=matmul(translate(...c),matmul(rz(rot[2]),matmul(ry(rot[1]),rx(rot[0]))));
 add('mito',G.sphere,{pos:c,size:[.75*scaleFactor,.33*scaleFactor,.35*scaleFactor],rot},{alpha:.46,rough:.34,color:colors.mito,emissive:.13});
 add('mito',G.sphere,{pos:c,size:[.70*scaleFactor,.285*scaleFactor,.30*scaleFactor],rot},{alpha:.19,rough:.32,color:[1,.86,.51]});
 for(let i=0;i<7;i++){let pts=[];const x=(-.54+i*.18)*scaleFactor;for(let j=0;j<=28;j++){let t=j/28,phi=t*Math.PI*2.0;pts.push([x + Math.sin(phi*1.2+i)*.035*scaleFactor,Math.sin(phi)*.215*scaleFactor,Math.cos(phi*.9)*.22*scaleFactor]);}addTube('mito',pts,.025*scaleFactor,{color:colors.crista,rough:.66,alpha:.96,emissive:.12},{pos:c,rot});}
 return m;
}
function addChloroplast(c,rot=[0,0,0],scaleFactor=1){add('chloro',G.sphere,{pos:c,size:[.77*scaleFactor,.46*scaleFactor,.32*scaleFactor],rot},{color:colors.chloro,alpha:.43,rough:.37,emissive:.14});
 // Quer zur Längsachse gestapelte Thylakoid-Disks und verbindende Stromalamellen (didaktische Strukturmodelle).
 const localParent=matmul(translate(...c),matmul(rz(rot[2]),matmul(ry(rot[1]),rx(rot[0]))));
 for(let stack=0;stack<4;stack++){for(let k=0;k<5;k++){let p=[(-.46+stack*.31)*scaleFactor,(-.1+k*.047)*scaleFactor,.015*scaleFactor];let pp=vec4Mul(localParent,[...p,1]);add('chloro',G.cylinder,{pos:pp.slice(0,3),size:[.16*scaleFactor,.022*scaleFactor,.16*scaleFactor],rot:[rot[0],rot[1],rot[2]]},{color:colors.grana,rough:.68});}}
 for(let l=0;l<3;l++){let pts=[];for(let i=0;i<=24;i++){let u=i/24;pts.push([(-.55+1.1*u)*scaleFactor,(-.11+l*.085)*scaleFactor,.02*scaleFactor+Math.sin(u*9)*.02]);}addTube('chloro',pts,.019*scaleFactor,{color:[.17,.69,.38],alpha:.95},{pos:c,rot});}
}
function addGolgi(c,scaleFactor=1){register('golgi',c,.84*scaleFactor);for(let k=0;k<6;k++){const length=(.92-k*.07)*scaleFactor;add('golgi',G.sheet,{pos:add3(c,[.03*k*scaleFactor,(k-2.5)*.15*scaleFactor,0]),size:[length,1*scaleFactor,.8*scaleFactor],rot:[0,.10,k*.024]},{color:k%2?[.97,.64,.81]:[1,.72,.88],alpha:.92,rough:.59,emissive:.025});}
 for(let i=0;i<6;i++){let a=i*2.2;add('golgi',G.micro,{pos:add3(c,[.97*Math.cos(a)*scaleFactor,.31*Math.sin(a)*scaleFactor,.3*Math.sin(a*1.8)*scaleFactor]),size:[.09,.08,.09]},{color:colors.vesicle,alpha:.84,rough:.2});}}
function addER(c,scaleFactor=1){register('er',c,.90*scaleFactor);for(let k=0;k<6;k++){let theta=k*.70+.4, pts=[];for(let j=0;j<=32;j++){let t=j/32;pts.push([(-.64+t*1.35)*scaleFactor,Math.sin(t*2*Math.PI+theta)*.12*scaleFactor+(k-2.5)*.10*scaleFactor,Math.cos(t*4.0+theta)*.30*scaleFactor]);}
 addTube('er',pts,.066*scaleFactor,{color:colors.er,alpha:.84,rough:.3,emissive:.075},{pos:c,rot:[.2,k*.16,0]});
 for(let j=0;j<7;j++){let t=j/7, p=pts[Math.floor(t*(pts.length-1))];add('er',G.micro,{pos:add3(c,p),size:[.034,.034,.034]},{color:colors.ribo,alpha:1,rough:.7});}}
}
let seed=302;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function addRibosomes(c,size,count,inside=()=>true){register('ribo',c,.65);let added=0,iterations=0;while(added<count&&iterations++<count*12){const p=[(random()*2-1)*size[0],(random()*2-1)*size[1],(random()*2-1)*size[2]];if(p[0]*p[0]/size[0]**2+p[1]*p[1]/size[1]**2+p[2]*p[2]/size[2]**2>1||!inside(p))continue;add('ribo',G.micro,{pos:add3(c,p),size:[.027,.027,.027]},{color:colors.ribo,rough:.75,emissive:.075});added++;}}
function addPlant(){register('wall',[0,0,0],3);register('membrane',[0,0,0],3);
 add('wall',G.box,{size:[3.1,2.25,1.76]},{color:colors.wall,alpha:.115,rough:.26,emissive:.07,envelope:true});
 add('membrane',G.box,{size:[2.98,2.14,1.67]},{color:colors.membrane,alpha:.055,rough:.26,emissive:.06,envelope:true});
 register('vacuole',[.35,-.10,-.30],1.55);add('vacuole',G.sphere,{pos:[.35,-.14,-.35],size:[1.85,1.36,1.12]},{color:colors.vacuole,alpha:.17,rough:.15,emissive:.07});
 addNucleus([-1.52,.75,.63],.94);register('mito',[1.70,-.80,.87],.60);addMito([1.87,-.82,.88],1.0,[.24,-.32,.47]);addMito([-1.12,-1.71,.48],.85,[.56,.41,-.27]);addMito([1.88,1.53,.19],.83,[.54,-.32,.22]);
 register('chloro',[-1.57,-.96,.59],.68);addChloroplast([-1.69,-.9,.66],[.14,.14,.5],1.06);addChloroplast([1.83,.46,-.73],[.65,.48,-.26],.97);addChloroplast([-.42,1.73,.58],[.5,.18,-.5],.90);addChloroplast([-2.04,.2,-.45],[-.44,.28,.6],.82);
 addGolgi([1.20,1.06,1.23],.78);addER([-.85,.42,.12],1.05);
 addRibosomes([0,0,0],[2.69,1.93,1.53],74,p=>(p[0]-.35)**2/1.84**2+(p[1]+.14)**2/1.35**2+(p[2]+.35)**2/1.11**2>1.18&& (p[0]+1.52)**2+(p[1]-.75)**2+(p[2]-.63)**2>.95**2);
}
function addAnimal(){register('membrane',[0,0,0],2.6);add('membrane',G.sphere,{size:[2.73,2.19,1.81]},{color:colors.membrane,alpha:.12,rough:.22,emissive:.12,envelope:true});
 addNucleus([-.65,.20,.15],1.11);register('mito',[1.26,-.83,.83],.65);addMito([1.36,-.85,.84],1.05,[.1,.2,.6]);addMito([1.42,1.22,-.05],.89,[.32,-.19,-.1]);addMito([-1.80,-1.12,.37],.72,[.08,1.07,-.23]);
 addGolgi([.75,.74,1.00],.95);addER([-.25,-.67,-.54],1.0);
 register('lyso',[-1.5,1.35,.47],.4);for(let i=0;i<5;i++){const p=[-1.5+Math.cos(i*2.4)*.29,1.38+Math.sin(i*3.0)*.23,.65+(i%2)*.34];add('lyso',G.sphere,{pos:p,size:[.20,.2,.20]},{color:colors.lyso,alpha:.85,rough:.37});}
 register('vesicle',[1.94,.11,.34],.35);for(let i=0;i<8;i++){let a=i*2.4,p=[1.84+Math.sin(a)*.31,.08+Math.cos(a)*.63,.45+Math.sin(a*1.8)*.25];add('vesicle',G.sphere,{pos:p,size:[.11,.1,.11]},{color:colors.vesicle,alpha:.50,rough:.15});}
 addRibosomes([0,0,0],[2.5,1.98,1.5],89,p=>(p[0]+.65)**2+(p[1]-.2)**2+(p[2]-.15)**2>1.15**2);
}
function addCiliate(){
 // Pantoffeltierchen als konkretes Beispiel eines eukaryotischen Einzellers.
 register('membrane',[0,0,0],2.8);
 add('membrane',G.sphere,{size:[2.73,1.12,.84],rot:[0,0,-.12]},{color:[.29,.75,.84],alpha:.16,rough:.30,emissive:.11,envelope:true});
 add('membrane',G.sphere,{size:[2.60,1.02,.75],rot:[0,0,-.12]},{color:[.44,.82,.81],alpha:.05,rough:.28,emissive:.04,envelope:true});
 register('macronucleus',[-.38,.10,.18],.74);add('macronucleus',G.sphere,{pos:[-.40,.06,.18],size:[.76,.52,.48]},{color:[.68,.54,.92],alpha:.78,rough:.42,emissive:.07});
 register('micronucleus',[.27,.36,.35],.25);add('micronucleus',G.sphere,{pos:[.30,.36,.36],size:[.21,.20,.19]},{color:[.95,.72,1],alpha:.95,rough:.46});
 register('vacuole',[1.65,.51,.17],.57);add('vacuole',G.sphere,{pos:[1.65,.48,.17],size:[.41,.35,.32]},{color:[.34,.78,.93],alpha:.34,rough:.23,emissive:.09});
 for(let k=0;k<8;k++){let a=k*Math.PI/4,pts=[];for(let j=0;j<6;j++){let t=j/5;pts.push([1.65+Math.cos(a)*(.37+t*.46),.48+Math.sin(a)*(.31+t*.25),.13]);}addTube('vacuole',pts,.017,{color:[.46,.89,.92],alpha:.78});}
 register('food',[.78,-.44,.31],.85);for(const [x,y,z,r] of [[.79,-.46,.48,.30],[-1.45,-.22,.33,.25],[-.15,-.61,-.04,.23],[1.17,.2,-.28,.19]]){
 add('food',G.sphere,{pos:[x,y,z],size:[r,r*.88,r*.88]},{color:[.98,.66,.42],alpha:.59,rough:.5});add('food',G.sphere,{pos:[x+.05,y-.04,z+.05],size:[r*.42,r*.35,r*.42]},{color:[.75,.37,.25],alpha:.68,rough:.65});}
 register('mito',[-1.12,.63,-.04],.63);addMito([-1.35,.59,-.15],.67,[.12,-.5,.2]);addMito([.89,.43,-.13],.65,[.2,.6,.3]);addMito([-.26,-.75,-.21],.55,[.1,.2,-.5]);
 register('oral',[.74,-.80,.47],.42);let groove=[];for(let i=0;i<25;i++){let t=i/24;groove.push([.23+t*.86,-.92+Math.sin(t*Math.PI)*.14,.47+Math.sin(t*Math.PI)*.10]);}addTube('oral',groove,.085,{color:[.26,.49,.67],alpha:.95,rough:.55});
 register('cilia',[0,0,0],2.75);for(let i=0;i<150;i++){let a=(i/150)*Math.PI*2,x=-2.57+(i%26)/25*5.14,q=Math.max(.09,1-(x/2.73)**2),phi=a*2.39996323;let y=Math.sqrt(q)*1.05*Math.sin(phi),z=Math.sqrt(q)*.78*Math.cos(phi);
 let n=norm([x/(2.73*2.73),y/(1.12*1.12),z/(.84*.84)]);let p=[x,y,z];let pts=[p,add3(p,mul3(n,.12)),add3(p,mul3(n,.27))];addTube('cilia',pts,.010,{color:[.66,.94,.87],alpha:.75,rough:.4});}
}

function buildCell(type){current=type;selected=null;objs=[];groups={};seed=302;switch(type){case'plant':addPlant();break;case'animal':addAnimal();break;case'ciliate':addCiliate();break;}closePanel();refreshLabels();for(let el of document.querySelectorAll('[data-cell]'))el.setAttribute('aria-pressed',String(el.dataset.cell===type));camGoal.distance=homeDistance(type);camGoal.target=[0,0,0];updateSelection(null);}
const cam={theta:.53,phi:.23,distance:9.3,target:[0,0,0]},camGoal={theta:.53,phi:.23,distance:9.3,target:[0,0,0]};
function homeDistance(type){const aspect=Math.max(.2,window.innerWidth/Math.max(1,window.innerHeight)),t=2*Math.tan(45*Math.PI/360);const targetWidth=type==='plant'?7.0:type==='ciliate'?6.5:6.2;const targetHeight=type==='plant'?5.8:type==='ciliate'?4.4:5.2;return clamp(Math.max(targetWidth/(t*aspect),targetHeight/t),6.6,27);}
let width=1,height=1,ratio=1,vp=eye(),cameraPosition=[0,0,9],lastTime=0;let labelElements=[];
function cameraSet(){const {theta,phi,distance,target}=cam;let pos=[Math.cos(phi)*Math.sin(theta)*distance,Math.sin(phi)*distance,Math.cos(phi)*Math.cos(theta)*distance];cameraPosition=add3(target,pos);let fov=45*Math.PI/180;vp=matmul(perspective(fov,width/height,.1,90),lookAt(cameraPosition,target));}
function project(p){const q=vec4Mul(vp,[...p,1]);if(q[3]<=0)return null;return {x:(q[0]/q[3]*.5+.5)*width,y:(1-(q[1]/q[3]*.5+.5))*height,depth:q[2]/q[3]};}
function resize(){ratio=Math.min(window.devicePixelRatio||1,1.7);let w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));w=Math.min(3200,w);h=Math.min(2200,h);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}width=canvas.clientWidth;height=canvas.clientHeight;gl.viewport(0,0,canvas.width,canvas.height);}
function drawObj(o,dim){gl.bindVertexArray(o.mesh.vao);gl.uniformMatrix4fv(uniforms.uModel,false,o.model);gl.uniformMatrix3fv(uniforms.uNormal,false,o.normal);gl.uniform3fv(uniforms.uColor,o.color);gl.uniform1f(uniforms.uOpacity,o.alpha);gl.uniform1f(uniforms.uRough,o.rough);gl.uniform1f(uniforms.uEmissive,o.emissive+(selected===o.group?.09:0));gl.uniform1f(uniforms.uDim,dim);gl.drawElements(gl.TRIANGLES,o.mesh.count,gl.UNSIGNED_INT,0);}
function frame(now){let dt=clamp((now-lastTime)/1000||.016,.001,.06);lastTime=now;resize();let lerp=1-Math.exp(-dt*7.3);cam.theta+=(camGoal.theta-cam.theta)*lerp;cam.phi+=(camGoal.phi-cam.phi)*lerp;cam.distance+=(camGoal.distance-cam.distance)*lerp;for(let i=0;i<3;i++)cam.target[i]+=(camGoal.target[i]-cam.target[i])*lerp;cameraSet();
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(uniforms.uVP,false,vp);gl.uniform3fv(uniforms.uCamera,cameraPosition);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 const renderables=objs.filter(o=>showEnvelope||!o.envelope);
 gl.disable(gl.BLEND);gl.depthMask(true);
 for(const o of renderables){if(o.alpha>=.995)drawObj(o,selected&&selected!==o.group?.28:0);}
 const translucent=renderables.filter(o=>o.alpha<.995).sort((a,b)=>Math.hypot(...sub3(b.center,cameraPosition))-Math.hypot(...sub3(a.center,cameraPosition)));
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
 for(const o of translucent)drawObj(o,selected&&selected!==o.group?.22:0);
 gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
 if(showLabels)for(const entry of labelElements){const {el,g}=entry,p=project(g.center);if(p&&p.depth<1&&p.x>35&&p.x<width-35&&p.y>35&&p.y<height-30){el.style.display='block';el.style.left=p.x+'px';el.style.top=p.y+'px';}else el.style.display='none';}
 requestAnimationFrame(frame);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function openPanel(html){panelContent.innerHTML=html;panel.classList.add('open');}
function closePanel(){panel.classList.remove('open');}
const cellOverview={
 plant:['Pflanzenzelle','Dargestellt ist eine schematische, chloroplastenhaltige Pflanzenzelle. Die Zellwand stabilisiert; die Zellmembran reguliert den Stoffaustausch. Eine große Zentralvakuole trägt zum Turgor bei.','Nicht jede Pflanzenzelle besitzt Chloroplasten (beispielsweise Zellen vieler Speicherorgane).'],
 animal:['Tierzelle','Die Tierzelle besitzt keine Zellwand. Ihre Organellen sind durch Membranen gegliedert und übernehmen unterschiedliche Aufgaben.','Die tatsächliche Form und die Anzahl der Organellen hängen vom jeweiligen Zelltyp ab.'],
 ciliate:['Einzeller: Pantoffeltierchen','Das Pantoffeltierchen ist ein eukaryotischer Einzeller. Es besitzt Zellkern, Mitochondrien, Nahrungsvakuolen, kontraktile Vakuolen und zahlreiche Cilien.','„Einzeller“ bezeichnet die Organisationsform eines Lebewesens, keine einheitliche Zellbauart. Auch Bakterien sind Einzeller, haben aber keinen membranumhüllten Zellkern.']
};
function infoHTML(g){return `<div class="head"><div><p class="eyebrow">${escapeHtml(cellOverview[current][0])} · Organell</p><h2>${escapeHtml(g.title)}</h2></div><button class="x" id="closePanel" aria-label="Schließen">×</button></div><p class="intro">${escapeHtml(g.about)}</p><details open><summary>Bau und Lage</summary><p>${escapeHtml(g.structure)}</p></details><details><summary>Was das Modell vereinfacht</summary><p>${escapeHtml(g.limit)}</p></details><div class="section"><button class="compact" id="backOverview" type="button">Zur Zellübersicht</button></div>`;}
function overviewPanel(){const d=cellOverview[current],items=Object.values(groups).filter(g=>g.id!=='ribo').map(g=>`<button type="button" data-select="${escapeHtml(g.id)}">${escapeHtml(g.title)}</button>`).join('');openPanel(`<div class="head"><div><p class="eyebrow">Zelltyp</p><h2>${escapeHtml(d[0])}</h2></div><button class="x" id="closePanel" aria-label="Schließen">×</button></div><p class="intro">${escapeHtml(d[1])}</p><details><summary>Alle Strukturen auswählen</summary><div class="mini-list">${items}</div></details><details><summary>Fachlicher Hinweis</summary><p>${escapeHtml(d[2])}</p></details><p class="modelDisclaimer">3D-Strukturmodell, keine mikroskopische Aufnahme; Größen und Organellenzahlen sind nicht maßstabsgetreu.</p>`);bindPanelButtons();}
function bindPanelButtons(){const close=$('closePanel');if(close)close.onclick=()=>{closePanel();selected=null;};const back=$('backOverview');if(back)back.onclick=()=>{selected=null;overviewPanel();};for(const el of panel.querySelectorAll('[data-select]'))el.onclick=()=>updateSelection(el.dataset.select);}

function updateSelection(id){selected=id;let g=id?groups[id]:null;if(g){camGoal.target=g.center.slice();camGoal.distance=Math.min(7,Math.max(4.6,camGoal.distance*.84));openPanel(infoHTML(g));bindPanelButtons();$('sr').textContent=g.title+' ausgewählt';}else $('sr').textContent='Zellmodell: '+cellOverview[current][0];}

function refreshLabels(){const layer=$('labelLayer');layer.innerHTML='';labelElements=[];for(const g of Object.values(groups)){if(['wall','membrane','ribo'].includes(g.id))continue;let el=document.createElement('div');el.className='label';el.textContent=g.title;layer.append(el);labelElements.push({el,g});}}
function listPanel(){overviewPanel();}

function helpPanel(){openPanel(`<div class="head"><div><p class="eyebrow">Bedienung</p><h2>Das Modell erkunden</h2></div><button class="x" id="closePanel" aria-label="Schließen">×</button></div><p>Mit einem Finger oder gedrückter Maustaste drehen. Zum Zoomen zwei Finger auseinanderziehen oder das Mausrad bewegen. Ein Organell auswählen, um Bau und Funktion nachzulesen.</p><p>Über „Strukturen“ kannst du jedes Organell direkt auswählen. „Labels“ zeigt Kurzbeschriftungen; „Hülle“ schaltet die äußere Begrenzung um.</p><div class="section"><strong>Was das Modell nicht zeigt</strong><p>Es handelt sich um ein dreidimensionales Strukturmodell, nicht um eine mikroskopische Aufnahme. Größenverhältnisse, Zahl, Ausrichtung und Bewegungen der Organellen sind vereinfacht. Die Lipiddoppelschicht ist nicht molekular aufgelöst.</p></div>`);$('closePanel').onclick=closePanel;}
const pointers=new Map();let dragStart=null,pinchStart=null,moved=false;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){dragStart=[e.clientX,e.clientY];moved=false;}canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){const dx=e.clientX-prev[0],dy=e.clientY-prev[1];if(Math.abs(dx)+Math.abs(dy)>.25){camGoal.theta+=dx*.0067;camGoal.phi=clamp(camGoal.phi+dy*.0067,-1.22,1.22);}if(dragStart&&Math.hypot(e.clientX-dragStart[0],e.clientY-dragStart[1])>8)moved=true;}else if(pointers.size===2){let p=[...pointers.values()],dist=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinchStart&&dist>0){camGoal.distance=clamp(camGoal.distance*pinchStart/dist,3.3,27);}pinchStart=dist;moved=true;}});
canvas.addEventListener('pointerup',e=>{const click=!moved&&pointers.size===1;const px=e.clientX,py=e.clientY;pointers.delete(e.pointerId);if(pointers.size===0){canvas.classList.remove('dragging');pinchStart=null;}if(click){let candidates=Object.values(groups).filter(g=>!['wall','membrane','ribo'].includes(g.id)).map(g=>{let q=project(g.center);let dist=q?Math.hypot(px-q.x,py-q.y):1e9;let threshold=clamp(g.radius*height/(cam.distance*.8),30,89);return {g,dist,threshold};}).filter(x=>x.dist<x.threshold).sort((a,b)=>a.dist-b.dist);if(candidates.length)updateSelection(candidates[0].g.id);else if(selected){selected=null;closePanel();camGoal.target=[0,0,0];camGoal.distance=homeDistance(current);}}});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pinchStart=null;canvas.classList.remove('dragging');});
canvas.addEventListener('wheel',e=>{e.preventDefault();camGoal.distance=clamp(camGoal.distance*Math.exp(e.deltaY*.00082),3.3,27);},{passive:false});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')camGoal.theta-=.18;if(e.key==='ArrowRight')camGoal.theta+=.18;if(e.key==='ArrowUp')camGoal.phi=clamp(camGoal.phi-.15,-1.22,1.22);if(e.key==='ArrowDown')camGoal.phi=clamp(camGoal.phi+.15,-1.22,1.22);if(e.key==='+')camGoal.distance=Math.max(3.3,camGoal.distance-.45);if(e.key==='-')camGoal.distance=Math.min(27,camGoal.distance+.45);}});
for(let el of document.querySelectorAll('[data-cell]'))el.onclick=()=>{buildCell(el.dataset.cell);};
$('listBtn').onclick=listPanel;$('overviewBtn').onclick=overviewPanel;$('helpBtn').onclick=helpPanel;
$('labelBtn').onclick=()=>{showLabels=!showLabels;$('labelBtn').setAttribute('aria-pressed',String(showLabels));if(!showLabels)for(const o of labelElements)o.el.style.display='none';};
$('envelopeBtn').onclick=()=>{showEnvelope=!showEnvelope;$('envelopeBtn').setAttribute('aria-pressed',String(showEnvelope));};
$('resetBtn').onclick=()=>{selected=null;closePanel();camGoal.target=[0,0,0];camGoal.theta=.53;camGoal.phi=.23;camGoal.distance=homeDistance(current);};
$('fullBtn').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
window.addEventListener('resize',()=>{resize();if(!selected)camGoal.distance=homeDistance(current);});window.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();});
gl.enable(gl.DEPTH_TEST);buildCell('plant');requestAnimationFrame(frame);

function startFallback(){
 document.body.classList.add('fallback-mode');
 const layer=document.createElement('div');layer.className='fallback';layer.id='fallbackArt';canvas.after(layer);
 let current='plant',showNames=false,showShell=true;
 const introductions={
  plant:{name:'Pflanzenzelle',summary:'Beispiel einer chloroplastenhaltigen Pflanzenzelle. Zellwand, Zellmembran, Vakuole und unterschiedliche Organellen lassen sich im Modell vergleichen.',limit:'Nicht alle Pflanzenzellen besitzen Chloroplasten. Anzahl, Form und Größe sind nicht maßstabsgetreu.'},
  animal:{name:'Tierzelle',summary:'Tierische Zellen besitzen keine Zellwand; ihre Zellmembran und inneren Membranen begrenzen verschiedene Reaktionsräume.',limit:'Unterschiedliche Tierzellen weichen in Form und Ausstattung erheblich voneinander ab.'},
  ciliate:{name:'Einzeller: Pantoffeltierchen',summary:'Das Pantoffeltierchen ist ein einzelliger Eukaryot. Es besitzt Zellkerne, Mitochondrien, Nahrungsvakuolen, kontraktile Vakuolen und Cilien.',limit:'Einzeller ist keine eigene Zellbauart. Auch Bakterien sind Einzeller, besitzen aber keinen Zellkern.'}
 };
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
 ${g('er','ER',er(326,405),[285,382])}
 ${g('wall','Zellwand','<rect x="137" y="129" width="732" height="464" rx="42" fill="none" stroke="#d4f1a4" stroke-width="16" stroke-opacity=".15"/>',[464,119])}`);}
 function animal(){return wrap(`<g filter="url(#rim)"><path class="shell" d="M 178 359 C 156 218 325 145 472 126 C 610 100 808 188 843 339 C 904 510 702 584 522 570 C 331 590 205 518 178 359Z" fill="url(#cellBody)" stroke="#84d9ea" stroke-width="7"/></g>
 ${g('nucleus','Zellkern','<ellipse cx="448" cy="326" rx="140" ry="122" fill="url(#nuclear)" stroke="#d9c7fb" stroke-width="6"/><circle cx="496" cy="350" r="37" fill="#dfa1d9"/>',[434,312])}
 ${g('mito','Mitochondrien',mito(652,217,17)+mito(322,508,-35)+mito(715,468,26),[703,170])}
 ${g('golgi','Golgi-Apparat',golgi(638,346,-17),[733,354])}
 ${g('er','Endoplasmatisches Reticulum',er(279,330),[243,252])}
 ${g('lyso','Lysosomen','<g fill="#efbc80" stroke="#f6e6b0" stroke-width="3"><circle cx="745" cy="315" r="31"/><circle cx="240" cy="402" r="22"/><circle cx="757" cy="404" r="19"/></g>',[732,287])}
 ${g('membrane','Zellmembran','<path d="M 178 359 C 156 218 325 145 472 126 C 610 100 808 188 843 339 C 904 510 702 584 522 570 C 331 590 205 518 178 359Z" fill="none" stroke="#b1fcf0" stroke-opacity=".25" stroke-width="14"/>',[480,606])}`);}
 function ciliate(){const strokes=Array.from({length:92},(_,i)=>{let a=i*2*Math.PI/92, x=500+312*Math.cos(a),y=349+154*Math.sin(a),xx=500+340*Math.cos(a),yy=349+177*Math.sin(a);return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${xx.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="#98ece1" stroke-width="2.3" stroke-linecap="round" opacity=".7"/>`;}).join('');return wrap(`<g filter="url(#rim)"><ellipse class="shell" cx="500" cy="349" rx="315" ry="158" fill="url(#cellBody)" stroke="#79d9db" stroke-width="7"/></g>
 ${g('cilia','Cilien (Wimpern)',`<g>${strokes}</g>`,[504,168])}
 ${g('macronucleus','Großkern','<ellipse cx="437" cy="334" rx="95" ry="70" fill="url(#nuclear)" stroke="#c8b6f0" stroke-width="5"/>',[389,324])}
 ${g('micronucleus','Kleinkern','<circle cx="544" cy="289" r="24" fill="#d9a8e9" stroke="#f5cdf8" stroke-width="4"/>',[566,263])}
 ${g('vacuole','Kontraktile Vakuole','<circle cx="694" cy="284" r="47" fill="url(#vacuole)" stroke="#b4f1e8" stroke-width="4"/><g fill="none" stroke="#66dce6" stroke-width="6"><path d="M695 238v-29 M695 329v29 M647 284h-29 M741 284h30 M660 250l-21-21 M728 318l20 20"/></g>',[703,215])}
 ${g('food','Nahrungsvakuolen','<g fill="#f3aa72" stroke="#ffe2b7" stroke-width="4"><circle cx="584" cy="401" r="36"/><circle cx="312" cy="363" r="28"/><circle cx="716" cy="403" r="23"/></g>',[610,462])}
 ${g('oral','Mundfeld','<path d="M584 486 Q655 463 704 466" fill="none" stroke="#245d85" stroke-width="13" stroke-linecap="round"/>',[697,502])}
 ${g('mito','Mitochondrien',mito(353,250,-25).replace('rx="89"','rx="62"').replace('ry="38"','ry="28"'),[279,230])}`);}
 const panels={
  plant:{vacuole:['Zentralvakuole','Speichert Wasser und gelöste Stoffe; trägt gemeinsam mit der Zellwand zum Turgor bei.','Der Tonoplast begrenzt die Vakuole.','Nicht jede Pflanzenzelle besitzt eine so große Zentralvakuole.'],nucleus:['Zellkern','Enthält den überwiegenden Teil der DNA.','Die Kernhülle besteht aus zwei Membranen mit Kernporen. Der Nucleolus ist an der Bildung ribosomaler Untereinheiten beteiligt.','DNA und Kernporen sind nicht maßstabsgerecht dargestellt.'],mito:['Mitochondrium','Ort wesentlicher Schritte der Zellatmung und ATP-Bereitstellung.','Die innere Membran bildet die Cristae.','Die Faltungen sind stark vereinfacht.'],chloro:['Chloroplast','In grünen Pflanzenzellen findet hier Fotosynthese statt.','Thylakoidmembranen tragen wichtige molekulare Komplexe der Fotosynthese.','Die Diskstapel sind im Maßstab verändert.'],golgi:['Golgi-Apparat','Modifiziert, sortiert und verteilt Stoffe.','Stapel membranumgrenzter Zisternen.','Die Formen und Transportwege sind vereinfacht.'],er:['Endoplasmatisches Reticulum','Beteiligt an Proteinsynthese, Lipidbildung und Stofftransport.','Raues ER trägt Ribosomen. Die äußere Kernmembran geht in das ER über.','Das Netzwerk ist stark schematisiert.'],wall:['Zellwand','Stabilisiert die Pflanzzelle.','Zellulosehaltige Wand außerhalb der Zellmembran; keine Biomembran.','Wandstärken sind vergrößert.']},
  animal:{nucleus:['Zellkern','Enthält den überwiegenden Teil des Erbmaterials.','Doppelte Kernhülle und Nucleolus.','Nicht maßstabsgerecht.'],mito:['Mitochondrien','Wichtige Orte der ATP-Bereitstellung.','Innere Membran mit Cristae.','Das Organell besitzt weitere räumliche Unterteilungen.'],golgi:['Golgi-Apparat','Sortiert und modifiziert unter anderem Proteine.','Abgeflachte Zisternen und Vesikel.','Vesikeltransport ist hier nicht animiert.'],er:['Endoplasmatisches Reticulum','Membransystem für Synthese, Modifikation und Transport.','Glattes und raues ER übernehmen unterschiedliche Aufgaben.','Vereinfachte Form.'],lyso:['Lysosomen','Abbau bestimmter Zellbestandteile.','Membranbegrenzte Räume mit hydrolytischen Enzymen.','Lysosomen unterscheiden sich je nach Zelltyp.'],membrane:['Zellmembran','Grenzt das Cytoplasma ab und reguliert Austauschprozesse.','Phospholipid-Doppelschicht mit Membranproteinen.','Die Moleküle sind nicht aufgelöst.']},
  ciliate:{macronucleus:['Großkern','Der Großkern ist an der Steuerung zahlreicher Vorgänge beteiligt.','In Pantoffeltierchen gibt es zusätzlich mindestens einen Kleinkern.','Der Kernaufbau ist vereinfacht.'],micronucleus:['Kleinkern','Bedeutsam für die Weitergabe und Neukombination genetischer Information bei der Konjugation.','Membranumhüllter Zellkern.','Vorgänge der Konjugation sind nicht gezeigt.'],cilia:['Cilien','Zahlreiche Zellfortsätze dienen der Fortbewegung und der Erzeugung von Strömungen.','Cilien besitzen innen Mikrotubuli.','Zahl und Koordination sind vereinfacht.'],vacuole:['Kontraktile Vakuole','Gibt überschüssiges Wasser an die Umgebung ab.','Beteiligt an der Osmoregulation im Süßwasser.','Füllung und Entleerung sind hier nicht animiert.'],food:['Nahrungsvakuolen','Dienen der Aufnahme und Verdauung von Nahrung.','Membranbegrenzte Räume.','Der Verdauungsweg ist nicht animiert.'],oral:['Mundfeld','Bereich der Nahrungsaufnahme.','Cilien befördern Nahrungsteilchen zum Zellmund.','Räumlicher Aufbau ist stark vereinfacht.'],mito:['Mitochondrien','Das Pantoffeltierchen ist ein Eukaryot und besitzt Mitochondrien.','Innere Membran mit Cristae.','Die Anzahl im Modell ist willkürlich.']}
 };
 function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function open(html){panelContent.innerHTML=html;panel.classList.add('open');const close=$('closePanel');if(close)close.onclick=()=>panel.classList.remove('open');for(const button of panel.querySelectorAll('[data-select]'))button.onclick=()=>show(button.dataset.select);}
 function show(id){const p=panels[current][id];if(!p)return;open(`<div class="head"><div><p class="eyebrow">${escapeText(introductions[current].name)} · Struktur</p><h2>${escapeText(p[0])}</h2></div><button class="x" id="closePanel" aria-label="Schließen">×</button></div><p class="intro">${escapeText(p[1])}</p><details open><summary>Bau und Funktion</summary><p>${escapeText(p[2])}</p></details><details><summary>Modellgrenze</summary><p>${escapeText(p[3])}</p></details>`);}
 function overview(){const d=introductions[current], buttons=Object.entries(panels[current]).map(([id,v])=>`<button data-select="${id}">${escapeText(v[0])}</button>`).join('');open(`<div class="head"><div><p class="eyebrow">Zellmodell</p><h2>${escapeText(d.name)}</h2></div><button class="x" id="closePanel" aria-label="Schließen">×</button></div><p class="intro">${escapeText(d.summary)}</p><details><summary>Strukturen und Funktionen</summary><div class="mini-list">${buttons}</div></details><details><summary>Fachliche Einordnung</summary><p>${escapeText(d.limit)}</p></details><p class="modelDisclaimer">Die hier sichtbare 2D-Ersatzansicht ist kein dreidimensionales Modell. Auf modernen Geräten mit WebGL 2 wird die echte räumliche Zellansicht geladen.</p>`);}
 function build(id){current=id;layer.innerHTML=({plant,animal,ciliate}[id])();layer.classList.toggle('show-labels',showNames);layer.classList.toggle('hide-shell',!showShell);panel.classList.remove('open');for(const b of document.querySelectorAll('[data-cell]'))b.setAttribute('aria-pressed',String(b.dataset.cell===id));layer.querySelectorAll('[data-part]').forEach(el=>{el.addEventListener('click',()=>show(el.dataset.part));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(el.dataset.part);}});});$('sr').textContent='2D-Ersatzmodell: '+introductions[id].name;}
 document.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>build(b.dataset.cell));
 $('listBtn').onclick=overview;$('overviewBtn').onclick=overview;
 $('helpBtn').onclick=()=>open('<div class="head"><h2>Bedienung</h2><button class="x" id="closePanel" aria-label="Schließen">×</button></div><p>Die interaktiven Strukturen können angeklickt oder über „Strukturen“ ausgewählt werden. Zum Öffnen der räumlich drehbaren Version ist ein Browser mit WebGL 2 erforderlich.</p>');
 $('labelBtn').onclick=()=>{showNames=!showNames;layer.classList.toggle('show-labels',showNames);$('labelBtn').setAttribute('aria-pressed',String(showNames));};
 $('envelopeBtn').onclick=()=>{showShell=!showShell;layer.classList.toggle('hide-shell',!showShell);$('envelopeBtn').setAttribute('aria-pressed',String(showShell));};
 $('resetBtn').onclick=()=>build(current);
 $('fullBtn').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
 window.addEventListener('keydown',e=>{if(e.key==='Escape')panel.classList.remove('open');});
 build('plant');
}

})();

