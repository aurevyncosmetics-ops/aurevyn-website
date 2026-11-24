// ==========================================================
// AUREVYN — PROMOS
//   1) Coupon codes (Eid sale, etc.) — cart mein lagte hain
//   2) Bundles + "Frequently Bought Together" + multi-buy (2 lo to 10% off)
//
// Yeh file script.js ke BAAD load hoti hai. Sab offers neeche ke
// CONFIG section mein hain — naya code / bundle yahin add karein.
//
// NOTE: Yeh static website hai, is liye codes browser mein check hote hain
// (koi server nahi). Order WhatsApp par aata hai, wahan aap code dekh kar
// confirm kar sakti hain. "Ek customer ek hi baar" jaisi limit yahan
// enforce nahi ho sakti.
// ==========================================================

// ----------------------------------------------------------
// CONFIG 1: COUPON CODES
//   type: 'percent'  -> value = % off (maxDiscount = cap, optional)
//         'flat'     -> value = PKR off
//         'freeship' -> delivery free
//   minSubtotal : kam az kam cart amount (bundle/multi-buy discount ke baad)
//   starts / expires : 'YYYY-MM-DD' (optional)
// ----------------------------------------------------------
const COUPONS = {
    // Eid sale: dates apni asal Eid sale ke mutabiq badal lein
    EID15:     { type: 'percent',  value: 15, minSubtotal: 1500, maxDiscount: 1000, expires: '2027-03-20', label: 'Eid Sale, 15% off' },
    FLAT100:   { type: 'flat',     value: 100, minSubtotal: 1000, label: 'PKR 100 off' },
    FREESHIP:  { type: 'freeship', value: 0,  minSubtotal: 1000, label: 'Free delivery' }
};

// ----------------------------------------------------------
// CONFIG 2: MULTI-BUY  ("2 lo to 10% off")
//   Ek hi product ki min qty lene par us product par % off.
//   Zyada tiers chahiye to add karein, e.g. { min: 3, percent: 15 }
// ----------------------------------------------------------
const QTY_TIERS = [
    { min: 2, percent: 10 }
];
const QTY_DISCOUNT_EXCLUDE_IDS = [999]; // 999 = Gift Box

// ----------------------------------------------------------
// CONFIG 3: BUNDLES  (Frequently Bought Together)
//   groups: har group = alternatives ki list (product ids).
//           Bundle ke liye cart mein har group se ek product chahiye.
//   percent: poore set par % off
// ----------------------------------------------------------
const BUNDLES = [
    { id: 'lip-duo',   name: 'Lip Duo',         groups: [[1, 2, 3, 4, 13], [38]],        percent: 10 },
    { id: 'lip-care',  name: 'Lip Care Combo',  groups: [[29, 30], [35]],                percent: 10 },
    { id: 'eye-drama', name: 'Eye Drama Set',   groups: [[17], [33], [24]],              percent: 12 },
    { id: 'full-base', name: 'Complete Base',   groups: [[14, 32], [20, 34], [6, 16]],   percent: 12 }
];

// ----------------------------------------------------------
// CONFIG 4: FIRST ORDER DISCOUNT  (automatic, no code needed)
//   Naye customer ke pehle order par percent% off, cart mein khud lag jata hai.
//   Bundle / multi-buy ke baad ke amount par lagta hai.
//   Agar customer ne paise kam karne wala coupon (percent/flat) laga rakha ho
//   to coupon chalta hai aur first-order discount nahi lagta (stack nahi hote).
//   FREESHIP coupon ke saath dono chalte hain.
//   NOTE: customer ko browser (localStorage) se pehchana jata hai — koi server
//   nahi hai, isliye browser data clear karne wala dobara le sakta hai.
//   Band karne ke liye enabled: false karein.
// ----------------------------------------------------------
const FIRST_ORDER = { enabled: true, percent: 5 };
const FIRST_ORDER_KEY = 'aurevynFirstOrderUsed';

