const FORMATS = ['Test','ODI','T20I','IPL'];
const pct = (a,b) => b ? (100*a/b).toFixed(1)+'%' : '–';
const PAGES = {
  // ---------------- EVERY MATCH ----------------
  async matches() {
    const [m, s] = await Promise.all([loadJSON('matches'), loadJSON('stats_computed')]);
    const cov = s.meta.coverage;
    $('#lead').innerHTML = `Every match in the Cricsheet ball-by-ball record in which he played: <b>${num(m.length)}</b> matches across Tests, ODIs, T20Is and the IPL, with his batting, keeping and the result in each. Coverage against official totals: ${FORMATS.map(f=>`${f} ${cov[f].found}${cov[f].official?'/'+cov[f].official:''}`).join(' · ')}. Missing matches are gaps in the public ball-by-ball record, not in his career.`;
    const opps = [...new Set(m.map(x=>x.opponent))].sort(), years=[...new Set(m.map(x=>x.date.slice(0,4)))].sort(), countries=[...new Set(m.map(x=>x.country))].sort(), events=[...new Set(m.map(x=>x.event).filter(Boolean))].sort();
    $('#controls').innerHTML = `
      <select id="f-format"><option value="">All formats</option>${FORMATS.map(f=>`<option>${f}</option>`).join('')}</select>
      <select id="f-year"><option value="">All years</option>${years.map(y=>`<option>${y}</option>`).join('')}</select>
      <select id="f-opp"><option value="">All opponents</option>${opps.map(o=>`<option>${esc(o)}</option>`).join('')}</select>
      <select id="f-country"><option value="">Anywhere</option>${countries.map(o=>`<option>${esc(o)}</option>`).join('')}</select>
      <select id="f-event"><option value="">All series & events</option>${events.map(o=>`<option>${esc(o)}</option>`).join('')}</select>
      <select id="f-result"><option value="">Any result</option><option value="won">Won</option><option value="lost">Lost</option><option value="drawn">Drawn</option><option value="tied">Tied</option><option value="no result">No result</option></select>
      <select id="f-cap"><option value="">Captain or not</option><option value="1">As captain</option><option value="0">Not captain</option></select>
      <select id="f-min"><option value="">Any score</option><option value="50">50+ runs</option><option value="100">100+ runs</option><option value="pom">Player of the match</option><option value="st">A stumping</option><option value="3d">3+ dismissals</option></select>
      <select id="f-sort"><option value="date">Newest first</option><option value="date-asc">Oldest first</option><option value="runs">Most runs</option><option value="dis">Most dismissals</option></select>
      <input id="f-q" placeholder="Search venue, event, summary…">`;
    const runsOf = x => x.dhoni.batting.reduce((a,b)=>a+b.runs,0), disOf = x => x.dhoni.keeping.catches + x.dhoni.keeping.stumpings;
    const batStr = x => x.dhoni.batting.length ? x.dhoni.batting.map(b=>`${b.runs}${b.notOut?'*':''} (${b.balls})`).join(' & ') : 'dnb';
    let page=0; const PER=50;
    function filtered() {
      const g=id=>$('#'+id).value; const q=g('f-q').toLowerCase();
      let r = m.filter(x => (!g('f-format')||x.format===g('f-format')) && (!g('f-year')||x.date.startsWith(g('f-year'))) && (!g('f-opp')||x.opponent===g('f-opp')) && (!g('f-country')||x.country===g('f-country')) && (!g('f-event')||x.event===g('f-event')) && (!g('f-result')||x.result===g('f-result')) && (g('f-cap')===''||String(+x.captain)===g('f-cap'))
        && (!q || [x.venue,x.city,x.event,x.summary,x.opponent].join(' ').toLowerCase().includes(q)));
      const mn=g('f-min'); if(mn==='50'||mn==='100') r=r.filter(x=>x.dhoni.batting.some(b=>b.runs>=+mn)); if(mn==='pom') r=r.filter(x=>x.dhoni.playerOfMatch); if(mn==='st') r=r.filter(x=>x.dhoni.keeping.stumpings>0); if(mn==='3d') r=r.filter(x=>disOf(x)>=3);
      const so=g('f-sort'); r.sort((a,b)=> so==='date'? b.date.localeCompare(a.date) : so==='date-asc'? a.date.localeCompare(b.date) : so==='runs'? runsOf(b)-runsOf(a) : disOf(b)-disOf(a));
      return r;
    }
    function draw() {
      const r=filtered(); const tot=r.length; page=Math.min(page, Math.max(0,Math.ceil(tot/PER)-1));
      const runs=r.reduce((a,x)=>a+runsOf(x),0), outs=r.reduce((a,x)=>a+x.dhoni.batting.filter(b=>!b.notOut).length,0), wins=r.filter(x=>x.result==='won').length, ct=r.reduce((a,x)=>a+x.dhoni.keeping.catches,0), st=r.reduce((a,x)=>a+x.dhoni.keeping.stumpings,0);
      $('#count').innerHTML = `<b>${num(tot)}</b> matches · ${num(runs)} runs at ${outs?(runs/outs).toFixed(2):'–'} · ${wins} won (${pct(wins,tot)}) · ${ct} ct, ${st} st`;
      const slice=r.slice(page*PER,(page+1)*PER);
      $('#content').innerHTML = `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Fmt</th><th>Opponent</th><th>Venue</th><th>Result</th><th>Batting</th><th class="n">Ct</th><th class="n">St</th><th>Cap</th></tr></thead><tbody>${slice.map(x=>`<tr class="mrow ${x.result}" data-id="${x.id}"><td class="d">${esc(fmtDate(x.date))}</td><td>${x.format}</td><td>${esc(x.opponent)}</td><td class="small">${esc(x.city||x.venue)}, ${esc(x.country)}</td><td>${esc(x.result)}${x.margin?` <span class="muted small">${esc(x.margin)}</span>`:''}</td><td>${batStr(x)}${x.dhoni.playerOfMatch?' <span class="tag">PoM</span>':''}</td><td class="n">${x.dhoni.keeping.catches||''}</td><td class="n">${x.dhoni.keeping.stumpings||''}</td><td>${x.captain?'©':''}</td></tr>`).join('')}</tbody></table></div>
        <div class="pager">${page>0?`<button class="chip" data-p="${page-1}">← Previous</button>`:''}<span class="muted small" style="padding:6px">Page ${page+1} of ${Math.max(1,Math.ceil(tot/PER))}</span>${(page+1)*PER<tot?`<button class="chip" data-p="${page+1}">Next →</button>`:''}</div>`;
    }
    draw();
    $('#controls').addEventListener('input', ()=>{page=0;draw();});
    $('#content').addEventListener('click', e => { const p=e.target.closest('[data-p]'); if(p){page=+p.dataset.p;draw();window.scrollTo({top:$('#count').offsetTop-80});return;} const row=e.target.closest('.mrow'); if(!row) return; const next=row.nextElementSibling; if(next&&next.classList.contains('mdetail')){next.remove();return;} const x=m.find(y=>y.id===row.dataset.id); const tr=document.createElement('tr'); tr.className='mdetail'; tr.innerHTML=`<td colspan="9"><b>${esc(x.event||'')}</b>${x.stage?` · ${esc(x.stage)}`:''} · ${esc(x.venue)}<br>${x.teamScores.map(t=>`${esc(t.team)} ${t.runs}/${t.wickets}${t.overs?` (${t.overs} ov)`:''}`).join(' · ')}<br>Toss: ${esc(x.toss?.winner||'')} ${esc(x.toss?.decision?'chose to '+x.toss.decision:'')} · ${x.battedFirst?'Batted first':'Batted second'}${x.dhoni.batting.map(b=>b.dismissal?` · ${b.runs}: ${esc(b.dismissal)}`:'').join('')}${x.dhoni.bowling?` · Bowled ${x.dhoni.bowling.balls} balls, ${x.dhoni.bowling.wickets}/${x.dhoni.bowling.runs}`:''}${x.dhoni.keeping.runOuts?` · ${x.dhoni.keeping.runOuts} run-out`:''}<br><span class="muted">${esc(x.summary)} · <a href="https://www.espncricinfo.com/search?q=${encodeURIComponent('Dhoni '+x.opponent+' '+x.date)}" target="_blank" rel="noopener">Scorecard search</a></span></td>`; row.after(tr); });
  },
  // ---------------- NUMBERS ----------------
  async stats() {
    const [s, rec, m] = await Promise.all([loadJSON('stats_computed'), loadJSON('records'), loadJSON('matches')]);
    const o = rec.official;
    $('#lead').textContent = 'Official career figures first, then everything the ball-by-ball archive can compute: by year, by opponent, by country, by batting position, batting first against chasing, and as captain.';
    let html = `<section><div class="section-head"><div><div class="eyebrow">Official</div><h2>Career summary</h2></div></div><div class="tablewrap"><table><thead><tr><th>Format</th><th>Span</th><th class="n">Mat</th><th class="n">Inns</th><th class="n">NO</th><th class="n">Runs</th><th class="n">HS</th><th class="n">Avg</th><th class="n">SR</th><th class="n">100</th><th class="n">50</th><th class="n">6s</th><th class="n">Ct</th><th class="n">St</th></tr></thead><tbody>${o.formats.map(f=>`<tr><td><b>${f.format}</b></td><td class="small muted">${f.span}</td><td class="n">${f.matches}</td><td class="n">${f.innings}</td><td class="n">${f.notOuts}</td><td class="n">${num(f.runs)}</td><td class="n">${f.highest}</td><td class="n">${f.average}</td><td class="n">${f.strikeRate}</td><td class="n">${f.hundreds}</td><td class="n">${f.fifties}</td><td class="n">${f.sixes}</td><td class="n">${f.catches}</td><td class="n">${f.stumpings}</td></tr>`).join('')}<tr><td><b>International</b></td><td class="small muted">2004 – 2019</td><td class="n">${o.international.matches}</td><td class="n">–</td><td class="n">–</td><td class="n">${num(o.international.runs)}</td><td class="n">183*</td><td class="n">–</td><td class="n">–</td><td class="n">${o.international.hundreds}</td><td class="n">${o.international.fifties}</td><td class="n">359</td><td class="n">${o.international.catches}</td><td class="n">${o.international.stumpings}</td></tr></tbody></table></div><div class="src">${esc(o.international.source)}; format rows ${esc(o.formats[0].source)}</div></section>`;
    // computed
    const years = Object.keys(s.byYear).sort();
    html += `<section><div class="section-head"><div><div class="eyebrow">Computed from ${num(m.length)} matches</div><h2>Year by year</h2></div></div><div class="grid2">
      ${barChart({title:'Runs per year, by format', labels:years, stacked:true, series:[{name:'ODI',data:years.map(y=>s.byYear[y].ODI?.runs||0)},{name:'Test',data:years.map(y=>s.byYear[y].Test?.runs||0),alt:true},{name:'T20I',data:years.map(y=>s.byYear[y].T20I?.runs||0)},{name:'IPL',data:years.map(y=>s.byYear[y].IPL?.runs||0),alt:true}], height:240})}
      ${lineChart({title:'ODI batting average and strike rate by year', labels:years.filter(y=>s.byYear[y].ODI), series:[{name:'Average',data:years.filter(y=>s.byYear[y].ODI).map(y=>s.byYear[y].ODI.average)},{name:'Strike rate',data:years.filter(y=>s.byYear[y].ODI).map(y=>s.byYear[y].ODI.strikeRate),alt:true}], height:240})}
      ${barChart({title:'Matches per year', labels:years, series:[{name:'Matches',data:years.map(y=>s.byYear[y].total.matches)}], height:200})}
      ${barChart({title:'Dismissals per year (all formats)', labels:years, series:[{name:'Dismissals',data:years.map(y=>s.byYear[y].total.dismissals)}], height:200})}
    </div></section>`;
    html += `<section><div class="section-head"><div><div class="eyebrow">Computed</div><h2>The finisher, in numbers</h2></div></div><div class="grid2">
      <div class="tablewrap"><table><thead><tr><th>Format</th><th class="n">Inns chasing</th><th class="n">Runs</th><th class="n">Avg</th><th class="n">SR</th><th class="n">Not outs</th><th class="n">Won chases he batted in</th><th class="n">Not out in won chase</th><th class="n">Avg in won chases</th></tr></thead><tbody>${FORMATS.map(f=>{const c=s.chasing[f]; if(!c) return ''; return `<tr><td><b>${f}</b></td><td class="n">${c.inningsBattingSecond}</td><td class="n">${num(c.runs)}</td><td class="n">${c.average}</td><td class="n">${c.strikeRate}</td><td class="n">${c.notOuts}</td><td class="n">${c.successfulChasesWhereDhoniBatted}</td><td class="n">${c.notOutInSuccessfulChase}</td><td class="n">${c.averageInSuccessfulChases}</td></tr>`;}).join('')}</tbody></table></div>
      ${hbarChart({title:'ODI runs by batting position', sub:'Innings in brackets; average shown', rows:Object.entries(s.battingPosition.ODI).map(([p,v])=>({label:`No.${p} (${v.innings} inns)`, value:v.average, alt:+p>=6}))})}
    </div></section>`;
    const oppF = f => Object.entries(s.byOpponent[f]||{}).filter(([k,v])=>v.matches>=3).sort((a,b)=>b[1].runs-a[1].runs);
    html += `<section><div class="section-head"><div><div class="eyebrow">Computed</div><h2>By opponent</h2></div><div class="filters" id="oppf">${FORMATS.map((f,i)=>`<button class="chip ${i===1?'active':''}" data-f="${f}">${f}</button>`).join('')}</div></div><div id="oppt"></div></section>`;
    const ctr = Object.entries(s.byCountry).map(([c,v])=>({c, m:Object.values(v).reduce((a,x)=>a+x.matches,0), r:Object.values(v).reduce((a,x)=>a+x.runs,0), w:Object.values(v).reduce((a,x)=>a+x.wins,0), v})).sort((a,b)=>b.m-a.m);
    html += `<section><div class="section-head"><div><div class="eyebrow">Computed</div><h2>By country</h2></div></div><div class="tablewrap"><table><thead><tr><th>Country</th><th class="n">Matches</th><th class="n">Runs</th><th class="n">Won</th><th>Test</th><th>ODI</th><th>T20I</th><th>IPL</th></tr></thead><tbody>${ctr.map(x=>`<tr><td><b>${esc(x.c)}</b></td><td class="n">${x.m}</td><td class="n">${num(x.r)}</td><td class="n">${x.w}</td>${FORMATS.map(f=>`<td class="small">${x.v[f]?`${x.v[f].matches} m · ${x.v[f].runs} r · avg ${x.v[f].average} · HS ${x.v[f].highest}`:''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
    html += `<section><div class="section-head"><div><div class="eyebrow">Computed</div><h2>Top innings and best keeping days</h2></div></div><div class="grid2">${FORMATS.map(f=>`<div class="tablewrap"><h3 style="margin:10px 0 4px">${f}</h3><table><thead><tr><th>Score</th><th>Opponent</th><th>Date</th><th>Result</th></tr></thead><tbody>${(s.topInnings[f]||[]).slice(0,10).map(t=>`<tr class="${t.result}"><td><b>${t.runs}${t.notOut?'*':''}</b> <span class="muted small">(${t.balls})</span></td><td>${esc(t.opponent)}</td><td class="d">${esc(fmtDate(t.date))}</td><td class="small">${esc(t.result)}</td></tr>`).join('')}</tbody></table></div>`).join('')}
      <div class="tablewrap"><h3 style="margin:10px 0 4px">Most dismissals in a match</h3><table><thead><tr><th>Ct + St</th><th>Fmt</th><th>Opponent</th><th>Date</th></tr></thead><tbody>${s.topKeeping.map(t=>`<tr><td><b>${t.dismissals}</b> <span class="muted small">(${t.catches}c ${t.stumpings}s)</span></td><td>${t.format}</td><td>${esc(t.opponent)}</td><td class="d">${esc(fmtDate(t.date))}</td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3>Bowling (yes, he bowled)</h3><p class="small">${FORMATS.map(f=>`<b>${f}</b>: ${s.bowling[f].balls} balls, ${s.bowling[f].runs} runs, ${s.bowling[f].wickets} wicket${s.bowling[f].wickets===1?'':'s'}${s.bowling[f].best?` (best ${s.bowling[f].best})`:''}`).join('<br>')}</p><p class="small muted">His only international wicket was Travis Dowlin of West Indies, Champions Trophy, Johannesburg, 30 September 2009. He has never bowled in the IPL.</p></div></div>
      <p class="src">${esc(s.meta.source)}. Coverage: ${FORMATS.map(f=>`${f} ${s.meta.coverage[f].found}${s.meta.coverage[f].official?' of '+s.meta.coverage[f].official:''}`).join(', ')}. ${s.meta.notes.map(esc).join(' ')}</p></section>`;
    $('#content').innerHTML = html;
    const drawOpp = f => { $('#oppt').innerHTML = `<div class="tablewrap"><table><thead><tr><th>Opponent</th><th class="n">Mat</th><th class="n">Runs</th><th class="n">Avg</th><th class="n">HS</th><th class="n">W</th><th class="n">L</th><th class="n">Ct</th><th class="n">St</th></tr></thead><tbody>${oppF(f).map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td class="n">${v.matches}</td><td class="n">${num(v.runs)}</td><td class="n">${v.average}</td><td class="n">${v.highest}</td><td class="n">${v.wins}</td><td class="n">${v.losses}</td><td class="n">${v.catches}</td><td class="n">${v.stumpings}</td></tr>`).join('')}</tbody></table></div>`; };
    drawOpp('ODI'); $('#oppf').onclick = e => { const b=e.target.closest('.chip'); if(!b) return; $$('.chip','#oppf'&&$('#oppf')).forEach(c=>c.classList.toggle('active',c===b)); drawOpp(b.dataset.f); };
  },
  // ---------------- RECORDS ----------------
  async records() {
    const r = await loadJSON('records');
    $('#lead').textContent = r.intro;
    const kindClass = k => /world/i.test(k)?'world':/india/i.test(k)?'india':/personal/i.test(k)?'personal':'';
    const kinds = [...new Set(r.records.map(x=>x.kind))];
    $('#filters').innerHTML = `<button class="chip active" data-k="all">All</button>` + kinds.map(k=>`<button class="chip" data-k="${esc(k)}">${esc(k)}</button>`).join('');
    const draw = k => { $('#content').innerHTML = `<div class="records">${r.records.filter(x=>k==='all'||x.kind===k).map(x=>`<article class="rec"><div class="kind ${kindClass(x.kind)}">${esc(x.kind)}</div><b>${esc(x.value)}</b><h3>${esc(x.title)}</h3><p>${esc(x.context)}</p><div class="stands">Still stands: ${esc(x.stands)}<br>Source: ${x.sourceUrl?`<a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener">${esc(x.source)}</a>`:esc(x.source)}</div></article>`).join('')}</div>`; };
    draw('all');
    $('#filters').onclick = e => { const b=e.target.closest('.chip'); if(!b) return; $$('.chip',$('#filters')).forEach(c=>c.classList.toggle('active',c===b)); draw(b.dataset.k); };
    $('#milestones').innerHTML = `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Milestone</th><th>Detail</th></tr></thead><tbody>${r.milestones.map(x=>`<tr><td class="d">${esc(fmtDate(x.date))}</td><td><b>${esc(x.title)}</b></td><td class="small">${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>`;
    $("#verification-tbl").innerHTML = `<div class="tablewrap"><table><thead><tr><th>Fact</th><th>Value used</th><th>Sources and notes</th><th>Status</th></tr></thead><tbody>${r.verification.map(x=>`<tr><td><b>${esc(x.fact)}</b></td><td>${esc(x.value)}</td><td class="small">${esc(x.sources)}</td><td><span class="status ${/discrep|corrected|coverage/.test(x.status)?'warn':''}">${esc(x.status)}</span></td></tr>`).join('')}</tbody></table></div>`;
  },
  // ---------------- CAPTAINCY ----------------
  async captaincy() {
    const [c, s] = await Promise.all([loadJSON('captaincy'), loadJSON('stats_computed')]);
    $('#lead').textContent = c.intro;
    let html = `<section><div class="section-head"><div><div class="eyebrow">Official</div><h2>Results as captain</h2></div></div><div class="grid2">
      <div class="tablewrap"><table><thead><tr><th>Format</th><th>Span</th><th class="n">Mat</th><th class="n">W</th><th class="n">L</th><th class="n">D</th><th class="n">T</th><th class="n">NR</th><th class="n">Win %</th></tr></thead><tbody>${c.summary.map(x=>`<tr><td><b>${x.format}</b></td><td class="small muted">${x.span}</td><td class="n">${x.matches}</td><td class="n">${x.won}</td><td class="n">${x.lost}</td><td class="n">${x.drawn}</td><td class="n">${x.tied}</td><td class="n">${x.nr}</td><td class="n">${x.winPct}</td></tr>`).join('')}</tbody></table><div class="src">ESPNcricinfo captaincy records</div></div>
      ${barChart({title:'Wins and losses as captain', labels:c.summary.slice(0,3).map(x=>x.format), series:[{name:'Won',data:c.summary.slice(0,3).map(x=>x.won)},{name:'Lost',data:c.summary.slice(0,3).map(x=>x.lost),alt:true}], height:220})}
    </div></section>`;
    html += `<section><div class="section-head"><div><div class="eyebrow">Why it worked</div><h2>Six habits, with evidence</h2></div></div><div class="pillars">${c.pillars.map(p=>`<div class="pillar"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><div class="ev"><b>Evidence.</b> ${esc(p.evidence)}</div></div>`).join('')}</div></section>`;
    html += `<section><div class="section-head"><div><div class="eyebrow">Decision lab</div><h2>What would you have done?</h2></div></div><p class="muted">Six real situations. Pick an option, then see what he chose and what happened. The point is the reasoning, not the applause.</p><div class="lab">${c.scenarios.map(sc=>`<div class="scenario" data-actual="${sc.actual}"><div class="eyebrow">${esc(sc.title)}</div><p>${esc(sc.situation)}</p><div class="opts">${sc.options.map((o,i)=>`<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div><div class="reveal"><b>What he did:</b> ${esc(sc.options[sc.actual])}.<br>${esc(sc.outcome)}<div class="src">${esc(sc.source)}</div></div></div>`).join('')}</div></section>`;
    html += `<section><div class="section-head"><div><div class="eyebrow">ICC events</div><h2>Tournament record as captain</h2></div></div><div class="grid2"><div class="tablewrap"><table><thead><tr><th>Year</th><th>Event</th><th>Result</th><th>Note</th></tr></thead><tbody>${c.iccTournaments.map(t=>`<tr class="${t.result==='Won'?'won':''}"><td class="d">${t.year}</td><td>${esc(t.event)}</td><td><b>${esc(t.result)}</b></td><td class="small muted">${esc(t.note)}</td></tr>`).join('')}</tbody></table></div>
      <div class="tablewrap"><h3 style="margin:10px 0 4px">Other trophies as captain</h3><table><tbody>${c.otherTrophies.map(t=>`<tr><td class="d">${t.year}</td><td><b>${esc(t.event)}</b><br><span class="small muted">${esc(t.note)}</span></td></tr>`).join('')}</tbody></table></div></div></section>`;
    html += `<section><div class="section-head"><div><div class="eyebrow">Tests</div><h2>Every Test series as captain</h2></div></div><div class="tablewrap"><table><thead><tr><th>Season</th><th>Opponent</th><th>Result</th><th>Note</th></tr></thead><tbody>${c.testSeries.map(t=>`<tr><td class="d">${esc(t.season)}</td><td>${esc(t.opponent)}</td><td><b>${esc(t.result)}</b></td><td class="small muted">${esc(t.note)}</td></tr>`).join('')}</tbody></table></div></section>`;
    const cap = s.captaincy;
    html += `<section><div class="section-head"><div><div class="eyebrow">Computed</div><h2>Batting as captain</h2></div></div><div class="tablewrap"><table><thead><tr><th>Format</th><th class="n">Matches in archive</th><th class="n">Won</th><th class="n">Lost</th><th class="n">Win %</th><th class="n">Runs as captain</th><th class="n">Average as captain</th></tr></thead><tbody>${FORMATS.map(f=>cap[f]?`<tr><td><b>${f}</b></td><td class="n">${cap[f].matches}</td><td class="n">${cap[f].wins}</td><td class="n">${cap[f].losses}</td><td class="n">${cap[f].winPct}</td><td class="n">${num(cap[f].runsAsCaptain)}</td><td class="n">${cap[f].averageAsCaptain}</td></tr>`:'').join('')}</tbody></table></div><p class="src">Cricsheet archive; captaincy flagged by date (${esc(s.meta.captaincyRule.ODI)} for ODIs), so counts differ slightly from the official table above.</p>
      ${c.quotes.map(q=>`<div class="quote"><p>“${esc(q.text)}”</p><cite>${esc(q.source)}</cite></div>`).join('')}</section>`;
    $('#content').innerHTML = html;
    $('#content').addEventListener('click', e => { const b=e.target.closest('.opt'); if(!b) return; const sc=b.closest('.scenario'); if(sc.classList.contains('done')) return; sc.classList.add('done'); $$('.opt',sc).forEach(o=>o.classList.add(+o.dataset.i===+sc.dataset.actual?'correct':'wrong')); });
  },
  // ---------------- KEEPING ----------------
  async keeping() {
    const [k, s] = await Promise.all([loadJSON('keeping'), loadJSON('stats_computed')]);
    $('#lead').textContent = k.intro;
    const years=Object.keys(s.byYear).sort();
    $('#content').innerHTML = `<section><div class="grid2"><div class="tablewrap"><table><thead><tr><th>Format</th><th class="n">Mat</th><th class="n">Catches</th><th class="n">Stumpings</th><th class="n">Dismissals</th><th class="n">Per match</th></tr></thead><tbody>${k.totals.map(t=>`<tr><td><b>${t.format}</b></td><td class="n">${t.matches}</td><td class="n">${t.catches}</td><td class="n">${t.stumpings}</td><td class="n">${t.dismissals}</td><td class="n">${t.perMatch}</td></tr>`).join('')}</tbody></table><div class="src">ESPNcricinfo wicketkeeping records</div></div>
      ${hbarChart({title:'Most international dismissals, all formats', sub:k.comparison.note, rows:k.comparison.keepers.map(x=>({label:x.name, value:x.dismissals, alt:x.name!=='MS Dhoni'}))})}
      ${hbarChart({title:'Stumpings: the gap', sub:'International stumpings, same keepers', rows:k.comparison.keepers.sort((a,b)=>b.stumpings-a.stumpings).map(x=>({label:x.name, value:x.stumpings, alt:x.name!=='MS Dhoni'}))})}
      ${barChart({title:'Dismissals per year (archive)', labels:years, series:[{name:'Dismissals',data:years.map(y=>s.byYear[y].total.dismissals)}], height:220})}
    </div></section>
    <section><div class="section-head"><div><div class="eyebrow">Technique</div><h2>How he kept</h2></div></div><div class="grid2">${k.skills.map(x=>`<div class="card"><h3>${esc(x.title)}</h3><p class="small">${esc(x.text)}</p></div>`).join('')}</div></section>
    <section><div class="section-head"><div><div class="eyebrow">Moments</div><h2>Famous hands</h2></div></div><div class="list">${k.famous.map(x=>`<article class="item"><div class="yr">${x.date.slice(0,4)}</div><div><div class="kind">${esc(fmtDate(x.date))}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div></article>`).join('')}</div>
    <p class="src">${k.sources.map(esc).join(' · ')}</p></section>`;
  },
  // ---------------- IPL ----------------
  async ipl() {
    const [p, s] = await Promise.all([loadJSON('ipl'), loadJSON('stats_computed')]);
    $('#lead').textContent = p.intro;
    const c=p.career; const yrs=p.seasons.map(x=>String(x.year));
    $('#content').innerHTML = `<section><div class="stats">${[['Matches',c.matches],['Runs',num(c.runs)],['Strike rate',c.strikeRate],['Titles / finals as captain',`${c.titles} / ${c.finals}`]].map(([l,v])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div><div class="src">${esc(c.source)}</div></section>
    <section><div class="section-head"><div><div class="eyebrow">Season by season</div><h2>Eighteen seasons</h2></div></div><div class="grid2">${barChart({title:'Runs per IPL season', labels:yrs, series:[{name:'Runs',data:p.seasons.map(x=>x.runs)}], height:220})}${lineChart({title:'Strike rate per season', labels:yrs, series:[{name:'SR',data:p.seasons.map(x=>x.strikeRate)}], height:220})}</div>
      <div class="tablewrap" style="margin-top:14px"><table><thead><tr><th>Year</th><th>Team</th><th class="n">Mat</th><th class="n">Runs</th><th class="n">Avg</th><th class="n">SR</th><th>Captain</th><th>Finish</th></tr></thead><tbody>${p.seasons.map(x=>`<tr class="${/Champions/.test(x.finish)?'won':''}"><td class="d">${x.year}</td><td>${x.team}</td><td class="n">${x.matches}</td><td class="n">${x.runs}</td><td class="n">${x.average}</td><td class="n">${x.strikeRate}</td><td>${x.captain?'©':''}</td><td>${esc(x.finish)}</td></tr>`).join('')}</tbody></table></div><p class="src">${esc(p.seasonNote)}</p></section>
    <section><div class="section-head"><div><div class="eyebrow">Dhoni × Chennai Super Kings</div><h2>Thala</h2></div></div><div class="grid2">${p.csk.map(x=>`<div class="card"><h3>${esc(x.title)}</h3><p class="small">${esc(x.text)}</p></div>`).join('')}</div></section>
    <section><div class="section-head"><div><div class="eyebrow">Rivals</div><h2>The finals opponents</h2></div></div><div class="grid3">${p.rivals.map(x=>`<div class="card"><h3>${esc(x.team)}</h3><p class="small">${esc(x.note)}</p></div>`).join('')}</div>
    ${s.byOpponent.IPL?`<div class="tablewrap" style="margin-top:14px"><table><thead><tr><th>IPL opponent (archive)</th><th class="n">Mat</th><th class="n">Runs</th><th class="n">Avg</th><th class="n">HS</th><th class="n">W</th><th class="n">L</th></tr></thead><tbody>${Object.entries(s.byOpponent.IPL).sort((a,b)=>b[1].matches-a[1].matches).map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td class="n">${v.matches}</td><td class="n">${v.runs}</td><td class="n">${v.average}</td><td class="n">${v.highest}</td><td class="n">${v.wins}</td><td class="n">${v.losses}</td></tr>`).join('')}</tbody></table></div>`:''}</section>`;
  },
  // ---------------- MOMENTS ----------------
  async moments() {
    const [mo, rp, images] = await Promise.all([loadJSON('moments'), loadJSON('replays'), loadJSON('images').catch(()=>[])]);
    $('#lead').textContent = mo.intro;
    const KEY = {'vizag-2005':'vizag2005','wc-2011-final':'wc2011final','wt20-2007-final':'wt20_2007final','ct-2013-final':'ct2013final','chennai-2013-224':'chennai2013test','wc-2019-semi':'wc2019semi','wt20-2016-bangladesh':'wt20_2016_ban'};
    const used=new Set();
    $('#content').innerHTML = `<div class="chapters">${mo.matches.map(x=>{ const yr=x.date.slice(0,4); const img=images.find(i=>!used.has(i.id)&&(i.tags||[]).some(t=>t.includes(yr))&&i.era!=='ranchi')||images.find(i=>!used.has(i.id)&&i.date&&String(i.date).startsWith(yr)); if(img) used.add(img.id); const r=rp[KEY[x.replay]];
      return `<article class="chapter ${img?'has-media':''}" id="${x.id}"><div><div class="date">${esc(fmtDate(x.date))} · ${esc(x.venue)} · ${x.format}</div><h2>${esc(x.title)}</h2><p class="subtitle">${esc(x.subtitle)}</p>${x.story.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="scoreline">${esc(x.stat)} · <b>${esc(x.result)}</b></div>${x.quote?`<blockquote class="sp serif" style="margin:.6rem 0;font-size:1.1rem">“${esc(x.quote.text)}”<br><span class="small muted">${esc(x.quote.source)}</span></blockquote>`:''}<div class="src">${esc(x.source)}</div>${r?`<button class="replaybtn" data-r="${esc(KEY[x.replay])}">▶ Relive it ball by ball</button><div class="rp"></div>`:''}</div>${img?imageFigure(img):''}</article>`; }).join('')}</div>`;
    $('#content').addEventListener('click', e => { const b=e.target.closest('.replaybtn'); if(!b) return; b.nextElementSibling.innerHTML = replayWidget(rp[b.dataset.r], b.dataset.r); b.remove(); });
  },
  // ---------------- TROPHIES ----------------
  async trophies() {
    const t = await loadJSON('trophies');
    $('#lead').textContent = t.intro;
    const CUP = `<svg class="cup" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3M12 14v4M8 20h8"/></svg>`;
    const card = x => `<article class="trophy">${CUP}<div class="yr">${x.year}</div><h3>${esc(x.title)}</h3>${x.team?`<p class="eyebrow">${esc(x.team)}</p>`:''}<p><b>Final.</b> ${esc(x.final)}</p>${x.route?`<p><b>Route.</b> ${esc(x.route)}</p>`:''}<p><b>Dhoni.</b> ${esc(x.dhoni)}</p>${x.squad?`<details><summary class="small">Squad</summary><p class="small">${esc(x.squad)}</p></details>`:''}${x.source?`<div class="src">${esc(x.source)}</div>`:''}</article>`;
    $('#content').innerHTML = `<section><div class="section-head"><div><div class="eyebrow">India</div><h2>International trophies</h2></div></div><div class="trophies">${t.international.map(card).join('')}</div>
      <div class="card" style="margin-top:18px"><h3>Only captain to win all three ICC white-ball trophies</h3><p class="small">2007 ICC World Twenty20 → 2011 ICC Cricket World Cup → 2013 ICC Champions Trophy. No other captain, man or woman, has completed the set. Source: ICC Hall of Fame citation, June 2025.</p></div></section>
      <section><div class="section-head"><div><div class="eyebrow">Chennai Super Kings</div><h2>Franchise trophies</h2></div></div><div class="trophies">${t.franchise.map(card).join('')}</div></section>
      <section><div class="section-head"><div><div class="eyebrow">IPL</div><h2>Ten finals as captain</h2></div></div><div class="tablewrap"><table><tbody>${t.finalsAsCaptain.map(f=>`<tr class="${f.result==='Won'?'won':'lost'}"><td class="d">${f.year}</td><td>${esc(f.event)}</td><td><b>${esc(f.result)}</b></td></tr>`).join('')}</tbody></table></div></section>`;
  },
  // ---------------- GALLERY ----------------
  async gallery() {
    const imgs = await loadJSON('images');
    const eras = (await loadJSON('timeline')).eras;
    const f = $('#filters'); f.innerHTML = `<button class="chip active" data-era="all">All</button>` + eras.filter(e=>imgs.some(i=>i.era===e.id)).map(e=>`<button class="chip" data-era="${e.id}">${esc(e.title)}</button>`).join('');
    const draw = era => { $('#content').innerHTML = `<div class="gallery">${imgs.filter(i=>era==='all'||i.era===era).map(i=>`<figure data-id="${i.id}"><img src="${esc(i.src)}" alt="${esc(i.alt||i.caption)}" decoding="async" loading="lazy" width="${i.w||''}" height="${i.h||''}"><figcaption>${esc(i.caption)}${i.date?` <span class="muted">(${esc(i.date)})</span>`:''}<span class="cred">${esc(i.author||'Unknown')} · ${esc(i.license)} · <a href="${esc(i.source)}" target="_blank" rel="noopener">Commons</a></span></figcaption></figure>`).join('')}</div>`; };
    draw('all');
    f.onclick = e => { const b=e.target.closest('.chip'); if(!b) return; $$('.chip',f).forEach(c=>c.classList.toggle('active',c===b)); draw(b.dataset.era); };
    const lb = document.createElement('div'); lb.className='lightbox'; lb.innerHTML='<button aria-label="Close">✕</button><img alt=""><p></p>'; document.body.appendChild(lb);
    $('#content').addEventListener('click', e => { if (e.target.closest('a')) return; const fig=e.target.closest('figure'); if(!fig) return; const i=imgs.find(x=>x.id===fig.dataset.id); $('img',lb).src=i.full||i.src; $('img',lb).alt=i.alt||i.caption; $('p',lb).textContent=`${i.caption} — ${i.author||''} · ${i.license}`; lb.classList.add('open'); });
    lb.onclick = () => lb.classList.remove('open'); document.addEventListener('keydown', e=>{ if(e.key==='Escape') lb.classList.remove('open'); });
  },
  // ---------------- VIDEOS ----------------
  async videos() {
    const v = await loadJSON('videos');
    const pls = [...new Set(v.map(x=>x.playlist).filter(Boolean))];
    const f = $('#filters'); f.innerHTML = `<button class="chip active" data-p="all">All</button>` + pls.map(p=>`<button class="chip" data-p="${esc(p)}">${esc(p)}</button>`).join('');
    const draw = p => { $('#content').innerHTML = `<div class="videos">${v.filter(x=>p==='all'||x.playlist===p).map(x=>`<article class="video">${ytFrame(x.youtube, x.title)}<div class="body"><h3>${esc(x.title)}</h3><p>${esc(x.channel)}${x.note?` · ${esc(x.note)}`:''}</p></div></article>`).join('')}</div>`; };
    draw('all');
    f.onclick = e => { const b=e.target.closest('.chip'); if(!b) return; $$('.chip',f).forEach(c=>c.classList.toggle('active',c===b)); draw(b.dataset.p); };
    wireYouTube($('#content'));
  },
  // ---------------- THE MAN ----------------
  async man() {
    const [m, q, images] = await Promise.all([loadJSON('man'), loadJSON('quotes'), loadJSON('images').catch(()=>[])]);
    $('#lead').textContent = m.intro;
    const pick = tag => images.find(i=>(i.tags||[]).includes(tag));
    const IMG = {family: pick('ranchi'), railways: pick('ranchi'), army: pick('army'), hof: pick('hall-of-fame'), retirement: pick('retirement'), bikes: pick('personal')};
    const seen=new Set();
    $('#content').innerHTML = `<div class="chapters">${m.sections.map(s=>{ let img=IMG[s.id]; if(img&&seen.has(img.id)) img=null; if(img) seen.add(img.id); return `<article class="chapter ${img?'has-media':''}" id="${s.id}"><div><h2>${esc(s.title)}</h2>${s.text.map(p=>`<p>${esc(p)}</p>`).join('')}${s.quote?`<div class="quote" style="margin:14px 0"><p style="font-size:1.15rem">“${esc(s.quote.text)}”</p><cite>${esc(s.quote.source)}</cite></div>`:''}${s.source?`<div class="src">${esc(s.source)}</div>`:''}</div>${img?imageFigure(img):''}</article>`; }).join('')}</div>
      <section><div class="section-head"><div><div class="eyebrow">In his words</div><h2>Quotes, with sources</h2></div></div><div class="grid2">${q.map(x=>`<div class="quote" style="margin:0"><p style="font-size:1.15rem">“${esc(x.text)}”</p><cite>${esc(x.source)}</cite></div>`).join('')}</div></section>
      <section><div class="section-head"><div><div class="eyebrow">Honours</div><h2>Awards</h2></div></div><div class="tablewrap"><table><thead><tr><th>Year</th><th>Award</th><th>Awarding body</th></tr></thead><tbody>${m.awards.map(a=>`<tr><td class="d">${a.year}</td><td><b>${esc(a.title)}</b></td><td class="small muted">${esc(a.body)}</td></tr>`).join('')}</tbody></table></div></section>
      <section><div class="section-head"><div><div class="eyebrow">Legacy</div><h2>What changed because of him</h2></div></div><div class="grid2">${m.legacy.map(l=>`<div class="card"><h3>${esc(l.title)}</h3><p class="small">${esc(l.text)}</p></div>`).join('')}</div></section>`;
  }
};
(async () => { await renderChrome(); try { await PAGES[$('main').dataset.page](); } catch (e) { console.error(e); $('#content').innerHTML = `<p class="muted">Could not load this page's data (${esc(e.message)}).</p>`; } })();
