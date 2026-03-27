/**
 * NW Homeworks — Remodel Budget Estimator
 * Calculator UI, Logic, and Chart.js Integration
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────
  const state = {
    roomType: 'kitchen',
    zipCode: '',
    sqft: 120,
    sizeMode: 'preset',
    selectedPreset: 'k-md',
    finishLevel: 'midRange',
    categories: {}
  };

  let chartInstance = null;
  let debounceTimer = null;

  const CHART_COLORS = [
    '#8eba3f', '#5e9ab2', '#7a6b5c', '#b8d48a',
    '#8a8880', '#7db8cc', '#6a9e2e', '#a09688', '#4d8a9e'
  ];

  // ─── Init ───────────────────────────────────────────────────
  function init() {
    initCategories();
    renderSizePresets();
    renderFinishCards();
    renderScopeToggles();
    attachEventListeners();
    calculate();
  }

  function initCategories() {
    const cats = COST_DATA[state.roomType];
    state.categories = {};
    for (const key of Object.keys(cats)) {
      state.categories[key] = true;
    }
  }

  // ─── Render: Size Presets ───────────────────────────────────
  function renderSizePresets() {
    const container = document.getElementById('size-presets');
    const presets = ROOM_PRESETS[state.roomType];
    container.innerHTML = presets.map(p => `
      <button class="size-preset${p.id === state.selectedPreset ? ' active' : ''}"
              data-id="${p.id}" data-sqft="${p.sqft}">
        ${p.label}
        <span class="size-preset__sqft">${p.sqft} sq ft</span>
      </button>
    `).join('');

    container.querySelectorAll('.size-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.size-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedPreset = btn.dataset.id;
        state.sqft = parseInt(btn.dataset.sqft);
        calculate();
      });
    });
  }

  // ─── Render: Finish Cards ───────────────────────────────────
  function renderFinishCards() {
    const container = document.getElementById('finish-cards');
    container.innerHTML = Object.entries(FINISH_LEVELS).map(([key, lvl]) => {
      const isIkea = key === 'ikea';
      const isBathroom = state.roomType === 'bathroom';
      const disabled = isIkea && isBathroom;
      return `
        <button class="finish-card${isIkea ? ' finish-card--ikea' : ''}${key === state.finishLevel ? ' active' : ''}${disabled ? ' disabled' : ''}"
                data-level="${key}" ${disabled ? 'disabled title="IKEA is available for kitchens only"' : ''}>
          <span class="finish-card__icon">${lvl.icon}</span>
          <span class="finish-card__label">${lvl.label}</span>
          <span class="finish-card__desc">${disabled ? 'Kitchen only' : lvl.description}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.finish-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.finish-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.finishLevel = card.dataset.level;
        calculate();
      });
    });
  }

  // ─── Render: Scope Toggles ──────────────────────────────────
  function renderScopeToggles() {
    const container = document.getElementById('scope-toggles');
    const cats = COST_DATA[state.roomType];
    container.innerHTML = Object.entries(cats).map(([key, cat]) => `
      <div class="scope-toggle${state.categories[key] ? ' active' : ''}" data-category="${key}">
        <div class="scope-toggle__info">
          <span class="scope-toggle__label">${cat.label}</span>
        </div>
        <div class="scope-toggle__switch"></div>
      </div>
    `).join('');

    container.querySelectorAll('.scope-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const cat = toggle.dataset.category;
        state.categories[cat] = !state.categories[cat];
        toggle.classList.toggle('active');
        calculate();
      });
    });
  }

  // ─── Event Listeners ────────────────────────────────────────
  function attachEventListeners() {
    // Room type tabs
    document.querySelectorAll('.tab[data-room]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab[data-room]').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        state.roomType = tab.dataset.room;

        // Reset finish level if switching to bathroom with IKEA selected
        if (state.roomType === 'bathroom' && state.finishLevel === 'ikea') {
          state.finishLevel = 'midRange';
        }

        // Reset preset to appropriate default
        const presets = ROOM_PRESETS[state.roomType];
        const defaultPreset = presets[2]; // Medium
        state.selectedPreset = defaultPreset.id;
        state.sqft = defaultPreset.sqft;

        initCategories();
        renderSizePresets();
        renderFinishCards();
        renderScopeToggles();
        calculate();
      });
    });

    // Zip code input
    const zipInput = document.getElementById('zip-code');
    zipInput.addEventListener('input', () => {
      const val = zipInput.value.replace(/\D/g, '').slice(0, 5);
      zipInput.value = val;
      state.zipCode = val;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateMetroHint();
        calculate();
      }, 150);
    });

    // Size mode toggle
    document.querySelectorAll('.size-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-toggle__btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.sizeMode = btn.dataset.mode;

        const presetsEl = document.getElementById('size-presets');
        const customEl = document.getElementById('size-custom');

        if (state.sizeMode === 'preset') {
          presetsEl.classList.remove('hidden');
          customEl.classList.add('hidden');
        } else {
          presetsEl.classList.add('hidden');
          customEl.classList.remove('hidden');
          document.getElementById('sqft-input').focus();
        }
      });
    });

    // Custom sqft input
    const sqftInput = document.getElementById('sqft-input');
    sqftInput.addEventListener('input', () => {
      const val = parseInt(sqftInput.value);
      if (val && val >= 15 && val <= 500) {
        state.sqft = val;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculate, 150);
      }
    });
  }

  // ─── Metro Hint ─────────────────────────────────────────────
  function updateMetroHint() {
    const hint = document.getElementById('metro-hint');
    if (state.zipCode.length === 5) {
      const metro = getMetroDisplayName(state.zipCode);
      const multiplier = getRegionalMultiplier(state.zipCode);
      if (metro) {
        hint.textContent = `${metro} \u2014 ${getMultiplierDescription(multiplier)}`;
        hint.className = 'form-hint form-hint--active';
      } else {
        hint.textContent = 'Using national average rates';
        hint.className = 'form-hint';
      }
    } else if (state.zipCode.length > 0) {
      hint.textContent = 'Enter a 5-digit zip code';
      hint.className = 'form-hint';
    } else {
      hint.textContent = '';
      hint.className = 'form-hint';
    }
  }

  // ─── Calculate ──────────────────────────────────────────────
  function calculate() {
    const multiplier = getRegionalMultiplier(state.zipCode);
    const cats = COST_DATA[state.roomType];
    const results = { categories: {}, totalLow: 0, totalHigh: 0, maxMid: 0 };

    for (const [key, catData] of Object.entries(cats)) {
      if (!state.categories[key]) continue;

      const tier = catData[state.finishLevel];
      if (!tier) continue;

      const rawCost = tier.base + (tier.perSqft * state.sqft);
      const low = Math.round(rawCost * tier.low * multiplier);
      const high = Math.round(rawCost * tier.high * multiplier);
      const mid = Math.round((low + high) / 2);

      results.categories[key] = { low, high, mid, label: catData.label };
      results.totalLow += low;
      results.totalHigh += high;
      if (mid > results.maxMid) results.maxMid = mid;
    }

    results.multiplier = multiplier;
    results.metroName = getMetroDisplayName(state.zipCode);
    results.tips = selectTips(state.finishLevel, state.roomType);

    renderResults(results);
  }

  // ─── Render Results ─────────────────────────────────────────
  function renderResults(results) {
    const placeholder = document.getElementById('results-placeholder');
    const content = document.getElementById('results-content');
    const hasCategories = Object.keys(results.categories).length > 0;

    if (!hasCategories) {
      placeholder.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }

    placeholder.classList.add('hidden');
    content.classList.remove('hidden');

    // Total
    document.getElementById('results-total').innerHTML =
      `${formatCurrency(results.totalLow)}<span class="results-total__separator">&ndash;</span>${formatCurrency(results.totalHigh)}`;

    // Regional note
    const regionalEl = document.getElementById('results-regional');
    if (results.metroName && state.zipCode.length === 5) {
      regionalEl.innerHTML = `Adjusted for <strong>${results.metroName}</strong> &mdash; ${getMultiplierDescription(results.multiplier)}`;
    } else {
      regionalEl.innerHTML = 'Enter your zip code above for location-adjusted pricing';
    }

    // Breakdown rows
    const breakdownEl = document.getElementById('results-breakdown');
    let i = 0;
    breakdownEl.innerHTML = Object.entries(results.categories).map(([key, cat]) => {
      const barPct = results.maxMid > 0 ? Math.max(8, Math.round((cat.mid / results.maxMid) * 100)) : 0;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      i++;
      return `
        <div class="breakdown-row">
          <div class="breakdown-row__header">
            <span class="breakdown-row__label">${cat.label}</span>
            <span class="breakdown-row__value">${formatCurrency(cat.low)} &ndash; ${formatCurrency(cat.high)}</span>
          </div>
          <div class="breakdown-row__bar">
            <div class="breakdown-row__bar-fill" style="width:${barPct}%;background:${color}"></div>
          </div>
        </div>
      `;
    }).join('');

    // Tips
    const tipsEl = document.getElementById('results-tips');
    tipsEl.innerHTML = results.tips.map(t => `<div class="tip">${t}</div>`).join('');

    // Chart
    renderChart(results);
  }

  // ─── Chart ──────────────────────────────────────────────────
  function renderChart(results) {
    const canvas = document.getElementById('cost-chart');
    if (!canvas) return;

    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
      setTimeout(() => renderChart(results), 200);
      return;
    }

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    const entries = Object.entries(results.categories);
    const labels = entries.map(([, c]) => c.label);
    const data = entries.map(([, c]) => c.mid);
    const colors = entries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { family: "'Figtree', sans-serif", size: 12 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const entry = entries[ctx.dataIndex];
                const cat = entry[1];
                return ` ${cat.label}: ${formatCurrency(cat.low)} \u2013 ${formatCurrency(cat.high)}`;
              }
            },
            titleFont: { family: "'Figtree', sans-serif" },
            bodyFont: { family: "'Figtree', sans-serif" }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: false,
          easing: 'easeOutQuart',
          duration: 600
        }
      }
    });
  }

  // ─── Boot ───────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
