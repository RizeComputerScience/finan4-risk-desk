/* The Risk Desk: FINAN IV Unit 10 (risk and return: people need paying to take risk, two kinds of bad news, beta, the required return).
   Config for lib/coursedev/desk-engine. Real inputs (sources in ../sources/FACTS.md): 10-year Treasury 4.9% (Treasury par yield curve,
   2026-11-04), implied market premium 4.2% (Damodaran, start of 2026, 4.23%), betas DraftKings 1.61 and Con Edison 0.22 (Yahoo Finance,
   5Y monthly, 2026-11-04), BLS OEWS May 2025 wages and CFOI 2024 fatal injury rates, loss-aversion research.
   Names swept for reuse 2026-11-04 (case_reuse.py): Fallowfield Advisors, Fallowfield, Ingrid Sowande, Ingrid, Sowande, DraftKings (FINE),
   Con Edison and Consolidated Edison (CLEAN). Duke Energy was rejected (case-like use in FINAN VI).
   The two warm-ups have no right answers. They use the engine's opt-in `autosave` (no Check button; the answer is recorded the moment it
   is valid) and `parts` (each question's field sits under that question). Their judge accepts any sensible entry, records it on the
   receipt, and the praise shows what research found. The coin on the first warm-up flips for feel only: flips are not graded or recorded.
   Rework 2026-11-05 (Samuel's review, design/course-principles.md): round seeds, ten stocks not twenty, worked examples, β, sources
   folded away, tolerance sentences removed. seedVersion and version moved to 2, so saved progress and receipts from v1 do not carry over. */