function promoPendingOrderId() {
    try { const p = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null'); return (p && p.orderId) || ''; } catch (e) { return ''; }
}

// Pehla order? (Agar pehla order 'cancelled' ho gaya to discount wapas mil jata hai)
function isFirstOrderEligible() {
    if (!FIRST_ORDER.enabled) return false;
    try {
        const used = localStorage.getItem(FIRST_ORDER_KEY);
        if (!used) return true;
        const p = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
        return !!(p && p.orderId === used && p.cancelled === true);
    } catch (e) { return true; }
}

const COUPON_STORAGE_KEY = 'aurevynCoupon';

// ==========================================================
// HELPERS
// ==========================================================
function promoMoney(n) { return 'PKR ' + Math.round(n).toLocaleString(); }

function promoEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function getAppliedCouponCode() {
    try { return localStorage.getItem(COUPON_STORAGE_KEY) || ''; } catch (e) { return ''; }
}
function setAppliedCouponCode(code) {
    try {
        if (code) localStorage.setItem(COUPON_STORAGE_KEY, code);
        else localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch (e) {}
}

// ==========================================================
// ENGINE
// ==========================================================
function evaluateCoupon(code, base) {
    if (!code) return null;
    const c = COUPONS[code];
    if (!c) return { code: code, valid: false, discount: 0, freeShipping: false, message: 'This coupon code is not valid.' };

    const now = new Date();
    if (c.starts && now < new Date(c.starts + 'T00:00:00')) {
        return { code: code, valid: false, discount: 0, freeShipping: false, message: 'This coupon is not active yet.' };
    }
    if (c.expires && now > new Date(c.expires + 'T23:59:59')) {
        return { code: code, valid: false, discount: 0, freeShipping: false, message: 'This coupon has expired.' };
    }
    if (c.minSubtotal && base < c.minSubtotal) {
        return { code: code, label: c.label, valid: false, discount: 0, freeShipping: false,
                 message: 'Add ' + promoMoney(c.minSubtotal - base) + ' more to use ' + code + '.' };
    }

    let discount = 0, freeShipping = false;
    if (c.type === 'percent') {
        discount = Math.round(base * c.value / 100);
        if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    } else if (c.type === 'flat') {
        discount = Math.min(c.value, base);
    } else if (c.type === 'freeship') {
        freeShipping = true;
    }
    return { code: code, label: c.label, valid: true, discount: discount, freeShipping: freeShipping, message: '' };
}

// Cart se saari promo discounts nikalta hai (bundle -> multi-buy -> coupon)
function computePromos() {
    const subtotal = cart.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);

    // Cart ko single units mein tod do taake sets ginna asaan ho
    const units = [];
    cart.forEach(function (i) {
        for (let n = 0; n < i.quantity; n++) units.push({ id: i.id, price: i.price, used: false });
    });

    // 1) Bundles
    const bundleLines = [];
    let bundleDiscount = 0;
    BUNDLES.forEach(function (b) {
        let sets = 0, saved = 0;
        while (true) {
            const pick = [];
            let complete = true;
            for (let g = 0; g < b.groups.length; g++) {
                const u = units.find(function (x) { return !x.used && b.groups[g].indexOf(x.id) !== -1 && pick.indexOf(x) === -1; });
                if (!u) { complete = false; break; }
                pick.push(u);
            }
            if (!complete) break;
            pick.forEach(function (u) { u.used = true; });
            saved += pick.reduce(function (s, u) { return s + u.price; }, 0) * b.percent / 100;
            sets++;
        }
        if (sets) {
            const amt = Math.round(saved);
            bundleDiscount += amt;
            bundleLines.push({ label: b.name + ' bundle' + (sets > 1 ? ' ×' + sets : '') + ' (' + b.percent + '% off)', amount: amt });
        }
    });

    // 2) Multi-buy (bundle mein use na hue units par)
    const tiers = QTY_TIERS.slice().sort(function (a, b) { return b.min - a.min; });
    const byId = {};
    units.forEach(function (u) {
        if (!u.used && QTY_DISCOUNT_EXCLUDE_IDS.indexOf(u.id) === -1) (byId[u.id] = byId[u.id] || []).push(u);
    });
    let qtyDiscount = 0;
    const qtyApplied = {};
    Object.keys(byId).forEach(function (id) {
        const list = byId[id];
        const tier = tiers.find(function (t) { return list.length >= t.min; });
        if (tier) {
            qtyDiscount += list.reduce(function (s, u) { return s + u.price; }, 0) * tier.percent / 100;
            qtyApplied[id] = tier.percent;
        }
    });
    qtyDiscount = Math.round(qtyDiscount);

    // 3) Coupon (bundle/multi-buy ke baad ke amount par)
    const afterOffers = Math.max(0, subtotal - bundleDiscount - qtyDiscount);
    const coupon = evaluateCoupon(getAppliedCouponCode(), afterOffers);
    const couponDiscount = coupon && coupon.valid ? Math.min(coupon.discount, afterOffers) : 0;
    const freeShipping = !!(coupon && coupon.valid && coupon.freeShipping);

    // 4) First order discount (automatic) — sirf tab jab koi paisay wala coupon na laga ho
    let firstOrderDiscount = 0;
    if (isFirstOrderEligible() && afterOffers > 0 && couponDiscount === 0) {
        firstOrderDiscount = Math.round(afterOffers * FIRST_ORDER.percent / 100);
    }

    return {
        subtotal: subtotal,
        bundleDiscount: bundleDiscount,
        bundleLines: bundleLines,
        qtyDiscount: qtyDiscount,
        qtyApplied: qtyApplied,
        coupon: coupon,
        couponDiscount: couponDiscount,
        firstOrderDiscount: firstOrderDiscount,
        freeShipping: freeShipping,
        totalDiscount: bundleDiscount + qtyDiscount + couponDiscount + firstOrderDiscount
    };
}

function promoGivesFreeShipping() {
    return cart.length > 0 && computePromos().freeShipping;
}

// Summary rows (cart / checkout / review / WhatsApp sab isi se banate hain)
function promoLines(p) {
    const lines = [];
    p.bundleLines.forEach(function (l) { lines.push({ label: l.label, amount: l.amount }); });
    if (p.qtyDiscount > 0) {
        const pcts = Object.keys(p.qtyApplied).map(function (k) { return p.qtyApplied[k]; });
        const pct = pcts.length ? Math.max.apply(null, pcts) : 0;
        lines.push({ label: 'Multi-buy savings (' + pct + '% off)', amount: p.qtyDiscount });
    }
    if (p.firstOrderDiscount > 0) lines.push({ label: 'First order discount (' + FIRST_ORDER.percent + '% off)', amount: p.firstOrderDiscount });
    if (p.coupon && p.coupon.valid) {
        if (p.couponDiscount > 0) lines.push({ label: 'Coupon ' + p.coupon.code, amount: p.couponDiscount });
        if (p.freeShipping) lines.push({ label: 'Coupon ' + p.coupon.code + ' — free delivery', amount: 0, text: 'FREE' });
    }
    return lines;
}

// ==========================================================
// COUPON ACTIONS
// ==========================================================
function applyCouponFromInput() {
    const input = document.getElementById('promo-coupon-input');
    applyCoupon(input ? input.value : '');
}

function applyCoupon(raw) {
    const code = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!code) { showToast('error', 'Enter a code', 'Please type your coupon code first.'); return; }
    if (!cart.length) { showToast('error', 'Cart is empty', 'Add something to your cart, then apply the code.'); return; }

    const prev = getAppliedCouponCode();
    setAppliedCouponCode(code);
    const p = computePromos();
    if (!p.coupon || !p.coupon.valid) {
        const msg = p.coupon ? p.coupon.message : 'This coupon code is not valid.';
        setAppliedCouponCode(prev);
        showToast('error', 'Coupon not applied', msg, 2500);
        return;
    }
    updateCartUI();
    const what = p.freeShipping ? 'Free delivery unlocked!' : 'You save ' + promoMoney(p.couponDiscount) + '.';
    showToast('success', code + ' applied', what, 2200);
}

