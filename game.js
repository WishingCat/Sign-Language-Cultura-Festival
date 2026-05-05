/* =============================================================================
   手语文化节 · 换装展 — Game logic
   ============================================================================= */
(() => {
  "use strict";

  /* ── Catalog ─────────────────────────────────────────────────────────────── */
  // numbers map directly to the digit used in the character filename:
  //   character file =  `${top??0}${bottom??0}${shoe??0}.png`
  const CATALOG = {
    top: [
      { value: 1, src: "assets/signs/top-1.jpg" },
      { value: 2, src: "assets/signs/top-2.jpg" },
      { value: 3, src: "assets/signs/top-3.jpg" },
      { value: 4, src: "assets/signs/top-4.jpg" },
    ],
    bottom: [
      { value: 1, src: "assets/signs/bottom-1.jpg" },
      { value: 2, src: "assets/signs/bottom-2.jpg" },
      { value: 3, src: "assets/signs/bottom-3.jpg" },
      { value: 4, src: "assets/signs/bottom-4.jpg" },
    ],
    // shoe digit "4" (靴子) intentionally absent — no rendered character images.
    shoe: [
      { value: 1, src: "assets/signs/shoe-1.jpg" },
      { value: 2, src: "assets/signs/shoe-2.jpg" },
      { value: 3, src: "assets/signs/shoe-3.jpg" },
      { value: 5, src: "assets/signs/shoe-5.png" },
    ],
  };

  const SLOT_LABEL = { top: "上衣", bottom: "下装", shoe: "鞋子" };
  const SLOT_HINT  = { top: "TOPS", bottom: "BOTTOMS", shoe: "SHOES" };

  /* ── State ───────────────────────────────────────────────────────────────── */
  const state = {
    top: null,
    bottom: null,
    shoe: null,
  };

  // The artist did not draw certain bottom + shoe combinations:
  //   毛裤(2) + 运动鞋(5)   ← no athletic-shoes-with-thermal-pants
  //   短裤(3) + 皮鞋(1)     ← no leather-shoes-with-shorts
  //   裙子(4) + 皮鞋(1)     ← no leather-shoes-with-skirt
  const INCOMPATIBLE_BOTTOM_SHOE = {
    2: new Set([5]),
    3: new Set([1]),
    4: new Set([1]),
  };
  function isShoeCompatible(shoeValue) {
    if (state.bottom == null) return true;
    const blocked = INCOMPATIBLE_BOTTOM_SHOE[state.bottom];
    return !blocked || !blocked.has(shoeValue);
  }

  /* ── DOM refs ────────────────────────────────────────────────────────────── */
  const $character = document.getElementById("character");
  const $resetBtn = document.getElementById("resetBtn");
  const $stamp = document.getElementById("sparkleBurst");
  const $cover = document.getElementById("cover");
  const $game = document.getElementById("game");
  const $startBtn = document.getElementById("startBtn");
  const $homeBtn = document.getElementById("homeBtn");
  const $bloomBurst = document.getElementById("bloomBurst");
  const $nickInput = document.getElementById("nickInput");
  const $nickError = document.getElementById("nickError");
  const $nickWrap = $nickInput && $nickInput.closest(".cover__name");
  const $fellowsPanel = document.getElementById("fellowsPanel");
  const $fellowsList = document.getElementById("fellowsList");
  const $fellowsCount = document.getElementById("fellowsCount");
  const $fellowsMore = document.getElementById("fellowsMore");
  const $strollBtn = document.getElementById("strollBtn");
  const $mbtiFieldset = document.getElementById("mbtiFieldset");
  const $mbtiOut = document.getElementById("mbtiOut");
  const railGrids = {
    top: document.getElementById("rail-top"),
    bottom: document.getElementById("rail-bottom"),
    shoe: document.getElementById("rail-shoe"),
  };
  const railCategories = document.querySelectorAll(".rail__category");
  const clearBtns = document.querySelectorAll(".rail__clear");
  const headBtns = document.querySelectorAll(".rail__head-btn");

  const SLOT_ORDER = ["top", "bottom", "shoe"];
  // Track which single category is expanded. Default: top.
  let expandedSlot = "top";

  /* ── Render cards ────────────────────────────────────────────────────────── */
  function renderRails() {
    Object.entries(CATALOG).forEach(([slot, items]) => {
      const grid = railGrids[slot];
      grid.innerHTML = "";
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "card";
        btn.setAttribute("aria-pressed", "false");
        btn.dataset.slot = slot;
        btn.dataset.value = String(item.value);
        btn.innerHTML = `
          <div class="card__img-wrap">
            <img class="card__img" src="${item.src}" alt="${SLOT_LABEL[slot]}手语 № ${item.value}" loading="lazy" draggable="false">
          </div>
          <span class="card__num">${item.value.toString().padStart(2, "0")}</span>
          <span class="card__hint">${SLOT_HINT[slot]}</span>
        `;
        btn.addEventListener("click", () => onCardClick(slot, item.value));
        grid.appendChild(btn);
      });
    });
  }

  /* ── Selection ───────────────────────────────────────────────────────────── */
  // The character art is layered: a non-zero shoe needs a non-zero bottom,
  // a non-zero bottom needs a non-zero top. Categories activate sequentially.
  function isSlotEnabled(slot) {
    if (slot === "top") return true;
    if (slot === "bottom") return state.top != null;
    if (slot === "shoe") return state.bottom != null;
    return false;
  }

  function onCardClick(slot, value) {
    if (!isSlotEnabled(slot)) return;
    if (slot === "shoe" && !isShoeCompatible(value)) return;
    // toggle: clicking same selected card unselects (back to null)
    state[slot] = state[slot] === value ? null : value;
    // clearing a parent slot also clears any dependent child slots
    if (slot === "top" && state.top == null) {
      state.bottom = null;
      state.shoe = null;
    }
    if (slot === "bottom" && state.bottom == null) {
      state.shoe = null;
    }
    // changing bottom may invalidate current shoe selection
    if (slot === "bottom" && state.shoe != null && !isShoeCompatible(state.shoe)) {
      state.shoe = null;
    }
    syncCardStates();
    syncCategorySelectedFlag();
    syncExpandedState();
    renderCharacter();
  }

  function clearSlot(slot) {
    state[slot] = null;
    if (slot === "top") { state.bottom = null; state.shoe = null; }
    if (slot === "bottom") { state.shoe = null; }
    syncCardStates();
    syncCategorySelectedFlag();
    // cleared → reopen that category
    setExpanded(slot);
    renderCharacter();
  }

  function setExpanded(slot) {
    expandedSlot = slot;
    syncExpandedState();
  }

  function syncExpandedState() {
    // If expandedSlot is locked, fall back to the deepest unlocked slot
    if (!isSlotEnabled(expandedSlot)) {
      for (let i = SLOT_ORDER.length - 1; i >= 0; i--) {
        if (isSlotEnabled(SLOT_ORDER[i])) { expandedSlot = SLOT_ORDER[i]; break; }
      }
    }
    railCategories.forEach((cat) => {
      const slot = cat.dataset.slot;
      const isOpen = slot === expandedSlot && isSlotEnabled(slot);
      cat.dataset.expanded = isOpen ? "true" : "false";
      const btn = cat.querySelector(".rail__head-btn");
      if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function syncCardStates() {
    document.querySelectorAll(".card").forEach((btn) => {
      const { slot, value } = btn.dataset;
      const v = Number(value);
      const selected = state[slot] === v;
      let enabled = isSlotEnabled(slot);
      let incompatible = false;
      if (slot === "shoe" && enabled && !isShoeCompatible(v)) {
        enabled = false;
        incompatible = true;
      }
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
      btn.toggleAttribute("disabled", !enabled);
      btn.dataset.locked = enabled ? "false" : "true";
      btn.dataset.incompatible = incompatible ? "true" : "false";
    });
  }

  function syncCategorySelectedFlag() {
    railCategories.forEach((cat) => {
      const slot = cat.dataset.slot;
      cat.dataset.hasSelection = state[slot] != null ? "true" : "false";
      cat.dataset.locked = isSlotEnabled(slot) ? "false" : "true";
    });
  }

  /* ── Character render ────────────────────────────────────────────────────── */
  let lastSrc = $character.getAttribute("src");

  function renderCharacter() {
    const { top, bottom, shoe } = state;
    const allUntouched = top == null && bottom == null && shoe == null;
    const allSet = top != null && bottom != null && shoe != null;

    let nextSrc;
    if (allUntouched) {
      nextSrc = "assets/characters/start.png";
    } else {
      const t = top ?? 0;
      const b = bottom ?? 0;
      const s = shoe ?? 0;
      nextSrc = `assets/characters/${t}${b}${s}.png`;
    }

    if (nextSrc !== lastSrc) {
      swapCharacter(nextSrc);
      lastSrc = nextSrc;
    }

    if (allSet) {
      // Show the stroll CTA, but defer stamp + submit + roster until user clicks it.
      toggleCompleteStamp(false);
      showStrollBtn(top, bottom, shoe);
      hideFellowsPanel();
    } else {
      toggleCompleteStamp(false);
      hideStrollBtn();
      hideFellowsPanel();
    }
  }

  function swapCharacter(nextSrc) {
    $character.classList.remove("is-swapping-in");
    $character.classList.add("is-swapping-out");
    const ghost = new Image();
    ghost.onload = ghost.onerror = () => {
      $character.src = nextSrc;
      $character.classList.remove("is-swapping-out");
      // force reflow so animation re-triggers
      // eslint-disable-next-line no-unused-expressions
      $character.offsetWidth;
      $character.classList.add("is-swapping-in");
    };
    ghost.src = nextSrc;
  }

  function toggleCompleteStamp(show) {
    if (show) {
      $stamp.classList.remove("is-visible");
      // restart animation
      // eslint-disable-next-line no-unused-expressions
      $stamp.offsetWidth;
      $stamp.classList.add("is-visible");
    } else {
      $stamp.classList.remove("is-visible");
    }
  }

  /* ── Cover ↔ Game transitions ────────────────────────────────────────────── */
  let isTransitioning = false;

  function enterGame() {
    if (isTransitioning) return;
    if (!validateAndStoreNick()) return;
    isTransitioning = true;
    if ($bloomBurst) {
      $bloomBurst.classList.remove("is-bursting");
      // force reflow so animation re-triggers
      // eslint-disable-next-line no-unused-expressions
      $bloomBurst.offsetWidth;
      $bloomBurst.classList.add("is-bursting");
    }
    $cover.classList.add("is-leaving");
    window.setTimeout(() => {
      $cover.hidden = true;
      $cover.classList.remove("is-leaving");
      if ($bloomBurst) $bloomBurst.classList.remove("is-bursting");
      $game.hidden = false;
      $game.classList.remove("is-entering");
      // eslint-disable-next-line no-unused-expressions
      $game.offsetWidth;
      $game.classList.add("is-entering");
      window.setTimeout(() => {
        $game.classList.remove("is-entering");
        isTransitioning = false;
      }, 800);
    }, 520);
  }

  function returnToCover() {
    if (isTransitioning) return;
    isTransitioning = true;
    $game.hidden = true;
    $cover.hidden = false;
    $cover.classList.remove("is-leaving");
    // eslint-disable-next-line no-unused-expressions
    $cover.offsetWidth;
    isTransitioning = false;
  }

  /* ── Nickname ────────────────────────────────────────────────────────────── */
  const NICK_KEY = "signNickname";
  let nickname = "";

  function loadNickname() {
    try { nickname = (localStorage.getItem(NICK_KEY) || "").slice(0, 20); }
    catch { nickname = ""; }
    if ($nickInput && nickname) $nickInput.value = nickname;
  }
  function setNickError(msg) {
    if (!$nickError) return;
    $nickError.textContent = msg || "";
    if (msg && $nickWrap) {
      $nickWrap.classList.remove("is-shaking");
      // eslint-disable-next-line no-unused-expressions
      $nickWrap.offsetWidth;
      $nickWrap.classList.add("is-shaking");
    }
  }
  function sanitizeNickFront(raw) {
    if (typeof raw !== "string") return "";
    return raw.replace(/[ -<>&"'`]/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 20);
  }
  function validateAndStoreNick() {
    if (!$nickInput) return true; // safety: if input missing, do not block
    const cleaned = sanitizeNickFront($nickInput.value);
    if (!cleaned) {
      setNickError("请填一个 1–20 字的昵称 ✿");
      $nickInput.focus();
      return false;
    }
    setNickError("");
    nickname = cleaned;
    $nickInput.value = cleaned;
    try { localStorage.setItem(NICK_KEY, cleaned); } catch {}
    return true;
  }

  /* ── MBTI ────────────────────────────────────────────────────────────────── */
  const MBTI_KEY = "signMbti";
  const MBTI_VALID = [
    new Set(["I", "E", "X"]),
    new Set(["N", "S", "X"]),
    new Set(["F", "T", "X"]),
    new Set(["P", "J", "X"]),
  ];
  const AXIS_ORDER = ["ie", "ns", "ft", "pj"];
  const AXIS_INDEX = { ie: 0, ns: 1, ft: 2, pj: 3 };
  let mbti = "XXXX";

  function setMbtiChar(axisKey, ch) {
    const i = AXIS_INDEX[axisKey];
    if (i == null) return;
    if (!MBTI_VALID[i].has(ch)) ch = "X";
    mbti = mbti.slice(0, i) + ch + mbti.slice(i + 1);
    try { localStorage.setItem(MBTI_KEY, mbti); } catch {}
    syncMbtiUI();
  }
  function syncMbtiUI() {
    if (!$mbtiFieldset) return;
    AXIS_ORDER.forEach((axis, i) => {
      const ch = mbti[i];
      $mbtiFieldset.querySelectorAll(`.seg__btn[data-axis="${axis}"]`).forEach(btn => {
        btn.classList.toggle("is-on", btn.dataset.value === ch);
      });
    });
    if ($mbtiOut) $mbtiOut.textContent = mbti;
  }
  function loadMbti() {
    try {
      const raw = (localStorage.getItem(MBTI_KEY) || "XXXX").toUpperCase();
      mbti = "";
      for (let i = 0; i < 4; i++) {
        const ch = raw[i];
        mbti += ch && MBTI_VALID[i].has(ch) ? ch : "X";
      }
    } catch { mbti = "XXXX"; }
    syncMbtiUI();
  }

  /* ── Fellows (same-outfit roster) ───────────────────────────────────────── */
  const submittedCodes = new Set();
  let fellowsExpanded = false;
  let lastQueryCode = null;
  let inflight = null;

  function codeOf(t, b, s) { return `${t}${b}${s}`; }

  async function submitOutfit(t, b, s) {
    const code = codeOf(t, b, s);
    if (submittedCodes.has(code)) return;
    submittedCodes.add(code);
    try {
      await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, t, b, s, mbti }),
      });
    } catch (e) {
      // silently swallow — name list will still try to load
      submittedCodes.delete(code);
    }
  }

  async function loadFellows(t, b, s) {
    if (!$fellowsPanel) return;
    const code = codeOf(t, b, s);
    lastQueryCode = code;
    showFellowsLoading();
    try {
      const res = await fetch(`/api/outfits?t=${t}&b=${b}&s=${s}`);
      if (!res.ok) throw new Error("http " + res.status);
      const data = await res.json();
      if (lastQueryCode !== code) return; // stale
      renderFellows(data.list || [], code);
    } catch (e) {
      if (lastQueryCode === code) renderFellowsError(t, b, s);
    }
  }

  function showFellowsPanel() {
    if (!$fellowsPanel) return;
    $fellowsPanel.hidden = false;
  }
  function hideFellowsPanel() {
    if (!$fellowsPanel) return;
    $fellowsPanel.hidden = true;
    if ($fellowsList) $fellowsList.innerHTML = "";
    if ($fellowsCount) $fellowsCount.textContent = "—";
    if ($fellowsMore) $fellowsMore.hidden = true;
    fellowsExpanded = false;
  }
  function showFellowsLoading() {
    showFellowsPanel();
    if (!$fellowsList) return;
    $fellowsList.classList.add("is-loading");
    $fellowsList.classList.remove("is-collapsed");
    $fellowsList.innerHTML =
      '<span class="fellows__skel"></span>'.repeat(6);
    if ($fellowsCount) $fellowsCount.textContent = "...";
    if ($fellowsMore) $fellowsMore.hidden = true;
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${m}/${day} ${hh}:${mm}`;
  }
  function escapeText(s) {
    return String(s).replace(/[<>&"']/g, c => ({
      "<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"
    })[c]);
  }
  function renderFellows(list, code) {
    if (!$fellowsList) return;
    $fellowsList.classList.remove("is-loading");
    showFellowsPanel();
    // Sort newest first; mark the (last) entry whose nick matches as "self"
    const sorted = list.slice().sort((a, b) => b.ts - a.ts);
    const others = sorted.length;
    if ($fellowsCount) {
      $fellowsCount.textContent = others <= 1
        ? "仅你一人"
        : `共 ${others} 人`;
    }
    if (sorted.length === 0) {
      $fellowsList.innerHTML =
        '<li class="fellows__empty">✿ 你是<strong>第一个</strong>穿这身的同学</li>';
      if ($fellowsMore) $fellowsMore.hidden = true;
      return;
    }
    let selfFlagged = false;
    const html = sorted.map((e, i) => {
      const isSelf = !selfFlagged && e.nick === nickname;
      if (isSelf) selfFlagged = true;
      const cls = "fellows__item" + (isSelf ? " fellows__item--self" : "");
      const delay = (i * 35).toFixed(0);
      return `<li class="${cls}" style="animation-delay:${delay}ms">
        <span class="fellows__item-mark">${isSelf ? "✿你" : "✿"}</span>
        <span class="fellows__item-nick">${escapeText(e.nick)}</span>${
          e.mbti && e.mbti !== "XXXX"
            ? `<span class="fellows__item-mbti">${escapeText(e.mbti)}</span>`
            : ""
        }
        <span class="fellows__item-time">${fmtTime(e.ts)}</span>
      </li>`;
    }).join("");
    $fellowsList.innerHTML = html;
    if (sorted.length > 12) {
      $fellowsList.classList.add("is-collapsed");
      if ($fellowsMore) {
        $fellowsMore.hidden = false;
        $fellowsMore.classList.remove("is-open");
        $fellowsMore.querySelector(".fellows__more-text").textContent =
          `展开全部（+${sorted.length - 12}）`;
      }
      fellowsExpanded = false;
    } else {
      $fellowsList.classList.remove("is-collapsed");
      if ($fellowsMore) $fellowsMore.hidden = true;
    }
  }
  function toggleFellowsExpand() {
    if (!$fellowsList || !$fellowsMore) return;
    fellowsExpanded = !fellowsExpanded;
    $fellowsList.classList.toggle("is-collapsed", !fellowsExpanded);
    $fellowsMore.classList.toggle("is-open", fellowsExpanded);
    const t = $fellowsMore.querySelector(".fellows__more-text");
    if (t) t.textContent = fellowsExpanded ? "收起" : "展开全部";
  }
  function renderFellowsError(t, b, s) {
    if (!$fellowsList) return;
    $fellowsList.classList.remove("is-loading");
    $fellowsList.innerHTML =
      `<li class="fellows__error">
         <span>✿ 名单暂时拿不到，先 enjoy 你的造型</span>
         <button type="button" class="fellows__retry">重试</button>
       </li>`;
    if ($fellowsCount) $fellowsCount.textContent = "—";
    if ($fellowsMore) $fellowsMore.hidden = true;
    const btn = $fellowsList.querySelector(".fellows__retry");
    if (btn) btn.addEventListener("click", () => loadFellows(t, b, s));
  }

  /* ── Stroll CTA (gates the reveal) ───────────────────────────────────────── */
  let strollOutfit = null;       // {t,b,s} the button currently represents
  let strollBusy = false;
  function showStrollBtn(t, b, s) {
    if (!$strollBtn) return;
    strollOutfit = { t, b, s };
    if ($strollBtn.hidden) {
      $strollBtn.hidden = false;
      // restart entrance animation each time it appears
      $strollBtn.style.animation = "none";
      // eslint-disable-next-line no-unused-expressions
      $strollBtn.offsetWidth;
      $strollBtn.style.animation = "";
    }
    $strollBtn.disabled = false;
  }
  function hideStrollBtn() {
    if (!$strollBtn) return;
    strollOutfit = null;
    $strollBtn.hidden = true;
    $strollBtn.disabled = false;
  }
  async function onStrollClick() {
    if (strollBusy || !strollOutfit) return;
    const { t, b, s } = strollOutfit;
    strollBusy = true;
    if ($strollBtn) $strollBtn.disabled = true;
    // Step 1: stamp + petal burst
    toggleCompleteStamp(true);
    // Step 2: hide the button (after the stamp animation kicks in)
    window.setTimeout(() => { hideStrollBtn(); }, 450);
    // Step 3: submit + load roster (fellows panel renders skeleton then list)
    submitOutfit(t, b, s);
    await loadFellows(t, b, s);
    strollBusy = false;
  }

  /* ── Reset ───────────────────────────────────────────────────────────────── */
  function reset() {
    state.top = null;
    state.bottom = null;
    state.shoe = null;
    syncCardStates();
    syncCategorySelectedFlag();
    setExpanded("top");
    renderCharacter();
    const stage = $character && $character.closest(".stage");
    if (stage) {
      stage.classList.remove("is-flipping");
      // eslint-disable-next-line no-unused-expressions
      stage.offsetWidth;
      stage.classList.add("is-flipping");
      stage.addEventListener("animationend", function onEnd(e) {
        if (e.animationName === "pageFlip") {
          stage.classList.remove("is-flipping");
          stage.removeEventListener("animationend", onEnd);
        }
      });
    }
  }

  /* ── Preload character images (idle) ─────────────────────────────────────── */
  function preloadCharacters() {
    const paths = ["assets/characters/start.png", "assets/characters/000.png"];
    const tops = [1, 2, 3, 4];
    const bottoms = [1, 2, 3, 4];
    const shoes = [1, 2, 3, 5];
    for (const t of tops) {
      paths.push(`assets/characters/${t}00.png`);
      for (const b of bottoms) {
        paths.push(`assets/characters/${t}${b}0.png`);
        const blocked = INCOMPATIBLE_BOTTOM_SHOE[b] || new Set();
        for (const s of shoes) {
          if (blocked.has(s)) continue;
          paths.push(`assets/characters/${t}${b}${s}.png`);
        }
      }
    }

    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
    idle(() => {
      paths.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    });
  }

  /* ── Mouse-following petal trail ─────────────────────────────────────────── */
  function initPetalTrail() {
    const canvas = document.getElementById("petalCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const petals = [];
    const MAX = 50;
    const COLORS = [
      ["#FF8FAB", "#E66589"], // bloom
      ["#FFD23F", "#F0B41E"], // sun
      ["#BFE39A", "#6FB43F"], // leaf
      ["#FFC9D8", "#FF8FAB"], // pale bloom
      ["#D7ECF8", "#8EC5E8"], // sky
    ];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let lastX = null, lastY = null, lastT = 0;
    let lastSpawn = 0;
    function spawn(x, y, vx, vy, opts) {
      const palette = COLORS[(Math.random() * COLORS.length) | 0];
      const o = opts || {};
      petals.push({
        x, y,
        vx: vx * 0.18 + (Math.random() - 0.5) * 0.5,
        vy: vy * 0.12 + (Math.random() * 0.18 + 0.05),
        size: (o.sizeMin || 7) + Math.random() * (o.sizeRange || 7),
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        sway: Math.random() * Math.PI * 2,
        swayAmp: 0.5 + Math.random() * 0.6,
        color: palette[0],
        edge: palette[1],
        life: 0,
        ttl: o.ttl || (260 + Math.random() * 140),
        kind: Math.random() < 0.55 ? "petal" : (Math.random() < 0.5 ? "leaf" : "round"),
      });
      while (petals.length > MAX) petals.shift();
    }

    function onMove(e) {
      const x = e.clientX, y = e.clientY;
      const t = performance.now();
      if (t - lastSpawn < 90) {
        lastX = x; lastY = y; lastT = t;
        return;
      }
      const dx = lastX == null ? 0 : x - lastX;
      const dy = lastY == null ? 0 : y - lastY;
      const dt = Math.max(8, t - lastT);
      const jitterX = (Math.random() - 0.5) * 10;
      const jitterY = (Math.random() - 0.5) * 10;
      spawn(x + jitterX, y + jitterY, dx / dt * 6, dy / dt * 6);
      lastX = x; lastY = y; lastT = t; lastSpawn = t;
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", (e) => {
      const N = 9;
      for (let i = 0; i < N; i++) {
        const a = (Math.PI * 2 * i) / N + Math.random() * 0.3;
        const r = 18 + Math.random() * 14;
        const speed = 16 + Math.random() * 10;
        spawn(
          e.clientX + Math.cos(a) * r,
          e.clientY + Math.sin(a) * r,
          Math.cos(a) * speed,
          Math.sin(a) * speed - 8,
          { ttl: 380 + Math.random() * 160, sizeMin: 9, sizeRange: 8 }
        );
      }
      // a couple of slow drifting sparkle dots
      for (let i = 0; i < 4; i++) {
        spawn(
          e.clientX + (Math.random() - 0.5) * 30,
          e.clientY + (Math.random() - 0.5) * 30,
          0, -2 - Math.random() * 3,
          { ttl: 320 + Math.random() * 120, sizeMin: 4, sizeRange: 3 }
        );
      }
    });

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = (() => {
        const f = p.life / p.ttl;
        if (f < 0.15) return f / 0.15 * 0.9;        // gentle fade in
        if (f > 0.7) return Math.max(0, (1 - f) / 0.3) * 0.9; // slow fade out
        return 0.9;
      })();
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.edge;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (p.kind === "petal") {
        // sakura-style teardrop
        const s = p.size;
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.7, -s * 0.6, s * 0.7, s * 0.4, 0, s);
        ctx.bezierCurveTo(-s * 0.7, s * 0.4, -s * 0.7, -s * 0.6, 0, -s);
      } else if (p.kind === "leaf") {
        const s = p.size;
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s, 0, 0, s);
        ctx.quadraticCurveTo(-s, 0, 0, -s);
      } else {
        ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.life++;
        p.sway += 0.018;
        p.vx += Math.sin(p.sway) * 0.012 * p.swayAmp;
        p.vy += 0.008; // very gentle gravity
        p.vx *= 0.992;
        p.vy *= 0.996;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        if (p.life > p.ttl || p.y > H + 40) {
          petals.splice(i, 1);
          continue;
        }
        drawPetal(p);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ── Wire it up ──────────────────────────────────────────────────────────── */
  function init() {
    renderRails();
    syncCategorySelectedFlag();
    syncExpandedState();
    $resetBtn.addEventListener("click", reset);
    if ($startBtn) $startBtn.addEventListener("click", enterGame);
    if ($homeBtn) $homeBtn.addEventListener("click", returnToCover);
    clearBtns.forEach((btn) => {
      btn.addEventListener("click", () => clearSlot(btn.dataset.clear));
    });
    headBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.toggle;
        if (!isSlotEnabled(slot)) return;
        setExpanded(slot);
      });
    });
    preloadCharacters();
    initPetalTrail();
    loadNickname();
    if ($nickInput) {
      $nickInput.addEventListener("input", () => setNickError(""));
      $nickInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); enterGame(); }
      });
    }
    if ($fellowsMore) $fellowsMore.addEventListener("click", toggleFellowsExpand);
    if ($strollBtn) $strollBtn.addEventListener("click", onStrollClick);
    loadMbti();
    if ($mbtiFieldset) {
      $mbtiFieldset.addEventListener("click", (e) => {
        const btn = e.target.closest(".seg__btn");
        if (!btn) return;
        const axis = btn.dataset.axis;
        const value = btn.dataset.value;
        if (!axis || !value) return;
        setMbtiChar(axis, value);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
