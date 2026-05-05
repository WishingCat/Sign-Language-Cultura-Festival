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
      { value: 1, src: "assets/signs/top-1.jpg",    item: "assets/items/top-1.png",    label: "羽绒服" },
      { value: 2, src: "assets/signs/top-2.jpg",    item: "assets/items/top-2.png",    label: "T 恤" },
      { value: 3, src: "assets/signs/top-3.jpg",    item: "assets/items/top-3.png",    label: "毛衣" },
      { value: 4, src: "assets/signs/top-4.jpg",    item: "assets/items/top-4.png",    label: "衬衫" },
    ],
    bottom: [
      { value: 1, src: "assets/signs/bottom-1.jpg", item: "assets/items/bottom-1.png", label: "牛仔裤" },
      { value: 2, src: "assets/signs/bottom-2.jpg", item: "assets/items/bottom-2.png", label: "毛裤" },
      { value: 3, src: "assets/signs/bottom-3.jpg", item: "assets/items/bottom-3.png", label: "短裤" },
      { value: 4, src: "assets/signs/bottom-4.jpg", item: "assets/items/bottom-4.png", label: "裙子" },
    ],
    shoe: [
      { value: 1, src: "assets/signs/shoe-1.jpg",   item: "assets/items/shoe-1.png",   label: "皮鞋" },
      { value: 2, src: "assets/signs/shoe-2.jpg",   item: "assets/items/shoe-2.png",   label: "高跟鞋" },
      { value: 3, src: "assets/signs/shoe-3.jpg",   item: "assets/items/shoe-3.png",   label: "拖鞋" },
      { value: 4, src: "assets/items/shoe-4.png",   item: "assets/items/shoe-4.png",   label: "靴子" },
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

  // Two combinations that don't have a `${t}${b}4.png` rendered: 144 and 414.
  // For those we fall back to `${t}${b}5.png` which the asset folder still ships.
  const SHOE4_FALLBACK = new Set(["14", "41"]);
  function isShoeCompatible() { return true; }

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
  const $tabbar = document.getElementById("tabbar");
  const $panelWall = document.getElementById("panelWall");
  const $panelBoard = document.getElementById("panelBoard");
  const $dressingId = document.getElementById("dressingId");
  const $dressingNick = document.getElementById("dressingNick");
  const $dressingSeq = document.getElementById("dressingSeq");
  const $dressingMbti = document.getElementById("dressingMbti");
  const $wallSub = document.getElementById("wallSub");
  const $wallEmpty = document.getElementById("wallEmpty");
  const $wallHero = document.getElementById("wallHero");
  const $wallHeroImg = document.getElementById("wallHeroImg");
  const $wallHeroNick = document.getElementById("wallHeroNick");
  const $wallHeroSeq = document.getElementById("wallHeroSeq");
  const $wallHeroMbti = document.getElementById("wallHeroMbti");
  const $wallOthers = document.getElementById("wallOthers");
  const $wallOthersList = document.getElementById("wallOthersList");
  const $wallOthersEmpty = document.getElementById("wallOthersEmpty");
  const $wallOthersRefresh = document.getElementById("wallOthersRefresh");
  const $boardForm = document.getElementById("boardForm");
  const $boardInput = document.getElementById("boardInput");
  const $boardCount = document.getElementById("boardCount");
  const $boardError = document.getElementById("boardError");
  const $boardList = document.getElementById("boardList");
  const $boardEmpty = document.getElementById("boardEmpty");
  const $boardLocked = document.getElementById("boardLocked");
  const $boardPost = document.getElementById("boardPost");
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
    syncStageItems();
  }

  /* ── Side item display (items flank the stage based on active rail) ──── */
  const $stageItemsLeft  = document.getElementById("stageItemsLeft");
  const $stageItemsRight = document.getElementById("stageItemsRight");
  let renderedItemsSlot = null;

  function renderStageItemsFor(slot) {
    if (!$stageItemsLeft || !$stageItemsRight) return;
    if (renderedItemsSlot === slot) return; // already rendered
    renderedItemsSlot = slot;
    const items = (CATALOG[slot] || []).filter(it => it.item);
    // Two on each side; pad with blanks if fewer.
    const left = items.slice(0, 2);
    const right = items.slice(2, 4);
    $stageItemsLeft.innerHTML  = left.map(itemCardHTML).join("");
    $stageItemsRight.innerHTML = right.map(itemCardHTML).join("");
  }
  function itemCardHTML(it) {
    return `<div class="stage-item" data-slot-value="${it.value}">
      <img class="stage-item__img" src="${it.item}" alt="${it.label}" loading="lazy" draggable="false">
      <span class="stage-item__label">${it.label}</span>
    </div>`;
  }
  function syncStageItems() {
    if (!$stageItemsLeft || !$stageItemsRight) return;
    const slot = expandedSlot;
    if (!slot || !isSlotEnabled(slot)) {
      $stageItemsLeft.classList.remove("is-visible");
      $stageItemsRight.classList.remove("is-visible");
      return;
    }
    renderStageItemsFor(slot);
    // Mark currently selected item active
    const selected = state[slot];
    [$stageItemsLeft, $stageItemsRight].forEach(box => {
      box.querySelectorAll(".stage-item").forEach(el => {
        const v = Number(el.dataset.slotValue);
        el.classList.toggle("is-active", v === selected);
      });
      box.classList.add("is-visible");
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
    syncStageItems();
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
      let s = shoe ?? 0;
      // 144 / 414 don't exist; the artist used digit 5 for those two combos.
      if (s === 4 && SHOE4_FALLBACK.has(`${t}${b}`)) s = 5;
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

  async function enterGame() {
    if (isTransitioning) return;
    if (!validateAndStoreNick()) return;
    // Step 1: server-side check and register the nickname (sequential UID)
    if ($startBtn) $startBtn.disabled = true;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, nickname, mbti }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        const sug = data.suggestion ? `，试试「${data.suggestion}」？` : "";
        setNickError(`「${nickname}」已被同学使用 ✿${sug}`);
        if (data.suggestion && $nickInput) $nickInput.value = data.suggestion;
        return;
      }
      if (!res.ok || !data.ok) {
        setNickError("注册失败了，再试一次 ✿");
        return;
      }
      userSeq = data.seq;
      userDisplayUid = data.displayUid;
      try {
        localStorage.setItem(SEQ_KEY, String(userSeq));
        localStorage.setItem(DUID_KEY, userDisplayUid);
      } catch {}
      updateDressingId();
    } catch (e) {
      setNickError("网络打了个盹儿，再试一次 ✿");
      return;
    } finally {
      if ($startBtn) $startBtn.disabled = false;
    }

    // Step 2: animated transition to the game
    isTransitioning = true;
    if ($bloomBurst) {
      $bloomBurst.classList.remove("is-bursting");
      // eslint-disable-next-line no-unused-expressions
      $bloomBurst.offsetWidth;
      $bloomBurst.classList.add("is-bursting");
    }
    $cover.classList.add("is-leaving");
    window.setTimeout(() => {
      $cover.hidden = true;
      $cover.classList.remove("is-leaving");
      if ($bloomBurst) $bloomBurst.classList.remove("is-bursting");
      revealApp();          // show tabbar + dressing panel
      navigate("dressing");
      isTransitioning = false;
    }, 520);
  }

  function returnToCover() {
    if (isTransitioning) return;
    navigate("home");
  }

  /* ── Nickname ────────────────────────────────────────────────────────────── */
  const NICK_KEY = "signNickname";
  const UID_KEY = "signUid";
  const SEQ_KEY = "signSeq";
  const DUID_KEY = "signDisplayUid";
  let nickname = "";
  let userId = "";
  let userSeq = 0;
  let userDisplayUid = "";

  function loadUserId() {
    try {
      let v = localStorage.getItem(UID_KEY) || "";
      if (!/^[a-f0-9-]{8,}$/i.test(v)) {
        v = (crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(UID_KEY, v);
      }
      userId = v;
    } catch { userId = "anon-" + Math.random().toString(36).slice(2, 10); }
  }

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
  let fellowsExpanded = false;
  let lastQueryCode = null;
  let inflight = null;

  function codeOf(t, b, s) { return `${t}${b}${s}`; }

  async function submitOutfit(t, b, s) {
    try {
      await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, nickname, t, b, s, mbti }),
      });
    } catch (e) {
      // silently swallow — name list will still try to load
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
      if ($wallSub && lastSubmittedOutfit) {
        const { t, b, s } = lastSubmittedOutfit;
        $wallSub.textContent = `造型 ${codeOf(t,b,s)} · 你是第一位`;
      }
      return;
    }
    let selfFlagged = false;
    const html = sorted.map((e, i) => {
      const isSelf = !selfFlagged && e.seq && e.seq === userSeq;
      if (isSelf) selfFlagged = true;
      const cls = "fellows__item" + (isSelf ? " fellows__item--self" : "");
      const delay = (i * 35).toFixed(0);
      const seq = e.displayUid || (e.seq ? "#" + String(e.seq).padStart(3, "0") : "");
      return `<li class="${cls}" style="animation-delay:${delay}ms">
        <span class="fellows__item-mark">${isSelf ? "✿你" : "✿"}</span>
        <span class="user-tag${isSelf?" user-tag--mine":""}">
          <span class="user-tag__nick fellows__item-nick">${escapeText(e.nick)}</span>${
            seq ? `<span class="user-tag__seq fellows__item-seq">${escapeText(seq)}</span>` : ""
          }
        </span>${
          e.mbti && e.mbti !== "XXXX"
            ? `<span class="fellows__item-mbti">${escapeText(e.mbti)}</span>`
            : ""
        }
        <span class="fellows__item-time">${fmtTime(e.ts)}</span>
      </li>`;
    }).join("");
    $fellowsList.innerHTML = html;
    if ($wallSub && lastSubmittedOutfit) {
      const { t, b, s } = lastSubmittedOutfit;
      $wallSub.textContent = `造型 ${codeOf(t,b,s)} · 共 ${sorted.length} 人`;
    }
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
    // Step 3: submit + remember outfit, then navigate to the Wall after the stamp animation.
    setLastOutfit(t, b, s);
    try { await submitOutfit(t, b, s); } catch {}
    window.setTimeout(() => { navigate("wall"); strollBusy = false; }, 900);
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
    const shoes = [1, 2, 3, 4];
    for (const t of tops) {
      paths.push(`assets/characters/${t}00.png`);
      for (const b of bottoms) {
        paths.push(`assets/characters/${t}${b}0.png`);
        for (const s of shoes) {
          // tb-only "144" / "414" combos render shoe digit 5 instead.
          const sFinal = (s === 4 && SHOE4_FALLBACK.has(`${t}${b}`)) ? 5 : s;
          paths.push(`assets/characters/${t}${b}${sFinal}.png`);
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

  /* ── Routing + tabs ──────────────────────────────────────────────────────── */
  const ROUTES = ["home", "dressing", "wall", "board"];
  let currentRoute = "home";
  let messagePollTimer = null;

  function isRegistered() { return userSeq > 0; }

  function revealApp() {
    if ($tabbar) $tabbar.hidden = false;
    if ($game) $game.hidden = false;
  }
  function hideApp() {
    if ($tabbar) $tabbar.hidden = true;
    if ($game) $game.hidden = true;
  }

  function setActiveTab(route) {
    if (!$tabbar) return;
    $tabbar.querySelectorAll(".tabbar__btn").forEach(btn => {
      const on = btn.dataset.route === route;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function showOnly(route) {
    // map: home=cover, dressing=$game, wall=$panelWall, board=$panelBoard
    if ($cover)      $cover.hidden      = route !== "home";
    if ($game)       $game.hidden       = !(route === "dressing");
    if ($panelWall)  $panelWall.hidden  = route !== "wall";
    if ($panelBoard) $panelBoard.hidden = route !== "board";
    setActiveTab(route);
    if (route !== "board") stopMessagePoll();
  }

  function navigate(route) {
    if (!ROUTES.includes(route)) route = "home";
    // gating: must be registered to leave home
    if (!isRegistered() && route !== "home") route = "home";
    currentRoute = route;
    if (route === "home" && isRegistered()) {
      // home stays usable so the cover splash is visible
      showOnly("home");
    } else {
      showOnly(route);
    }
    if (route === "wall")  enterWall();
    if (route === "board") enterBoard();
    if (location.hash !== "#/" + route) {
      try { history.replaceState(null, "", "#/" + route); } catch {}
    }
    window.scrollTo(0, 0);
  }

  function onHashChange() {
    const m = (location.hash || "").match(/^#\/(\w+)/);
    const route = m ? m[1] : "home";
    navigate(route);
  }

  /* ── Dressing-id badge ───────────────────────────────────────────────────── */
  function updateDressingId() {
    if (!$dressingId) return;
    if (!isRegistered()) { $dressingId.hidden = true; return; }
    $dressingId.hidden = false;
    if ($dressingNick) $dressingNick.textContent = nickname;
    if ($dressingSeq)  $dressingSeq.textContent  = userDisplayUid || "";
    if ($dressingMbti) $dressingMbti.textContent = (mbti && mbti !== "XXXX") ? mbti : "";
  }

  /* ── Wall enter ───────────────────────────────────────────────────────────── */
  let lastSubmittedOutfit = null;
  function setLastOutfit(t, b, s) { lastSubmittedOutfit = { t, b, s }; }
  function enterWall() {
    if (!$panelWall) return;
    // Always show "others" strip — it's about discovery, not your own state.
    loadOthersStrip();

    const { top, bottom, shoe } = state;
    const allSet = top != null && bottom != null && shoe != null;
    // Three states for the user side of the wall:
    //   A) didn't pick anything yet → CTA back to dressing
    //   B) picked all three but hasn't pressed the stroll button → live preview
    //   C) submitted at least once → show hero + same-outfit roster
    const submitted = !!lastSubmittedOutfit;
    if (!submitted && !allSet) {
      // (A)
      if ($wallEmpty) $wallEmpty.hidden = false;
      if ($wallHero)  $wallHero.hidden  = true;
      if ($fellowsPanel) $fellowsPanel.hidden = true;
      if ($wallSub)  $wallSub.textContent = "你的春装还没挑齐";
      return;
    }
    // For (B) and (C) we have a t/b/s to mirror.
    const tbs = submitted ? lastSubmittedOutfit : { t: top, b: bottom, s: shoe };
    if ($wallEmpty) $wallEmpty.hidden = true;
    if ($fellowsPanel) $fellowsPanel.hidden = false;
    if ($wallSub) {
      $wallSub.textContent = submitted
        ? `你的造型 ${codeOf(tbs.t, tbs.b, tbs.s)}`
        : `预览造型 ${codeOf(tbs.t, tbs.b, tbs.s)} · 还没贴到墙上`;
    }
    renderWallHero(tbs.t, tbs.b, tbs.s, !submitted);
    if (submitted) {
      loadFellows(tbs.t, tbs.b, tbs.s);
    } else {
      // Hide same-outfit roster until they actually submit.
      if ($fellowsPanel) $fellowsPanel.hidden = true;
    }
  }

  function renderWallHero(t, b, s, preview) {
    if (!$wallHero) return;
    $wallHero.hidden = false;
    $wallHero.classList.toggle("is-preview", !!preview);
    if ($wallHeroImg) $wallHeroImg.src = `assets/characters/${t}${b}${s}.png`;
    if ($wallHeroNick) $wallHeroNick.textContent = nickname || "—";
    if ($wallHeroSeq)  $wallHeroSeq.textContent  = userDisplayUid || "";
    if ($wallHeroMbti) $wallHeroMbti.textContent = (mbti && mbti !== "XXXX") ? mbti : "";
  }

  async function loadOthersStrip() {
    if (!$wallOthers || !$wallOthersList) return;
    $wallOthers.hidden = false;
    const params = new URLSearchParams({ limit: "20" });
    if (userId) params.set("excludeUid", userId);
    if (lastSubmittedOutfit) {
      const { t, b, s } = lastSubmittedOutfit;
      params.set("exclude", codeOf(t, b, s));
    }
    try {
      const res = await fetch(`/api/outfits/recent?${params}`);
      if (!res.ok) throw new Error("http " + res.status);
      const data = await res.json();
      renderOthersStrip(data.list || []);
    } catch (e) {
      $wallOthersList.innerHTML = "";
      if ($wallOthersEmpty) {
        $wallOthersEmpty.hidden = false;
        $wallOthersEmpty.textContent = "服务器暂时联系不上 ✿ 稍后再来";
      }
    }
  }

  function renderOthersStrip(list) {
    if (!$wallOthersList) return;
    if (!list.length) {
      $wallOthersList.innerHTML = "";
      if ($wallOthersEmpty) $wallOthersEmpty.hidden = false;
      return;
    }
    if ($wallOthersEmpty) $wallOthersEmpty.hidden = true;
    const html = list.slice(0, 12).map((e, i) => {
      const seq = e.displayUid || (e.seq ? "#" + String(e.seq).padStart(3, "0") : "");
      return `<li class="wall__other" style="animation-delay:${Math.min(i, 11) * 35}ms">
        <figure class="wall__other__figure">
          <img class="wall__other__img" src="assets/characters/${e.t}${e.b}${e.s}.png" alt="${escapeText(e.nick)} 的造型" loading="lazy">
        </figure>
        <span class="wall__other__nick">${escapeText(e.nick)}</span><span class="wall__other__seq">${escapeText(seq)}</span>${
          e.mbti && e.mbti !== "XXXX"
            ? `<span class="wall__other__mbti">${escapeText(e.mbti)}</span>`
            : ""
        }
      </li>`;
    }).join("");
    $wallOthersList.innerHTML = html;
  }

  /* ── Board ────────────────────────────────────────────────────────────────── */
  let lastBoardTs = 0;

  function enterBoard() {
    if ($boardLocked) $boardLocked.hidden = isRegistered();
    if ($boardForm) $boardForm.hidden = !isRegistered();
    fetchMessages(true);
    startMessagePoll();
    if ($boardInput) syncBoardCount();
  }
  function syncBoardCount() {
    if (!$boardCount || !$boardInput) return;
    $boardCount.textContent = `${$boardInput.value.length} / 140`;
  }
  function startMessagePoll() {
    stopMessagePoll();
    messagePollTimer = window.setInterval(() => fetchMessages(false), 30_000);
  }
  function stopMessagePoll() {
    if (messagePollTimer) { window.clearInterval(messagePollTimer); messagePollTimer = null; }
  }
  async function fetchMessages(replace) {
    try {
      const uidParam = userId ? `&uid=${encodeURIComponent(userId)}` : "";
      const url = replace
        ? `/api/messages?limit=80${uidParam}`
        : `/api/messages?limit=80&since=${lastBoardTs}${uidParam}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (replace) showBoardOffline();
        return;
      }
      const data = await res.json();
      if (replace) {
        renderMessages(data.list || []);
      } else if (data.list && data.list.length) {
        // prepend fresh notes
        renderMessages([...data.list, ...readRenderedMessages()]);
      }
      if (data.list && data.list[0]) lastBoardTs = data.list[0].ts;
    } catch (e) {
      if (replace) showBoardOffline();
    }
  }
  function showBoardOffline() {
    if (!$boardList) return;
    $boardList.innerHTML = `<li class="board__note board__note--c2" style="--rot:1deg">
      <div class="board__note__body">看起来这里的服务器暂时连不上 ✿ 请稍后再来吧。<br>（如果你在校园网部署的版本里看到这条，重启服务即可）</div>
      <div class="board__note__foot"><span class="user-tag"><span class="user-tag__nick">✿ 春日提醒</span></span></div>
    </li>`;
    if ($boardEmpty) $boardEmpty.hidden = true;
  }
  function readRenderedMessages() {
    if (!$boardList) return [];
    return Array.from($boardList.querySelectorAll(".board__note")).map(li => ({
      id: li.dataset.id,
      ts: Number(li.dataset.ts),
      body: li.querySelector(".board__note__body")?.textContent || "",
      nick: li.dataset.nick || "",
      mbti: li.dataset.mbti || "XXXX",
      seq: Number(li.dataset.seq) || null,
      displayUid: li.dataset.duid || null,
    }));
  }
  function renderMessages(list) {
    if (!$boardList) return;
    if (!list || list.length === 0) {
      $boardList.innerHTML = "";
      if ($boardEmpty) $boardEmpty.hidden = false;
      return;
    }
    if ($boardEmpty) $boardEmpty.hidden = true;
    // Newest first
    const sorted = list.slice().sort((a, b) => b.ts - a.ts);
    const seen = new Set();
    const html = sorted.filter(m => {
      if (!m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    }).map((m, i) => {
      const c = ((m.ts | 0) % 4) + 1;
      const rot = ((m.ts | 0) % 5 - 2) * 1.0;
      const isMine = m.seq && m.seq === userSeq;
      const cls = `board__note board__note--c${c}` + (isMine ? " board__note--mine" : "");
      const time = fmtTime(m.ts);
      const seq = m.displayUid || (m.seq ? "#" + String(m.seq).padStart(3, "0") : "");
      return `<li class="${cls}" data-id="${escapeText(m.id)}" data-ts="${m.ts}"
        data-nick="${escapeText(m.nick)}" data-mbti="${escapeText(m.mbti||"")}"
        data-seq="${m.seq||""}" data-duid="${escapeText(seq)}"
        data-flowers="${m.flowers||0}"
        style="--rot:${rot}deg;animation-delay:${Math.min(i,12)*30}ms">
        <div class="board__note__body">${escapeText(m.body)}</div>
        <div class="board__note__foot">
          <span class="user-tag${isMine?" user-tag--mine":""}">
            <span class="user-tag__nick">✿ ${escapeText(m.nick||"匿名")}</span>
            <span class="user-tag__seq">${escapeText(seq)}</span>
          </span>
          <span class="board__note__time">${time}</span>
        </div>
        <button class="board__flower${m.mineFlower ? " is-given" : ""}"
                type="button"
                data-flower="${escapeText(m.id)}"
                aria-label="送花">
          <span class="board__flower-icon" aria-hidden="true">✿</span>
          <span class="board__flower-count">${m.flowers || 0}</span>
        </button>
      </li>`;
    }).join("");
    $boardList.innerHTML = html;
  }

  async function postMessage(body) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: userId, body }),
    });
    return res;
  }

  async function onFlowerClick(e) {
    const btn = e.target.closest(".board__flower");
    if (!btn) return;
    const mid = btn.dataset.flower;
    if (!mid) return;
    if (!isRegistered()) {
      if ($boardError) $boardError.textContent = "先在首页起一个昵称就可以送花啦 ✿";
      return;
    }
    if (btn.classList.contains("is-given")) {
      // Visual nudge if already given
      btn.classList.remove("is-pulse");
      // eslint-disable-next-line no-unused-expressions
      btn.offsetWidth;
      btn.classList.add("is-pulse");
      return;
    }
    btn.disabled = true;
    btn.classList.add("is-given");
    sproutFlowerBurst(btn);
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(mid)}/flower`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const countEl = btn.querySelector(".board__flower-count");
        if (countEl) countEl.textContent = String(data.count);
      } else {
        // rollback if server rejected
        btn.classList.remove("is-given");
      }
    } catch {
      btn.classList.remove("is-given");
    } finally {
      btn.disabled = false;
    }
  }

  function sproutFlowerBurst(btn) {
    const burst = document.createElement("span");
    burst.className = "board__flower-burst";
    burst.textContent = "✿";
    btn.appendChild(burst);
    setTimeout(() => burst.remove(), 900);
  }

  async function onBoardSubmit(e) {
    e.preventDefault();
    if (!isRegistered()) {
      if ($boardError) $boardError.textContent = "先去首页起一个昵称吧 ✿";
      return;
    }
    const body = ($boardInput?.value || "").trim();
    if (!body) {
      if ($boardError) $boardError.textContent = "写一句话再贴上去吧 ✿";
      return;
    }
    if ($boardError) $boardError.textContent = "";
    if ($boardPost) $boardPost.disabled = true;
    try {
      const res = await postMessage(body);
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        if ($boardError) $boardError.textContent = "稍歇片刻再贴 ✿（每分钟最多 3 张）";
        return;
      }
      if (!res.ok || !data.ok) {
        if ($boardError) $boardError.textContent = "贴失败了，再试一次 ✿";
        return;
      }
      if ($boardInput) $boardInput.value = "";
      syncBoardCount();
      await fetchMessages(true);
    } finally {
      if ($boardPost) $boardPost.disabled = false;
    }
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
    loadUserId();
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

    /* tabbar + routing */
    if ($tabbar) {
      $tabbar.addEventListener("click", (e) => {
        const btn = e.target.closest(".tabbar__btn");
        if (!btn) return;
        navigate(btn.dataset.route);
      });
    }
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-route]");
      if (!el) return;
      // tabbar handled above; out-of-tabbar route triggers (CTA buttons)
      if (el.closest(".tabbar")) return;
      e.preventDefault();
      navigate(el.dataset.route);
    });
    window.addEventListener("hashchange", onHashChange);

    /* board */
    if ($boardForm) $boardForm.addEventListener("submit", onBoardSubmit);
    if ($boardList) $boardList.addEventListener("click", onFlowerClick);
    if ($boardInput) $boardInput.addEventListener("input", syncBoardCount);
    if ($wallOthersRefresh) $wallOthersRefresh.addEventListener("click", loadOthersStrip);

    /* rehydrate seq + dressingId */
    try {
      const s = Number(localStorage.getItem(SEQ_KEY)) || 0;
      const d = localStorage.getItem(DUID_KEY) || "";
      if (s > 0 && nickname) {
        userSeq = s;
        userDisplayUid = d || ("#" + String(s).padStart(3, "0"));
      }
    } catch {}
    // If we already know the user, validate against server in the background.
    if (userId && isRegistered()) {
      revealApp();
      updateDressingId();
      navigate(((location.hash || "").match(/^#\/(\w+)/) || [, "home"])[1]);
      // background sanity ping
      fetch(`/api/users/me?uid=${encodeURIComponent(userId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(j => {
          if (j && j.ok) {
            userSeq = j.seq;
            userDisplayUid = j.displayUid;
            try {
              localStorage.setItem(SEQ_KEY, String(j.seq));
              localStorage.setItem(DUID_KEY, j.displayUid);
            } catch {}
            updateDressingId();
          } else {
            // server forgot us — drop local seq, send back to home
            userSeq = 0; userDisplayUid = "";
            try { localStorage.removeItem(SEQ_KEY); localStorage.removeItem(DUID_KEY); } catch {}
            hideApp();
            $cover.hidden = false;
          }
        })
        .catch(() => { /* offline ok */ });
    } else {
      hideApp();
      // ensure cover is visible, panels hidden
      if ($cover) $cover.hidden = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