function removeCoupon() {
    setAppliedCouponCode('');
    updateCartUI();
    showToast('success', 'Coupon removed', 'The coupon code was removed.', 1500);
}

// Order place hone ke baad coupon dobara use na ho
function clearCouponAfterOrder() { setAppliedCouponCode(''); }

// ==========================================================
// ADD PRODUCT (bundle / nudge ke liye)
// ==========================================================
function promoAddToCart(product, shadeOverride) {
    const hasShades = product.shades && product.shades.length > 0;
    const shade = hasShades ? (shadeOverride || product.shades[0].name) : null;
    const cartKey = shade ? product.id + '_' + shade : String(product.id);
    const existing = cart.find(function (i) { return i.cartKey === cartKey; });
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, cartKey: cartKey, name: product.name, shade: shade, price: product.price, image: product.image, quantity: 1 });

    trackPixelEvent('AddToCart', {
        content_ids: [String(product.id)],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'PKR'
    });
}

function promoBestInGroup(group) {
    const cands = group.map(function (id) { return products.find(function (p) { return p.id === id; }); })
        .filter(function (p) { return p && !isProductOutOfStock(p); });
    cands.sort(function (a, b) { return (b.reviews || 0) - (a.reviews || 0); });
    return cands[0] || null;
}

function addPromoNudgeItem(productId) {
    const product = products.find(function (p) { return p.id === productId; });
    if (!product) return;
    promoAddToCart(product);
    saveCart(); updateCartUI();
    showToast('success', 'Added to Cart', product.name + ' added — bundle discount applied!', 1800);
}

