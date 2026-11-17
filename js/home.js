(async () => {
  const site = await renderChrome();
  const [tl, images, quotes, man] = await Promise.all([loadJSON('timeline'), loadJSON('images').catch(()=>[]), loadJSON('quotes'), loadJSON('man')]);
  const byId = Object.fromEntries(images.map(i=>[i.id,i]));
  const hero = images.find(i=>i.hero) || images[0];
  $('#hero').innerHTML = `<div class="bg" style="background-image:url('${esc(hero?.src||'')}')"></div><div class="shade"></div><div class="wrap">
      <div class="eyebrow">${esc(site.subtitle)}</div><h1>MS DHONI</h1>
      <div class="sub">The Journey of a Legend</div>
      <div class="path">1981 — Ranchi → India → World Cricket → Immortality</div>
      <p class="tagline">${esc(site.tagline)}</p>
      <div class="cta"><a class="btn" href="#story">Enter the journey</a><a class="btn ghost" href="#life">Explore the timeline</a><a class="btn ghost" href="/matches">Every match</a></div></div>
      ${hero?`<div class="credit">Photo: ${esc(hero.author||'')} · ${esc(hero.license)} · Wikimedia Commons</div>`:''}`;
  $('#strip').innerHTML = `<div class="wrap">${site.stats.map(s=>`<div class="stat"><b data-count="${esc(s.value)}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div>`;
  // count-up
  const io = new IntersectionObserver(es => es.forEach(en => { if(!en.isIntersecting) return; const b=en.target; io.unobserve(b); const target=b.dataset.count; const n=parseInt(target.replace(/,/g,''),10); if(isNaN(n)){b.textContent=target;return;} const t0=performance.now(); const step=t=>{ const p=Math.min(1,(t-t0)/1400); const v=Math.round(n*(1-Math.pow(1-p,3))); b.textContent=v.toLocaleString('en-IN'); if(p<1) requestAnimationFrame(step); else b.textContent=target; }; requestAnimationFrame(step); }), {threshold:.5});
  $$('#strip b').forEach(b=>io.observe(b));
  $('#phrases').innerHTML = site.phrases.map(p=>`<span>${esc(p)}</span>`).join('');
  $('#eras').innerHTML = tl.eras.map(e=>`<a class="era" href="#${e.id}"><div class="years">${esc(e.years)}</div><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p></a>`).join('');
  const filters = $('#filters');
  const TAGS = ['Test','ODI','T20I','IPL','Captaincy','Trophy','Life','Award'];
  filters.innerHTML = `<button class="chip active" data-f="all">All</button>` + tl.eras.map(e=>`<button class="chip" data-f="era:${e.id}">${esc(e.title)}</button>`).join('') + `<span class="muted small" style="margin-left:6px">By kind:</span>` + TAGS.map(t=>`<button class="chip" data-f="tag:${t}">${t}</button>`).join('');
  const events = [...tl.events].sort((a,b)=>a.date.localeCompare(b.date));
  const used = new Set([hero?.id]);
  events.forEach(ev => {
    if (ev.media && byId[ev.media]) { ev._img = byId[ev.media]; used.add(ev.media); return; }
    const m = images.find(i => !used.has(i.id) && i.event===ev.id);
    if (m) { ev._img = m; used.add(m.id); }
  });
  // fallback: give each era's first few imageless events an unused era image
  tl.eras.forEach(e => { events.filter(ev=>ev.era===e.id && !ev._img).forEach(ev => { const m = images.find(i=>!used.has(i.id) && i.era===e.id); if (m) { ev._img=m; used.add(m.id); } }); });
  let qi = 0;
  function render(f) {
    let html = '';
    const [kind, val] = f.split(':');
    tl.eras.filter(e=>f==='all'||kind==='tag'||e.id===val).forEach(e => {
      const evs = events.filter(ev=>ev.era===e.id && (kind!=='tag' || (ev.tags||[]).includes(val)));
      if (!evs.length) return;
      html += `<div class="era-marker" id="${e.id}"><div class="eyebrow">${esc(e.years)}</div><h2>${esc(e.title)}</h2><p>${esc(e.summary)}</p></div>`;
      evs.forEach(ev => {
        html += `<article class="event ${ev._img?'has-img':''}" id="${ev.id}"><div>
          <div class="date">${esc(fmtDate(ev.date, {yearOnly: ev.date.endsWith('-01-01')}))}</div><h3>${esc(ev.title)}</h3><div class="place">${esc(ev.place||'')}</div>
          <p>${esc(ev.text)}</p><div class="tags">${(ev.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>${ev.source?`<div class="src">${esc(ev.source)}</div>`:''}</div>
          ${ev._img?imageFigure(ev._img):''}</article>`;
      });
      if (kind!=='tag') { const q = quotes[qi++ % quotes.length]; html += `<div class="quote"><p>“${esc(q.text)}”</p><cite>${esc(q.source)}</cite></div>`; }
    });
    $('#timeline').innerHTML = html;
  }
  render('all');
  filters.onclick = e => { const b=e.target.closest('.chip'); if(!b) return; $$('.chip',filters).forEach(c=>c.classList.toggle('active',c===b)); render(b.dataset.f); };
  $('#closing').innerHTML = `<div class="big">19:29</div><p>${esc(man.closing.text)}</p>`;
  if (location.hash) setTimeout(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView(),100);
})();
