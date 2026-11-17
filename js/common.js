const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const num = n => n == null ? '–' : Number(n).toLocaleString('en-IN');
function fmtDate(iso, {yearOnly=false}={}) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (yearOnly || !m) return String(y);
  if (!d) return `${MONTHS[m-1]} ${y}`;
  return `${d} ${MONTHS[m-1]} ${y}`;
}
const CACHE = {};
async function loadJSON(name) { if (CACHE[name]) return CACHE[name]; const r = await fetch(`/data/${name}.json`); if (!r.ok) throw new Error(name); return CACHE[name] = await r.json(); }
// Brand mark: a set of stumps with the bails flying
const MARK = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 36V14M20 36V14M28 36V14"/><path d="M9 11l7-4M24 7l7 4" stroke-width="2"/></svg>`;
async function renderChrome() {
  const site = await loadJSON('site');
  const pageTitle = $('main')?.dataset.title;
  document.title = pageTitle ? `${pageTitle} · ${site.title}` : site.title;
  const path = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  $('#site-header').innerHTML = `<div class="wrap">
    <a class="brand" href="/">${MARK}<span>${esc(site.name)}</span></a>
    <button class="navtoggle" aria-label="Menu" aria-expanded="false">☰</button>
    <nav class="main" aria-label="Main">${site.nav.map(n=>`<a href="${n.href}" ${n.href===path?'class="active" aria-current="page"':''}>${esc(n.label)}</a>`).join('')}
      <button class="themebtn" title="Toggle theme" aria-label="Toggle light and dark mode">◐</button></nav></div>`;
  $('#site-footer').innerHTML = `<div class="wrap">
    <div><strong class="serif" style="color:var(--ink)">${esc(site.title)}</strong><br>${esc(site.dates)}<br><br>${esc(site.occasion)}</div>
    <div>Text on this site is released under CC BY-SA 4.0. Photographs are from Wikimedia Commons and carry their own licences, shown with each image. Videos are embedded from their publishers' YouTube channels and remain their copyright. Career totals follow the ICC Hall of Fame citation and ESPNcricinfo; the match archive and charts are computed from Cricsheet ball-by-ball data (ODbL) and state their coverage. ${esc(site.dataNote)}<br><br><a href="https://github.com/rkmsd7/dhoni-tribute">Source on GitHub</a> · <a href="/records#verification">Verification table</a></div></div>`;
  $('.navtoggle').onclick = e => { const n=$('nav.main'); n.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', n.classList.contains('open')); };
  $('.themebtn').onclick = () => { const r=document.documentElement; r.dataset.theme = r.dataset.theme==='light' ? 'dark' : 'light'; try{localStorage.setItem('theme', r.dataset.theme)}catch{} };
  return site;
}
try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch {}
function imageFigure(img, {small=false}={}) {
  if (!img) return '';
  return `<figure><img src="${esc(img.src)}" alt="${esc(img.alt||img.caption)}" decoding="async" loading="lazy"><figcaption>${esc(img.caption)}${small?'':` <span class="cred">${esc(img.author||'')} · ${esc(img.license)}</span>`}</figcaption></figure>`;
}
function ytFrame(id, title) { return `<div class="frame"><button aria-label="Play ${esc(title||'video')}" data-yt="${esc(id)}" style="background-image:url(https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg)"></button></div>`; }
function wireYouTube(root=document) { root.addEventListener('click', e => { const b=e.target.closest('button[data-yt]'); if(!b) return; b.parentElement.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`; }); }
// ---- tiny SVG charts ----
function barChart({title, sub, labels, series, height=220, stacked=false, fmt=v=>v}) {
  const W=720, H=height, padL=38, padB=28, padT=12, padR=8;
  const n=labels.length, maxV=Math.max(1, ...labels.map((_,i)=>stacked? series.reduce((a,s)=>a+(s.data[i]||0),0) : Math.max(...series.map(s=>s.data[i]||0))));
  const iw=(W-padL-padR)/n, bw=stacked? iw*0.7 : iw*0.7/series.length;
  const y=v=>padT+(H-padT-padB)*(1-v/maxV);
  let g=''; const ticks=4; for(let t=0;t<=ticks;t++){ const v=maxV*t/ticks; g+=`<line class="grid" x1="${padL}" x2="${W-padR}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${padL-4}" y="${y(v)+3}" text-anchor="end">${fmt(Math.round(v))}</text>`; }
  let bars=''; labels.forEach((l,i)=>{ let base=0; series.forEach((s,k)=>{ const v=s.data[i]||0; if(!v) return; const x=padL+i*iw+iw*0.15+(stacked?0:k*bw); const y0=stacked? y(base+v) : y(v); const h=stacked? y(base)-y(base+v) : H-padB-y(v); bars+=`<rect class="bar ${s.alt?'alt':''}" x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" rx="2"><title>${esc(l)} · ${esc(s.name)}: ${fmt(v)}</title></rect>`; if(stacked) base+=v; }); const step=Math.ceil(n/14); if(i%step===0) bars+=`<text class="axis" x="${(padL+i*iw+iw/2).toFixed(1)}" y="${H-padB+14}" text-anchor="middle">${esc(l)}</text>`; });
  const legend = series.length>1 ? `<div class="legend">${series.map(s=>`<span><i style="background:${s.alt?'var(--blue)':'var(--gold)'}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><h3>${esc(title)}</h3>${sub?`<p class="sub">${esc(sub)}</p>`:''}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${g}${bars}</svg>${legend}</div>`;
}
function lineChart({title, sub, labels, series, height=220, fmt=v=>v, yMax}) {
  const W=720, H=height, padL=38, padB=28, padT=12, padR=8;
  const n=labels.length, maxV=yMax||Math.max(1,...series.flatMap(s=>s.data.filter(v=>v!=null)));
  const x=i=>padL+(W-padL-padR)*(n>1? i/(n-1):0.5), y=v=>padT+(H-padT-padB)*(1-v/maxV);
  let g=''; for(let t=0;t<=4;t++){ const v=maxV*t/4; g+=`<line class="grid" x1="${padL}" x2="${W-padR}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${padL-4}" y="${y(v)+3}" text-anchor="end">${fmt(Math.round(v))}</text>`; }
  const step=Math.ceil(n/14); labels.forEach((l,i)=>{ if(i%step===0) g+=`<text class="axis" x="${x(i).toFixed(1)}" y="${H-padB+14}" text-anchor="middle">${esc(l)}</text>`; });
  let paths=''; series.forEach(s=>{ let d='', pen=false; s.data.forEach((v,i)=>{ if(v==null){pen=false;return;} d+=(pen?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' '; pen=true; }); paths+=`<path class="line ${s.alt?'alt':''}" d="${d}"/>`; s.data.forEach((v,i)=>{ if(v!=null) paths+=`<circle class="dot" style="fill:${s.alt?'var(--blue)':'var(--gold)'}" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3"><title>${esc(labels[i])} · ${esc(s.name)}: ${fmt(v)}</title></circle>`; }); });
  const legend = series.length>1 ? `<div class="legend">${series.map(s=>`<span><i style="background:${s.alt?'var(--blue)':'var(--gold)'}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><h3>${esc(title)}</h3>${sub?`<p class="sub">${esc(sub)}</p>`:''}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${g}${paths}</svg>${legend}</div>`;
}
function hbarChart({title, sub, rows, fmt=v=>v}) { // rows: [{label, value, alt}]
  const maxV=Math.max(1,...rows.map(r=>r.value)); const rh=22, W=720, padL=150, H=rows.length*rh+8;
  const bars=rows.map((r,i)=>{ const w=(W-padL-60)*r.value/maxV; const y=4+i*rh; return `<text class="lbl" x="${padL-8}" y="${y+15}" text-anchor="end">${esc(r.label)}</text><rect class="bar ${r.alt?'alt':''}" x="${padL}" y="${y+3}" width="${w.toFixed(1)}" height="${rh-8}" rx="2"><title>${esc(r.label)}: ${fmt(r.value)}</title></rect><text class="lbl" x="${padL+w+6}" y="${y+15}">${fmt(r.value)}</text>`; }).join('');
  return `<div class="chart"><h3>${esc(title)}</h3>${sub?`<p class="sub">${esc(sub)}</p>`:''}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${bars}</svg></div>`;
}
// ---- replay widget (ball-by-ball) ----
function replayWidget(rp, key) {
  if (!rp) return '';
  const d = rp.dhoniInnings || [];
  let html = `<div class="replay"><div class="eyebrow">Relive</div><h3>${esc(rp.title)}</h3><p class="small muted">${esc(rp.result||'')} · Ball-by-ball from Cricsheet</p>`;
  if (d.length) {
    const labels = d.map(b=>b.ball), cum = d.map(b=>b.cum);
    html += lineChart({title:`Dhoni's innings, run by run`, sub:`${d.length} balls faced · ${d.filter(b=>b.four).length} fours, ${d.filter(b=>b.six).length} sixes`, labels, series:[{name:'Runs', data:cum}], height:180});
    html += `<div class="balls">${d.map(b=>`<span class="ball ${b.six?'six':b.four?'four':''}" title="${esc(b.o)} ${esc(b.bowler)}: ${b.r}">${b.r}</span>`).join('')}</div>`;
  }
  const full = (rp.innings||[]).filter(i=>i.deliveries && i.deliveries.length);
  full.forEach(inn => {
    const last = inn.deliveries.slice(-36);
    html += `<details><summary>${esc(inn.team)} innings — the last six overs${inn.target?` (target ${inn.target})`:''}</summary><div class="balls">${last.map((b,i)=>{ const over=b.o.split('.')[0]; const first = i===0 || last[i-1].o.split('.')[0]!==over; return (first?`<span class="over-lbl">Over ${+over+1} · ${esc(b.bowler)}</span>`:'')+`<span class="ball ${b.w?'w':b.t>=6?'six':b.t===4?'four':''}" title="${esc(b.o)} ${esc(b.batter)} b ${esc(b.bowler)}: ${b.t}${b.w?' · '+esc(b.w):''} · ${esc(b.score)}">${b.w?'W':b.t}</span>`; }).join('')}</div>
      ${inn.overTotals? lineChart({title:`${inn.team}: runs per over`, labels: inn.overTotals.map(o=>o.over), series:[{name:'Runs', data: inn.overTotals.map(o=>o.runs)}], height:150}) : ''}</details>`;
  });
  return html + '</div>';
}