// ==========================================================
// CART SIDEBAR UI  (coupon box, savings rows, hints, nudge)
// ==========================================================
function renderCartPromos() {
    const footer = document.querySelector('#cart-sidebar .cart-footer');
    if (!footer) return;
    const p = computePromos();
    const hasItems = cart.length > 0;

    // ---- coupon box ----
    let box = document.getElementById('promo-coupon-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'promo-coupon-box';
        box.className = 'promo-coupon-box';
        footer.insertBefore(box, footer.firstChild);
    }
    box.style.display = hasItems ? '' : 'none';
    const code = getAppliedCouponCode();
    const sig = code + '|' + (p.coupon ? (p.coupon.valid ? 'ok' : p.coupon.message) : '-');
    if (box.dataset.sig !== sig) {
        box.dataset.sig = sig;
        if (!p.coupon) {
            box.innerHTML =
                '<div class="promo-coupon-row">' +
                '<i class="fas fa-ticket-alt"></i>' +
                '<input id="promo-coupon-input" type="text" placeholder="Coupon code" autocomplete="off" autocapitalize="characters" maxlength="20" ' +
                'onkeydown="if(event.key===\'Enter\'){event.preventDefault();applyCouponFromInput();}">' +
                '<button type="button" onclick="applyCouponFromInput()">Apply</button>' +
                '</div>';
        } else if (p.coupon.valid) {
            box.innerHTML =
                '<div class="promo-coupon-applied">' +
                '<span><i class="fas fa-check-circle"></i> <b>' + promoEsc(p.coupon.code) + '</b> · ' + promoEsc(p.coupon.label) + '</span>' +
                '<button type="button" onclick="removeCoupon()">Remove</button>' +
                '</div>';
        } else {
            box.innerHTML =
                '<div class="promo-coupon-applied is-warning">' +
                '<span><i class="fas fa-exclamation-circle"></i> <b>' + promoEsc(p.coupon.code) + '</b> · ' + promoEsc(p.coupon.message) + '</span>' +
                '<button type="button" onclick="removeCoupon()">Remove</button>' +
                '</div>';
        }
    }

    // ---- savings rows (subtotal ke neeche) ----
    let rows = document.getElementById('promo-savings-rows');
    if (!rows) {
        rows = document.createElement('div');
        rows.id = 'promo-savings-rows';
        rows.className = 'promo-savings-rows';
        const totalRow = footer.querySelector('.cart-total-row');
        if (totalRow) totalRow.insertAdjacentElement('afterend', rows);
        else footer.appendChild(rows);
    }
    const lines = hasItems ? promoLines(p) : [];
    if (!lines.length) {
        rows.innerHTML = '';
    } else {
        rows.innerHTML = lines.map(function (l) {
            return '<div class="promo-row"><span><i class="fas fa-tag"></i> ' + promoEsc(l.label) + '</span><strong>' +
                (l.text ? l.text : '-' + promoMoney(l.amount)) + '</strong></div>';
        }).join('') +
        (p.totalDiscount > 0
            ? '<div class="promo-row promo-row-total"><span>Total after savings</span><strong>' +
              promoMoney(Math.max(0, p.subtotal - p.totalDiscount)) + '</strong></div>'
            : '');
    }

    // ---- per-item multi-buy hint ----
    const qtyById = {};
    cart.forEach(function (i) { qtyById[i.id] = (qtyById[i.id] || 0) + i.quantity; });
    const firstTier = QTY_TIERS.slice().sort(function (a, b) { return a.min - b.min; })[0];
    const itemEls = document.querySelectorAll('#cart-items-container .cart-item');
    itemEls.forEach(function (el, idx) {
        const item = cart[idx];
        if (!item) return;
        const old = el.querySelector('.promo-hint');
        if (old) old.remove();
        let text = '';
        let ok = false;
        if (p.qtyApplied[item.id]) { text = p.qtyApplied[item.id] + '% multi-buy discount applied'; ok = true; }
        else if (firstTier && QTY_DISCOUNT_EXCLUDE_IDS.indexOf(item.id) === -1 && qtyById[item.id] < firstTier.min) {
            text = 'Buy ' + firstTier.min + ' & save ' + firstTier.percent + '%';
        }
        const details = el.querySelector('.cart-item-details');
        if (text && details) {
            const d = document.createElement('div');
            d.className = 'promo-hint' + (ok ? ' is-applied' : '');
            d.textContent = text;
            const price = details.querySelector('.cart-item-price');
            if (price) price.insertAdjacentElement('afterend', d); else details.appendChild(d);
        }
    });

    // ---- bundle nudge ("complete the set") ----
    let nudge = document.getElementById('promo-nudge');
    if (!nudge) {
        nudge = document.createElement('div');
        nudge.id = 'promo-nudge';
        nudge.className = 'promo-nudge';
        footer.parentNode.insertBefore(nudge, footer);
    }
    nudge.innerHTML = '';
    nudge.style.display = 'none';
    if (hasItems) {
        const inCart = {};
        cart.forEach(function (i) { inCart[i.id] = true; });
        for (let b = 0; b < BUNDLES.length; b++) {
            const bundle = BUNDLES[b];
            const have = bundle.groups.map(function (g) { return g.some(function (id) { return inCart[id]; }); });
            const haveCount = have.filter(Boolean).length;
            if (haveCount === 0 || haveCount === bundle.groups.length) continue;
            const missingIdx = have.indexOf(false);
            const cand = promoBestInGroup(bundle.groups[missingIdx]);
            if (!cand) continue;
            nudge.innerHTML =
                '<div class="promo-nudge-text"><i class="fas fa-gift"></i> Add <b>' + promoEsc(cand.name) + '</b> (' + promoMoney(cand.price) +
                ') &amp; get <b>' + bundle.percent + '% off</b> your ' + promoEsc(bundle.name) + '</div>' +
                '<button type="button" onclick="addPromoNudgeItem(' + cand.id + ')">Add</button>';
            nudge.style.display = 'flex';
            break;
        }
    }
}

// ==========================================================
// CHECKOUT SIDEBAR / REVIEW ROWS
// ==========================================================
function renderCheckoutPromoLines() {
    const sum = document.querySelector('.checkout-sidebar .sidebar-summary');
    if (!sum) return;
    sum.querySelectorAll('.promo-line').forEach(function (n) { n.remove(); });
    const totalLine = sum.querySelector('.summary-line.total');
    if (!totalLine) return;
    promoLines(computePromos()).forEach(function (l) {
        totalLine.insertAdjacentHTML('beforebegin',
            '<div class="summary-line discount promo-line"><span>' + promoEsc(l.label) + '</span><span>' +
            (l.text ? l.text : '-' + promoMoney(l.amount)) + '</span></div>');
    });
}