(function (root) {
  'use strict';
  const RF = 0.049, ERP = 0.042, BD = 1.61, BC = 0.22;            // real inputs, see header
  const RD = RF + BD * ERP, RC = RF + BC * ERP;                   // 11.662% and 5.824%
  const RD1 = 0.117, RC1 = 0.058;                                 // the rounded rates the price step uses
  const STORE = 16;                                               // the store job's pay in the warm-up (fictional offer)
  const N = 10;                                                   // stocks in the spread-out portfolio (the reading uses $10,000 over ten)

  const QUIZ = [
    { title: 'Quick win: which bad news can you spread out?',
      q: 'Ingrid’s client owns stock in ten different companies. Which of these is bad news that owning ten stocks protects the client from?',
      options: ['A fire that shuts one company’s main factory', 'A recession', 'A rise in interest rates across the whole economy', 'A jump in oil prices that raises nearly every company’s costs'],
      answer: 0,
      why: ['Right. A factory fire hits one company. With the money spread over ten, only one tenth of it is in that company.',
        'A recession hits nearly every company at once, so all ten stocks tend to fall together. Owning more of them does not help.',
        'Higher interest rates affect nearly every company at once, so all ten stocks tend to move together.',
        'A jump in oil prices raises costs for nearly every company at once, so owning ten of them does not spread it out.'] },
    { title: 'Quick win: reading a beta',
      q: 'Con Edison’s beta (β) is 0.22. What does that tell you?',
      options: ['Its price tends to move much less than the market', 'It loses money 22% of the time', 'It earns a return of 22% a year', 'It tends to move 22% more than the market'],
      answer: 0,
      why: ['Right. With β = 0.22, when the market moves 10%, Con Edison tends to move only about 2.2%. People keep paying their electric bills in a recession.',
        'Beta says nothing about how often a stock loses money. It compares the size of the stock’s moves with the market’s moves.',
        'Beta is not a return. It measures how volatile a stock is next to the market.',
        'A beta above 1 means a stock moves more than the market. A beta of 0.22 is well below 1, so Con Edison moves much less.'] },
    { title: 'Quick win: what the gap means',
      q: 'DraftKings’ required return is about 11.7% and Con Edison’s is about 5.8%. What does the gap mean?',
      options: ['Investors expect more from DraftKings to make up for its more volatile price', 'DraftKings is guaranteed to earn 11.7% a year', 'DraftKings is the better investment', 'Con Edison is losing money'],
      answer: 0,
      why: ['Right. The required return is what investors need to expect before they will hold the stock. DraftKings’ price swings far more, so they need a bigger reward for living with it.',
        'Nothing is guaranteed. A required return is what investors expect on average; in a bad year DraftKings can fall much further than Con Edison.',
        'A higher required return pays for more risk. It does not make DraftKings better, only riskier, and some investors would rather have the steady stock.',
        'A lower required return means investors need less reward to hold Con Edison, because its price is steady. It says nothing about losses.'] },
    { title: 'Exam-style question',
      q: 'The 10-year Treasury yields 4.0%, the market premium is 5.0%, and a stock’s beta is 1.4. What is the stock’s required return?',
      options: ['11.0%', '9.0%', '7.0%', '12.6%'],
      answer: 0,
      why: ['Right. Required return = 4.0% + 1.4 × 5.0% = 4.0% + 7.0% = 11.0%. Questions on the exams look like this one.',
        '9.0% adds the Treasury yield and the market premium but leaves out the beta. Multiply the premium by 1.4 first.',
        '7.0% is beta × premium alone. Add the 4.0% Treasury yield to it.',
        '12.6% multiplies the Treasury yield by the beta as well. Only the premium gets multiplied: 4.0% + 1.4 × 5.0%.'] },
  ];

  const STEPS = [
    { id: 'w1', label: 'Coin flip warm-up', kind: 'task' },
    { id: 'w2', label: 'Summer job warm-up', kind: 'task' },
    { id: 'walk', label: 'What most people say', kind: 'walk' },
    { id: 't1', label: 'Recall or recession', kind: 'task' },
    { id: 'q1', label: 'Check 1', kind: 'check', quiz: 0 },
    { id: 't2', label: 'How jumpy?', kind: 'task' },
    { id: 'q2', label: 'Check 2', kind: 'check', quiz: 1 },
    { id: 't3', label: 'Required returns', kind: 'task' },
    { id: 'q3', label: 'Check 3', kind: 'check', quiz: 2 },
    { id: 't4', label: 'Price today', kind: 'task' },
    { id: 'q4', label: 'Exam-style question', kind: 'check', quiz: 3 },
    { id: 'note', label: 'Your note', kind: 'note' },
  ];

  function buildTasks(rng, h) {
    const T = [];
    T.push({ id: 'w1' });
    T.push({ id: 'w2' });
    const A = h.pick(rng, [10000, 20000, 30000, 40000]), d1 = h.pick(rng, [0.40, 0.50, 0.60]), d2 = h.pick(rng, [0.10, 0.20]);
    T.push({ id: 't1', A, d1, d2, one1: A * d1, ten1: A / N * d1, one2: A * d2, ten2: A * d2, decision: 'recall' });
    const mv = h.pick(rng, [-0.05, -0.10, -0.20, 0.05, 0.10, 0.20]), H = h.pick(rng, [1000, 2000, 5000, 10000]);
    T.push({ id: 't2', mv, H, dk: BD * mv, ce: BC * mv, dkD: H * BD * mv, ceD: H * BC * mv });
    T.push({ id: 't3', dkP: BD * ERP, dk: RD, ceP: BC * ERP, ce: RC });
    const X = h.between(rng, 60, 150, 5);
    T.push({ id: 't4', X, pD: X / (1 + RD1), pC: X / (1 + RC1), decision: 'dk' });
    return T;
  }

  const m = (x, dp) => root.DeskEngine.h.money(x, dp);
  const sgn = (x, dp) => (x >= 0 ? '+' : '−') + m(Math.abs(x), dp);
  const pc = (x, dp) => { const d = dp == null ? 1 : dp; const v = Math.round(x * 100 * Math.pow(10, d)) / Math.pow(10, d); return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%'; };
  const spc = (x, dp) => (x >= 0 ? '+' : '') + pc(x, dp);
  const cell = (L, y, label) => `<label class="sr-only" for="r${y}">${label}</label><input id="r${y}" class="rowin" data-row="${y}" inputmode="decimal" autocomplete="off" value="${(L.rows || [])[y] ? String(L.rows[y]).replace(/"/g, '') : ''}"><span class="mark" id="mk${y}"></span>`;
  // A percentage typed as 11.7, 11.7% or 0.117 all read as 0.117. A bare number under 1 is read whichever way matches.
  function pctOf(raw, exact, h) {
    const s = String(raw == null ? '' : raw); const v = h.parseMoney(s);
    if (!isFinite(v) || /%/.test(s)) return v;
    if (exact != null && Math.abs(v / 100 - exact) <= 0.0007) return v / 100;
    return Math.abs(v) >= 1 ? v / 100 : v;
  }
  const judgePct = (raw, exact, diag, h, other) => h.judgeNumber(pctOf(raw, exact, h), exact, diag, { tol: 0.0007, unreadable: 'Type a percentage, like 11.7%.', closeMsg: 'Close. Keep two decimal places in the percentages and round only at the end.', otherMsg: other });
  // prose: the columns that hold words rather than numbers (they wrap and use the text font)
  const tbl = (cap, head, rows, prose) => { const P = prose || [0];
    return `<div class="tw"><table class="cf"><caption>${cap}</caption>${head ? `<thead><tr>${head.map((x, i) => `<th scope="col"${P.includes(i) ? ' style="text-align:left"' : ''}>${x}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map((r) => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${r.c.map((x, i) => `<td${P.includes(i) ? ' class="lbl"' : ''}>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; };

  // The coin on the first warm-up: for feel only, never graded or recorded. The tally lasts while the page is open.
  const flips = { h: 0, t: 0 };
  const COIN_CSS = `.coin-row{display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;margin:.7rem 0 .3rem}
.coin{width:60px;height:60px;position:relative;flex:none;transform-style:preserve-3d;perspective:none}
.coin .face{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 15px var(--serif);letter-spacing:.02em;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:3px solid #8C6D1F;background:radial-gradient(circle at 35% 30%,#F8E7A8,#D9B24A 65%,#B48E2C);color:#4A3A0C}
.coin .face.tails{transform:rotateY(180deg)}
.coin.res-t{transform:rotateY(180deg)}
.coin.spin.res-h{animation:coinH .6s ease-out}
.coin.spin.res-t{animation:coinT .6s ease-out}
@keyframes coinH{0%{transform:translateY(0) rotateY(0deg)}50%{transform:translateY(-16px) rotateY(900deg)}100%{transform:translateY(0) rotateY(1800deg)}}
@keyframes coinT{0%{transform:translateY(0) rotateY(0deg)}50%{transform:translateY(-16px) rotateY(990deg)}100%{transform:translateY(0) rotateY(1980deg)}}
@media (prefers-reduced-motion:reduce){.coin.spin.res-h,.coin.spin.res-t{animation:none}}
.coin-out{font-size:16px;margin:0}`;
  const tallyText = () => (flips.h + flips.t ? `Heads ${flips.h}, Tails ${flips.t}` : 'Try a few flips before you answer.');
  const coinHtml = () => `<div class="coin-row"><div class="coin ${flips.last === 't' ? 'res-t' : 'res-h'}" id="coin" aria-hidden="true"><span class="face heads">Heads</span><span class="face tails">Tails</span></div>
    <button class="btn small secondary" type="button" id="flipBtn">Flip the coin</button><p class="coin-out" id="coinOut" aria-live="polite">${tallyText()}</p></div>`;
  function wireCoin($) {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('coinCss')) { const st = document.createElement('style'); st.id = 'coinCss'; st.textContent = COIN_CSS; document.head.appendChild(st); }
    const btn = $('#flipBtn'), coin = $('#coin'), out = $('#coinOut'); if (!btn || !coin) return;
    const still = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    btn.addEventListener('click', () => {
      const side = Math.random() < 0.5 ? 'h' : 't'; btn.disabled = true; out.textContent = 'Flipping…';
      coin.classList.remove('spin', 'res-h', 'res-t'); void coin.offsetWidth; coin.classList.add('res-' + side); if (!still) coin.classList.add('spin');
      setTimeout(() => { flips[side]++; flips.last = side; out.textContent = (side === 'h' ? 'Heads. ' : 'Tails. ') + 'So far: ' + tallyText(); btn.disabled = false; }, still ? 0 : 620);
    });
  }

  function taskView(t, L, h) {
    if (t.id === 'w1') return { title: 'Warm-up: a coin flip', place: 'No right answers here. Ingrid wants to know how you feel about risk.',
      noCalc: true, autosave: true, wire: wireCoin,
      parts: [
        { html: `<p>A bet on one flip of a fair coin: <b>tails, you pay $10</b>. Heads, you win an amount you choose.</p>${coinHtml()}`, field: 'value' },
        { html: '<p>Now nothing can be lost. Take <b>$10 for sure</b>, or flip for <b>$20 or $0</b>.</p>', field: 'choice' }],
      value: { label: '1. What is the smallest win that would get you to take this bet?', placeholder: '$0', help: '' },
      choice: { legend: '2. Which do you take?', options: [['sure', 'The sure $10'], ['flip', 'Flip for $20 or $0']] },
      sources: '<p>Loss aversion: Brown, Imai, Vieider and Camerer, “Meta-Analysis of Empirical Estimates of Loss Aversion,” <i>Journal of Economic Literature</i>, 2024. The sure thing: Kahneman and Tversky, “Prospect Theory,” <i>Econometrica</i>, 1979.</p>' };
    if (t.id === 'w2') return { title: 'Warm-up: two summer jobs', place: 'One more, about work. Again, no right answers.',
      body: `<p>You have two full-time summer offers.</p>
        ${tbl('The two jobs', ['Job', 'What you do', 'Pay'], [{ c: ['Hardware store', 'Stock shelves indoors, with air conditioning', `${m(STORE)} an hour`] }, { c: ['Roofing crew', 'Carry shingles up ladders onto steep roofs in July heat', 'You decide'] }], [0, 1])}`,
      noCalc: true, autosave: true,
      value: { label: 'How much an hour would the roofing job have to pay before you would take it over the store job?', placeholder: '$0', help: '' },
      sources: '<p>Wages: Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025 (median hourly wage). Deaths on the job: Bureau of Labor Statistics, Census of Fatal Occupational Injuries, 2024.</p>' };
    if (t.id === 't1') return { title: 'One stock or ten: a recall and a recession', place: 'A new client has ' + m(t.A) + ' to invest. She wants to put all of it into one company she likes, a maker of children’s car seats.',
      body: `<p>Ingrid shows her two ways the money could go:</p>
        <ul><li><b>One stock:</b> all ${m(t.A)} in the car-seat maker.</li><li><b>Ten stocks:</b> ${m(t.A / N)} in each of ten companies, one of them the car-seat maker.</li></ul>
        <p>Then two kinds of bad news:</p>
        <ul><li><b>A recall.</b> A faulty buckle forces a recall. The car-seat maker’s stock falls <b>${pc(t.d1, 0)}</b>. The other nine companies are not affected.</li>
        <li><b>A recession.</b> People spend less, so nearly every company sells less. All ten stocks fall <b>${pc(t.d2, 0)}</b>.</li></ul>`,
      example: `<p>$5,000 split over ten stocks is $500 in each.</p>
        <p>One company’s stock falls 30%. One stock loses $5,000 × 30% = $1,500.</p>
        <p>Ten stocks lose only the $500 in that company: $500 × 30% = $150.</p>
        <p>Every stock falls 15%. Both lose $5,000 × 15% = $750.</p>`,
      table: `<div class="tw"><table class="cf"><caption>Dollars the client loses</caption><thead><tr><th scope="col" style="text-align:left">Bad news</th><th scope="col">One stock</th><th scope="col">Ten stocks</th></tr></thead><tbody>
        <tr><td class="lbl">The recall (car-seat maker falls ${pc(t.d1, 0)})</td><td>${cell(L, 1, 'Recall loss with one stock')}</td><td>${cell(L, 2, 'Recall loss with ten stocks')}</td></tr>
        <tr><td class="lbl">The recession (every stock falls ${pc(t.d2, 0)})</td><td>${cell(L, 3, 'Recession loss with one stock')}</td><td>${cell(L, 4, 'Recession loss with ten stocks')}</td></tr></tbody></table></div>`,
      choice: { legend: 'Owning ten stocks protected the client from', options: [['recall', 'The recall only'], ['recession', 'The recession only'], ['both', 'Both'], ['neither', 'Neither']] },
      helpLabels: ['Show me the recall row', 'Show me both rows'] };
    if (t.id === 't2') {
      const dir = t.mv < 0 ? 'falls' : 'rises';
      return { title: 'How jumpy is each stock?', place: `The client also owns ${m(t.H)} of DraftKings, the sports-betting company, and ${m(t.H)} of Con Edison, New York City’s electric company.`,
        body: `<p>A stock’s <b>beta (β)</b> measures how volatile it is next to the market. With β = 1 a stock tends to move as much as the market. With β = 2 it tends to move twice as much, and with β = 0.5 half as much.</p>
          <p class="formula">stock’s move = β × market move</p>`,
        example: `<p>The market falls 4%. A stock with β = 1.5 tends to move 1.5 × −4% = −6%.</p>
          <p>On $3,000 that is $3,000 × −6% = −$180.</p>`,
        parts: [{ html: `${tbl('Betas, November 2026', ['Stock', 'β'], [{ c: ['DraftKings', BD.toFixed(2)] }, { c: ['Con Edison', BC.toFixed(2)] }])}
          <p>Now the market <b>${dir} ${pc(Math.abs(t.mv), 0)}</b> next month. Fill in each stock’s move and the change in the client’s ${m(t.H)}.</p>`, field: 'table' }],
        table: `<div class="tw"><table class="cf"><caption>If the market ${dir} ${pc(Math.abs(t.mv), 0)}</caption><thead><tr><th scope="col" style="text-align:left">Line</th><th scope="col">DraftKings</th><th scope="col">Con Edison</th></tr></thead><tbody>
          <tr><td class="lbl">The stock’s move (β × market move), %</td><td>${cell(L, 1, 'DraftKings move in percent')}</td><td>${cell(L, 2, 'Con Edison move in percent')}</td></tr>
          <tr><td class="lbl">Change in the client’s ${m(t.H)}, dollars</td><td>${cell(L, 3, 'DraftKings change in dollars')}</td><td>${cell(L, 4, 'Con Edison change in dollars')}</td></tr></tbody></table></div>
          <p class="small">Type a percentage like −6.5 or −6.5%. Start a fall with a minus sign.</p>`,
        sources: '<p>Betas: Yahoo Finance, “Beta (5Y Monthly),” November 4, 2026, each matching StockAnalysis.</p>',
        helpLabels: ['Show me the percentages', 'Show me every cell'] };
    }
    if (t.id === 't3') return { title: 'The required return for each stock', place: 'The client asks what return she should expect from each stock for the risk she is taking.',
      body: `<p>The <b>required return</b> is the return investors need to expect before they will hold a stock.</p>
        <p class="formula">required return = Treasury yield + β × market premium</p>
        <ul><li>The <b>Treasury yield</b> is what the US government pays to borrow for 10 years, the safest return available.</li>
        <li>The <b>market premium</b> is the extra return investors expect for owning the whole stock market instead.</li></ul>`,
      example: `<p>Treasury yield 3%, β = 1.5, market premium 6%.</p>
        <p>β × market premium = 1.5 × 6% = 9%.</p>
        <p>Required return = 3% + 9% = 12%.</p>`,
      parts: [{ html: '<p>Now the real numbers for November 2026. Type each answer as a percentage.</p>', field: 'table' }],
      table: `<div class="tw"><table class="cf"><caption>Required returns, November 2026</caption><thead><tr><th scope="col" style="text-align:left">Line</th><th scope="col">DraftKings</th><th scope="col">Con Edison</th></tr></thead><tbody>
        <tr><td class="lbl">Treasury yield, 10 years</td><td>${pc(RF)}</td><td>${pc(RF)}</td></tr>
        <tr><td class="lbl">β</td><td>${BD.toFixed(2)}</td><td>${BC.toFixed(2)}</td></tr>
        <tr><td class="lbl">Market premium</td><td>${pc(ERP)}</td><td>${pc(ERP)}</td></tr>
        <tr><td class="lbl">β × market premium</td><td>${cell(L, 1, 'DraftKings beta times premium')}</td><td>${cell(L, 3, 'Con Edison beta times premium')}</td></tr>
        <tr class="total hl"><td class="lbl"><b>Required return</b> (Treasury yield + β × market premium)</td><td>${cell(L, 2, 'DraftKings required return')}</td><td>${cell(L, 4, 'Con Edison required return')}</td></tr></tbody></table></div>`,
      sources: '<p>Treasury yield: US Treasury, daily par yield curve, 10-year rate on November 4, 2026. Market premium: Aswath Damodaran (NYU), implied premium at the start of 2026 (4.23%). Betas: Yahoo Finance, “Beta (5Y Monthly),” November 4, 2026.</p>',
      helpLabels: ['Show me DraftKings', 'Show me both columns'] };
    if (t.id === 't4') return { title: 'Why the risky stock sells cheaper', place: 'The client asks why anyone would buy the riskier stock at all.',
      body: `<p>Ingrid answers with a simple case. One share of each company is expected to be worth <b>${m(t.X)}</b> a year from now, counting any dividend. Investors pay today only what that ${m(t.X)} is worth at the return they require. It is the same discounting as Unit 4:</p>
        <p class="formula">price today = value next year ÷ (1 + required return)</p>
        <p>Use the rounded required returns from the last step: <b>${pc(RD1)}</b> for DraftKings and <b>${pc(RC1)}</b> for Con Edison.</p>`,
      example: `<p>A share expected to be worth $106 next year, with a required return of 6%:</p>
        <p>$106 ÷ 1.06 = $100.00 today.</p>`,
      table: `<div class="tw"><table class="cf"><caption>Price today of a share expected to be worth ${m(t.X)} in a year</caption><thead><tr><th scope="col" style="text-align:left">Stock</th><th scope="col">Required return</th><th scope="col">Price today</th></tr></thead><tbody>
        <tr><td class="lbl">DraftKings</td><td>${pc(RD1)}</td><td>${cell(L, 1, 'DraftKings price today')}</td></tr>
        <tr><td class="lbl">Con Edison</td><td>${pc(RC1)}</td><td>${cell(L, 2, 'Con Edison price today')}</td></tr></tbody></table></div>
        <p class="small">Give each price to the cent.</p>`,
      choice: { legend: 'If both shares are worth ' + m(t.X) + ' in a year, as expected, which buyer earns the higher return?', options: [['dk', 'The buyer of DraftKings'], ['ce', 'The buyer of Con Edison'], ['same', 'Both earn the same']] },
      helpLabels: ['Show me DraftKings', 'Show me both prices'] };
  }

  function judgeTask(t, e, h) {
    const rows = e.rows || [];
    if (t.id === 'w1') {
      const v = h.parseMoney(e.value);
      if (!isFinite(v) || v <= 0) return { ok: false, code: 'novalue', msg: 'Type a dollar amount for question 1, like 15.' };
      if (v > 1e6) return { ok: false, code: 'huge', msg: 'Type an amount under $1,000,000. If no amount would get you to bet, type 1000000.' };
      if (e.choice !== 'sure' && e.choice !== 'flip') return { ok: false, code: 'nochoice', msg: 'Now pick an answer to question 2.' };
      t.mine = { choice: e.choice, v }; return { ok: true };
    }
    if (t.id === 'w2') {
      const v = h.parseMoney(e.value);
      if (!isFinite(v) || v <= 0) return { ok: false, code: 'novalue', msg: 'Type an hourly amount in dollars, like 20.' };
      if (v > 1000) return { ok: false, code: 'huge', msg: 'Type an hourly amount under $1,000. If no pay would get you on a roof, type 1000.' };
      t.mine = { v }; return { ok: true };
    }
    if (t.id === 't1') {
      const abs = (s) => Math.abs(h.parseMoney(s)); const rr = []; const each = t.A / N;
      rr[1] = h.judgeNumber(abs(rows[1]), t.one1, [[t.A * (1 - t.d1), 'left', 'That is what is left. Give the dollars lost.']], { otherMsg: `${m(t.A)} × ${pc(t.d1, 0)}.` });
      rr[2] = h.judgeNumber(abs(rows[2]), t.ten1, [[t.one1, 'all', `Only one of the ten companies had the recall, and the client has ${m(each)} in it.`], [each, 'whole', `That is the whole ${m(each)} in the car-seat maker. Its stock fell ${pc(t.d1, 0)}, not to zero.`], [each * (1 - t.d1), 'left', 'That is what is left. Give the dollars lost.']],
        { otherMsg: `${m(t.A)} ÷ 10 = ${m(each)} is in the car-seat maker. It fell ${pc(t.d1, 0)}.` });
      rr[3] = h.judgeNumber(abs(rows[3]), t.one2, [[t.one1, 'recall', `That uses the recall’s ${pc(t.d1, 0)}. In the recession the stock fell ${pc(t.d2, 0)}.`], [t.A * (1 - t.d2), 'left', 'That is what is left. Give the dollars lost.']], { otherMsg: `${m(t.A)} × ${pc(t.d2, 0)}.` });
      rr[4] = h.judgeNumber(abs(rows[4]), t.ten2, [[t.A * t.d2 / N, 'one', `A recession hits nearly every company. All ten stocks fall ${pc(t.d2, 0)}, so all ${m(t.A)} falls.`], [t.ten1, 'recall', 'That is the recall’s loss. In the recession every stock falls.']], { otherMsg: `Every stock falls ${pc(t.d2, 0)}, so the loss is ${m(t.A)} × ${pc(t.d2, 0)}.` });
      const names = ['', 'Recall, one stock', 'Recall, ten stocks', 'Recession, one stock', 'Recession, ten stocks'];
      const bad = [1, 2, 3, 4].find((y) => !rr[y].ok);
      if (bad) return { ok: false, rowRes: rr, msg: `${names[bad]}: ${rr[bad].msg}` };
      if (e.choice !== t.decision) return { ok: false, rowRes: rr, msg: !e.choice ? 'Say what owning ten stocks protected the client from as well.' : 'Compare the two columns row by row. In which row is the ten-stock loss much smaller than the one-stock loss?' };
      return { ok: true, rowRes: rr };
    }
    if (t.id === 't2') {
      const rr = []; const dir = t.mv < 0 ? 'fell' : 'rose';
      const pr = (y, b, ex) => judgePct(rows[y], ex, [[t.mv, 'market', `That is the market’s move. Multiply it by β, ${b.toFixed(2)}.`], [b, 'beta', `That is β itself. Multiply β, ${b.toFixed(2)}, by the market’s move, ${spc(t.mv, 0)}.`], [b / 100, 'beta', `That is β itself. Multiply β, ${b.toFixed(2)}, by the market’s move, ${spc(t.mv, 0)}.`], [t.mv + b / 100, 'add', `Multiply the market’s move by β, ${b.toFixed(2)}; do not add them.`], [t.mv / b, 'div', `Multiply by β, ${b.toFixed(2)}, rather than dividing.`]], h, `${b.toFixed(2)} × ${spc(t.mv, 0)}.`);
      rr[1] = pr(1, BD, t.dk); rr[2] = pr(2, BC, t.ce);
      const dr = (y, b, ex) => h.judgeNumber(h.parseMoney(rows[y]), ex, [[t.H * t.mv, 'market', `That is the market’s move on ${m(t.H)}. Use the stock’s own move, β × market move.`], [t.H * (1 + b * t.mv), 'value', 'That is the new value. Give the change, starting a fall with a minus sign.'], [t.H * b, 'hb', `That is ${m(t.H)} × β. Multiply ${m(t.H)} by the stock’s move from the row above.`]], { minTol: 1, otherMsg: `${m(t.H)} × the stock’s move.` });
      rr[3] = dr(3, BD, t.dkD); rr[4] = dr(4, BC, t.ceD);
      for (const y of [1, 2, 3, 4]) if (!rr[y].ok && rr[y].code === 'sign') rr[y].msg = `The market ${dir}, and a positive β moves the same way as the market, so ${t.mv < 0 ? 'start with a minus sign' : 'the change is positive'}.`;
      const names = ['', 'DraftKings move', 'Con Edison move', 'DraftKings dollars', 'Con Edison dollars'];
      const bad = [1, 2, 3, 4].find((y) => !rr[y].ok);
      if (bad) return { ok: false, rowRes: rr, msg: `${names[bad]}: ${rr[bad].msg}` };
      return { ok: true, rowRes: rr };
    }
    if (t.id === 't3') {
      const rr = [];
      const bp = (y, b, ex) => judgePct(rows[y], ex, [[RF + ex, 'rf', 'That adds the Treasury yield already. This row is β × market premium only.'], [ERP, 'erp', `That is the premium alone. Multiply it by β, ${b.toFixed(2)}.`], [b * (RF + ERP), 'both', 'Multiply only the market premium by β.']], h, `${b.toFixed(2)} × ${pc(ERP)}.`);
      const rq = (y, b, ex) => judgePct(rows[y], ex, [[RF + ERP, 'nobeta', `That adds the whole premium. Multiply the premium by β, ${b.toFixed(2)}, first.`], [b * ERP, 'norf', `Add the Treasury yield, ${pc(RF)}, to β × premium.`], [b * (RF + ERP), 'both', `Only the premium gets multiplied by β: ${pc(RF)} + ${b.toFixed(2)} × ${pc(ERP)}.`], [RF * b + ERP, 'swap', `Multiply the premium by β, not the Treasury yield: ${pc(RF)} + ${b.toFixed(2)} × ${pc(ERP)}.`]], h, `${pc(RF)} + ${b.toFixed(2)} × ${pc(ERP)}.`);
      rr[1] = bp(1, BD, t.dkP); rr[2] = rq(2, BD, t.dk); rr[3] = bp(3, BC, t.ceP); rr[4] = rq(4, BC, t.ce);
      const names = ['', 'DraftKings, β × premium', 'DraftKings, required return', 'Con Edison, β × premium', 'Con Edison, required return'];
      const bad = [1, 2, 3, 4].find((y) => !rr[y].ok);
      if (bad) return { ok: false, rowRes: rr, msg: `${names[bad]}: ${rr[bad].msg}` };
      return { ok: true, rowRes: rr };
    }
    if (t.id === 't4') {
      const rr = []; const tol = 0.0015 * t.X;
      const pr = (y, r, other, ex) => h.judgeNumber(h.parseMoney(rows[y]), ex, [[t.X * (1 - r), 'sub', `Divide by (1 + ${pc(r)}) rather than subtracting ${pc(r)}: ${m(t.X)} ÷ ${(1 + r).toFixed(3)}.`], [t.X * (1 + r), 'mult', `That grows the ${m(t.X)}. Divide by (1 + ${pc(r)}) to bring it back to today.`], [t.X / (1 + other), 'swap', 'That uses the other company’s required return.'], [t.X, 'none', 'That is next year’s value. Discount it to today.'], [t.X / r, 'perp', `Divide by 1 + ${pc(r)}, which is ${(1 + r).toFixed(3)}, not by ${pc(r)} alone.`]],
        { tol, closeMsg: `Close. Divide by ${(1 + r).toFixed(3)} and round only at the end.`, otherMsg: `${m(t.X)} ÷ ${(1 + r).toFixed(3)}.` });
      rr[1] = pr(1, RD1, RC1, t.pD); rr[2] = pr(2, RC1, RD1, t.pC);
      const bad = [1, 2].find((y) => !rr[y].ok);
      if (bad) return { ok: false, rowRes: rr, msg: `${bad === 1 ? 'DraftKings' : 'Con Edison'}: ${rr[bad].msg}` };
      if (e.choice !== t.decision) return { ok: false, rowRes: rr, msg: !e.choice ? 'Answer the question about which buyer earns more as well.' : 'Both shares end up worth the same. Which buyer paid less for it today?' };
      return { ok: true, rowRes: rr };
    }
  }

  function helpText(t, lvl) {
    if (t.id === 'w1') return 'Any answer counts. Type the smallest win, in dollars, that would get you to risk losing $10 on one flip. Then pick the offer you would really take.';
    if (t.id === 'w2') return `Any answer counts. Type the hourly pay, in dollars, that would get you to choose the roof over ${m(STORE)} an hour at the store.`;
    if (t.id === 't1') return lvl === 1 ? `Recall, one stock: ${m(t.A)} × ${pc(t.d1, 0)} = ${m(t.one1)}. Recall, ten stocks: only ${m(t.A / N)} is in the car-seat maker, so ${m(t.A / N)} × ${pc(t.d1, 0)} = ${m(t.ten1)}.`
      : `Recall: ${m(t.one1)} and ${m(t.ten1)}. Recession: every stock falls ${pc(t.d2, 0)}, so both portfolios lose ${m(t.A)} × ${pc(t.d2, 0)} = ${m(t.one2)}. Ten stocks protected the client from the recall only.`;
    if (t.id === 't2') return lvl === 1 ? `DraftKings: ${BD.toFixed(2)} × ${spc(t.mv, 0)} = ${spc(t.dk, 2)}. Con Edison: ${BC.toFixed(2)} × ${spc(t.mv, 0)} = ${spc(t.ce, 2)}.`
      : `Moves: ${spc(t.dk, 2)} and ${spc(t.ce, 2)}. Dollars: ${m(t.H)} × ${spc(t.dk, 2)} = ${sgn(t.dkD)}, and ${m(t.H)} × ${spc(t.ce, 2)} = ${sgn(t.ceD)}.`;
    if (t.id === 't3') return lvl === 1 ? `DraftKings: ${BD.toFixed(2)} × ${pc(ERP)} = ${pc(t.dkP, 2)}. Required return = ${pc(RF)} + ${pc(t.dkP, 2)} = ${pc(t.dk, 2)}. In Desmos: <code>4.9+1.61*4.2</code>.`
      : `DraftKings: ${pc(t.dkP, 2)} and ${pc(t.dk, 2)}. Con Edison: ${BC.toFixed(2)} × ${pc(ERP)} = ${pc(t.ceP, 2)}, so ${pc(RF)} + ${pc(t.ceP, 2)} = ${pc(t.ce, 2)}.`;
    if (t.id === 't4') return lvl === 1 ? `DraftKings: ${m(t.X)} ÷ ${(1 + RD1).toFixed(3)} = ${m(t.pD, 2)}. In Desmos: <code>${t.X}/1.117</code>.`
      : `DraftKings ${m(t.pD, 2)}; Con Edison ${m(t.X)} ÷ ${(1 + RC1).toFixed(3)} = ${m(t.pC, 2)}. The DraftKings buyer pays less for the same ${m(t.X)}, so that buyer earns more.`;
  }

  function praise(t) {
    if (t.id === 'w1') {
      const y = t.mine ? t.mine.v : null, ch = t.mine ? t.mine.choice : null;
      const you = y == null ? '' : `You asked for ${m(y, y % 1 ? 1 : 0)} to risk $10 and chose ${ch === 'sure' ? 'the sure $10' : 'the flip'}. `;
      const vs = y == null ? 'Most people ask for about <b>$20</b>, twice what they could lose.' : y < 10 ? 'You would take a bet that loses money on average. Most people would not: they ask for about <b>$20</b>, twice what they could lose.'
        : y < 17 ? 'That is less than most people ask. The typical answer is about <b>$20</b>, twice what they could lose.' : y <= 25 ? 'That is close to the typical answer, about <b>$20</b>: twice what they could lose.'
          : 'That is more than most people ask. The typical answer is about <b>$20</b>, twice what they could lose.';
      return `${you}${vs} Most people also take the sure $10.`;
    }
    if (t.id === 'w2') {
      const y = t.mine ? t.mine.v : null;
      const you = y == null ? '' : `You said ${m(y, y % 1 ? 2 : 0)} an hour, ${y >= STORE ? m(y - STORE, (y - STORE) % 1 ? 2 : 0) + ' more than' : 'less than'} the store job. `;
      return `${you}In real life the typical roofer earns <b>$26.65</b> an hour and the typical shelf stocker <b>$17.95</b>. Roofers also die on the job at a rate of <b>48.7</b> per 100,000 full-time workers, against <b>1.8</b> in retail stores. Part of the gap pays for skill. Part pays people to accept the danger and the heat.`;
    }
    if (t.id === 't1') return `The recall cost ${m(t.one1)} with one stock but only ${m(t.ten1)} with ten. The recession cost ${m(t.one2)} either way. Owning many stocks protects you from news that hits one company, not from news that hits nearly all of them.`;
    if (t.id === 't2') return `DraftKings tends to move about ${(BD / BC).toFixed(1)} times as far as Con Edison: ${sgn(t.dkD)} against ${sgn(t.ceD)} on the same ${m(t.H)}. That volatility is what investors want to be paid for.`;
    if (t.id === 't3') return `Investors require about ${pc(t.dk)} from DraftKings and ${pc(t.ce)} from Con Edison. The gap of about ${((t.dk - t.ce) * 100).toFixed(1)} percentage points is their pay for living with DraftKings’ riskier price.`;
    if (t.id === 't4') return `DraftKings sells for ${m(t.pD, 2)} against ${m(t.pC, 2)} for Con Edison, even though both are expected to be worth ${m(t.X)}. The riskier stock sells cheaper, so a buyer who sits through the bumps earns ${pc(RD1)} if the year goes as expected, against ${pc(RC1)}.`;
  }

  function selfAnswer(t) {
    const f2 = (x) => (x * 100).toFixed(2) + '%';
    if (t.id === 'w1') return { choice: 'sure', value: '20' };
    if (t.id === 'w2') return { value: '25' };
    if (t.id === 't1') return { rows: [null, String(Math.round(t.one1)), String(Math.round(t.ten1)), String(Math.round(t.one2)), String(Math.round(t.ten2))], choice: t.decision };
    if (t.id === 't2') return { rows: [null, f2(t.dk), f2(t.ce), String(Math.round(t.dkD)), String(Math.round(t.ceD))] };
    if (t.id === 't3') return { rows: [null, f2(t.dkP), f2(t.dk), f2(t.ceP), f2(t.ce)] };
    if (t.id === 't4') return { rows: [null, t.pD.toFixed(2), t.pC.toFixed(2)], choice: t.decision };
  }
  function selfWrong(t) {
    const f2 = (x) => (x * 100).toFixed(2) + '%';
    if (t.id === 'w1') return { choice: null, value: '20' };
    if (t.id === 'w2') return { value: '' };
    if (t.id === 't1') return { rows: [null, String(Math.round(t.one1)), String(Math.round(t.one1)), String(Math.round(t.one2)), String(Math.round(t.ten2))], choice: t.decision };
    if (t.id === 't2') return { rows: [null, f2(t.mv), f2(t.ce), String(Math.round(t.dkD)), String(Math.round(t.ceD))] };
    if (t.id === 't3') return { rows: [null, f2(t.dkP), f2(RF + ERP), f2(t.ceP), f2(t.ce)] };
    if (t.id === 't4') return { rows: [null, (t.X * (1 - RD1)).toFixed(2), t.pC.toFixed(2)], choice: t.decision };
  }

  const WALK = {
    title: 'What most people say, and what it means for stocks',
    intro: '<p>Ingrid keeps a sheet of what researchers found when they asked people the questions you just answered. She uses it to explain to clients why a riskier stock has to promise more.</p>',
    render(stage) {
      if (stage < 2) {
        const rows = [{ c: ['The smallest win to bet $10 on a coin flip', 'About $20. People need to win about twice what they could lose.'] },
          { c: ['A sure $10 or a coin flip for $20 or $0', 'Most people take the sure $10. In one classic experiment, 80% chose a sure $3,000 over an 80% chance at $4,000, which pays more on average.'] }];
        if (stage >= 1) rows.push({ c: ['Roofing against stocking shelves', 'Roofers earn a median $26.65 an hour against $17.95 for stock clerks. They die on the job at 48.7 per 100,000 full-time workers, against 1.8 in retail stores.'], cls: 'reveal' });
        return tbl('What researchers found', ['Question', 'What most people say or do'], rows, [0, 1]);
      }
      if (stage === 2) return tbl('Two shares, each expected to be worth $110 in a year', ['Share', 'Return required', 'Price today'],
        [{ c: ['A steady stock', '6%', '$110 ÷ 1.06 = $103.77'] }, { c: ['A jumpy stock', '12%', '$110 ÷ 1.12 = $98.21'], cls: 'reveal' }]);
      if (stage === 3) return tbl('If the market falls 10%', ['β', 'The stock tends to move', 'A stock like this'],
        [{ c: ['0.5', '0.5 × −10% = −5%', 'A steady business, like a utility'] }, { c: ['1.0', '1.0 × −10% = −10%', 'The market itself'] }, { c: ['1.3', '1.3 × −10% = −13%', 'A business whose sales swing with the economy'], cls: 'reveal' }], [0, 2]);
      return tbl('The required return for a stock with β = 1.3', ['Line', 'A stock with β = 1.3'],
        [{ c: ['Treasury yield, 10 years', '4.9%'] }, { c: ['β', '1.3'] }, { c: ['Market premium', '4.2%'] }, { c: ['β × market premium', '1.3 × 4.2% = 5.46%'] }, { c: ['<b>Required return</b> (Treasury yield + β × market premium)', '4.9% + 5.46% = <b>10.36%</b>'], cls: 'total hl' }]);
    },
    stages: [
      { t: 'The coin flip', p: 'Most people turn down a fair bet. To risk losing $10, the typical person needs a chance to win about $20. Losing hurts about twice as much as winning feels good.' },
      { t: 'The roofing job', p: 'Work shows the same pattern. Roofing is one of the most dangerous jobs in the country, and it pays more than stocking shelves. Part of the gap pays for skill. Part pays people to accept the danger.' },
      { t: 'Stocks work the same way', p: 'Investors are people too. If a jumpy stock and a steady stock were expected to be worth the same $110 next year, everyone would rather own the steady one. So the risky one has to sell for less today. Its buyers pay $98.21 instead of $103.77, and if the year goes as expected they earn 12% instead of 6%. <b>A jumpy stock sells cheaper and earns more.</b>' },
      { t: 'Measure the jumpiness', p: 'A stock’s <b>beta</b>, written <b>β</b>, measures how volatile it is next to the market. A stock with β = 1.3 tends to move 1.3 times as far as the market, in the same direction. With β below 1 it moves less.' },
      { t: 'Turn β into a return', p: 'Finance teams use one formula: <b>required return = Treasury yield + β × market premium</b>. The <b>Treasury yield</b> is what the US government pays to borrow for 10 years, the safest return around. The <b>market premium</b> is the extra return investors expect for owning the whole stock market, about 4.2% at the start of 2026. For β = 1.3: 4.9% + 1.3 × 4.2% = 10.36%, or about 10.4%.' },
    ],
    sources: '<ul><li>Coin flip: Brown, Imai, Vieider and Camerer, “Meta-Analysis of Empirical Estimates of Loss Aversion,” <i>Journal of Economic Literature</i>, 2024 (607 estimates from 150 studies).</li><li>Sure thing: Kahneman and Tversky, “Prospect Theory,” <i>Econometrica</i>, 1979.</li><li>Pay: Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025. Deaths on the job: Bureau of Labor Statistics, Census of Fatal Occupational Injuries, 2024.</li><li>Treasury yield: US Treasury, 10-year par yield, November 4, 2026. Market premium: Aswath Damodaran (NYU), implied premium at the start of 2026.</li></ul>',
  };

  root.DESK = {
    practiceStart: 't1',
    app: 'finan4-u10-risk-desk', version: 2, seedVersion: 2, salt: 'rize-finan4-u10-risk:4c81d2', points: 20,
    storageKey: 'rize-finan4-u10-risk-v1', filePrefix: 'RiskDesk',
    verifyUrl: 'https://rizecomputerscience.github.io/finan4-risk-desk/verify.html',
    calcPlaceholder: '4.9+1.3*4.2',
    calcHint: 'Type or tap. Use * to multiply and / to divide, so 4.9+1.3*4.2 is the required return in percent for a stock with β = 1.3 and 110/1.12 is a price today.',
    story: { title: 'The Risk Desk', kicker: 'Corporate Finance, Unit 10', company: 'Fallowfield Advisors', team: 'Research Team',
      from: 'Ingrid Sowande', fromTitle: 'portfolio manager, Fallowfield Advisors',
      dek: 'You have joined the research team at Fallowfield Advisors, a small firm that invests savings for families. Ingrid Sowande, a portfolio manager, wants you ready to explain to clients why some stocks have to promise more than others.',
      whatBox: '<b>People need paying to accept risk.</b> A stock whose price jumps around more than the market has to sell for less, so its buyers can expect to earn more. Beta (β) measures how volatile a stock is, and one formula turns β into the return investors require.',
      stepsLine: 'There are twelve steps: two warm-up questions with no right answers, a look at what most people answer, four problems with three one-question checks between them, one exam-style question, and a short note to Ingrid.' },
    steps: STEPS, quiz: QUIZ, walk: WALK, buildTasks, taskView, judgeTask, helpText, praise, selfAnswer, selfWrong,
    note: { title: 'A note for the client', label: 'Your note to Ingrid', minWords: 30, receiptHeading: 'Note to the portfolio manager',
      prompt: 'The client asks why anyone would buy Con Edison when DraftKings is expected to earn about twice as much. Answer her in plain words. Use the two betas, say what a DraftKings buyer is being paid for, and connect it to one of your warm-up answers.' },
  };
})(typeof window !== 'undefined' ? window : globalThis);
