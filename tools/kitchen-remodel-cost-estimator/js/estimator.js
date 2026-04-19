/**
 * NW Homeworks — Kitchen Remodel Cost Estimator V2
 * Accordion UI, State Management, Calculations, Chart.js
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────
  const state = {
    zipCode: '',
    kitchenSF: 120,
    sizeMode: 'preset',
    selectedPreset: 'k-md',
    layout: 'lshape',

    cabinetsReplacing: true,
    cabinetTier: 'midRange',

    countertopsReplacing: true,
    countertopMaterial: 'quartz',

    backsplashReplacing: true,
    backsplashOption: 'midTile',

    flooringReplacing: true,
    flooringMaterial: 'lvp',

    appliancesBuying: true,
    applianceTier: 'mid',
    applianceInstalls: {
      fridge: true, range: true, cooktop: false,
      wallOven: false, dishwasher: true, microhood: true, wallHood: false, canopyHood: false
    },

    plumbingReplacing: true,
    plumbingTier: 'mid',

    lightingRecessed: false,
    lightingUnderCab: false,
    lightingPendants: false,
    layoutChange: false,

    trimEnabled: true,
    paintEnabled: true,

    activeSection: 0
  };

  let chartInstance = null;
  let debounceTimer = null;

  const CHART_COLORS = [
    '#8eba3f', '#6a9e2e', '#b8d48a', '#5c8a28',
    '#847667', '#a89888', '#d4d0cc', '#5c4f43'
  ];

  // ─── 3D Isometric Layout Icons ───────────────────────────────
  // Each layout is described as a set of cabinet "runs" and optional
  // "islands" in plan-view coordinates (u = width, v = depth from front).
  // We render each run as an isometric 3D box with top, front, and right
  // faces and paint back-to-front so near boxes occlude far ones.
  const LAYOUT_DEFS = {
    galley: {
      runs: [
        { u1: 0, u2: 10, v1: 6, v2: 8 },
        { u1: 0, u2: 10, v1: 0, v2: 2 }
      ],
      islands: []
    },
    lshape: {
      runs: [
        { u1: 0, u2: 10, v1: 6, v2: 8 },
        { u1: 0, u2: 2,  v1: 0, v2: 6 }
      ],
      islands: []
    },
    ushape: {
      runs: [
        { u1: 0, u2: 10, v1: 6, v2: 8 },
        { u1: 0, u2: 2,  v1: 0, v2: 6 },
        { u1: 8, u2: 10, v1: 0, v2: 6 }
      ],
      islands: []
    },
    lisland: {
      runs: [
        { u1: 0, u2: 10, v1: 6, v2: 8 },
        { u1: 0, u2: 2,  v1: 0, v2: 6 }
      ],
      islands: [
        { u1: 4, u2: 8, v1: 2, v2: 4 }
      ]
    },
    uisland: {
      runs: [
        { u1: 0, u2: 10, v1: 6, v2: 8 },
        { u1: 0, u2: 2,  v1: 0, v2: 6 },
        { u1: 8, u2: 10, v1: 0, v2: 6 }
      ],
      islands: [
        { u1: 3.5, u2: 6.5, v1: 2, v2: 4 }
      ]
    }
  };

  function buildLayoutIcon(key) {
    var def = LAYOUT_DEFS[key];
    if (!def) return '';
    var scale = 5;
    var offsetX = 15;
    var offsetY = 60;
    var H = 3;       // cabinet height
    var VDX = 0.55;  // v-axis projects this much to the right
    var VDY = 0.35;  // v-axis projects this much upward

    function proj(u, v, h) {
      return [
        +(offsetX + (u + v * VDX) * scale).toFixed(2),
        +(offsetY - (v * VDY + h) * scale).toFixed(2)
      ];
    }
    function pts(arr) {
      return arr.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    }
    function box(r, islandCls) {
      var baseCls = islandCls ? 'layout-3d__island' : 'layout-3d__run';
      var top   = [proj(r.u1, r.v2, H), proj(r.u2, r.v2, H), proj(r.u2, r.v1, H), proj(r.u1, r.v1, H)];
      var front = [proj(r.u1, r.v1, H), proj(r.u2, r.v1, H), proj(r.u2, r.v1, 0), proj(r.u1, r.v1, 0)];
      var right = [proj(r.u2, r.v1, H), proj(r.u2, r.v2, H), proj(r.u2, r.v2, 0), proj(r.u2, r.v1, 0)];
      return '<polygon class="' + baseCls + ' layout-3d__front" points="' + pts(front) + '"/>' +
             '<polygon class="' + baseCls + ' layout-3d__right" points="' + pts(right) + '"/>' +
             '<polygon class="' + baseCls + ' layout-3d__top"   points="' + pts(top) + '"/>';
    }

    var all = [];
    def.runs.forEach(function (r) { all.push({ r: r, island: false }); });
    def.islands.forEach(function (r) { all.push({ r: r, island: true }); });
    // Draw furthest-back first so nearer boxes paint on top.
    all.sort(function (a, b) {
      return (b.r.v1 + b.r.v2) - (a.r.v1 + a.r.v2);
    });

    var body = all.map(function (item) { return box(item.r, item.island); }).join('');
    return '<svg class="layout-3d" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }

  // ─── Init ───────────────────────────────────────────────────
  function init() {
    hydrateStateFromURL();

    renderSizePresets();
    attachInputListeners();

    renderLayoutCards();
    renderCabinetCards();
    renderCountertopCards();
    renderBacksplashCards();
    renderFlooringCards();
    renderApplianceTierCards();
    renderApplianceInstallToggles();
    renderPlumbingCards();
    renderLightingToggles();
    renderLayoutChangeToggle();
    renderFinishingToggles();
    attachAccordionListeners();
    attachReplacingToggles();
    attachShareButton();
    attachStickyTotalObserver();
    syncInputsFromState();

    openSection(0);
    updateMetroHint();
    recalculate();
  }

  function syncInputsFromState() {
    var zipInput = document.getElementById('zip-code');
    if (zipInput && state.zipCode) zipInput.value = state.zipCode;

    if (state.sizeMode === 'custom') {
      document.querySelectorAll('.size-toggle__btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.mode === 'custom');
      });
      document.getElementById('size-presets').classList.add('hidden');
      var customEl = document.getElementById('size-custom');
      customEl.classList.remove('hidden');
      var sqftInput = document.getElementById('sqft-input');
      if (sqftInput) sqftInput.value = state.kitchenSF;
    }

    // Sync the static Replacing / Keeping Current toggles + their option panels.
    var replacingMap = [
      { id: 'cabinets-toggle',    stateKey: 'cabinetsReplacing',    optionsId: 'cabinets-options' },
      { id: 'countertops-toggle', stateKey: 'countertopsReplacing', optionsId: 'countertops-options' },
      { id: 'backsplash-toggle',  stateKey: 'backsplashReplacing',  optionsId: 'backsplash-options' },
      { id: 'flooring-toggle',    stateKey: 'flooringReplacing',    optionsId: 'flooring-options' },
      { id: 'appliances-toggle',  stateKey: 'appliancesBuying',     optionsId: 'appliances-tier-options' },
      { id: 'plumbing-toggle',    stateKey: 'plumbingReplacing',    optionsId: 'plumbing-options' }
    ];
    replacingMap.forEach(function (t) {
      var container = document.getElementById(t.id);
      if (!container) return;
      var val = state[t.stateKey];
      container.querySelectorAll('.replacing-toggle__btn').forEach(function (b) {
        b.classList.toggle('active', (b.dataset.value === 'true') === val);
      });
      var options = document.getElementById(t.optionsId);
      if (options) options.classList.toggle('collapsed', !val);
    });

    // If we hydrated an invalid slab selection, fall back to tile.
    if (isSlabOption(state.backsplashOption) && !state.countertopsReplacing) {
      state.backsplashOption = 'midTile';
      renderBacksplashCards();
    }
  }

  function recalculate() {
    calculate();
  }

  // ─── Accordion ────────────────────────────────────────────────
  function attachAccordionListeners() {
    document.querySelectorAll('.accordion-header').forEach(function (header) {
      header.addEventListener('click', function () {
        var section = parseInt(header.closest('.accordion-section').dataset.section);
        openSection(section);
      });
    });
  }

  function openSection(index) {
    var sections = document.querySelectorAll('.accordion-section');
    sections.forEach(function (sec) {
      var i = parseInt(sec.dataset.section);
      var content = sec.querySelector('.accordion-content');
      var header = sec.querySelector('.accordion-header');
      if (i === index) {
        sec.classList.add('active');
        sec.classList.remove('completed');
        header.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        sec.classList.remove('active');
        if (i < index) sec.classList.add('completed');
        header.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0';
      }
    });
    state.activeSection = index;
    updateSummaries();
  }

  function advanceSection() {
    if (state.activeSection < 7) {
      setTimeout(function () { openSection(state.activeSection + 1); }, 350);
    }
  }

  // ─── Render: Size Presets ─────────────────────────────────────
  function renderSizePresets() {
    var container = document.getElementById('size-presets');
    container.innerHTML = KITCHEN_PRESETS.map(function (p) {
      return '<button class="size-preset' + (p.id === state.selectedPreset ? ' active' : '') +
        '" data-id="' + p.id + '" data-sqft="' + p.sqft + '">' +
        p.label + '<span class="size-preset__sqft">' + p.sqft + ' sq ft</span></button>';
    }).join('');

    container.querySelectorAll('.size-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.size-preset').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.selectedPreset = btn.dataset.id;
        state.sqft = parseInt(btn.dataset.sqft);
        state.kitchenSF = state.sqft;
        recalculate();
      });
    });
  }

  // ─── Render: Layout Cards ─────────────────────────────────────
  function renderLayoutCards() {
    var container = document.getElementById('layout-cards');
    container.innerHTML = Object.entries(KITCHEN_LAYOUTS).map(function (entry) {
      var key = entry[0], layout = entry[1];
      return '<button class="layout-card' + (key === state.layout ? ' active' : '') +
        '" data-layout="' + key + '">' +
        '<span class="layout-card__icon">' + buildLayoutIcon(key) + '</span>' +
        '<span class="layout-card__label">' + layout.label + '</span>' +
        (layout.hint ? '<span class="layout-card__hint">' + layout.hint + '</span>' : '') +
        '</button>';
    }).join('');

    container.querySelectorAll('.layout-card').forEach(function (card) {
      card.addEventListener('click', function () {
        container.querySelectorAll('.layout-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        state.layout = card.dataset.layout;
        applyLayoutApplianceDefaults();
        recalculate();
      });
    });
  }

  function isIslandLayout() {
    return state.layout === 'lisland' || state.layout === 'uisland';
  }

  function applyLayoutApplianceDefaults() {
    state.applianceInstalls.canopyHood = isIslandLayout();
    renderApplianceInstallToggles();
  }

  // ─── Render: Option Cards (generic) ───────────────────────────
  function renderOptionCards(containerId, data, stateKey, extraFields) {
    var container = document.getElementById(containerId);
    container.innerHTML = Object.entries(data).map(function (entry) {
      var key = entry[0], item = entry[1];
      var isActive = state[stateKey] === key;
      var isDisabled = item._disabled;
      var html = '<button class="option-card' + (isActive ? ' active' : '') + (isDisabled ? ' disabled' : '') +
        '" data-key="' + key + '"' + (isDisabled ? ' disabled title="' + (item._disabledReason || '') + '"' : '') + '>' +
        '<span class="option-card__name">' + item.label + '</span>';
      if (item.rate !== null && item.rate !== undefined) {
        html += '<span class="option-card__price">$' + item.rate + '/sf</span>';
      } else if (item.rateLow !== undefined) {
        html += '<span class="option-card__price">$' + item.rateLow + '\u2013' + item.rateHigh + '/sf</span>';
      } else if (item.cost !== undefined) {
        html += '<span class="option-card__price">' + formatCurrency(item.cost) + '</span>';
      } else if (item.rangeLow !== undefined) {
        html += '<span class="option-card__price">' + formatCurrency(item.rangeLow) + '\u2013' + formatCurrency(item.rangeHigh) + '</span>';
      }
      if (item.desc) html += '<span class="option-card__desc">' + item.desc + '</span>';
      if (item.brands) html += '<span class="option-card__brands">' + item.brands + '</span>';
      html += '</button>';
      return html;
    }).join('');

    container.querySelectorAll('.option-card:not(.disabled)').forEach(function (card) {
      card.addEventListener('click', function () {
        container.querySelectorAll('.option-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        state[stateKey] = card.dataset.key;
        recalculate();
        if (stateKey === 'countertopMaterial') updateBacksplashSlab();
      });
    });
  }

  function renderCabinetCards() { renderOptionCards('cabinet-cards', CABINET_TIERS, 'cabinetTier'); }
  function renderCountertopCards() { renderOptionCards('countertop-cards', COUNTERTOP_MATERIALS, 'countertopMaterial'); }
  function renderFlooringCards() { renderOptionCards('flooring-cards', FLOORING_MATERIALS, 'flooringMaterial'); }
  function renderApplianceTierCards() { renderOptionCards('appliance-tier-cards', APPLIANCE_TIERS, 'applianceTier'); }
  function renderPlumbingCards() { renderOptionCards('plumbing-cards', PLUMBING_TIERS, 'plumbingTier'); }

  function isSlabOption(key) {
    var opt = BACKSPLASH_OPTIONS[key];
    return !!(opt && opt.type && opt.type.indexOf('slab') === 0);
  }

  function renderBacksplashCards() {
    var data = {};
    Object.entries(BACKSPLASH_OPTIONS).forEach(function (entry) {
      var key = entry[0], item = entry[1];
      var clone = Object.assign({}, item);
      if (isSlabOption(key)) {
        if (!state.countertopsReplacing) {
          clone._disabled = true;
          clone._disabledReason = 'Requires new countertops';
        } else {
          var ctRate = COUNTERTOP_MATERIALS[state.countertopMaterial].rate;
          clone.desc = clone.desc + ' ($' + ctRate + '/sf)';
        }
      }
      data[key] = clone;
    });
    renderOptionCards('backsplash-cards', data, 'backsplashOption');
  }

  function updateBacksplashSlab() {
    if (isSlabOption(state.backsplashOption) && !state.countertopsReplacing) {
      state.backsplashOption = 'midTile';
    }
    renderBacksplashCards();
  }

  // ─── Render: Appliance Install Toggles ────────────────────────
  function renderApplianceInstallToggles() {
    var container = document.getElementById('appliance-install-toggles');
    container.innerHTML = Object.entries(APPLIANCE_INSTALLS).map(function (entry) {
      var key = entry[0], item = entry[1];
      var isActive = state.applianceInstalls[key];
      return '<div class="scope-toggle' + (isActive ? ' active' : '') + '" data-key="' + key + '">' +
        '<div class="scope-toggle__info"><span class="scope-toggle__label">' + item.label + '</span></div>' +
        '<span class="scope-toggle__cost">' + formatCurrency(item.fee) + '</span>' +
        '<div class="scope-toggle__switch"></div></div>';
    }).join('');

    container.querySelectorAll('.scope-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var key = toggle.dataset.key;
        state.applianceInstalls[key] = !state.applianceInstalls[key];

        // Cooktop/Range/Wall Oven interlock
        if (key === 'cooktop' && state.applianceInstalls.cooktop) {
          state.applianceInstalls.range = false;
          state.applianceInstalls.wallOven = true;
          renderApplianceInstallToggles();
        } else if (key === 'cooktop' && !state.applianceInstalls.cooktop) {
          state.applianceInstalls.range = true;
          state.applianceInstalls.wallOven = false;
          renderApplianceInstallToggles();
        } else if (key === 'range' && state.applianceInstalls.range) {
          state.applianceInstalls.cooktop = false;
          state.applianceInstalls.wallOven = false;
          renderApplianceInstallToggles();
        } else {
          toggle.classList.toggle('active');
        }

        recalculate();
      });
    });
  }

  // ─── Render: Lighting Toggles ─────────────────────────────────
  function renderLightingToggles() {
    var container = document.getElementById('lighting-toggles');
    var items = [
      { key: 'lightingRecessed', data: LIGHTING_OPTIONS.recessed },
      { key: 'lightingUnderCab', data: LIGHTING_OPTIONS.underCab },
      { key: 'lightingPendants', data: LIGHTING_OPTIONS.pendants }
    ];
    container.innerHTML = items.map(function (item) {
      var isActive = state[item.key];
      return '<div class="scope-toggle' + (isActive ? ' active' : '') + '" data-key="' + item.key + '">' +
        '<div class="scope-toggle__info"><span class="scope-toggle__label">' + item.data.label + '</span>' +
        '<span class="scope-toggle__desc">' + item.data.desc + '</span></div>' +
        '<span class="scope-toggle__cost">$' + item.data.rate + '/sf</span>' +
        '<div class="scope-toggle__switch"></div></div>';
    }).join('');

    container.querySelectorAll('.scope-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var key = toggle.dataset.key;
        state[key] = !state[key];
        toggle.classList.toggle('active');
        recalculate();
      });
    });
  }

  // ─── Render: Layout Change Toggle ─────────────────────────────
  function renderLayoutChangeToggle() {
    var container = document.getElementById('layout-change-toggle');
    container.innerHTML = '<div class="scope-toggle' + (state.layoutChange ? ' active' : '') + '" data-key="layoutChange">' +
      '<div class="scope-toggle__info"><span class="scope-toggle__label">Yes, changing layout or moving appliances</span>' +
      '<span class="scope-toggle__desc">' + LAYOUT_CHANGE_ELECTRICAL.desc + '</span></div>' +
      '<div class="scope-toggle__switch"></div></div>';

    container.querySelector('.scope-toggle').addEventListener('click', function () {
      state.layoutChange = !state.layoutChange;
      this.classList.toggle('active');
      recalculate();
    });
  }

  // ─── Render: Finishing Toggles ────────────────────────────────
  function renderFinishingToggles() {
    var container = document.getElementById('finishing-toggles');
    var items = [
      { key: 'trimEnabled', label: FINISHING_COSTS.trim.label, rate: '$' + FINISHING_COSTS.trim.rate + '/sf' },
      { key: 'paintEnabled', label: FINISHING_COSTS.paint.label, rate: '$' + FINISHING_COSTS.paint.rate + '/sf' }
    ];
    container.innerHTML = items.map(function (item) {
      var isActive = state[item.key];
      return '<div class="scope-toggle' + (isActive ? ' active' : '') + '" data-key="' + item.key + '">' +
        '<div class="scope-toggle__info"><span class="scope-toggle__label">' + item.label + '</span></div>' +
        '<span class="scope-toggle__cost">' + item.rate + '</span>' +
        '<div class="scope-toggle__switch"></div></div>';
    }).join('');

    container.querySelectorAll('.scope-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var key = toggle.dataset.key;
        state[key] = !state[key];
        toggle.classList.toggle('active');
        recalculate();
      });
    });
  }

  function renderFinishingAutoItems() {
    var container = document.getElementById('finishing-auto-items');
    var multiplier = getRegionalMultiplier(state.zipCode);
    var sf = state.kitchenSF;
    var items = [];

    if (state.cabinetsReplacing) {
      var demoCost = Math.round(FINISHING_COSTS.kitchenDemo.rate * sf * multiplier);
      items.push({ label: FINISHING_COSTS.kitchenDemo.label, value: formatCurrency(demoCost) });
    } else {
      items.push({ label: FINISHING_COSTS.kitchenDemo.label, value: 'N/A', na: true });
    }

    if (state.flooringReplacing) {
      var floorCost = Math.round(FINISHING_COSTS.flooringRemoval.rate * sf * multiplier);
      items.push({ label: FINISHING_COSTS.flooringRemoval.label, value: formatCurrency(floorCost) });
    } else {
      items.push({ label: FINISHING_COSTS.flooringRemoval.label, value: 'N/A', na: true });
    }

    var dwTier = getDrywallTier(state);
    if (dwTier) {
      var dwCost = Math.round((dwTier.base + dwTier.perSF * sf) * multiplier);
      items.push({ label: dwTier.label, value: formatCurrency(dwCost) });
    } else {
      items.push({ label: 'Drywall Repair', value: 'N/A', na: true });
    }

    container.innerHTML = items.map(function (item) {
      return '<div class="auto-calc-row">' +
        '<span class="auto-calc-row__label">' + item.label + '</span>' +
        '<span class="auto-calc-row__value' + (item.na ? ' auto-calc-row__value--na' : '') + '">' + item.value + '</span></div>';
    }).join('');
  }

  // ─── Replacing/Keeping Toggles ────────────────────────────────
  function attachReplacingToggles() {
    var toggles = [
      { id: 'cabinets-toggle', stateKey: 'cabinetsReplacing', optionsId: 'cabinets-options' },
      { id: 'countertops-toggle', stateKey: 'countertopsReplacing', optionsId: 'countertops-options' },
      { id: 'backsplash-toggle', stateKey: 'backsplashReplacing', optionsId: 'backsplash-options' },
      { id: 'flooring-toggle', stateKey: 'flooringReplacing', optionsId: 'flooring-options' },
      { id: 'appliances-toggle', stateKey: 'appliancesBuying', optionsId: 'appliances-tier-options' },
      { id: 'plumbing-toggle', stateKey: 'plumbingReplacing', optionsId: 'plumbing-options' }
    ];

    toggles.forEach(function (t) {
      var container = document.getElementById(t.id);
      if (!container) return;
      container.querySelectorAll('.replacing-toggle__btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          container.querySelectorAll('.replacing-toggle__btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var val = btn.dataset.value === 'true';
          state[t.stateKey] = val;

          var options = document.getElementById(t.optionsId);
          if (options) {
            if (val) options.classList.remove('collapsed');
            else options.classList.add('collapsed');
          }

          enforceDependencyChain();
          recalculate();

          if (!val) advanceSection();
        });
      });
    });
  }

  function enforceDependencyChain() {
    var ctToggle = document.getElementById('countertops-toggle');
    var ctForced = document.getElementById('countertops-forced');
    var bsToggle = document.getElementById('backsplash-toggle');
    var bsForced = document.getElementById('backsplash-forced');

    if (state.cabinetsReplacing) {
      state.countertopsReplacing = true;
      ctToggle.classList.add('locked');
      ctToggle.querySelector('[data-value="true"]').classList.add('active');
      ctToggle.querySelector('[data-value="false"]').classList.remove('active');
      ctForced.classList.remove('hidden');
      document.getElementById('countertops-options').classList.remove('collapsed');

      state.backsplashReplacing = true;
      bsToggle.classList.add('locked');
      bsToggle.querySelector('[data-value="true"]').classList.add('active');
      bsToggle.querySelector('[data-value="false"]').classList.remove('active');
      bsForced.textContent = 'Required when replacing cabinets';
      bsForced.classList.remove('hidden');
      document.getElementById('backsplash-options').classList.remove('collapsed');
    } else {
      ctToggle.classList.remove('locked');
      ctForced.classList.add('hidden');

      if (state.countertopsReplacing) {
        state.backsplashReplacing = true;
        bsToggle.classList.add('locked');
        bsToggle.querySelector('[data-value="true"]').classList.add('active');
        bsToggle.querySelector('[data-value="false"]').classList.remove('active');
        bsForced.textContent = 'Required when replacing countertops';
        bsForced.classList.remove('hidden');
        document.getElementById('backsplash-options').classList.remove('collapsed');
      } else {
        bsToggle.classList.remove('locked');
        bsForced.classList.add('hidden');
      }
    }

    updateBacksplashSlab();
  }

  // ─── Input Listeners ──────────────────────────────────────────
  function attachInputListeners() {
    var zipInput = document.getElementById('zip-code');
    zipInput.addEventListener('input', function () {
      var val = zipInput.value.replace(/\D/g, '').slice(0, 5);
      zipInput.value = val;
      state.zipCode = val;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        updateMetroHint();
        recalculate();
      }, 150);
    });

    document.querySelectorAll('.size-toggle__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.size-toggle__btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.sizeMode = btn.dataset.mode;
        var presetsEl = document.getElementById('size-presets');
        var customEl = document.getElementById('size-custom');
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

    var sqftInput = document.getElementById('sqft-input');
    sqftInput.addEventListener('input', function () {
      var val = parseInt(sqftInput.value);
      if (val && val >= 40 && val <= 500) {
        state.kitchenSF = val;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(recalculate, 150);
      }
    });
  }

  function updateMetroHint() {
    var hint = document.getElementById('metro-hint');
    if (state.zipCode.length === 5) {
      var metro = getMetroDisplayName(state.zipCode);
      var multiplier = getRegionalMultiplier(state.zipCode);
      if (metro) {
        hint.innerHTML = '<span class="metro-chip"><span class="metro-chip__check" aria-hidden="true"></span>' +
          '<strong>' + metro + '</strong>' +
          '<span class="metro-chip__sep">\u00b7</span>' +
          '<span>' + multiplier.toFixed(2) + '\u00d7 national avg</span></span>';
        hint.className = 'form-hint form-hint--chip';
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

  // ─── Calculate ────────────────────────────────────────────────
  function calculate() {
    var m = getRegionalMultiplier(state.zipCode);
    var areas = getDerivedAreas(state.kitchenSF, state.layout);
    var results = { sections: [], totalLow: 0, totalHigh: 0 };

    // Cabinets
    if (state.cabinetsReplacing) {
      var ct = CABINET_TIERS[state.cabinetTier];
      var cabLow = Math.round(areas.cabinetFaceSF * ct.rate * ct.low * m);
      var cabHigh = Math.round(areas.cabinetFaceSF * ct.rate * ct.high * m);
      results.sections.push({ label: 'Cabinets', low: cabLow, high: cabHigh });
    }

    // Countertops
    if (state.countertopsReplacing) {
      var cm = COUNTERTOP_MATERIALS[state.countertopMaterial];
      var ctLow = Math.round(areas.counterSF * cm.rate * cm.low * m);
      var ctHigh = Math.round(areas.counterSF * cm.rate * cm.high * m);
      results.sections.push({ label: 'Countertops', low: ctLow, high: ctHigh });
    }

    // Backsplash
    if (state.backsplashReplacing) {
      var bsOpt = BACKSPLASH_OPTIONS[state.backsplashOption] || BACKSPLASH_OPTIONS.midTile;
      var bsRate, bsArea;
      if (bsOpt.type === 'slab4' && state.countertopsReplacing) {
        bsRate = COUNTERTOP_MATERIALS[state.countertopMaterial].rate;
        bsArea = areas.counterLF * (4 / 12);
      } else if (bsOpt.type === 'slabFull' && state.countertopsReplacing) {
        bsRate = COUNTERTOP_MATERIALS[state.countertopMaterial].rate;
        bsArea = areas.backsplashSF;
      } else {
        bsRate = bsOpt.rate || 34;
        bsArea = areas.backsplashSF;
      }
      var bsLow = Math.round(Math.max(bsArea * bsRate * (bsOpt.low || 0.85) * m, BACKSPLASH_MIN_CHARGE * m));
      var bsHigh = Math.round(Math.max(bsArea * bsRate * (bsOpt.high || 1.15) * m, BACKSPLASH_MIN_CHARGE * m));
      results.sections.push({ label: 'Backsplash', low: bsLow, high: bsHigh });
    }

    // Flooring
    if (state.flooringReplacing) {
      var fl = FLOORING_MATERIALS[state.flooringMaterial];
      var flLow = Math.round(areas.kitchenSF * fl.rateLow * m);
      var flHigh = Math.round(areas.kitchenSF * fl.rateHigh * m);
      results.sections.push({ label: 'Flooring', low: flLow, high: flHigh });
    }

    // Appliances
    var appLow = 0, appHigh = 0;
    if (state.appliancesBuying) {
      var at = APPLIANCE_TIERS[state.applianceTier];
      appLow += at.rangeLow;
      appHigh += at.rangeHigh;
    }
    var installTotal = 0;
    Object.entries(state.applianceInstalls).forEach(function (entry) {
      if (entry[1]) installTotal += APPLIANCE_INSTALLS[entry[0]].fee;
    });
    appLow += Math.round(installTotal * m);
    appHigh += Math.round(installTotal * m);
    if (appLow > 0 || appHigh > 0) {
      results.sections.push({ label: 'Appliances', low: appLow, high: appHigh });
    }

    // Plumbing
    if (state.plumbingReplacing) {
      var pl = PLUMBING_TIERS[state.plumbingTier];
      var plCost = Math.round(pl.cost * m);
      results.sections.push({ label: 'Plumbing', low: plCost, high: plCost });
    }

    // Electrical
    var elecLow = 0, elecHigh = 0;
    if (state.lightingRecessed) { var c = Math.round(LIGHTING_OPTIONS.recessed.rate * areas.kitchenSF * m); elecLow += c; elecHigh += c; }
    if (state.lightingUnderCab) { var c2 = Math.round(LIGHTING_OPTIONS.underCab.rate * areas.kitchenSF * m); elecLow += c2; elecHigh += c2; }
    if (state.lightingPendants) { var c3 = Math.round(LIGHTING_OPTIONS.pendants.rate * areas.kitchenSF * m); elecLow += c3; elecHigh += c3; }
    if (state.layoutChange) {
      var lc = Math.round((LAYOUT_CHANGE_ELECTRICAL.base + LAYOUT_CHANGE_ELECTRICAL.perSF * areas.kitchenSF) * m);
      elecLow += lc; elecHigh += lc;
    }
    if (elecLow > 0) {
      results.sections.push({ label: 'Electrical', low: elecLow, high: elecHigh });
    }

    // Finishing bundle
    var finLow = 0, finHigh = 0;
    var finSubs = [];

    if (state.cabinetsReplacing) {
      var demo = Math.round(FINISHING_COSTS.kitchenDemo.rate * areas.kitchenSF * m);
      finLow += demo; finHigh += demo;
      finSubs.push({ label: 'Kitchen Demolition', value: demo });
    }
    if (state.flooringReplacing) {
      var flrem = Math.round(FINISHING_COSTS.flooringRemoval.rate * areas.kitchenSF * m);
      finLow += flrem; finHigh += flrem;
      finSubs.push({ label: 'Flooring Removal', value: flrem });
    }
    var dwTier = getDrywallTier(state);
    if (dwTier) {
      var dw = Math.round((dwTier.base + dwTier.perSF * areas.kitchenSF) * m);
      finLow += dw; finHigh += dw;
      finSubs.push({ label: 'Drywall Repair', value: dw });
    }
    if (state.trimEnabled) {
      var tr = Math.round(FINISHING_COSTS.trim.rate * areas.kitchenSF * m);
      finLow += tr; finHigh += tr;
      finSubs.push({ label: 'Trim', value: tr });
    }
    if (state.paintEnabled) {
      var pa = Math.round(FINISHING_COSTS.paint.rate * areas.kitchenSF * m);
      finLow += pa; finHigh += pa;
      finSubs.push({ label: 'Paint', value: pa });
    }
    if (finLow > 0) {
      results.sections.push({ label: 'Demo, Prep & Finishing', low: finLow, high: finHigh, subItems: finSubs });
    }

    // Totals
    results.sections.forEach(function (s) {
      results.totalLow += s.low;
      results.totalHigh += s.high;
    });

    results.multiplier = m;
    results.metroName = getMetroDisplayName(state.zipCode);

    renderResults(results);
    renderExtras(results);
    renderFinishingAutoItems();
    updateSummaries();
  }

  // ─── Render Results ───────────────────────────────────────────
  function renderResults(results) {
    var placeholder = document.getElementById('results-placeholder');
    var content = document.getElementById('results-content');

    updateStickyTotal(results);

    if (results.sections.length === 0) {
      placeholder.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }

    placeholder.classList.add('hidden');
    content.classList.remove('hidden');

    document.getElementById('results-total').innerHTML =
      formatCurrency(results.totalLow) + '<span class="results-total__separator">&ndash;</span>' + formatCurrency(results.totalHigh);

    var regionalEl = document.getElementById('results-regional');
    if (results.metroName && state.zipCode.length === 5) {
      regionalEl.innerHTML = 'Adjusted for <strong>' + results.metroName + '</strong> &mdash; ' + getMultiplierDescription(results.multiplier);
    } else {
      regionalEl.innerHTML = 'Enter your zip code above for location-adjusted pricing';
    }

    var maxMid = 0;
    results.sections.forEach(function (s) {
      var mid = (s.low + s.high) / 2;
      if (mid > maxMid) maxMid = mid;
    });

    var breakdownEl = document.getElementById('results-breakdown');
    var i = 0;
    breakdownEl.innerHTML = results.sections.map(function (s) {
      var mid = (s.low + s.high) / 2;
      var barPct = maxMid > 0 ? Math.max(8, Math.round((mid / maxMid) * 100)) : 0;
      var color = CHART_COLORS[i % CHART_COLORS.length];
      i++;
      var isExpandable = s.subItems && s.subItems.length > 0;

      var html = '<div class="breakdown-row' + (isExpandable ? ' breakdown-row--expandable' : '') + '">' +
        '<div class="breakdown-row__header">' +
        '<span class="breakdown-row__label">' + s.label + '</span>' +
        '<span class="breakdown-row__value">' +
        (s.low === s.high ? formatCurrency(s.low) : formatCurrency(s.low) + ' &ndash; ' + formatCurrency(s.high)) +
        '</span></div>' +
        '<div class="breakdown-row__bar"><div class="breakdown-row__bar-fill" style="width:' + barPct + '%;background:' + color + '"></div></div>';

      if (isExpandable) {
        html += '<div class="breakdown-subitems">';
        s.subItems.forEach(function (sub) {
          html += '<div class="breakdown-subitem"><span>' + sub.label + '</span><span class="breakdown-subitem__value">' + formatCurrency(sub.value) + '</span></div>';
        });
        html += '</div>';
      }
      html += '</div>';
      return html;
    }).join('');

    breakdownEl.querySelectorAll('.breakdown-row--expandable').forEach(function (row) {
      row.addEventListener('click', function () {
        row.classList.toggle('expanded');
        var subs = row.querySelector('.breakdown-subitems');
        subs.classList.toggle('expanded');
      });
    });

    renderChart(results);
  }

  // ─── Update Summaries ─────────────────────────────────────────
  function updateSummaries() {
    var m = getRegionalMultiplier(state.zipCode);
    var areas = getDerivedAreas(state.kitchenSF, state.layout);

    // Section 0
    var s0 = state.kitchenSF + ' SF, ' + KITCHEN_LAYOUTS[state.layout].label;
    if (state.zipCode.length === 5) {
      var metro = getMetroDisplayName(state.zipCode);
      if (metro) s0 = metro + ', ' + s0;
    }
    setText('summary-0', s0);

    // Section 1 - Cabinets
    if (state.cabinetsReplacing) {
      setText('summary-1', CABINET_TIERS[state.cabinetTier].label);
    } else {
      setText('summary-1', 'Keeping current');
    }

    // Section 2 - Countertops
    if (state.countertopsReplacing) {
      setText('summary-2', COUNTERTOP_MATERIALS[state.countertopMaterial].label);
    } else {
      setText('summary-2', 'Keeping current');
    }

    // Section 3 - Backsplash
    if (state.backsplashReplacing) {
      setText('summary-3', BACKSPLASH_OPTIONS[state.backsplashOption].label);
    } else {
      setText('summary-3', 'Keeping current');
    }

    // Section 4 - Flooring
    if (state.flooringReplacing) {
      setText('summary-4', FLOORING_MATERIALS[state.flooringMaterial].label);
    } else {
      setText('summary-4', 'Keeping current');
    }

    // Section 5 - Appliances & Plumbing
    var s5parts = [];
    if (state.appliancesBuying) s5parts.push(APPLIANCE_TIERS[state.applianceTier].label + ' appliances');
    else s5parts.push('Keeping appliances');
    if (state.plumbingReplacing) s5parts.push(PLUMBING_TIERS[state.plumbingTier].label + ' plumbing');
    else s5parts.push('Keeping plumbing');
    setText('summary-5', s5parts.join(', '));

    // Section 6 - Electrical
    var elecParts = [];
    if (state.lightingRecessed) elecParts.push('Recessed');
    if (state.lightingUnderCab) elecParts.push('Under-cab');
    if (state.lightingPendants) elecParts.push('Pendants');
    if (state.layoutChange) elecParts.push('Layout change');
    setText('summary-6', elecParts.length > 0 ? elecParts.join(', ') : 'No electrical');

    // Section 7 - Finishing
    var finParts = [];
    if (state.trimEnabled) finParts.push('Trim');
    if (state.paintEnabled) finParts.push('Paint');
    if (state.cabinetsReplacing) finParts.push('Demo');
    setText('summary-7', finParts.length > 0 ? finParts.join(', ') : 'None');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ─── Chart ────────────────────────────────────────────────────
  function renderChart(results) {
    var canvas = document.getElementById('cost-chart');
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      setTimeout(function () { renderChart(results); }, 200);
      return;
    }
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    var labels = results.sections.map(function (s) { return s.label; });
    var data = results.sections.map(function (s) { return Math.round((s.low + s.high) / 2); });
    var colors = results.sections.map(function (_, i) { return CHART_COLORS[i % CHART_COLORS.length]; });

    chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff', hoverBorderWidth: 3, hoverOffset: 6 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { font: { family: "'Figtree', sans-serif", size: 12 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var s = results.sections[ctx.dataIndex];
                return ' ' + s.label + ': ' + (s.low === s.high ? formatCurrency(s.low) : formatCurrency(s.low) + ' \u2013 ' + formatCurrency(s.high));
              }
            },
            titleFont: { family: "'Figtree', sans-serif" },
            bodyFont: { family: "'Figtree', sans-serif" }
          }
        },
        animation: { animateRotate: true, animateScale: false, easing: 'easeOutQuart', duration: 600 }
      }
    });
  }

  // ─── Render: Extras (Tips, ROI, Timeline, Quote Hint) ────────
  function renderExtras(results) {
    renderTips();
    renderROI();
    renderTimeline();
    renderQuoteHint(results);
  }

  function renderTips() {
    var container = document.getElementById('results-tips');
    if (!container) return;
    var tips = selectDetailedTips(state);
    if (tips.length === 0) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    container.innerHTML = tips.map(function (tip) {
      return '<div class="tip">' + tip + '</div>';
    }).join('');
  }

  function renderROI() {
    var container = document.getElementById('results-roi');
    if (!container) return;
    var roiTier = getROITier(state);
    container.classList.remove('hidden');
    document.getElementById('roi-bar-fill').style.width = roiTier.roi + '%';
    document.getElementById('roi-pct').textContent = roiTier.roi + '% recouped at resale';
    document.getElementById('roi-label').textContent = roiTier.label;
  }

  function renderTimeline() {
    var el = document.getElementById('results-timeline');
    if (!el) return;
    var timeline = getTimeline(state);
    el.innerHTML = 'Typical timeline: <strong>' + timeline + '</strong>';
    el.classList.remove('hidden');
  }

  function renderQuoteHint(results) {
    var el = document.getElementById('results-quote-hint');
    if (!el) return;
    if (results.metroName && state.zipCode.length === 5) {
      el.textContent = 'Getting contractor bids? Your quotes should fall within this range for the ' + results.metroName + '.';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  // ─── Sticky Mobile Total ──────────────────────────────────────
  function updateStickyTotal(results) {
    var valEl = document.getElementById('sticky-total-value');
    if (!valEl) return;
    if (results.totalLow > 0) {
      valEl.innerHTML = formatCurrency(results.totalLow) + ' \u2013 ' + formatCurrency(results.totalHigh);
    } else {
      valEl.textContent = '\u2014';
    }
  }

  function attachStickyTotalObserver() {
    var sticky = document.getElementById('sticky-total');
    var sentinel = document.getElementById('results-total');
    if (!sticky || !sentinel || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Show sticky bar only when the in-page total is NOT visible.
        if (entry.isIntersecting) {
          sticky.classList.remove('visible');
          sticky.setAttribute('aria-hidden', 'true');
        } else if (document.getElementById('sticky-total-value').textContent.trim() !== '\u2014') {
          sticky.classList.add('visible');
          sticky.setAttribute('aria-hidden', 'false');
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
    observer.observe(sentinel);
  }

  // ─── Share / URL State ────────────────────────────────────────
  var URL_MAP = {
    zip: ['zipCode', 'str'],
    sf: ['kitchenSF', 'int'],
    sm: ['sizeMode', 'str'],
    sp: ['selectedPreset', 'str'],
    l:  ['layout', 'str'],
    cr: ['cabinetsReplacing', 'bool'],
    ct: ['cabinetTier', 'str'],
    tr: ['countertopsReplacing', 'bool'],
    tm: ['countertopMaterial', 'str'],
    br: ['backsplashReplacing', 'bool'],
    bo: ['backsplashOption', 'str'],
    fr: ['flooringReplacing', 'bool'],
    fm: ['flooringMaterial', 'str'],
    ab: ['appliancesBuying', 'bool'],
    at: ['applianceTier', 'str'],
    pr: ['plumbingReplacing', 'bool'],
    pt: ['plumbingTier', 'str'],
    lr: ['lightingRecessed', 'bool'],
    lu: ['lightingUnderCab', 'bool'],
    lp: ['lightingPendants', 'bool'],
    lc: ['layoutChange', 'bool'],
    te: ['trimEnabled', 'bool'],
    pe: ['paintEnabled', 'bool']
  };

  function encodeStateToParams() {
    var params = new URLSearchParams();
    Object.keys(URL_MAP).forEach(function (key) {
      var map = URL_MAP[key];
      var stateKey = map[0], type = map[1];
      var v = state[stateKey];
      if (v === '' || v === null || v === undefined) return;
      if (type === 'bool') {
        params.set(key, v ? '1' : '0');
      } else {
        params.set(key, String(v));
      }
    });
    // Encode active appliance installs as a comma list of active keys.
    var activeInstalls = Object.keys(state.applianceInstalls).filter(function (k) {
      return state.applianceInstalls[k];
    });
    if (activeInstalls.length) params.set('ai', activeInstalls.join(','));
    return params;
  }

  function hydrateStateFromURL() {
    if (!window.location.search) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(URL_MAP).forEach(function (key) {
      if (!params.has(key)) return;
      var map = URL_MAP[key];
      var stateKey = map[0], type = map[1];
      var raw = params.get(key);
      if (type === 'bool') {
        state[stateKey] = raw === '1';
      } else if (type === 'int') {
        var n = parseInt(raw, 10);
        if (!isNaN(n)) state[stateKey] = n;
      } else {
        state[stateKey] = raw;
      }
    });
    if (params.has('ai')) {
      var keys = params.get('ai').split(',').filter(Boolean);
      Object.keys(state.applianceInstalls).forEach(function (k) {
        state.applianceInstalls[k] = keys.indexOf(k) !== -1;
      });
    }
  }

  function attachShareButton() {
    var btn = document.getElementById('share-btn');
    var toast = document.getElementById('share-toast');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var params = encodeStateToParams();
      var url = window.location.origin + window.location.pathname + '?' + params.toString();
      var label = btn.querySelector('.share-btn__label');

      // Fire-and-forget the modern Clipboard API, with a synchronous execCommand fallback.
      var copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { navigator.clipboard.writeText(url); copied = true; } catch (_) { /* fall through */ }
      }
      if (!copied) fallbackCopy(url);

      // Give feedback immediately — don't wait on the clipboard promise.
      btn.classList.add('share-btn--copied');
      if (label) label.textContent = 'Copied!';
      if (toast) {
        toast.classList.add('visible');
        setTimeout(function () { toast.classList.remove('visible'); }, 2000);
      }
      setTimeout(function () {
        btn.classList.remove('share-btn--copied');
        if (label) label.textContent = 'Copy link';
      }, 2200);
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  // ─── Boot ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