function renderReviewPromoRows() {
    document.querySelectorAll('.review-promo-row').forEach(function (n) { n.remove(); });
    const totalEl = document.getElementById('review-total');
    const row = totalEl ? totalEl.closest('.summary-row') : null;
    if (!row) return;
    promoLines(computePromos()).forEach(function (l) {
        row.insertAdjacentHTML('beforebegin',
            '<div class="summary-row review-promo-row" style="color:#765C21;font-weight:700;"><span><i class="fas fa-tag"></i> ' +
            promoEsc(l.label) + '</span><strong style="color:#765C21;">' +
            (l.text ? l.text : '-' + promoMoney(l.amount)) + '</strong></div>');
    });
}

// ==========================================================
// FREQUENTLY BOUGHT TOGETHER  (product page)
// ==========================================================
function getFbtForProduct(product) {
    if (isProductOutOfStock(product)) return null;
    for (let b = 0; b < BUNDLES.length; b++) {
        const bundle = BUNDLES[b];
        const gi = bundle.groups.findIndex(function (g) { return g.indexOf(product.id) !== -1; });
        if (gi < 0) continue;
        const items = [product];
        let ok = true;
        bundle.groups.forEach(function (g, idx) {
            if (idx === gi) return;
            const best = promoBestInGroup(g);
            if (!best) ok = false; else items.push(best);
        });
        if (ok) return { bundle: bundle, items: items };
    }
    return null;
}

function renderFBT(product) {
    const old = document.getElementById('fbt-section');
    if (old) old.remove();
    const body = document.getElementById('product-detail-body');
    if (!body || !product) return;
    const fbt = getFbtForProduct(product);
    if (!fbt) return;

    const sec = document.createElement('section');
    sec.id = 'fbt-section';
    sec.className = 'fbt-section';
    sec.dataset.pid = product.id;
    sec.dataset.bundle = fbt.bundle.id;

    const itemsHtml = fbt.items.map(function (it, idx) {
        const isMain = idx === 0;
        return (idx > 0 ? '<span class="fbt-plus">+</span>' : '') +
            '<div class="fbt-item' + (isMain ? ' is-main' : '') + '">' +
            '<label class="fbt-check"><input type="checkbox" data-id="' + it.id + '" checked ' + (isMain ? 'disabled' : '') +
            ' onchange="updateFbtTotals()" aria-label="Include ' + promoEsc(it.name) + '"><span></span></label>' +
            '<a href="product.html?id=' + it.id + '" class="fbt-img"><img src="' + it.image + '" alt="' + promoEsc(it.name) + '" loading="lazy"></a>' +
            '<div class="fbt-name">' + (isMain ? '<em>This item:</em> ' : '') + promoEsc(it.name) + '</div>' +
            '<div class="fbt-price">' + promoMoney(it.price) + '</div>' +
            '</div>';
    }).join('');

    sec.innerHTML =
        '<div class="container">' +
        '<div class="fbt-head"><span class="subtitle">Save more together</span><h2>Frequently Bought Together</h2></div>' +
        '<div class="fbt-card">' +
        '<div class="fbt-items">' + itemsHtml + '</div>' +
        '<div class="fbt-summary">' +
        '<div class="fbt-badge"><i class="fas fa-gift"></i> ' + promoEsc(fbt.bundle.name) + ' — ' + fbt.bundle.percent + '% off</div>' +
        '<div class="fbt-total"><span id="fbt-old"></span><strong id="fbt-new"></strong></div>' +
        '<div id="fbt-save" class="fbt-save"></div>' +
        '<button type="button" id="fbt-add-btn" class="btn-primary" onclick="addFbtToCart()"></button>' +
        '</div>' +
        '</div>' +
        '</div>';

    body.insertAdjacentElement('afterend', sec);
    updateFbtTotals();
}

function getFbtSelection() {
    const sec = document.getElementById('fbt-section');
    if (!sec) return null;
    const bundle = BUNDLES.find(function (b) { return b.id === sec.dataset.bundle; });
    const ids = Array.prototype.map.call(sec.querySelectorAll('.fbt-check input:checked'), function (el) { return parseInt(el.dataset.id, 10); });
    const total = sec.querySelectorAll('.fbt-check input').length;
    const items = ids.map(function (id) { return products.find(function (p) { return p.id === id; }); }).filter(Boolean);
    return { sec: sec, bundle: bundle, items: items, allSelected: items.length === total };
}

function updateFbtTotals() {
    const sel = getFbtSelection();
    if (!sel) return;
    const sum = sel.items.reduce(function (s, p) { return s + p.price; }, 0);
    const pct = sel.allSelected ? sel.bundle.percent : 0;
    const save = Math.round(sum * pct / 100);
    const oldEl = document.getElementById('fbt-old');
    const newEl = document.getElementById('fbt-new');
    const saveEl = document.getElementById('fbt-save');
    const btn = document.getElementById('fbt-add-btn');
    if (oldEl) oldEl.textContent = save > 0 ? promoMoney(sum) : '';
    if (newEl) newEl.textContent = promoMoney(sum - save);
    if (saveEl) saveEl.textContent = save > 0
        ? 'You save ' + promoMoney(save)
        : 'Select all items to save ' + sel.bundle.percent + '%';
    if (btn) {
        btn.disabled = sel.items.length < 2;
        btn.innerHTML = sel.items.length < 2
            ? 'Select at least 2 items'
            : '<i class="fas fa-shopping-bag"></i> Add ' + sel.items.length + ' items to cart';
    }
}

function addFbtToCart() {
    const sel = getFbtSelection();
    if (!sel || sel.items.length < 2) return;
    const pdb = document.getElementById('product-detail-body');
    const mainShade = pdb ? pdb.getAttribute('data-qv-shade') : null;
    const mainId = parseInt(sel.sec.dataset.pid, 10);
    sel.items.forEach(function (p) {
        if (isProductOutOfStock(p)) return;
        promoAddToCart(p, p.id === mainId ? mainShade : null);
    });
    saveCart(); updateCartUI();
    showToast('success', 'Added to Cart',
        sel.allSelected ? sel.bundle.name + ' added — ' + sel.bundle.percent + '% bundle discount applied!' : sel.items.length + ' items added to your cart!', 2200);
}

// ==========================================================
// BACK-IN-STOCK ALERT  (WhatsApp par batao)
// Static site hai, is liye button customer ko WhatsApp par aap ke number
// ka pre-filled message khol deta hai: "jab stock aaye to mujhe batao".
// ==========================================================
const NOTIFY_WHATSAPP_NUMBER = '923258666803';

function notifyBackInStock(productId) {
    const product = products.find(function (p) { return p.id === productId; });
    if (!product) return;
    let link = '';
    try { link = new URL('product.html?id=' + product.id, window.location.href).href; } catch (e) {}
    const msg = 'Hi Aurevyn! 👋\nPlease notify me on WhatsApp when *' + product.name + '* is back in stock.' +
        (link ? '\n' + link : '');
    window.open('https://wa.me/' + NOTIFY_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    showToast('success', 'Opening WhatsApp', 'Send the message and we will let you know when it is back!', 2500);
}

function notifyButtonHTML(product) {
    return '<button type="button" class="notify-btn" onclick="notifyBackInStock(' + product.id + ')">' +
        '<i class="fab fa-whatsapp"></i> Notify me on WhatsApp</button>' +
        '<p class="notify-note">Back in stock soon? We will message you on WhatsApp.</p>';
}

// ==========================================================
// STICKY ADD-TO-CART BAR  (product page, phone par neeche chipka)
// ==========================================================
let _stickyObserver = null;
let _stickyMutation = null;

function initStickyAtc(product) {
    const old = document.getElementById('sticky-atc');
    if (old) old.remove();
    if (_stickyObserver) { _stickyObserver.disconnect(); _stickyObserver = null; }
    if (_stickyMutation) { _stickyMutation.disconnect(); _stickyMutation = null; }
    document.body.classList.remove('sticky-atc-on');

    const body = document.getElementById('product-detail-body');
    if (!body || !product) return;
    const out = isProductOutOfStock(product);

    const bar = document.createElement('div');
    bar.id = 'sticky-atc';
    bar.className = 'sticky-atc';
    bar.innerHTML =
        '<img class="sticky-atc-img" id="sticky-atc-img" src="' + product.image + '" alt="">' +
        '<div class="sticky-atc-info">' +
        '<div class="sticky-atc-name">' + promoEsc(product.name) + '</div>' +
        '<div class="sticky-atc-sub"><b>' + promoMoney(product.price) + '</b><span id="sticky-atc-shade"></span></div>' +
        '</div>' +
        (out
            ? '<button type="button" class="sticky-atc-btn is-notify" onclick="notifyBackInStock(' + product.id + ')"><i class="fab fa-whatsapp"></i> Notify me</button>'
            : '<button type="button" class="sticky-atc-btn" id="sticky-atc-btn" onclick="stickyAddToCart(' + product.id + ')"><i class="fas fa-shopping-bag"></i> Add to Cart</button>');
    document.body.appendChild(bar);
    document.body.classList.add('has-sticky-atc-page');

    function syncDetails() {
        const shade = body.getAttribute('data-qv-shade');
        const shadeEl = document.getElementById('sticky-atc-shade');
        if (shadeEl) shadeEl.textContent = shade ? ' · ' + shade : '';
        const main = document.getElementById('pd-main-img-' + product.id);
        const img = document.getElementById('sticky-atc-img');
        if (main && img && main.src && img.src !== main.src) img.src = main.src;
    }
    syncDetails();
    _stickyMutation = new MutationObserver(syncDetails);
    _stickyMutation.observe(body, { attributes: true, attributeFilter: ['data-qv-shade', 'data-qv-variant'] });

    // Bar sirf tab dikhao jab asli Add to Cart button screen se bahar ho
    const target = body.querySelector('.quick-view-details > .btn-primary');
    if (!target || !('IntersectionObserver' in window)) return;
    _stickyObserver = new IntersectionObserver(function (entries) {
        const visible = entries[0].isIntersecting;
        bar.classList.toggle('is-visible', !visible);
        document.body.classList.toggle('sticky-atc-on', !visible);
        if (!visible) syncDetails();
    }, { threshold: 0 });
    _stickyObserver.observe(target);
}

function stickyAddToCart(productId) {
    addToCartFromProductPage(productId);
    const btn = document.getElementById('sticky-atc-btn');
    if (btn && !btn.dataset.busy) {
        btn.dataset.busy = '1';
        const html = btn.innerHTML;
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> Added!';
        setTimeout(function () { btn.classList.remove('added'); btn.innerHTML = html; delete btn.dataset.busy; }, 1100);
    }
}

// ==========================================================
// STYLES (JS se inject — modern.css ko chhoone ki zaroorat nahi)
// ==========================================================
(function injectPromoStyles() {
    if (document.getElementById('promo-styles')) return;
    const css = `
.promo-coupon-box{margin:0 0 12px}
.promo-coupon-row{display:flex;align-items:center;gap:8px;background:#fff;border:1px dashed #C9A24B;border-radius:12px;padding:6px 6px 6px 12px}
.promo-coupon-row>i{color:#C9A24B}
.promo-coupon-row input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:600 14px inherit;letter-spacing:.06em;text-transform:uppercase;color:#151515}
.promo-coupon-row input::placeholder{text-transform:none;letter-spacing:0;font-weight:400;color:#8a8a8a}
.promo-coupon-row button{border:0;background:#1C1B1A;color:#F6EEDB;border-radius:9px;padding:9px 16px;font-weight:700;font-size:13px;cursor:pointer}
.promo-coupon-applied{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#F6EEDB;border:1px solid rgba(201,162,75,.6);border-radius:12px;padding:10px 12px;font-size:13px;color:#151515}
.promo-coupon-applied i{color:#765C21}
.promo-coupon-applied button{border:0;background:transparent;color:#765C21;font-weight:700;font-size:12px;text-decoration:underline;cursor:pointer;flex-shrink:0}
.promo-coupon-applied.is-warning{background:#FFF6E5;border-color:#E3B341}
.promo-coupon-applied.is-warning i{color:#B7791F}
.promo-savings-rows{margin:0 0 8px}
.promo-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:#765C21;margin-bottom:4px}
.promo-row strong{white-space:nowrap}
.promo-row-total{color:#151515;font-weight:700;border-top:1px dashed rgba(0,0,0,.15);padding-top:6px;margin-top:6px}
.promo-hint{font-size:12px;color:#765C21;margin:2px 0 4px}
.promo-hint.is-applied{font-weight:700}
.promo-nudge{align-items:center;justify-content:space-between;gap:10px;margin:0 18px 10px;padding:10px 12px;background:#F6EEDB;border:1px solid rgba(201,162,75,.5);border-radius:12px;font-size:13px;color:#151515}
.promo-nudge i{color:#C9A24B;margin-right:4px}
.promo-nudge button{border:0;background:#1C1B1A;color:#F6EEDB;border-radius:8px;padding:7px 14px;font-weight:700;font-size:12px;cursor:pointer;flex-shrink:0}
.checkout-sidebar .promo-line{color:#765C21}

.fbt-section{padding:10px 0 20px}
.fbt-head{text-align:center;margin:20px 0 18px}
.fbt-head .subtitle{display:block;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#C9A24B;margin-bottom:6px}
.fbt-head h2{margin:0}
.fbt-card{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:24px;background:#fff;border:1px solid rgba(201,162,75,.45);border-radius:20px;padding:22px;box-shadow:0 12px 30px -20px rgba(17,17,17,.5)}
.fbt-items{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:12px}
.fbt-item{position:relative;width:148px;text-align:center}
.fbt-img{display:block;border-radius:14px;overflow:hidden;background:#FFFDF8;border:1px solid rgba(0,0,0,.06)}
.fbt-img img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}
.fbt-name{font-size:13px;line-height:1.35;margin-top:8px;color:#151515;min-height:35px}
.fbt-name em{font-style:normal;font-weight:700;color:#765C21}
.fbt-price{font-weight:700;font-size:14px;margin-top:2px}
.fbt-plus{font-size:26px;font-weight:300;color:#C9A24B;align-self:flex-start;margin-top:52px}
.fbt-check{position:absolute;top:8px;left:8px;z-index:2;cursor:pointer;line-height:0}
.fbt-check input{position:absolute;opacity:0;width:22px;height:22px;margin:0;cursor:pointer}
.fbt-check span{display:inline-block;width:22px;height:22px;border-radius:6px;background:#fff;border:2px solid #C9A24B;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.fbt-check input:checked+span{background:#1C1B1A;border-color:#1C1B1A}
.fbt-check input:checked+span::after{content:"";display:block;width:5px;height:10px;border:solid #F6EEDB;border-width:0 2px 2px 0;transform:translate(6px,2px) rotate(45deg)}
.fbt-check input:disabled+span{opacity:.85}
.fbt-summary{min-width:230px;text-align:center}
.fbt-badge{display:inline-block;background:#F6EEDB;color:#765C21;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;margin-bottom:10px}
.fbt-total{display:flex;justify-content:center;align-items:baseline;gap:10px;margin-bottom:2px}
.fbt-total span{text-decoration:line-through;color:#8a8a8a;font-size:15px}
.fbt-total strong{font-size:24px;color:#151515}
.fbt-save{font-size:13px;color:#765C21;font-weight:600;margin-bottom:12px;min-height:18px}
.fbt-summary .btn-primary{width:100%;justify-content:center}
.fbt-summary .btn-primary:disabled{opacity:.55;cursor:not-allowed}
@media (max-width:640px){
  .fbt-card{padding:16px;gap:16px}
  .fbt-item{width:calc(50% - 22px);min-width:120px}
  .fbt-summary{width:100%}
}
.dark-mode .promo-coupon-row,.dark-mode .fbt-card{background:#1f1e1c;border-color:rgba(201,162,75,.5)}
.dark-mode .promo-coupon-row input,.dark-mode .fbt-name,.dark-mode .fbt-total strong,.dark-mode .fbt-price{color:#F6EEDB}
.dark-mode .promo-coupon-applied,.dark-mode .promo-nudge,.dark-mode .fbt-badge{background:#2a2825;color:#E6D3A3;border-color:rgba(201,162,75,.5)}
.dark-mode .promo-coupon-applied i,.dark-mode .promo-row,.dark-mode .promo-hint,.dark-mode .fbt-save,.dark-mode .fbt-name em{color:#E6D3A3}
.dark-mode .promo-row-total{color:#F6EEDB}
.dark-mode .promo-nudge{color:#F6EEDB}
.dark-mode .fbt-img{background:#2a2825;border-color:rgba(255,255,255,.08)}
.dark-mode .fbt-head h2{color:#F6EEDB}

.notify-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;padding:13px 16px;border:0;border-radius:12px;background:#25D366;color:#fff;font:700 15px inherit;cursor:pointer;box-shadow:0 8px 18px -10px rgba(37,211,102,.8)}
.notify-btn i{font-size:19px}
.notify-btn:active{transform:scale(.98)}
.notify-note{margin:8px 0 0;font-size:12px;color:#765C21;text-align:center}

.sticky-atc{display:none}
@media (max-width:768px){
  .sticky-atc{display:flex;align-items:center;gap:10px;position:fixed;left:10px;right:10px;bottom:calc(80px + env(safe-area-inset-bottom,0px));z-index:990;padding:9px 10px;border-radius:18px;background:rgba(255,253,248,.97);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(201,162,75,.55);box-shadow:0 14px 32px -12px rgba(17,17,17,.5);transform:translateY(calc(100% + 110px));transition:transform .3s cubic-bezier(.16,1,.3,1);pointer-events:none}
  .sticky-atc.is-visible{transform:translateY(0);pointer-events:auto}
  .sticky-atc-img{width:46px;height:46px;border-radius:10px;object-fit:cover;background:#F6EEDB;flex-shrink:0}
  .sticky-atc-info{flex:1;min-width:0}
  .sticky-atc-name{font-size:13px;font-weight:600;color:#151515;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sticky-atc-sub{font-size:13px;color:#4d5e54;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sticky-atc-sub b{color:#151515}
  .sticky-atc-btn{flex-shrink:0;display:flex;align-items:center;gap:7px;border:0;border-radius:12px;padding:12px 16px;background:#1C1B1A;color:#F6EEDB;font:700 14px inherit;cursor:pointer}
  .sticky-atc-btn.added{background:#765C21}
  .sticky-atc-btn.is-notify{background:#25D366;color:#fff}
  body.has-sticky-atc-page{padding-bottom:160px}
  body.sticky-atc-on .live-chat-widget,body.sticky-atc-on .go-to-top,body.sticky-atc-on .shade-quiz-fab,body.sticky-atc-on .whatsapp-float{margin-bottom:152px!important;transition:margin-bottom .3s ease}
  body.cart-open .sticky-atc,body.nav-menu-open .sticky-atc{display:none}
}
.dark-mode .sticky-atc{background:rgba(28,27,26,.97);border-color:rgba(201,162,75,.5)}
.dark-mode .sticky-atc-name,.dark-mode .sticky-atc-sub b{color:#F6EEDB}
.dark-mode .sticky-atc-sub{color:#cfc5ad}
.dark-mode .sticky-atc-btn:not(.is-notify){background:#C9A24B;color:#1C1B1A}
.dark-mode .notify-note{color:#E6D3A3}
`;
    const style = document.createElement('style');
    style.id = 'promo-styles';
    style.textContent = css;
    document.head.appendChild(style);
})();

// ==========================================================
// FIRST ORDER — order place hote hi us customer ke liye 'used' mark karo
// ==========================================================
(function () {
    const originalPlaceOrder = window.placeOrder;
    if (typeof originalPlaceOrder !== 'function') return;
    window.placeOrder = function () {
        const before = promoPendingOrderId();
        const wasEligible = isFirstOrderEligible();
        const result = originalPlaceOrder.apply(this, arguments);
        const after = promoPendingOrderId();
        if (wasEligible && after && after !== before) {
            try { localStorage.setItem(FIRST_ORDER_KEY, after); } catch (e) {}
        }
        return result;
    };
})();
