// ==========================================
// NAVBAR ALWAYS FIXED - ALL DEVICES
// ==========================================
(function() {
    'use strict';

    var header = document.getElementById('header') || document.querySelector('.main-header');
    if (!header) return;

    // Ensure header is always fixed - runs immediately
    function ensureFixedHeader() {
        header.style.setProperty('position', 'fixed', 'important');
        header.style.setProperty('top', '0', 'important');
        header.style.setProperty('left', '0', 'important');
        header.style.setProperty('right', '0', 'important');
        header.style.setProperty('width', '100%', 'important');
        header.style.setProperty('z-index', '999', 'important');
        header.style.setProperty('transform', 'none', 'important');
        header.style.setProperty('-webkit-transform', 'none', 'important');
    }

    // Run immediately
    ensureFixedHeader();

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureFixedHeader);
    }

    // Run on resize
    window.addEventListener('resize', ensureFixedHeader, { passive: true });

    // Run on scroll (in case something changes)
    window.addEventListener('scroll', ensureFixedHeader, { passive: true });

    // Add scroll class for shadow enhancement
    window.addEventListener('scroll', function() {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
            header.style.setProperty('box-shadow', '0 4px 30px rgba(139, 90, 43, 0.2)', 'important');
        } else {
            header.classList.remove('scrolled');
            header.style.setProperty('box-shadow', '0 2px 20px rgba(139, 90, 43, 0.1)', 'important');
        }
    }, { passive: true });

    // iOS Safari specific fix
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
        window.addEventListener('resize', function() {
            document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
            ensureFixedHeader();
        });
    }

    // Android specific fix
    if (/Android/i.test(navigator.userAgent)) {
        window.addEventListener('resize', ensureFixedHeader);
        // Fix for Chrome address bar showing/hiding
        window.addEventListener('scroll', ensureFixedHeader, { passive: true });
    }
})();

// ==========================================
// AUREVYN - COMPLETE JAVASCRIPT
// Updated: JazzCash + EasyPaisa + 6% Discount + Pakistan Cities
// ==========================================

// Global Variables
let cart = JSON.parse(localStorage.getItem('aurevynCart')) || [];
let wishlist = JSON.parse(localStorage.getItem('aurevynWishlist')) || [];
let products = [];
let currentSlide = 0;
let slideInterval;
let currentCheckoutStep = 1;
let selectedPaymentMethod = 'cod';
let whatsappWindow = null;
let whatsappCheckInterval = null;

const SHIPPING_FEE_ALL = 320;
const FREE_SHIPPING_THRESHOLD = 5000;

// ==========================================
// FORMSPREE ENDPOINTS
// ==========================================
const FORMSPREE_REVIEWS_URL = 'https://formspree.io/f/xwvdkevp';
const FORMSPREE_ORDERS_URL  = 'https://formspree.io/f/xnjkqajd';


function getShippingFee(city) {
    // Flat rate for all Pakistan cities.
    // 'city' param kept for future city-wise shipping expansion.
    return SHIPPING_FEE_ALL;
}
const DIGITAL_DISCOUNT_PERCENT = 6; // 6% discount for JazzCash/EasyPaisa

// ==========================================
// PAKISTAN CITIES LIST (Complete)
// ==========================================
const pakistanCities = [
    "Abbottabad", "Adezai", "Ali Bandar", "Amir Chah", "Attock",
    "Ayubia", "Bahawalpur", "Bahawalnagar", "Badin", "Bannu",
    "Batkhela", "Battagram", "Bhakkar", "Bhalwal", "Bhimber",
    "Burewala", "Chaman", "Charsadda", "Chichawatni", "Chiniot",
    "Chishtian", "Chitral", "Dadu", "Daska", "Dera Ghazi Khan",
    "Dera Ismail Khan", "Dinga", "Faisalabad", "Fort Abbas", "Ghotki",
    "Gilgit", "Gojra", "Gujranwala", "Gujrat", "Gujar Khan",
    "Hafizabad", "Haripur", "Haroonabad", "Hasilpur", "Haveli Lakha",
    "Hub", "Hyderabad", "Islamabad", "Jacobabad", "Jahanian",
    "Jampur", "Jamshoro", "Jhelum", "Jhang", "Joharabad",
    "Kamalia", "Kamber Ali Khan", "Kamoke", "Kandhkot", "Karachi",
    "Kasur", "Khairpur", "Khanewal", "Khanpur", "Kharian",
    "Khushab", "Khuzdar", "Kohat", "Kohlu", "Kot Adu",
    "Kotli", "Lahore", "Larkana", "Layyah", "Lodhran",
    "Loralai", "Mandi Bahauddin", "Mansehra", "Mardan", "Mastung",
    "Mian Channu", "Mianwali", "Mirpur", "Mirpurkhas", "Multan",
    "Muzaffarabad", "Muzaffargarh", "Narowal", "Nawabshah", "Nowshera",
    "Okara", "Pakpattan", "Pasrur", "Peshawar", "Pishin",
    "Pind Dadan Khan", "Quetta", "Rahim Yar Khan", "Rajanpur", "Rawalpindi",
    "Sadiqabad", "Sahiwal", "Sargodha", "Sheikhupura", "Shikarpur",
    "Sialkot", "Sibi", "Sukkur", "Swabi", "Swat",
    "Tando Adam", "Tando Allahyar", "Tank", "Taxila", "Toba Tek Singh",
    "Turbat", "Umerkot", "Vehari", "Wah Cantonment", "Wazirabad",
    "Zhob", "Ziarat"
];

// ==========================================
// CHECKOUT DATA OBJECT
// ==========================================
let checkoutData = {
    shipping: {},
    payment: {},
    items: []
};

// DOM refs
let preloader, cartSidebar, cartCount, cartItemCount, cartItemsContainer, cartSubtotal;
let wishlistCount, mobileMenu, overlay, toastContainer, quickViewModal, quickViewBody, checkoutModal;

// ==========================================
// PAGE / VIEW STATE PERSISTENCE
// Remembers which "page" (Sale, Category, Search) and which
// Quick View modal was open, so a refresh restores the same view
// instead of bouncing back to the home page.
// sessionStorage is used (not localStorage) so this resets once
// the tab/browser is closed, like a normal page session.
// ==========================================
const VIEW_STATE_KEY = 'aurevynViewState';
const QUICK_VIEW_STATE_KEY = 'aurevynQuickViewProduct';

function saveViewState(state) {
    try { sessionStorage.setItem(VIEW_STATE_KEY, JSON.stringify(state)); } catch (e) {}
}
function getViewState() {
    try {
        const raw = sessionStorage.getItem(VIEW_STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
function clearViewState() {
    try { sessionStorage.removeItem(VIEW_STATE_KEY); } catch (e) {}
}
function saveQuickViewState(productId) {
    try { sessionStorage.setItem(QUICK_VIEW_STATE_KEY, String(productId)); } catch (e) {}
}
function clearQuickViewState() {
    try { sessionStorage.removeItem(QUICK_VIEW_STATE_KEY); } catch (e) {}
}

// Called once on every page load (including refresh) after products & DOM are ready.
function restoreViewAndQuickViewState() {
    const viewState = getViewState();
    if (viewState) {
        if (viewState.type === 'sale') {
            showSaleProducts(true); // true = silent, skip the "Sale Products" toast on restore
        } else if (viewState.type === 'category' && viewState.category) {
            filterCategory(viewState.category);
        } else if (viewState.type === 'search' && viewState.search) {
            const desktopInput = document.getElementById('global-search-desktop');
            const mobileInput = document.getElementById('global-search-mobile');
            if (desktopInput) desktopInput.value = viewState.search;
            if (mobileInput) mobileInput.value = viewState.search;
            globalSearch(viewState.search);
        }
    }

    const qvProductIdRaw = (function () { try { return sessionStorage.getItem(QUICK_VIEW_STATE_KEY); } catch (e) { return null; } })();
    if (qvProductIdRaw) {
        const qvProductId = parseInt(qvProductIdRaw, 10);
        if (!isNaN(qvProductId) && products.some(p => p.id === qvProductId)) {
            openQuickView(qvProductId);
        } else {
            clearQuickViewState();
        }
    }
}

// ==========================================
// PRODUCT DATA
// ==========================================
const productsData = [

    {
        id: 1,
        name: "Ancher Colour Lipstick",
        category: "lips",
        price: 300,
        oldPrice: 450,
        rating: 4.8,
        reviews: 4800,
        image: "img/Ancher_colour_lipstick.png",
        badge: "Sale",
        description: "A burst of color that loves your lips back. Infused with nourishing Shea Butter, Vitamin E and Jojoba Oil, it glides on smooth, hydrates as it wears, and delivers vibrant, true color that lasts all day without drying your lips.",
        shades: [
            { name: "Peach Nude", color: "#D08E75" }
        ]
    },
    {
        id: 2,
        name: "Creamy Matte Lipstick",
        category: "lips",
        price: 499,
        oldPrice: null,
        rating: 4.9,
        reviews: 5100,
        image: "img/Creamy_matte_lipstick.png",
        badge: null,
        description: "Velvety matte color with a creamy soul. Formulated with Vitamin E and Avocado Oil, it glides on effortlessly for a smooth, comfortable matte finish that stays bold for hours — no cracking, no fading, just rich color all day.",
        shades: [
            { name: "Coral Pink", color: "#E36266", image: "img/Coral_Pink_Creamy_Matte_Lipstick.jpg" }
        ]
    },
    {
        id: 3,
        name: "Revolution Satin Lipstick",
        category: "lips",
        price: 449,
        oldPrice: 600,
        rating: 4.7,
        reviews: 4700,
        image: "img/Revolution.png",
        badges: ["New", "Sale"],
        description: "Rich pigment meets silky satin shine. Enriched with Argan Oil and Vitamin E, this lipstick conditions your lips while delivering a luminous, smooth finish with color that's as comfortable as it is captivating.",
        shades: [
            { name: "Light Brown", color: "#C19A6B" }
        ]
    },
    {
        id: 4,
        name: "EB Matte Lipstick",
        category: "lips",
        price: 499,
        oldPrice: 800,
        rating: 4.6,
        reviews: 4600,
        image: "img/matte_lipstick.png",
        badge: "Sale",
        description: "Deep, daring color that goes the distance. Made with Shea Butter and Vitamin E, this full-coverage matte lipstick locks in intense pigment for a bold, long-wearing finish that feels as good as it looks.",
        shades: [
            { name: "Dark Purple", color: "#4B1248", image: "img/dark_maroon_EB_Matte_Lipstick.jpg" },
            { name: "Dark Maroon", color: "#5C1A1A", image: "img/dark_purple_EB_Matte_Lipstick.jpg
" }
        ]
    },
    {
        id: 5,
        name: "NK Perfection Makeup Remover",
        category: "skincare",
        price: 899,
        oldPrice: null,
        rating: 4.5,
        reviews: 4500,
        image: "img/Makeup_remover.png",
        badge: null,
        description: "Effortlessly dissolve every trace of makeup — even stubborn waterproof formulas. Powered by Aloe Vera and Micellar Water, this gentle Face & Eyes remover lifts away makeup, dirt and oil in seconds, leaving skin feeling clean, soft and never stripped.",
        shades: []
    },
    {
        id: 6,
        name: "USHAS Setting Spray",
        category: "face",
        price: 749,
        oldPrice: 1050,
        rating: 4.8,
        reviews: 4800,
        image: "img/Setting_spray.png",
        badge: "Sale",
        description: "Lock in your look for up to 16 hours. This refreshing mist is infused with Aloe Vera, Rose Water and Vitamin E to hydrate skin while sealing your makeup against sweat, humidity and fading — for a flawless finish from morning to night.",
        shades: []
    },
    {
        id: 7,
        name: "Blush Stick Collection",
        category: "face",
        price: 450,
        oldPrice: 550,
        rating: 4.8,
        reviews: 4200,
        image: "img/Huda_matte_me_brand_pink_blush_stick.png",
        badge: "Sale",
        description: "Three ways to flush with color. Crafted with Shea Butter, Jojoba Oil and Vitamin E, this collection of Matte, Jelly & Long-Lasting blush sticks blends like a dream onto cheeks and lips for a buildable, natural flush.",
        variants: [
            {
                name: "Matte Pink",
                label: "Huda Matte Me",
                image: "img/Huda_matte_me_brand_pink_blush_stick.png",
                color: "#E8749A",
                shades: []
            },
            {
                name: "Jelly Tint",
                label: "Hudamoji Jelly",
                image: "img/Hudamoji_jelly_blush_tint_stick.png",
                color: "#D45B6A",
                shades: []
            },
            {
                name: "Matte Long-Lasting",
                label: "Hudamoji Matte",
                image: "img/Hudamoji_matte_me_long-lasting_jelly_blush_stick.png",
                color: "#C24B7A",
                shades: []
            }
        ],
        shades: []
    },
    {
        id: 10,
        name: "Moccallure 48-Shade Eyeshadow Palette",
        category: "eyes",
        price: 1650,
        oldPrice: 2500,
        rating: 4.9,
        reviews: 5800,
        image: "img/Mocallure.png",
        badges: ["New", "Hot"],
        description: "48 shades, endless looks. Blended with finely milled Mica and infused with Vitamin E, this palette delivers richly pigmented mattes, shimmers & glitters that blend effortlessly and stay vibrant from day to night.",
        shades: []
    },
    {
        id: 11,
        name: "Pamela Grant Perfect Face Compact Powder",
        category: "face",
        price: 499,
        oldPrice: 749,
        rating: 4.5,
        reviews: 4100,
        image: "img/Pamela_grant_perfect_face_compact_powder.png",
        badge: "Sale",
        description: "Flawless, shine-free skin in one swipe. Made with Kaolin Clay and Talc for oil control, plus Vitamin E to keep skin nourished, this lightweight, buildable powder mattifies instantly while letting your natural skin shine through.",
        shades: [
            { name: "Natural Beige", color: "#DEB887" }
        ]
    },
    {
        id: 12,
        name: "Maybelline Fit Me Matte Pressed Powder",
        category: "face",
        price: 599,
        oldPrice: 749,
        rating: 4.8,
        reviews: 6200,
        image: "img/Maybelline_fit_me_matte_poreless_pressed_powder.png",
        badge: "Sale",
        description: "Your shine, sorted. Formulated with oil-absorbing micro-powders and a poreless-finish complex, Maybelline Fit Me Matte powder blurs imperfections and controls shine all day, for skin that looks naturally smooth — never cakey, never dull.",
        shades: [
            { name: "Classic Ivory", color: "#F5DEB3" }
        ]
    },
    {
        id: 13,
        name: "Miss Rose Capsule Lipstick",
        category: "lips",
        price: 450,
        oldPrice: null,
        rating: 4.6,
        reviews: 3400,
        image: "img/Miss_rose_capsule_lipstick.png",
        badge: "New",
        description: "A pop of color in every capsule. Infused with Vitamin E and Shea Butter, this trendy capsule lipstick glides on with a moisturizing, glossy finish — twist, click and color your lips in seconds.",
        shades: [
            { name: "Ruby Red", color: "#C0392B" }
        ]
    },
    {
        id: 14,
        name: "Miss Rose Double Wear Liquid Foundation",
        category: "face",
        price: 1050,
        oldPrice: null,
        rating: 4.9,
        reviews: 5500,
        image: "img/Miss_rose_unique_double_wear_liquid_foundation.png",
        badges: ["New"],
        description: "All-day coverage that never quits. Enriched with Hyaluronic Acid and Vitamin E, this lightweight liquid foundation blends seamlessly for a smooth, natural finish that stays fresh and flawless from morning till night.",
        shades: []
    },
    {
        id: 15,
        name: "MUA Satin Sheen Lip Stylo",
        category: "lips",
        price: 499,
        oldPrice: null,
        rating: 4.7,
        reviews: 3800,
        image: "img/Satin_sheen_lip_stylo.png",
        badge: null,
        description: "Glide on the glow. Made with Shea Butter and Vitamin E, this twist-up lip stylo delivers a satin-sheen finish with a comfortable, non-sticky feel — effortless color, anytime, anywhere.",
        shades: []
    },
    {
        id: 16,
        name: "USHAS Snail Secretion Setting Spray",
        category: "face",
        price: 899,
        oldPrice: 1099,
        rating: 4.8,
        reviews: 4400,
        image: "img/Ushas_snail_secretion_filtrate_setting_spray.png",
        badge: "Sale",
        description: "Set your makeup, nourish your skin. Powered by Snail Secretion Filtrate and Vitamin E, this setting spray locks your look in place for hours while leaving skin hydrated, soft and naturally radiant.",
        shades: []
    },
    {
        id: 17,
        name: "Mascara",
        category: "eyes",
        price: 549,
        oldPrice: null,
        rating: 4.7,
        reviews: 4700,
        image: "img/Mascara.png",
        badge: null,
        description: "Lashes that steal the show. Formulated with Castor Oil and Beeswax, this volumizing mascara lengthens, curls and lifts every lash for a clump-free, dramatic look that lasts all day.",
        shades: []
    },
    {
        id: 18,
        name: "PRO Highlight Stick",
        category: "face",
        price: 599,
        oldPrice: null,
        rating: 4.7,
        reviews: 4700,
        image: "img/Highlight_stick.png",
        badge: null,
        description: "Catch the light, own the glow. Blended with Mica and Shea Butter, this creamy highlight stick melts into skin for a luminous, second-skin glow — swipe, blend and shine with the built-in brush.",
        shades: []
    },
    {
        id: 19,
        name: "Hoyosun Eyeshadow Palette",
        category: "eyes",
        price: 499,
        oldPrice: 700,
        rating: 4.9,
        reviews: 4900,
        image: "img/Hoyosun_eyeshadow_palette.png",
        badge: null,
        description: "Four shades, one stunning look. Made with finely milled Mica and Vitamin E, this palette blends warm mattes with a dazzling gold glitter for eye looks that go from soft daytime to sultry night.",
        shades: []
    },
    {
        id: 20,
        name: "7DAYS B.Colour Liquid Concealer",
        category: "face",
        price: 550,
        oldPrice: null,
        rating: 4.4,
        reviews: 4400,
        image: "img/B_Colour_liquid_concealer.png",
        badge: null,
        description: "Hide it, hydrate it. Infused with Hyaluronic Acid and Vitamin E, this lightweight liquid concealer covers dark circles and blemishes with full coverage that feels weightless and looks completely natural.",
        shades: []
    },
    {
        id: 21,
        name: "Careline Gloss Boss Lip Treat",
        category: "lips",
        price: 450,
        oldPrice: null,
        rating: 4.9,
        reviews: 4900,
        image: "img/Careline_gloss_boss_lip_treat.png",
        badge: null,
        description: "Lips that glow from the inside out. Treated with Olive Fruit Oil, Castor Seed Oil, Vitamin E and Hyaluronic Acid, this nourishing lip treat plumps, hydrates and adds a glossy shine that lasts.",
        shades: []
    },
    {
        id: 22,
        name: "Colorful Beehive Lip Gloss",
        category: "lips",
        price: 350,
        oldPrice: null,
        rating: 4.5,
        reviews: 4500,
        image: "img/Colorful_beehive_shaped_lip_gloss.png",
        badge: "Hot",
        description: "Sweet color, sweeter shine. Infused with Shea Butter and Vitamin E, this honeycomb-shaped lip gloss glides on smooth and moisturizing, wrapping your lips in a luscious, glossy pout in vibrant shades.",
        shades: [
            { name: "Honey Yellow", color: "#F5C518", image: "img/Yellow Beehive Lip Gloss.jpeg" },
            { name: "Purple", color: "#9B59B6", image: "img/Purple  Beehive Lip Gloss.jpg" },
            { name: "Red", color: "#C0392B", image: "img/Red  Beehive Lip Gloss.jpg" },
            { name: "Emerald Green", color: "#27AE60", image: "img/Green  Beehive Lip Gloss.jpg" }
        ]
    },
    {
        id: 24,
        name: "Luxury False Eyelashes",
        category: "eyes",
        price: 350,
        oldPrice: null,
        rating: 4.7,
        reviews: 3800,
        image: "img/Eye_lashes.png",
        badge: null,
        description: "Bold lashes, instant drama. Crafted from soft Synthetic Silk Fibers on a flexible, lightweight band, these reusable false lashes blend naturally for a full, fluttery look that lasts all day in comfort.",
        shades: []
    },
    {
        id: 25,
        name: "Holika Velvet Blanket Tint",
        category: "lips",
        price: 450,
        oldPrice: 520,
        rating: 4.8,
        reviews: 5200,
        image: "img/Holika_velvet_blanket_tint.png",
        badge: "Sale",
        description: "Lips wrapped in velvet color. Formulated with Jojoba Oil and Vitamin E, this Korean velvet tint blurs onto lips like a soft blanket, leaving a long-lasting, second-skin matte stain that never feels heavy.",
        shades: [
            { name: "Cherry Red", color: "#C0392B" }
        ]
    },
    {
        id: 26,
        name: "BrowPencil, Eyebrow Pencil",
        category: "eyes",
        price: 200,
        oldPrice: null,
        rating: 4.6,
        reviews: 3200,
        image: "img/Eyebrow_Pencil_1.png",
        badge: "New",
        description: "Brows on point, every time. Made with nourishing Vitamin E and natural waxes, this precision pencil glides smoothly to define, fill and shape — complete with a built-in spoolie for a natural, all-day finish.",
        shades: []
    },
    {
        id: 27,
        name: "Jarusa Órale BB Cream",
        category: "face",
        price: 349,
        oldPrice: null,
        rating: 4.7,
        reviews: 2900,
        image: "img/Jarusa_Órale_BB_Cream.png",
        badge: "New",
        description: "Skin perfection in one swipe. Infused with Hyaluronic Acid and Vitamin E, this breathable BB cream evens out tone, hydrates skin and blurs imperfections for a natural, healthy glow all day.",
        shades: []
    },
    {
        id: 28,
        name: "Wynie Soften Hand Cream",
        category: "skincare",
        price: 350,
        oldPrice: null,
        rating: 4.5,
        reviews: 2100,
        image: "img/Soften_Hand_Cream.png",
        badge: "New",
        description: "Hands that feel as good as they look. Enriched with Shea Butter and Glycerin, this fast-absorbing cream softens skin by up to 20% with just one use, leaving hands smooth, hydrated and never greasy.",
        shades: []
    },
    {
        id: 29,
        name: "MCoBeauty Overnight Lip Mask - Berry",
        category: "lips",
        price: 399,
        oldPrice: 500,
        rating: 4.8,
        reviews: 3700,
        image: "img/MCoBeauty_Overnight_Lip_Mask_in_Berry.jpg",
        badge: "New",
        description: "Wake up to softer lips. Infused with Shea Butter, Vitamin E and juicy Berry extract, this overnight lip mask melts in while you sleep to deeply hydrate and repair, so you wake up to smooth, plump lips.",
        shades: []
    },
    {
        id: 30,
        name: "MCoBeauty Overnight Lip Mask - Vanilla",
        category: "lips",
        price: 399,
        oldPrice: 500,
        rating: 4.8,
        reviews: 3500,
        image: "img/MCoBeauty_Overnight_Lip_Mask_in_Vanilla.jpg",
        badge: "New",
        description: "Wake up to softer lips. Infused with Shea Butter, Vitamin E and sweet Vanilla extract, this overnight lip mask melts in while you sleep to deeply hydrate and repair, so you wake up to smooth, plump lips.",
        shades: []
    },
    {
        id: 31,
        name: "LOCA Highlighter \"Glow Up\"",
        category: "face",
        price: 600,
        oldPrice: null,
        rating: 4.7,
        reviews: 2600,
        image: "img/Loca_Highlighter.png",
        badge: "New",
        description: "Glow that looks lit from within. Formulated with soothing Aloe Vera Gel and Hyaluronic Acid, this gel highlighter melts into skin for a dewy, radiant glow that feels weightless and never glittery-fake.",
        shades: []
    },
    {
        id: 32,
        name: "Hard Candy Glamoflauge Full Coverage Foundation",
        category: "face",
        price: 799,
        oldPrice: null,
        rating: 4.8,
        reviews: 4100,
        image: "img/Hard Candy Glamoflauge Full Coverage Foundation.png",
        badge: "New",
        description: "Flawless coverage, zero shine. Formulated oil-free with Vitamin E, this full coverage foundation blends seamlessly and wears beautifully for hours, camouflaging imperfections while keeping skin comfortable and breathable.",
        shades: []
    },
    {
        id: 33,
        name: "RPK High-Def Pigment Liquid Liner",
        category: "eyes",
        price: 299,
        oldPrice: null,
        rating: 4.6,
        reviews: 1900,
        image: "img/RPK_New_High-Def_pigment_Liquid_Liner.png",
        badge: "New",
        description: "Bold lines, zero smudging. This high-definition pigment liquid eyeliner glides on with an ultra-fine precision tip, delivering intense, jet-black color that stays sharp and smudge-free all day.",
        shades: []
    },
    {
        id: 34,
        name: "Hard Candy Glamoflauge Full Coverage Concealer",
        category: "face",
        price: 400,
        oldPrice: 550,
        rating: 4.7,
        reviews: 3300,
        image: "img/Hard Candy Glamoflauge Full Coverage Concealer.png",
        badges: ["New", "Sale"],
        description: "Brighten, cover, perfect. Infused with Niacinamide, this full coverage concealer melts into skin to brighten dark circles and erase blemishes — buildable coverage that never looks cakey, all day long.",
        shades: []
    },
    {
        id: 35,
        name: "LOCA Lip Balm - The Serve",
        category: "lips",
        price: 349,
        oldPrice: null,
        rating: 4.6,
        reviews: 2400,
        image: "img/LOCA_Lip_Balm_in_the-shade_05_The Serve.png",
        badge: "New",
        description: "Soft lips, served daily. Infused with nourishing Jojoba Oil, this lip balm melts on smooth to deeply moisturize dry lips, leaving them soft, smooth and comfortable from the first swipe.",
        shades: []
    },
    {
        id: 36,
        name: "Hard Candy Sheer Envy Perfecting Primer",
        category: "face",
        price: 400,
        oldPrice: null,
        rating: 4.6,
        reviews: 2200,
        image: "img/Hard_Candy_Sheer_Envy_Perfecting_Primer.png",
        badge: "New",
        description: "The perfect canvas starts here. Formulated to blur pores and smooth fine lines, this lightweight perfecting primer creates a silky, even base that helps your makeup glide on and stay flawless for hours.",
        shades: []
    },
    {
        id: 37,
        name: "Wibo Probrow Pencil",
        category: "eyes",
        price: 200,
        oldPrice: null,
        rating: 4.6,
        reviews: 2000,
        image: "img/Wibo_Probrow_Pencil_a_dual_ended_makeup_tool_featuring_a_diagonally_cut_triangular_shaped_tip_for_precise_definition_and_a_built_in_spoolie_brush_for_grooming.png",
        badge: "New",
        description: "Brow perfection, both ends covered. This dual-ended pencil features a diagonally cut triangular tip for razor-sharp definition, plus a built-in spoolie to blend and groom brows into place.",
        shades: []
    },
    {
        id: 38,
        name: "Ushas branded waterproof lip liner pencil",
        category: "lips",
        price: 200,
        oldPrice: null,
        rating: 4.7,
        reviews: 2300,
        image: "img/Ushas_branded_waterproof_lip_liner_pencil.jpg",
        badge: "New",
        description: "Lips lined, color defined. This waterproof lip liner pencil glides on with rich, long-wearing pigment in a deep berry shade, keeping your lip color sharp and smudge-free all day.",
        shades: []
    },
    {
        id: 39,
        name: "Laurenza Foundation Concealer Contour & Blush Palette",
        category: "face",
        price: 799,
        oldPrice: 1049,
        rating: 4.8,
        reviews: 1800,
        image: "img/Laurenza_Foundation_Concealer_Contour_and_Blush_Palette_an_all_in_one_cream_face_makeup.png",
        badges: ["New", "Sale"],
        description: "Your whole face, one palette. This all-in-one cream formula combines foundation, concealer, contour and blush shades in one compact, letting you build a complete, blended look in minutes — no extra products needed.",
        shades: []
    },
    {
        id: 40,
        name: "BrowPencil Twist-Up Eyebrow Pencil",
        category: "eyes",
        price: 200,
        oldPrice: null,
        rating: 4.6,
        reviews: 1900,
        image: "img/black_twist_up_eyebrow_pencil.png",
        badge: "New",
        description: "Define brows, your way. This twist-up pencil glides on smooth and precise, filling in sparse areas and shaping natural-looking brows with an easy, mess-free, retractable application.",
        shades: []
    },
    {
        id: 42,
        name: "Real Beauty Brow This Way Eyebrow Sculpting Kit",
        category: "eyes",
        price: 499,
        oldPrice: 600,
        rating: 4.7,
        reviews: 1700,
        image: "img/Brown_This_Way_Eyebrow_Sculpting_Kit.jpg",
        badges: ["New", "Sale"],
        description: "Sculpt brows like a pro. This two-tone wax and powder duo comes with a built-in brush to shape, fill and set brows for a natural, full-bodied look that lasts all day.",
        shades: []
    }
];

// ==========================================
// CATEGORY PRODUCT COUNTER
// ==========================================
function updateCategoryCounts() {
    const categories = ['lips', 'face', 'eyes', 'skincare'];
    categories.forEach(function(cat) {
        const count = productsData.filter(function(p) { return p.category === cat; }).length;
        const el = document.getElementById('cat-count-' + cat);
        if (el) {
            el.textContent = count + (count === 1 ? ' Product' : ' Products');
        }
    });
}

// ==========================================
// PRELOADER
// ==========================================
function hidePreloader() {
    const preloaderEl = document.getElementById('preloader');
    if (preloaderEl) preloaderEl.classList.add('hidden');
}

// Wait for first hero image before hiding preloader — max 4s safety timeout
function waitForHeroAndHide() {
    let done = false;
    const finish = () => { if (!done) { done = true; hidePreloader(); } };
    const img = new Image();
    img.onload = finish;
    img.onerror = finish;
    img.src = 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1920';
    setTimeout(finish, 4000);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(hidePreloader, 100);
}

// ==========================================
// CITY DROPDOWN POPULATION
// ==========================================
function populateCityDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Clear existing options except first
    select.innerHTML = '<option value="">-- Select Your City --</option>';

    pakistanCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
}


// ==========================================
// MOBILE SEARCH TOGGLE
// Fixed: 2026-04-26
// ==========================================
function toggleMobileSearch() {
    const searchBox = document.getElementById('mobile-search-box');
    const searchIcon = document.querySelector('.search-icon-mobile');

    if (!searchBox) return;

    const isActive = searchBox.classList.contains('active');

    if (isActive) {
        // Close search
        searchBox.classList.remove('active');
        if (searchIcon) searchIcon.classList.remove('active');
        // Clear mobile search input
        const mobileInput = document.getElementById('global-search-mobile');
        if (mobileInput) mobileInput.value = '';
    } else {
        // Close any open modals first
        closeAll();

        // Open search
        searchBox.classList.add('active');
        if (searchIcon) searchIcon.classList.add('active');

        // Focus the input after animation
        setTimeout(() => {
            const input = document.getElementById('global-search-mobile');
            if (input) {
                input.focus();
                // iOS Safari fix - ensure keyboard appears
                input.click();
            }
        }, 100);
    }
}



// ==========================================
// MOBILE SEARCH EVENT LISTENERS
// Fixed: 2026-04-26
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Prevent search box from closing when clicking inside it
    const searchBox = document.getElementById('mobile-search-box');
    if (searchBox) {
        searchBox.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Prevent touch events from bubbling on mobile
        searchBox.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }

    // Close search when clicking outside
    document.addEventListener('click', function(e) {
        const searchBox = document.getElementById('mobile-search-box');
        const searchIcon = document.querySelector('.search-icon-mobile');
        if (searchBox && searchBox.classList.contains('active')) {
            if (!searchBox.contains(e.target) && !(searchIcon && searchIcon.contains(e.target))) {
                searchBox.classList.remove('active');
                if (searchIcon) searchIcon.classList.remove('active');
            }
        }
    });

    // Close search on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const searchBox = document.getElementById('mobile-search-box');
            const searchIcon = document.querySelector('.search-icon-mobile');
            if (searchBox) searchBox.classList.remove('active');
            if (searchIcon) searchIcon.classList.remove('active');
        }
    });
});


// ==========================================
// INJECT SHADE STYLES AT RUNTIME
// (Guarantees styles load after all CSS)
// ==========================================
function injectShadeStyles() {
    if (document.getElementById('shade-runtime-styles')) return;
    const style = document.createElement('style');
    style.id = 'shade-runtime-styles';
    style.textContent = `
        .product-card { overflow: visible !important; }
        .product-image { overflow: hidden !important; border-radius: 20px 20px 0 0 !important; }
        .product-info { overflow: visible !important; }
        .shade-selector {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            margin: 8px 0 10px !important;
        }
        .shade-label {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 12px !important;
            color: #6d4c41 !important;
            margin-bottom: 7px !important;
            font-weight: 500 !important;
            align-items: center !important;
            gap: 4px !important;
        }
        .shade-label .selected-shade-name {
            color: #8b5a2b !important;
            font-weight: 700 !important;
        }
        .shade-swatches {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 7px !important;
            align-items: center !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        .shade-swatch {
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 24px !important;
            height: 24px !important;
            min-width: 24px !important;
            min-height: 24px !important;
            border-radius: 50% !important;
            border: 2px solid transparent !important;
            cursor: pointer !important;
            padding: 0 !important;
            outline: none !important;
            box-shadow: 0 1px 5px rgba(0,0,0,0.28) !important;
            position: relative !important;
            flex-shrink: 0 !important;
            transition: transform 0.18s, box-shadow 0.18s !important;
        }
        .shade-swatch:hover {
            transform: scale(1.25) !important;
            box-shadow: 0 3px 10px rgba(0,0,0,0.38) !important;
            z-index: 10 !important;
        }
        .shade-swatch.active {
            border: 2.5px solid #8b5a2b !important;
            box-shadow: 0 0 0 3px rgba(139,90,43,0.28), 0 2px 8px rgba(0,0,0,0.25) !important;
            transform: scale(1.15) !important;
        }
        .shade-swatch.active::after {
            content: "" !important;
            position: absolute !important;
            inset: 3px !important;
            border-radius: 50% !important;
            border: 1.5px solid rgba(255,255,255,0.8) !important;
            pointer-events: none !important;
        }
        .qv-shade-selector { margin: 14px 0 18px !important; }
        .qv-shade-selector .shade-swatch { width: 32px !important; height: 32px !important; min-width: 32px !important; min-height: 32px !important; }
        .qv-shade-selector .shade-label { font-size: 14px !important; margin-bottom: 10px !important; }
        .cart-item-shade {
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
            font-size: 11px !important;
            color: #6d4c41 !important;
            font-weight: 500 !important;
            margin: 2px 0 4px !important;
        }
        .cart-shade-dot {
            display: inline-block !important;
            width: 12px !important;
            height: 12px !important;
            border-radius: 50% !important;
            border: 1.5px solid rgba(0,0,0,0.15) !important;
            flex-shrink: 0 !important;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// INIT APP
// ==========================================
function initApp() {
    preloader = document.getElementById('preloader');
    cartSidebar = document.getElementById('cart-sidebar');
    cartCount = document.getElementById('cart-count');
    cartItemCount = document.getElementById('cart-item-count');
    cartItemsContainer = document.getElementById('cart-items-container');
    cartSubtotal = document.getElementById('cart-subtotal');
    wishlistCount = document.getElementById('wishlist-count');
    mobileMenu = document.getElementById('mobile-menu');
    overlay = document.getElementById('overlay');
    toastContainer = document.getElementById('toast-container');
    quickViewModal = document.getElementById('quick-view-modal');
    quickViewBody = document.getElementById('quick-view-body');
    checkoutModal = document.getElementById('checkout-modal');

    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 100 });
    }

    waitForHeroAndHide();

    injectShadeStyles();
    products = [...productsData];
    loadNewArrivals();
    loadBestSellers();
    loadAllProducts();
    updateCartUI();
    updateWishlistUI();
    startSlider();
    setupEventListeners();
    addMobileFilterButton();
    setupMobileMenu();
    forceCloseAllModals();
    updateCheckoutHTML(); // Inject new checkout HTML
    updateCategoryCounts(); // Auto-count products per category
    checkPendingOrderFromLink(); // Auto-reopen Confirm/Cancel card if there's a pending order (no link needed)
    restoreViewAndQuickViewState(); // Restore Sale/Category/Search page or open Quick View after a refresh
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.addEventListener('load', function () {
    hidePreloader();
    populateCityDropdown('checkout-city');
});

// Preloader is hidden via initApp() (500ms) and window.load — no extra timeout needed.

// ==========================================
// INJECT UPDATED CHECKOUT HTML (Step 1 + Step 2)
// ==========================================
function updateCheckoutHTML() {
    // Update Step 1: Shipping form with Pakistan cities
    const step1 = document.getElementById('checkout-step-1');
    if (step1) {
        step1.innerHTML = `
            <h3>Shipping Information</h3>
            <form id="shipping-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name * <span style="color:var(--brown-light);font-size:12px;">(Full Name)</span></label>
                        <input type="text" id="checkout-name" placeholder="Enter your full name" required>
                    </div>
                    <div class="form-group">
                        <label>Phone Number * <span style="color:var(--brown-light);font-size:12px;">(Phone Number)</span></label>
                        <input type="tel" id="checkout-phone" placeholder="03XX-XXXXXXX" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Email Address <span style="color:var(--brown-light);font-size:12px;">(Optional)</span></label>
                    <input type="email" id="checkout-email" placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Complete Address * <span style="color:var(--brown-light);font-size:12px;">(Complete Address)</span></label>
                    <textarea id="checkout-address" rows="3" placeholder="House No., Street, Area, Landmark" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>City * <span style="color:var(--brown-light);font-size:12px;">(City)</span></label>
                        <select id="checkout-city" required>
                            <option value="">-- Select Your City --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Postal Code <span style="color:var(--brown-light);font-size:12px;">(Optional)</span></label>
                        <input type="text" id="checkout-postal" placeholder="54000">
                    </div>
                </div>
                <button type="button" class="btn-continue-checkout" onclick="goToStep(2)">
                    Continue to Payment <i class="fas fa-arrow-right"></i>
                </button>
            </form>
        `;
        // Populate cities after injecting HTML
        populateCityDropdown('checkout-city');
    }

    // Update Step 2: Payment with JazzCash & EasyPaisa
    const step2 = document.getElementById('checkout-step-2');
    if (step2) {
        step2.innerHTML = `
            <h3>Payment Method</h3>

            <!-- 6% Discount Banner -->
            <div class="digital-discount-banner">
                <div class="discount-banner-icon">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="discount-banner-text">
                    <strong>🎉 6% EXTRA DISCOUNT!</strong>
                    <p>Pay with JazzCash or EasyPaisa and get <strong>6% discount</strong> payen!</p>
                </div>
            </div>

            <div class="payment-methods-list">

                <!-- Cash on Delivery -->
                <div class="payment-method-card" id="pm-cod" onclick="selectPaymentMethod('cod')">
                    <div class="payment-radio">
                        <input type="radio" name="payment" value="cod" id="pay-cod" checked>
                        <span class="radio-custom"></span>
                    </div>
                    <div class="payment-icon cod-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="payment-details">
                        <h4>Cash on Delivery (COD)</h4>
                        <p>Pay when your order is delivered</p>
                        <span class="payment-badge cod-badge">Most Popular</span>
                    </div>
                    <div class="payment-check"><i class="fas fa-check-circle"></i></div>
                </div>

                <!-- JazzCash -->
                <div class="payment-method-card" id="pm-jazzcash" onclick="selectPaymentMethod('jazzcash')">
                    <div class="payment-radio">
                        <input type="radio" name="payment" value="jazzcash" id="pay-jazzcash">
                        <span class="radio-custom"></span>
                    </div>
                    <div class="payment-icon jazzcash-icon">
                        <span style="color:#CC0000;font-family:Arial Black,sans-serif;font-weight:900;font-size:11px;line-height:1.1;text-align:center;">Jazz<br><span style="color:#FF6600;">Cash</span></span>
                    </div>
                    <div class="payment-details">
                        <h4>JazzCash</h4>
                        <p>Mobile wallet payment</p>
                        <span class="payment-badge discount-badge"><i class="fas fa-tags"></i> 6% Discount!</span>
                    </div>
                    <div class="payment-check"><i class="fas fa-check-circle"></i></div>
                </div>

                <!-- EasyPaisa -->
                <div class="payment-method-card" id="pm-easypaisa" onclick="selectPaymentMethod('easypaisa')">
                    <div class="payment-radio">
                        <input type="radio" name="payment" value="easypaisa" id="pay-easypaisa">
                        <span class="radio-custom"></span>
                    </div>
                    <div class="payment-icon easypaisa-icon">
                        <span style="color:#00a651;font-family:Arial Black,sans-serif;font-weight:900;font-size:10px;line-height:1.1;text-align:center;">easy<br><span style="color:#006400;">paisa</span></span>
                    </div>
                    <div class="payment-details">
                        <h4>EasyPaisa</h4>
                        <p>Mobile wallet payment</p>
                        <span class="payment-badge discount-badge"><i class="fas fa-tags"></i> 6% Discount!</span>
                    </div>
                    <div class="payment-check"><i class="fas fa-check-circle"></i></div>
                </div>

            </div>

            <!-- Payment Detail Form (shown based on selection) -->
            <div id="payment-detail-section"></div>

            <div class="checkout-buttons" style="margin-top:25px;">
                <button type="button" class="btn-back" onclick="goToStep(1)">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <button type="button" class="btn-continue-checkout" onclick="goToStep(3)">
                    Review Order <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }

    // Initialize default payment (COD)
    setTimeout(() => {
        selectPaymentMethod('cod');
        injectPaymentStyles();
    }, 100);
}

// ==========================================
// INJECT PAYMENT STYLES
// ==========================================
function injectPaymentStyles() {
    if (document.getElementById('payment-extra-styles')) return;
    const style = document.createElement('style');
    style.id = 'payment-extra-styles';
    style.textContent = `
        /* Digital Discount Banner */
        .digital-discount-banner {
            display: flex;
            align-items: center;
            gap: 15px;
            background: linear-gradient(135deg, #fff3e0, #ffe0b2);
            border: 2px solid #ff9800;
            border-radius: 14px;
            padding: 18px 22px;
            margin-bottom: 22px;
            animation: pulse-orange 2s infinite;
        }
        @keyframes pulse-orange {
            0%,100% { box-shadow: 0 0 0 0 rgba(255,152,0,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(255,152,0,0); }
        }
        .discount-banner-icon {
            width: 50px; height: 50px;
            background: linear-gradient(135deg, #ff9800, #f57c00);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 22px; flex-shrink: 0;
        }
        .discount-banner-text strong {
            color: #e65100; font-size: 16px; display: block; margin-bottom: 4px;
        }
        .discount-banner-text p {
            color: #bf360c; font-size: 13px; margin: 0;
        }

        /* Payment Methods List */
        .payment-methods-list {
            display: flex; flex-direction: column; gap: 14px;
        }
        .payment-method-card {
            display: flex; align-items: center; gap: 15px;
            padding: 18px 20px;
            border: 2px solid var(--cream-dark);
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--white);
        }
        .payment-method-card:hover {
            border-color: var(--brown-light);
            transform: translateY(-2px);
            box-shadow: 0 5px 20px var(--shadow);
        }
        .payment-method-card.active {
            border-color: var(--brown);
            background: linear-gradient(135deg, var(--cream-light), var(--white));
        }
        .payment-method-card.active-jazzcash {
            border-color: #e60012;
            background: linear-gradient(135deg, #fff5f5, var(--white));
        }
        .payment-method-card.active-easypaisa {
            border-color: #00a651;
            background: linear-gradient(135deg, #f0fff4, var(--white));
        }
        .payment-icon {
            width: 52px; height: 52px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; flex-shrink: 0;
        }
        .cod-icon { background: linear-gradient(135deg, #c8e6c9, #a5d6a7); color: #2e7d32; }
        .jazzcash-icon { background: #fff0f0; border: 2px solid #ffcdd2; }
        .easypaisa-icon { background: #f0fff4; border: 2px solid #c8e6c9; }
        .payment-method-card.active .cod-icon {
            background: linear-gradient(135deg, var(--brown), var(--brown-dark));
            color: white;
        }
        .payment-details { flex: 1; }
        .payment-details h4 { font-size: 15px; color: var(--text-dark); margin-bottom: 3px; }
        .payment-details p { font-size: 12px; color: var(--text-light); }
        .payment-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 5px; }
        .cod-badge { background: #e8f5e9; color: #2e7d32; }
        .discount-badge { background: linear-gradient(135deg, #e65100, #bf360c); color: white; }
        .payment-check { color: var(--brown); font-size: 22px; opacity: 0; transform: scale(0); transition: all 0.3s ease; }
        .payment-method-card.active .payment-check,
        .payment-method-card.active-jazzcash .payment-check,
        .payment-method-card.active-easypaisa .payment-check { opacity: 1; transform: scale(1); }
        .payment-method-card.active-jazzcash .payment-check { color: #e60012; }
        .payment-method-card.active-easypaisa .payment-check { color: #00a651; }

        /* Digital Payment Form */
        .digital-payment-form {
            background: var(--cream-light);
            border: 2px solid var(--cream-dark);
            border-radius: 14px;
            padding: 25px;
            margin-top: 18px;
            animation: fadeIn 0.3s ease;
        }
        .digital-payment-form.jazzcash-form { border-color: #ffcdd2; background: #fff5f5; }
        .digital-payment-form.easypaisa-form { border-color: #c8e6c9; background: #f0fff4; }
        .dpf-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .dpf-header img { width: 80px; height: auto; object-fit: contain; }
        .dpf-header-text h4 { font-size: 16px; margin-bottom: 4px; }
        .dpf-header-text p { font-size: 13px; color: var(--text-light); }
        .dpf-discount-pill {
            display: inline-flex; align-items: center; gap: 6px;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white; padding: 6px 14px; border-radius: 20px;
            font-size: 13px; font-weight: 700; margin-bottom: 18px;
        }
        .dpf-instructions {
            background: white; border-radius: 10px; padding: 15px; margin-bottom: 18px;
        }
        .dpf-instructions h5 { font-size: 14px; margin-bottom: 10px; color: var(--brown-dark); }
        .dpf-step {
            display: flex; align-items: flex-start; gap: 10px;
            margin-bottom: 8px; font-size: 13px; color: var(--text-light);
        }
        .dpf-step-num {
            width: 22px; height: 22px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700; flex-shrink: 0; color: white;
        }
        .jazzcash-num { background: #e60012; }
        .easypaisa-num { background: #00a651; }
        .account-number-box {
            display: flex; align-items: center; justify-content: space-between;
            background: white; border: 2px dashed; border-radius: 10px;
            padding: 14px 18px; margin-bottom: 15px;
        }
        .account-number-box.jazzcash-box { border-color: #e60012; }
        .account-number-box.easypaisa-box { border-color: #00a651; }
        .account-number-box .acc-label { font-size: 12px; color: var(--text-light); margin-bottom: 3px; }
        .account-number-box .acc-number { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
        .account-number-box.jazzcash-box .acc-number { color: #e60012; }
        .account-number-box.easypaisa-box .acc-number { color: #00a651; }
        .copy-btn {
            padding: 8px 14px; border: none; border-radius: 8px;
            font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
        }
        .jazzcash-box .copy-btn { background: #e60012; color: white; }
        .easypaisa-box .copy-btn { background: #00a651; color: white; }
        .copy-btn:hover { opacity: 0.85; transform: scale(1.05); }
        .txn-input-group { display: flex; gap: 10px; }
        .txn-input-group input { flex: 1; }
        .dpf-note {
            font-size: 12px; color: var(--text-light);
            background: white; padding: 10px 14px; border-radius: 8px;
            margin-top: 12px; line-height: 1.5;
        }
        .dpf-note i { color: #ff9800; margin-right: 5px; }

        /* Order Summary savings line */
        .savings-line { color: #27ae60 !important; font-weight: 700 !important; }

        /* Sidebar discount line */
        #sidebar-discount-line { color: #27ae60; }

        /* Mobile responsive for payment */
        @media (max-width: 480px) {
            .digital-discount-banner { flex-direction: column; text-align: center; }
            .account-number-box { flex-direction: column; gap: 10px; text-align: center; }
            .txn-input-group { flex-direction: column; }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// SELECT PAYMENT METHOD
// ==========================================
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    // Remove all active classes
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('active', 'active-jazzcash', 'active-easypaisa');
    });

    // Add active class to selected
    const selectedCard = document.getElementById('pm-' + method);
    if (selectedCard) {
        if (method === 'jazzcash') selectedCard.classList.add('active-jazzcash');
        else if (method === 'easypaisa') selectedCard.classList.add('active-easypaisa');
        else selectedCard.classList.add('active');
    }

    // Update sidebar with discount info
    updateSidebarTotals();

    // Show payment detail form
    const detailSection = document.getElementById('payment-detail-section');
    if (!detailSection) return;

    if (method === 'cod') {
        detailSection.innerHTML = '';
    } else if (method === 'jazzcash') {
        const { discountAmt, finalTotal, subtotal, shipping } = calculateTotalsWithDiscount();
        detailSection.innerHTML = `
            <div class="digital-payment-form jazzcash-form">
                <div class="dpf-header">
                    <div class="dpf-logo-box" style="background:#CC0000;border-radius:10px;padding:8px 14px;display:flex;align-items:center;justify-content:center;min-width:90px;">
                        <span style="color:white;font-family:Arial Black,sans-serif;font-weight:900;font-size:18px;letter-spacing:-1px;">Jazz<span style="color:#FF6600;">Cash</span></span>
                    </div>
                    <div class="dpf-header-text">
                        <h4 style="color:#e60012;">JazzCash Payment</h4>
                        <p>Send payment to the account number below</p>
                    </div>
                </div>
                <div class="dpf-discount-pill">
                    <i class="fas fa-tag"></i> 6% Discount Applied! — You saved PKR ${discountAmt.toLocaleString()} !
                </div>
                <div class="account-number-box jazzcash-box">
                    <div>
                        <div class="acc-label">JazzCash Account Number:</div>
                        <div class="acc-number">0301-7133824</div>
                        <div style="font-size:12px;color:#666;margin-top:2px;">Account Name: Aurevyn</div>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('0301-7133824')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="dpf-instructions">
                    <h5>How to Pay:</h5>
                    <div class="dpf-step"><span class="dpf-step-num jazzcash-num">1</span> <span>Open JazzCash app or dial *786#</span></div>
                    <div class="dpf-step"><span class="dpf-step-num jazzcash-num">2</span> <span>Select "Send Money"</span></div>
                    <div class="dpf-step"><span class="dpf-step-num jazzcash-num">3</span> <span>Enter number <strong>0301-7133824</strong></span></div>
                    <div class="dpf-step"><span class="dpf-step-num jazzcash-num">4</span> <span>Enter amount <strong>PKR ${finalTotal.toLocaleString()}</strong></span></div>
                    <div class="dpf-step"><span class="dpf-step-num jazzcash-num">5</span> <span>Enter your Transaction ID below</span></div>
                </div>
                <div class="form-group">
                    <label style="color:#c62828;font-weight:600;">Transaction ID (TID) * <span style="font-size:11px;color:#666;">(from JazzCash receipt)</span></label>
                    <div class="txn-input-group">
                        <input type="text" id="txn-id" placeholder="e.g., TK12345678" required style="border-color:#e60012;">
                        <button type="button" style="padding:0 18px;background:#e60012;color:white;border:none;border-radius:12px;cursor:pointer;white-space:nowrap;font-size:13px;" onclick="verifyTxnId()">
                            <i class="fas fa-check"></i> Verify
                        </button>
                    </div>
                </div>
                <div class="dpf-note"><i class="fas fa-info-circle"></i> Please enter your Transaction ID after payment. Orders without a TID cannot be processed.</div>
            </div>
        `;
    } else if (method === 'easypaisa') {
        const { discountAmt, finalTotal, subtotal, shipping } = calculateTotalsWithDiscount();
        detailSection.innerHTML = `
            <div class="digital-payment-form easypaisa-form">
                <div class="dpf-header">
                    <div class="dpf-logo-box" style="background:#00a651;border-radius:10px;padding:8px 14px;display:flex;align-items:center;justify-content:center;min-width:90px;">
                        <span style="color:white;font-family:Arial Black,sans-serif;font-weight:900;font-size:18px;letter-spacing:-1px;">easy<span style="color:#FFD700;">paisa</span></span>
                    </div>
                    <div class="dpf-header-text">
                        <h4 style="color:#00a651;">EasyPaisa Payment</h4>
                        <p>Send payment to the account number below</p>
                    </div>
                </div>
                <div class="dpf-discount-pill">
                    <i class="fas fa-tag"></i> 6% Discount Applied! — You saved PKR ${discountAmt.toLocaleString()} !
                </div>
                <div class="account-number-box easypaisa-box">
                    <div>
                        <div class="acc-label">EasyPaisa Account Number:</div>
                        <div class="acc-number">0301-7133824</div>
                        <div style="font-size:12px;color:#666;margin-top:2px;">Account Name: Aurevyn</div>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('0301-7133824')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="dpf-instructions">
                    <h5>How to Pay:</h5>
                    <div class="dpf-step"><span class="dpf-step-num easypaisa-num">1</span> <span>Open EasyPaisa app or dial *786#</span></div>
                    <div class="dpf-step"><span class="dpf-step-num easypaisa-num">2</span> <span>Select "Send Money"</span></div>
                    <div class="dpf-step"><span class="dpf-step-num easypaisa-num">3</span> <span>Enter number <strong>0301-7133824</strong></span></div>
                    <div class="dpf-step"><span class="dpf-step-num easypaisa-num">4</span> <span>Enter amount <strong>PKR ${finalTotal.toLocaleString()}</strong></span></div>
                    <div class="dpf-step"><span class="dpf-step-num easypaisa-num">5</span> <span>Enter your Transaction ID below</span></div>
                </div>
                <div class="form-group">
                    <label style="color:#1b5e20;font-weight:600;">Transaction ID (TID) * <span style="font-size:11px;color:#666;">(from EasyPaisa receipt)</span></label>
                    <div class="txn-input-group">
                        <input type="text" id="txn-id" placeholder="e.g., EP12345678" required style="border-color:#00a651;">
                        <button type="button" style="padding:0 18px;background:#00a651;color:white;border:none;border-radius:12px;cursor:pointer;white-space:nowrap;font-size:13px;" onclick="verifyTxnId()">
                            <i class="fas fa-check"></i> Verify
                        </button>
                    </div>
                </div>
                <div class="dpf-note"><i class="fas fa-info-circle"></i> Please enter your Transaction ID after payment. Orders without a TID cannot be processed.</div>
            </div>
        `;
    }
}

// ==========================================
// CALCULATE TOTALS WITH 6% DISCOUNT
// ==========================================
function calculateTotalsWithDiscount() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const city = checkoutData.shipping?.city || document.getElementById('checkout-city')?.value || '';
    const shippingFee = getShippingFee(city);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shippingFee;
    const baseTotal = subtotal + shipping;
    const isDigital = (selectedPaymentMethod === 'jazzcash' || selectedPaymentMethod === 'easypaisa');
    const discountAmt = isDigital ? Math.round(baseTotal * DIGITAL_DISCOUNT_PERCENT / 100) : 0;
    const finalTotal = baseTotal - discountAmt;
    return { subtotal, shipping, baseTotal, discountAmt, finalTotal, isDigital };
}

// ==========================================
// UPDATE SIDEBAR TOTALS (with discount if digital)
// ==========================================
function updateSidebarTotals() {
    const { subtotal, shipping, discountAmt, finalTotal, isDigital } = calculateTotalsWithDiscount();

    const subtotalEl = document.getElementById('sidebar-subtotal');
    const shippingEl = document.getElementById('sidebar-shipping');
    const discountLine = document.getElementById('sidebar-discount-line');
    const discountEl = document.getElementById('sidebar-discount');
    const totalEl = document.getElementById('sidebar-total');

    if (subtotalEl) subtotalEl.textContent = 'PKR ' + subtotal.toLocaleString();
    const city = checkoutData.shipping?.city || document.getElementById('checkout-city')?.value || '';
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : shipping;

    if (discountLine && discountEl) {
        if (isDigital && discountAmt > 0) {
            discountLine.style.display = 'flex';
            discountEl.textContent = '-PKR ' + discountAmt.toLocaleString();
            discountEl.className = 'savings-line';
        } else {
            discountLine.style.display = 'none';
        }
    }

    if (totalEl) totalEl.textContent = 'PKR ' + finalTotal.toLocaleString();
}

// ==========================================
// COPY TO CLIPBOARD
// ==========================================
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', 'Copied!', text + ' copied to clipboard!');
        });
    } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('success', 'Copied!', text + ' copied!');
    }
}

// ==========================================
// VERIFY TXN ID (basic check)
// ==========================================
function verifyTxnId() {
    const txnInput = document.getElementById('txn-id');
    if (!txnInput || !txnInput.value.trim()) {
        showToast('error', 'Transaction ID Required', 'Please enter your Transaction ID');
        return;
    }
    showToast('success', 'TID Verified!', 'Transaction ID recorded successfully.');
}

// ==========================================
// LOAD CHECKOUT SIDEBAR
// ==========================================
function loadCheckoutSidebar() {
    const container = document.getElementById('sidebar-items');
    if (!container) return;

    container.innerHTML = cart.map(item => {
        const shadeColor = item.shade ? getShadeColor(item.id, item.shade) : null;
        return `
        <div class="sidebar-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="sidebar-item-info">
                <h5>${item.name}</h5>
                ${item.shade ? `<div class="sidebar-item-shade"><span class="cart-shade-dot" style="background:${shadeColor};"></span>${item.shade}</div>` : ''}
                <span>Qty: ${item.quantity}</span>
            </div>
            <div class="sidebar-item-price">PKR ${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `}).join('');

    updateSidebarTotals();
}

// ==========================================
// PLACE ORDER (WhatsApp integration with discount info)
// ==========================================
function placeOrder() {
    // Validate transaction ID for digital payments
    if (selectedPaymentMethod !== 'cod') {
        const txnInput = document.getElementById('txn-id');
        if (!txnInput || !txnInput.value.trim()) {
            showToast('error', 'Transaction ID Required', 'Please enter your JazzCash/EasyPaisa Transaction ID');
            return;
        }
        checkoutData.payment.txnId = txnInput.value.trim();
    }

    const orderId = 'AV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const { subtotal, shipping, discountAmt, finalTotal, isDigital } = calculateTotalsWithDiscount();

    const methodLabels = {
        'cod': 'Cash on Delivery',
        'jazzcash': 'JazzCash',
        'easypaisa': 'EasyPaisa'
    };

    let message = `🛍️ *NEW ORDER - Aurevyn*%0A%0A`;
    message += `*Order ID:* ${orderId}%0A%0A`;
    message += `*👤 Customer Details:*%0A`;
    message += `Name: ${checkoutData.shipping.name}%0A`;
    message += `Phone: ${checkoutData.shipping.phone}%0A`;
    message += `Email: ${checkoutData.shipping.email || 'N/A'}%0A`;
    message += `Address: ${checkoutData.shipping.address}%0A`;
    message += `City: ${checkoutData.shipping.city}%0A`;
    message += `Postal: ${checkoutData.shipping.postal || 'N/A'}%0A%0A`;

    message += `*💳 Payment Method:* ${methodLabels[selectedPaymentMethod]}%0A`;
    if (isDigital) {
        message += `*Transaction ID:* ${checkoutData.payment.txnId}%0A`;
        message += `*6% Discount Applied:* -PKR ${discountAmt.toLocaleString()}%0A`;
    }
    message += `%0A`;

    message += `*📦 Order Items:*%0A`;
    cart.forEach(item => {
        const shadePart = item.shade ? ` (${item.shade})` : '';
        message += `• ${item.name}${shadePart} x${item.quantity} - PKR ${(item.price * item.quantity).toLocaleString()}%0A`;
    });

    message += `%0A*💰 Order Summary:*%0A`;
    message += `Subtotal: PKR ${subtotal.toLocaleString()}%0A`;
    message += `Shipping: ${shipping === 0 ? 'FREE' : shipping}%0A`;
    if (isDigital) message += `6% Digital Discount: -PKR ${discountAmt.toLocaleString()}%0A`;
    message += `*TOTAL: PKR ${finalTotal.toLocaleString()}*%0A%0A`;
    message += `Date: ${new Date().toLocaleString()}%0A`;
    message += `Status: Pending Confirmation`;

    // Add confirmation reminder note to seller message
    message += `%0A%0A🔴 *Order expires in 30 minutes if not confirmed.*`;
    message += `%0A⚠️ *Go back to the website and confirm your order if you liked this product!*`;

    try {
        window.open(`https://wa.me/923258666803?text=${message}`, '_blank');
    } catch(e) {
        console.warn('WhatsApp redirect blocked:', e);
    }

    // ── Formspree mein order save karo (email aayegi aapko) ──
    const itemsSummary = cart.map(function(item) {
        const shadePart = item.shade ? ' (' + item.shade + ')' : '';
        return item.name + shadePart + ' x' + item.quantity + ' = PKR ' + (item.price * item.quantity).toLocaleString();
    }).join(' | ');

    fetch(FORMSPREE_ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
            orderId:   orderId,
            name:      checkoutData.shipping.name,
            phone:     checkoutData.shipping.phone,
            email:     checkoutData.shipping.email || 'N/A',
            city:      checkoutData.shipping.city,
            address:   checkoutData.shipping.address,
            postal:    checkoutData.shipping.postal || 'N/A',
            items:     itemsSummary,
            subtotal:  'PKR ' + subtotal.toLocaleString(),
            shipping:  shipping === 0 ? 'FREE' : 'PKR ' + shipping,
            discount:  isDigital ? 'PKR ' + discountAmt.toLocaleString() : 'N/A',
            total:     'PKR ' + finalTotal.toLocaleString(),
            payment:   methodLabels[selectedPaymentMethod],
            txnId:     checkoutData.payment.txnId || 'N/A',
            status:    'Pending',
            date:      new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
        })
    }).catch(function(err) {
        console.warn('Order save failed (Formspree):', err);
    });

    const successOrderId = document.getElementById('success-order-id');
    if (successOrderId) successOrderId.textContent = orderId;

    // Save order expiry time (30 minutes from now)
    const expiryTime = Date.now() + (30 * 60 * 1000);
    const waTimeLabel = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    localStorage.setItem('aurevynPendingOrder', JSON.stringify({
        orderId: orderId,
        expiryTime: expiryTime,
        timeLabel: waTimeLabel,
        confirmed: false,
        cancelled: false
    }));

    cart = [];
    saveCart();
    updateCartUI();

    closeCheckout();

    setTimeout(() => {
        const successModal = document.getElementById('order-success-modal');
        if (successModal) successModal.classList.add('active');
        const waTimeEl = document.getElementById('wa-confirm-time');
        if (waTimeEl) waTimeEl.textContent = waTimeLabel;
        updateFloatingButtons();
        startOrderConfirmTimer(expiryTime);
        scheduleOrderReminders(expiryTime);
        schedulePushNotifications(expiryTime);
    }, 100);
}

// 30-minute countdown timer for order confirmation
function startOrderConfirmTimer(expiryTime) {
    const timerEl = document.getElementById('order-confirm-timer');
    const timerCountdown = document.getElementById('timer-countdown');
    const btnConfirm = document.querySelector('.btn-confirm-order');
    const btnCancel = document.querySelector('.btn-cancel-order');
    const expiredMsg = document.getElementById('order-expired-msg');

    if (!timerEl || !timerCountdown) return;

    timerEl.style.display = 'block';
    if (expiredMsg) expiredMsg.style.display = 'none';

    function updateTimer() {
        const now = Date.now();
        const remaining = expiryTime - now;

        if (remaining <= 0) {
            // Expired
            timerCountdown.textContent = '00:00:00';
            timerEl.classList.add('expired');
            if (btnConfirm) { btnConfirm.disabled = true; btnConfirm.style.opacity = '0.4'; btnConfirm.style.cursor = 'not-allowed'; }
            if (btnCancel) { btnCancel.disabled = true; btnCancel.style.opacity = '0.4'; btnCancel.style.cursor = 'not-allowed'; }
            if (expiredMsg) expiredMsg.style.display = 'block';

            // Update localStorage
            const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || '{}');
            if (pending && !pending.confirmed && !pending.cancelled) {
                pending.cancelled = true;
                localStorage.setItem('aurevynPendingOrder', JSON.stringify(pending));
            }
            clearInterval(timerInterval);
            return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);

        timerCountdown.textContent =
            String(hours).padStart(2, '0') + ':' +
            String(mins).padStart(2, '0') + ':' +
            String(secs).padStart(2, '0');

        // Warning color when < 5 min remaining
        if (remaining < 5 * 60 * 1000) {
            timerEl.classList.add('warning');
        }
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    // Store interval ID to clear if modal closes
    window._orderTimerInterval = timerInterval;
}

// ==========================================
// AUTO-RESUME CONFIRM/CANCEL CARD ON PAGE LOAD
// Customer doesn't need any special link — if the order is pending
// (not confirmed/cancelled and 30 min haven't passed) the card will
// reappear automatically whenever the website is opened.
// ==========================================
function checkPendingOrderFromLink() {
    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
    if (!pending) return;

    // Already confirmed or cancelled earlier — nothing left to do, don't keep popping the card up
    if (pending.confirmed || pending.cancelled) return;

    // Time already up — quietly mark as cancelled, don't show the modal
    if (Date.now() >= pending.expiryTime) {
        pending.cancelled = true;
        localStorage.setItem('aurevynPendingOrder', JSON.stringify(pending));
        return;
    }

    // Still pending and within the 30-minute window — show the Confirm/Cancel card automatically
    const successOrderId = document.getElementById('success-order-id');
    if (successOrderId) successOrderId.textContent = pending.orderId;

    const waTimeEl = document.getElementById('wa-confirm-time');
    if (waTimeEl && pending.timeLabel) waTimeEl.textContent = pending.timeLabel;

    const successModal = document.getElementById('order-success-modal');
    if (successModal) successModal.classList.add('active');
    updateFloatingButtons();

    startOrderConfirmTimer(pending.expiryTime);
    scheduleOrderReminders(pending.expiryTime);

    // Clean up any old confirm_order links that may still be floating around (older shared links)
    const params = new URLSearchParams(window.location.search);
    // If this page load came from tapping "Cancel Order" on a push notification, cancel it now
    const cameFromCancelNotification = params.has('action') && params.get('action') === 'cancel';

    // Clean up ?remind=1 param if present (from notification tap on new tab)
    if (params.has('remind')) {
        params.delete('remind');
        const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
    }

    if (params.has('confirm_order')) {
        params.delete('confirm_order');
        const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
    }

    if (params.has('action')) {
        params.delete('action');
        const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
    }

    if (cameFromCancelNotification) {
        cancelOrderWhatsApp();
    }
}

// ==========================================
// STEP VALIDATION (updated for new fields)
// ==========================================
// ==========================================
// PHONE VERIFICATION HELPERS
// ==========================================
function normalizePhone(p) {
    return p.replace(/[\s\-]/g, '');
}

function highlightPhoneConfirmError(isError) {
    const el = document.getElementById('checkout-phone-confirm');
    const msg = document.getElementById('phone-match-msg');
    if (!el) return;
    if (isError) {
        el.style.borderColor = '#e74c3c';
        el.style.boxShadow = '0 0 0 3px rgba(231,76,60,0.15)';
        if (msg) { msg.style.display = 'block'; msg.style.color = '#e74c3c'; msg.innerHTML = '<i class="fas fa-times-circle"></i> Numbers do not match'; }
    } else {
        el.style.borderColor = '#27ae60';
        el.style.boxShadow = '0 0 0 3px rgba(39,174,96,0.15)';
        if (msg) { msg.style.display = 'block'; msg.style.color = '#27ae60'; msg.innerHTML = '<i class="fas fa-check-circle"></i> Phone number confirmed!'; }
    }
}

function setupPhoneLiveCheck() {
    const phoneEl = document.getElementById('checkout-phone');
    const confirmEl = document.getElementById('checkout-phone-confirm');
    if (!confirmEl || !phoneEl) return;
    confirmEl.addEventListener('input', function() {
        const p1 = phoneEl.value.trim();
        const p2 = this.value.trim();
        if (p2.length === 0) {
            this.style.borderColor = '';
            this.style.boxShadow = '';
            const msg = document.getElementById('phone-match-msg');
            if (msg) msg.style.display = 'none';
            return;
        }
        highlightPhoneConfirmError(normalizePhone(p1) !== normalizePhone(p2));
        if (normalizePhone(p1) === normalizePhone(p2)) highlightPhoneConfirmError(false);
    });
}

function validateStep(step) {
    if (step === 1) {
        const name = document.getElementById('checkout-name')?.value?.trim();
        const phone = document.getElementById('checkout-phone')?.value?.trim();
        const codCheck = document.getElementById('cod-confirm-check');
        const address = document.getElementById('checkout-address')?.value?.trim();
        const city = document.getElementById('checkout-city')?.value;

        if (!name) { showToast('error', 'Name Required', 'Please enter your full name'); return false; }
        if (!phone || phone.length < 10) { showToast('error', 'Phone Required', 'Please enter a valid phone number (03XX-XXXXXXX)'); return false; }

        if (codCheck && !codCheck.checked) {
            showToast('error', 'Confirmation Required', 'Please confirm that this is a real order');
            const grp = codCheck.closest('.form-group');
            if (grp) {
                grp.style.outline = '2px solid #e74c3c';
                grp.style.borderRadius = '8px';
                grp.style.padding = '8px';
                setTimeout(() => { grp.style.outline = ''; grp.style.padding = ''; }, 2500);
            }
            return false;
        }
        if (codCheck) {
            const grp = codCheck.closest('.form-group');
            if (grp) { grp.style.outline = ''; grp.style.padding = ''; }
        }

        if (!address) { showToast('error', 'Address Required', 'Enter your complete address'); return false; }
        if (!city) { showToast('error', 'City Required', 'Please select your city'); return false; }

        checkoutData.shipping = {
            name, phone,
            email: document.getElementById('checkout-email')?.value || '',
            address,
            city,
            postal: document.getElementById('checkout-postal')?.value || ''
        };
    }

    if (step === 2) {
        checkoutData.payment = { method: selectedPaymentMethod };
        updateSidebarTotals();
    }

    return true;
}

// ==========================================
// POPULATE REVIEW DATA (updated with discount)
// ==========================================
function populateReviewData() {
    const reviewName = document.querySelector('#review-shipping .review-name');
    const reviewPhone = document.querySelector('#review-shipping .review-phone');
    const reviewAddress = document.querySelector('#review-shipping .review-address');

    if (reviewName) reviewName.textContent = checkoutData.shipping.name;
    if (reviewPhone) reviewPhone.textContent = checkoutData.shipping.phone;
    if (reviewAddress) reviewAddress.textContent = checkoutData.shipping.address + ', ' + checkoutData.shipping.city;

    const reviewMethod = document.querySelector('#review-payment .review-method');
    const methodLabels = { cod: 'Cash on Delivery', jazzcash: 'JazzCash (6% Discount Applied ✓)', easypaisa: 'EasyPaisa (6% Discount Applied ✓)' };
    if (reviewMethod) reviewMethod.textContent = methodLabels[selectedPaymentMethod] || selectedPaymentMethod;

    const itemsContainer = document.getElementById('review-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = cart.map(item => {
            const shadeColor = item.shade ? getShadeColor(item.id, item.shade) : null;
            return `
            <div class="review-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="review-item-info">
                    <h5>${item.name}</h5>
                    ${item.shade ? `<div class="cart-item-shade"><span class="cart-shade-dot" style="background:${shadeColor};"></span>${item.shade}</div>` : ''}
                    <span>Qty: ${item.quantity}</span>
                </div>
                <div class="review-item-price">PKR ${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        `}).join('');
    }

    const { subtotal, shipping, discountAmt, finalTotal, isDigital } = calculateTotalsWithDiscount();
    const reviewSubtotal = document.getElementById('review-subtotal');
    const reviewShipping = document.getElementById('review-shipping-cost');
    const reviewTotal = document.getElementById('review-total');

    if (reviewSubtotal) reviewSubtotal.textContent = 'PKR ' + subtotal.toLocaleString();
    if (reviewShipping) reviewShipping.textContent = shipping === 0 ? 'FREE' : shipping;
    if (reviewTotal) {
        reviewTotal.textContent = 'PKR ' + finalTotal.toLocaleString();
        // Remove any existing discount row to prevent duplicates on back/forward navigation
        const existingDiscount = document.querySelector('.review-discount-row');
        if (existingDiscount) existingDiscount.remove();
        if (isDigital) {
            reviewTotal.insertAdjacentHTML('beforebegin',
                `<div class="summary-row review-discount-row" style="color:#27ae60;font-weight:700;">
                    <span><i class="fas fa-tag"></i> 6% Discount</span>
                    <strong style="color:#27ae60;">-PKR ${discountAmt.toLocaleString()}</strong>
                </div>`
            );
        }
    }
}

// ==========================================
// OPEN CHECKOUT
// ==========================================
function openCheckout() {
    if (cart.length === 0) {
        showToast('error', 'Empty Cart', 'Please add items to your cart first.');
        return;
    }

    // Close cart sidebar first
    const cartSidebarEl = document.getElementById('cart-sidebar');
    if (cartSidebarEl) cartSidebarEl.classList.remove('active');

    // Open checkout modal
    const checkoutModalEl = document.getElementById('checkout-modal');
    if (checkoutModalEl) checkoutModalEl.classList.add('active');

    // FIX: Make checkout-header sticky so it stays visible while scrolling
    setTimeout(() => {
        const checkoutContent = checkoutModalEl ? checkoutModalEl.querySelector('.checkout-content') : null;
        const checkoutHeader = checkoutModalEl ? checkoutModalEl.querySelector('.checkout-header') : null;
        if (checkoutContent) {
            checkoutContent.style.setProperty('overflow-y', 'auto', 'important');
            checkoutContent.style.setProperty('max-height', '100vh', 'important');
            checkoutContent.style.setProperty('height', '100vh', 'important');
            checkoutContent.scrollTop = 0;
        }
        if (checkoutHeader) {
            checkoutHeader.style.setProperty('position', 'sticky', 'important');
            checkoutHeader.style.setProperty('top', '0', 'important');
            checkoutHeader.style.setProperty('z-index', '10', 'important');
        }
    }, 50);

    // Overlay for checkout
    const overlayEl = document.getElementById('overlay');
    if (overlayEl) {
        overlayEl.classList.add('active');
        overlayEl.onclick = function() { closeCheckout(); };
    }

    // Lock body scroll (without cart-open class to avoid CSS conflict)
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    if (window.innerWidth <= 768) {
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.dataset.scrollY = scrollY;
    }

    goToStep(1);
    loadCheckoutSidebar();
    populateCityDropdown('checkout-city');
    setTimeout(setupPhoneLiveCheck, 100);
    setTimeout(() => injectPaymentStyles(), 50);
    updateFloatingButtons();
}

function closeCheckout() {
    const checkoutModalEl = document.getElementById('checkout-modal');
    if (checkoutModalEl) checkoutModalEl.classList.remove('active');

    const overlayEl = document.getElementById('overlay');
    if (overlayEl) {
        overlayEl.classList.remove('active');
        overlayEl.onclick = function() { closeAll(); };
    }

    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.top = '';
    // Restore scroll position
    const savedScrollY = document.body.dataset.scrollY;
    if (savedScrollY) {
        window.scrollTo({ top: parseInt(savedScrollY), left: 0, behavior: 'instant' });
        delete document.body.dataset.scrollY;
    }
    updateFloatingButtons();
}

// ==========================================
// GO TO STEP
// ==========================================
function goToStep(step) {
    if (step > currentCheckoutStep && !validateStep(currentCheckoutStep)) return;

    document.querySelectorAll('.step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');
        if (stepNum === step) el.classList.add('active');
        else if (stepNum < step) el.classList.add('completed');
    });

    document.querySelectorAll('.checkout-step-content').forEach((el, index) => {
        el.classList.remove('active');
        if (index + 1 === step) el.classList.add('active');
    });

    currentCheckoutStep = step;

    // Scroll checkout content to top on every step change
    const checkoutModalEl = document.getElementById('checkout-modal');
    const checkoutContent = checkoutModalEl ? checkoutModalEl.querySelector('.checkout-content') : null;
    if (checkoutContent) checkoutContent.scrollTop = 0;

    if (step === 2) {
        // Save city before calculating
        const cityEl = document.getElementById('checkout-city');
        if (cityEl && cityEl.value) checkoutData.shipping.city = cityEl.value;
        selectPaymentMethod(selectedPaymentMethod);
        updateSidebarTotals();
    }
    if (step === 3) populateReviewData();
}

// ==========================================
// FORCE CLOSE ALL MODALS
// ==========================================
function forceCloseAllModals() {
    ['cart-sidebar', 'quick-view-modal', 'checkout-modal', 'return-modal',
        'policy-modal', 'gift-box-modal', 'customer-service-modal', 'overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    if (whatsappCheckInterval) { clearInterval(whatsappCheckInterval); whatsappCheckInterval = null; }
    whatsappWindow = null;
}

// ==========================================
// PRODUCT LOADING
// ==========================================
function loadNewArrivals() {
    const container = document.getElementById('new-arrivals-grid');
    if (!container) return;
    const newArrivalIds = [10, 14, 39, 32, 27, 29, 30, 33, 36, 37, 42]; // Moccallure, Miss Rose Foundation, Laurenza Palette, Hard Candy Foundation, Jarusa BB Cream, MCoBeauty Lip Mask Berry, MCoBeauty Lip Mask Vanilla, RPK Liquid Liner, Hard Candy Primer, Wibo Probrow Pencil, Real Beauty Brow Kit
    const newArrivalProducts = newArrivalIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    container.innerHTML = newArrivalProducts.map((p, i) => createProductCard(p, i)).join('');
    initNaCarousel();
}

// ==========================================
// NEW ARRIVALS CAROUSEL — Arrows & Dots
// ==========================================
function initNaCarousel() {
    const track = document.getElementById('new-arrivals-grid');
    const dotsContainer = document.getElementById('na-dots');
    if (!track || !dotsContainer) return;

    const cards = track.querySelectorAll('.product-card');
    const total = cards.length;
    dotsContainer.innerHTML = '';

    // Build dots
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'na-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to product ' + (i + 1));
        dot.addEventListener('click', function() { naScrollTo(i); });
        dotsContainer.appendChild(dot);
    }

    // Update active dot on scroll
    track.addEventListener('scroll', function() {
        const cardW = cards[0] ? cards[0].offsetWidth + 24 : 284;
        const active = Math.round(track.scrollLeft / cardW);
        dotsContainer.querySelectorAll('.na-dot').forEach(function(d, idx) {
            d.classList.toggle('active', idx === active);
        });
    }, { passive: true });
}

function naScrollTo(index) {
    const track = document.getElementById('new-arrivals-grid');
    if (!track) return;
    const card = track.querySelector('.product-card');
    const cardW = card ? card.offsetWidth + 24 : 284;
    track.scrollTo({ left: index * cardW, behavior: 'smooth' });
}

function naScroll(dir) {
    const track = document.getElementById('new-arrivals-grid');
    if (!track) return;
    const card = track.querySelector('.product-card');
    const cardW = card ? card.offsetWidth + 24 : 284;
    track.scrollBy({ left: dir * cardW, behavior: 'smooth' });
}

function loadBestSellers() {
    const container = document.getElementById('best-sellers-grid');
    if (!container) return;
    container.innerHTML = products.filter(p => p.rating >= 4.7).slice(0, 4).map((p, i) => createProductCard(p, i)).join('');
}

function loadAllProducts() {
    const container = document.getElementById('all-products-grid');
    if (!container) return;
    container.innerHTML = products.map((p, i) => createProductCard(p, i)).join('');
    updateShowingCount();
}

// Renders one or more badges on a product card.
// Supports product.badges (array, e.g. ["New", "Hot"]) and falls back to the
// legacy single product.badge string for products that only have one badge.
function renderProductBadges(product) {
    const list = (product.badges && product.badges.length) ? product.badges : (product.badge ? [product.badge] : []);
    if (!list.length) return '';
    if (list.length === 1) {
        return `<div class="product-badge ${list[0].toLowerCase()}">${list[0]}</div>`;
    }
    return `<div class="product-badges-stack">${list.map(b => `<div class="product-badge ${b.toLowerCase()}">${b}</div>`).join('')}</div>`;
}

function createProductCard(product, index = 99) {
    const imgLoading = index < 4 ? 'eager' : 'lazy';
    const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
    const inWishlist = wishlist.includes(product.id);
    const hasVariants = product.variants && product.variants.length > 0;
    const hasShades = product.shades && product.shades.length > 0;
    const defaultShade = hasShades ? product.shades[0].name : null;

    // Variant thumbnails — color circles if variant has color, else image thumbs
    const hasColorVariants = hasVariants && product.variants[0].color;
    const variantThumbs = hasVariants ? `
        <div class="variant-thumbs ${hasColorVariants ? 'color-variant-thumbs' : ''}" id="variant-thumbs-${product.id}">
            ${hasColorVariants ? `<div class="variant-color-label">Shade: <span class="selected-variant-name" id="variant-name-${product.id}">${product.variants[0].label}</span></div>` : ''}
            <div class="variant-swatches-row">
            ${product.variants.map((v, idx) => hasColorVariants ? `
                <button class="variant-color-swatch ${idx === 0 ? 'active' : ''}"
                    onclick="selectVariant(event, ${product.id}, ${idx})"
                    title="${v.label}"
                    style="background: ${v.color};"
                    aria-label="${v.label}">
                </button>
            ` : `
                <button class="variant-thumb ${idx === 0 ? 'active' : ''}"
                    onclick="selectVariant(event, ${product.id}, ${idx})"
                    title="${v.label}">
                    <img src="${v.image}" alt="${v.label}" loading="lazy">
                </button>
            `).join('')}
            </div>
        </div>
    ` : '';

    const shadeSwatch = hasShades ? `
        <div class="shade-selector" id="shades-${product.id}">
            <div class="shade-label">
                <span>Shade: </span>
                <span class="selected-shade-name" id="shade-name-${product.id}">${defaultShade}</span>
            </div>
            <div class="shade-swatches">
                ${product.shades.map((shade, idx) => `
                    <button
                        class="shade-swatch ${idx === 0 ? 'active' : ''}"
                        style="background:${shade.color};"
                        title="${shade.name}"
                        onclick="selectShade(event, ${product.id}, '${shade.name}')"
                        aria-label="${shade.name}"
                    ></button>
                `).join('')}
            </div>
        </div>
    ` : '';

    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}" data-price="${product.price}" data-rating="${product.rating}" data-selected-shade="${defaultShade || ''}" data-selected-variant="0">
            ${renderProductBadges(product)}
            <div class="product-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlistItem(${product.id})">
                <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
            </div>
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="${imgLoading}" id="card-img-${product.id}">
                <div class="product-actions">
                    <button class="action-btn" onclick="openQuickView(${product.id})" title="Quick View"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" onclick="addToCartWithShade(${product.id})" title="Add to Cart"><i class="fas fa-shopping-bag"></i></button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 id="card-name-${product.id}">${product.name}</h3>
                <div class="product-rating">
                    <div class="stars">${generateStars(product.rating)}</div>
                    <span class="rating-count">(${formatNumber(product.reviews)})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">PKR ${product.price}</span>
                    ${product.oldPrice ? `<span class="old-price">PKR ${product.oldPrice}</span>` : ''}
                    ${discount ? `<span class="discount">-${discount}%</span>` : ''}
                </div>
                ${variantThumbs}
                ${shadeSwatch}
                <button class="add-to-cart" onclick="addToCartWithShade(${product.id})">
                    <i class="fas fa-shopping-bag"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// VARIANT SELECTOR (Daraz-style)
// ==========================================
function selectVariant(event, productId, variantIdx) {
    event.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return;
    const variant = product.variants[variantIdx];
    if (!variant) return;

    // Update main card image
    const cardImg = document.getElementById(`card-img-${productId}`);
    if (cardImg) {
        cardImg.style.opacity = '0';
        setTimeout(() => {
            cardImg.src = variant.image;
            cardImg.style.opacity = '1';
        }, 150);
    }

    // Update variant thumb active state (works for both image thumbs and color swatches)
    const thumbsContainer = document.getElementById(`variant-thumbs-${productId}`);
    if (thumbsContainer) {
        thumbsContainer.querySelectorAll('.variant-thumb, .variant-color-swatch').forEach((btn, i) => {
            btn.classList.toggle('active', i === variantIdx);
        });
        // Update shade name label if present
        const nameEl = thumbsContainer.querySelector(`#variant-name-${productId}`);
        if (nameEl) nameEl.textContent = variant.label;
    }

    // Store selected variant
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        card.setAttribute('data-selected-variant', variantIdx);
        card.setAttribute('data-selected-shade', variant.name);
    }
}

// ==========================================
// SHADE SELECTOR FUNCTIONS
// ==========================================
function selectShade(event, productId, shadeName) {
    event.stopPropagation();
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (!card) return;

    // Update selected shade on card
    card.setAttribute('data-selected-shade', shadeName);

    // Update shade name label
    const nameEl = document.getElementById(`shade-name-${productId}`);
    if (nameEl) nameEl.textContent = shadeName;

    // Update active swatch
    const swatches = card.querySelectorAll('.shade-swatch');
    swatches.forEach(sw => {
        sw.classList.toggle('active', sw.getAttribute('title') === shadeName);
    });
    // Card image stays unchanged — shade image only shows inside Quick View
}

function addToCartWithShade(productId) {
    const giftBoxData = { id: 999, name: 'Luxury Gift Box', price: 6000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz0ro6wBxs0K7Dg1FzWHgbAlznuAhIHTaCqg&s' };
    const product = products.find(p => p.id === productId) || (productId === 999 ? giftBoxData : null);
    if (!product) return;

    // Get selected shade/variant from card
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    const selectedShade = card ? card.getAttribute('data-selected-shade') : '';
    const hasShades = product.shades && product.shades.length > 0;
    const hasVariants = product.variants && product.variants.length > 0;

    // Use variant name OR shade name for cart key
    const variantLabel = hasVariants ? selectedShade : null;
    const shadeLabel = hasShades ? selectedShade : null;
    const label = variantLabel || shadeLabel;

    // Get correct image for variant products
    let cartImage = product.image;
    if (hasVariants && card) {
        const variantIdx = parseInt(card.getAttribute('data-selected-variant') || '0');
        const variant = product.variants[variantIdx];
        if (variant) cartImage = variant.image;
    }

    const cartKey = label ? `${productId}_${label}` : `${productId}`;
    const existing = cart.find(i => i.cartKey === cartKey);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            cartKey,
            name: product.name,
            shade: label || null,
            price: product.price,
            image: cartImage,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();

    // Button animation
    if (card) {
        const btn = card.querySelector('.add-to-cart');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = originalHTML; }, 1000);
        }
    }

    const shadePart = label ? ` — ${label}` : '';
    showToast('success', 'Added to Cart', `${product.name}${shadePart} added to cart!`, 1500);

    // Ask notification permission ONCE — only after customer shows intent (added to cart)
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(function() {
            requestNotificationPermission();
        }, 2000);
    }
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) stars += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function formatNumber(num) {
    return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;
}

// ==========================================
// SALE
// ==========================================
function showSaleProducts(silent) {
    const saleProducts = products.filter(p => p.oldPrice !== null && p.oldPrice > p.price);
    const allProductsSection = document.getElementById('products');
    const saleSection = document.getElementById('sale-section');
    const saleContainer = document.getElementById('sale-products-grid');
    if (!saleSection || !saleContainer) return;
    if (allProductsSection) allProductsSection.style.display = 'none';
    saleSection.style.display = 'block';
    saleSection.classList.add('active');
    saleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    saleContainer.innerHTML = saleProducts.length === 0
        ? `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;"><i class="fas fa-tags" style="font-size:64px;color:#e74c3c;margin-bottom:20px;display:block;"></i><h3>No Sale Products</h3><button class="btn-primary" onclick="showAllProducts()">View All</button></div>`
        : saleProducts.map(p => createProductCard(p)).join('');
    if (!silent) showToast('success', 'Sale Products', `${saleProducts.length} products with amazing discounts!`);
    closeMobileMenu();
    saveViewState({ type: 'sale' });
}

function showAllProducts() {
    const allProductsSection = document.getElementById('products');
    const saleSection = document.getElementById('sale-section');
    if (saleSection) { saleSection.style.display = 'none'; saleSection.classList.remove('active'); }
    if (allProductsSection) { allProductsSection.style.display = 'block'; allProductsSection.scrollIntoView({ behavior: 'smooth' }); }
    loadAllProducts();
    clearViewState();
}

// ==========================================
// CART
// ==========================================
function addToCart(productId) {
    // Gift Box (id 999) is not in products array — use its fixed data
    const giftBoxData = { id: 999, name: 'Luxury Gift Box', price: 6000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz0ro6wBxs0K7Dg1FzWHgbAlznuAhIHTaCqg&s' };
    const product = products.find(p => p.id === productId) || (productId === 999 ? giftBoxData : null);
    if (!product) return;
    const existing = cart.find(i => i.id === productId && !i.shade);
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, cartKey: String(product.id), name: product.name, price: product.price, image: product.image, quantity: 1 });
    saveCart(); updateCartUI();

    // Show beautiful added state on button
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const btn = card.querySelector('.add-to-cart');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i> Added!';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = originalHTML;
            }, 1000);
        }
    }

    showToast('success', 'Added to Cart', `${product.name} has been added to your cart!`, 1500);

    // Ask notification permission ONCE — only after customer shows intent (added to cart)
    // This is much better UX than asking on page load.
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(function() {
            requestNotificationPermission();
        }, 2000); // Small delay so toast is visible first
    }
}

// ==========================================
// SHADE HELPER FUNCTIONS
// ==========================================
function getShadeColor(productId, shadeName) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.shades) return '#ccc';
    const shade = product.shades.find(s => s.name === shadeName);
    return shade ? shade.color : '#ccc';
}

function removeFromCartByKey(cartKey) {
    cart = cart.filter(i => (i.cartKey || i.id) != cartKey);
    saveCart(); updateCartUI();
    showToast('success', 'Removed', 'Item removed from cart.', 1500);
}

function updateQuantityByKey(cartKey, change) {
    const item = cart.find(i => (i.cartKey || i.id) == cartKey);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) { removeFromCartByKey(cartKey); return; }
    saveCart(); updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart(); updateCartUI();
    showToast('success', 'Removed', 'Item removed from cart.', 1500);
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) { removeFromCart(productId); return; }
    saveCart(); updateCartUI();
}

function saveCart() { localStorage.setItem('aurevynCart', JSON.stringify(cart)); }

function updateCartUI() {
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    const cartItemCountEl = document.getElementById('cart-item-count');
    if (cartCountEl) cartCountEl.textContent = totalItems;
    if (cartItemCountEl) cartItemCountEl.textContent = totalItems;

    const container = document.getElementById('cart-items-container');
    if (container) {
        if (cart.length === 0) {
            container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p><a href="#products" onclick="toggleCart()">Start Shopping</a></div>`;
        } else {
            container.innerHTML = cart.map(item => {
                const shadeColor = item.shade ? getShadeColor(item.id, item.shade) : null;
                const key = item.cartKey || item.id;
                return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        ${item.shade ? `<div class="cart-item-shade"><span class="cart-shade-dot" style="background:${shadeColor};"></span>${item.shade}</div>` : ''}
                        <div class="cart-item-price">PKR ${item.price}</div>
                        <div class="quantity-control">
                            <button onclick="updateQuantityByKey('${key}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantityByKey('${key}', 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCartByKey('${key}')"><i class="fas fa-times"></i></button>
                </div>
            `}).join('');
        }
    }

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    if (cartSubtotalEl) cartSubtotalEl.textContent = 'PKR ' + subtotal.toLocaleString();

    // Update shipping fee in cart
    const shippingFeeEl = document.getElementById('cart-shipping-fee');
    if (shippingFeeEl) {
        if (cart.length === 0) {
            shippingFeeEl.textContent = '-';
        } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
            shippingFeeEl.innerHTML = '<span class="free-text">FREE</span>';
        } else {
            shippingFeeEl.textContent = '320';
        }
    }
}

function toggleCart() {
    const cartSidebarEl = document.getElementById('cart-sidebar');
    const overlayEl = document.getElementById('overlay');

    if (!cartSidebarEl) return;

    const isOpening = !cartSidebarEl.classList.contains('active');
    const chatWidget = document.querySelector('.live-chat-widget');
    const darkModeFloat = document.getElementById('dark-mode-float');
    const goToTop = document.querySelector('.go-to-top');

    if (isOpening) {
        // Opening cart
        cartSidebarEl.style.zIndex = '1012';
        if (overlayEl) {
            overlayEl.style.zIndex = '1011';
            overlayEl.style.backdropFilter = 'none';
            overlayEl.style.webkitBackdropFilter = 'none';
            overlayEl.classList.add('active');
            overlayEl.onclick = function() { toggleCart(); };
        }
        cartSidebarEl.classList.add('active');
        document.body.classList.add('cart-open');
        const cartScrollY = window.scrollY;
        document.body.dataset.cartScrollY = cartScrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${cartScrollY}px`;
        document.body.style.width = '100%';

        // Hide floating widgets so they don't show over cart
        if (chatWidget) chatWidget.style.visibility = 'hidden';
        if (darkModeFloat) darkModeFloat.style.visibility = 'hidden';
        if (goToTop) {
            goToTop.style.visibility = 'hidden';
            goToTop.classList.remove('visible');
        }
        updateFloatingButtons();
    } else {
        // Closing cart
        cartSidebarEl.classList.remove('active');
        if (overlayEl) {
            overlayEl.classList.remove('active');
            overlayEl.onclick = function() { closeAll(); };
        }
        document.body.classList.remove('cart-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        // Restore scroll position
        const savedCartScrollY = document.body.dataset.cartScrollY;
        if (savedCartScrollY) {
            window.scrollTo({ top: parseInt(savedCartScrollY), left: 0, behavior: 'instant' });
            delete document.body.dataset.cartScrollY;
        }

        // Show floating widgets again
        if (chatWidget) chatWidget.style.visibility = '';
        if (darkModeFloat) darkModeFloat.style.visibility = '';
        // Only show go-to-top if scroll position warrants it
        if (goToTop) {
            goToTop.style.visibility = '';
            // Remove visible class — scroll event will re-add it when user scrolls again
            goToTop.classList.remove('visible');
        }
        updateFloatingButtons();
    }
}

// ==========================================
// WISHLIST
// ==========================================
function toggleWishlistItem(productId) {
    const index = wishlist.indexOf(productId);
    const product = products.find(p => p.id === productId);
    if (index > -1) { wishlist.splice(index, 1); showToast('success', 'Removed', `${product?.name} removed from wishlist.`, 1500); }
    else { wishlist.push(productId); showToast('success', 'Added', `${product?.name} added to wishlist!`); }
    saveWishlist(); updateWishlistUI();
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const btn = card.querySelector('.product-wishlist');
        const isActive = wishlist.includes(productId);
        btn.classList.toggle('active', isActive);
        btn.innerHTML = `<i class="${isActive ? 'fas' : 'far'} fa-heart"></i>`;
    }
}

function toggleWishlist() {
    if (wishlist.length === 0) { showToast('info', 'Empty Wishlist', 'Your wishlist is empty. Start adding products!'); return; }
    const wishlistProducts = products.filter(p => wishlist.includes(p.id));
    const container = document.getElementById('all-products-grid');
    if (container) {
        container.innerHTML = wishlistProducts.map(p => createProductCard(p)).join('');
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function saveWishlist() { localStorage.setItem('aurevynWishlist', JSON.stringify(wishlist)); }
function updateWishlistUI() {
    const el = document.getElementById('wishlist-count');
    if (el) el.textContent = wishlist.length;
}

// ==========================================
// HERO SLIDER
// ==========================================
function startSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    function showSlide(index) {
        slides.forEach((s, i) => { s.classList.toggle('active', i === index); if (dots[i]) dots[i].classList.toggle('active', i === index); });
        currentSlide = index;
    }
    window.changeSlide = function (dir) {
        let n = currentSlide + dir;
        if (n >= slides.length) n = 0;
        if (n < 0) n = slides.length - 1;
        showSlide(n);
    };
    window.currentSlide = function (index) { showSlide(index - 1); };
    slideInterval = setInterval(() => changeSlide(1), 5000);
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
        slider.addEventListener('mouseleave', () => { slideInterval = setInterval(() => changeSlide(1), 5000); });
    }
}

// ==========================================
// QUICK VIEW
// ==========================================
function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const qvb = document.getElementById('quick-view-body');
    if (qvb) {
        const hasVariants = product.variants && product.variants.length > 0;
        // For variant products, start with first variant's shades
        const activeVariant = hasVariants ? product.variants[0] : null;
        const activeShades = activeVariant ? activeVariant.shades : product.shades;
        const qvHasShades = activeShades && activeShades.length > 0;
        const qvDefaultShade = qvHasShades ? activeShades[0].name : null;
        // If first shade has its own image, use it as opening image in Quick View
        const firstShadeImage = qvHasShades && activeShades[0].image ? activeShades[0].image : null;
        const activeImage = firstShadeImage || (activeVariant ? activeVariant.image : product.image);

        // Variant gallery — color circles if variant has color, else image thumbs
        const hasColorVariants = hasVariants && product.variants[0].color;
        const variantGallery = hasVariants ? `
            <div class="qv-variant-gallery ${hasColorVariants ? 'qv-color-variant-gallery' : ''}">
                ${hasColorVariants ? `<div class="variant-color-label" style="width:100%;margin-bottom:6px;">Shade: <span class="selected-variant-name" id="qv-variant-name-${product.id}">${product.variants[0].label}</span></div>` : ''}
                <div class="variant-swatches-row">
                ${product.variants.map((v, idx) => hasColorVariants ? `
                    <button class="variant-color-swatch qv-color-swatch ${idx === 0 ? 'active' : ''}"
                        onclick="selectQVVariant(event, ${product.id}, ${idx})"
                        title="${v.label}"
                        style="background: ${v.color}; width:34px; height:34px;"
                        aria-label="${v.label}">
                    </button>
                ` : `
                    <button class="qv-variant-thumb ${idx === 0 ? 'active' : ''}"
                        onclick="selectQVVariant(event, ${product.id}, ${idx})"
                        title="${v.label}">
                        <img src="${v.image}" alt="${v.label}">
                        <span>${v.name}</span>
                    </button>
                `).join('')}
                </div>
            </div>
        ` : '';

        const qvShadeHtml = qvHasShades ? `
            <div class="shade-selector qv-shade-selector" id="qv-shades-${product.id}">
                <div class="shade-label">
                    <span>Select Shade: </span>
                    <span class="selected-shade-name" id="qv-shade-name-${product.id}">${qvDefaultShade}</span>
                </div>
                <div class="shade-swatches" id="qv-shade-swatches-${product.id}">
                    ${activeShades.map((shade, idx) => `
                        <button class="shade-swatch ${idx === 0 ? 'active' : ''}" style="background:${shade.color};" title="${shade.name}"
                            onclick="selectQuickViewShade(event, ${product.id}, '${shade.name}')" aria-label="${shade.name}"></button>
                    `).join('')}
                </div>
            </div>
        ` : '';

        qvb.innerHTML = `
            <div class="quick-view-image" onclick="openImageLightbox(document.getElementById('qv-main-img-${product.id}').src, '${product.name}')" title="Click to zoom" style="cursor:zoom-in;">
                <img src="${activeImage}" alt="${product.name}" id="qv-main-img-${product.id}">
                <span class="qv-zoom-hint"><i class="fas fa-search-plus"></i></span>
            </div>
            <div class="quick-view-details">
                <h2 id="qv-title-${product.id}">${product.name}</h2>
                <div class="stars">${generateStars(product.rating)}</div>
                <div class="price">PKR ${product.price}${product.oldPrice ? ` <span style="text-decoration:line-through;color:#999;font-size:18px;">PKR ${product.oldPrice}</span>` : ''}</div>
                <p class="description">${product.description}</p>
                ${variantGallery}
                ${qvShadeHtml}
                <button class="btn-primary" onclick="addToCartFromQuickView(${product.id});closeQuickView();" style="width:100%;">
                    <i class="fas fa-shopping-bag"></i> Add to Cart
                </button>
            </div>`;

        qvb.setAttribute('data-product-id', productId);
        qvb.setAttribute('data-qv-variant', '0');
        qvb.setAttribute('data-qv-shade', qvDefaultShade || '');
    }
    const qvm = document.getElementById('quick-view-modal');
    if (qvm) { qvm.classList.add('active'); qvm.scrollTop = 0; const c = qvm.querySelector('.quick-view-content'); if(c) c.scrollTop = 0; }
    const qvScrollY = window.scrollY;
    document.body.dataset.qvScrollY = qvScrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${qvScrollY}px`;
    document.body.style.width = '100%';
    updateFloatingButtons();
    saveQuickViewState(productId);
}

function selectQVVariant(event, productId, variantIdx) {
    event.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return;
    const variant = product.variants[variantIdx];
    if (!variant) return;

    // Update main QV image with fade
    const mainImg = document.getElementById(`qv-main-img-${productId}`);
    if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => { mainImg.src = variant.image; mainImg.style.opacity = '1'; }, 150);
    }

    // Update active thumb (works for both image thumbs and color swatches)
    const qvb = document.getElementById('quick-view-body');
    if (qvb) {
        qvb.querySelectorAll('.qv-variant-thumb, .qv-color-swatch').forEach((btn, i) => {
            btn.classList.toggle('active', i === variantIdx);
        });
        // Update shade name label if present
        const nameEl = qvb.querySelector(`#qv-variant-name-${productId}`);
        if (nameEl) nameEl.textContent = variant.label;
        qvb.setAttribute('data-qv-variant', variantIdx);
        qvb.setAttribute('data-qv-shade', variant.name);
    }
}

function closeQuickView() {
    const qvm = document.getElementById('quick-view-modal');
    if (qvm) qvm.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    // Restore scroll position
    const savedQvScrollY = document.body.dataset.qvScrollY;
    if (savedQvScrollY) {
        window.scrollTo({ top: parseInt(savedQvScrollY), left: 0, behavior: 'instant' });
        delete document.body.dataset.qvScrollY;
    }
    updateFloatingButtons();
    clearQuickViewState();
}

function selectQuickViewShade(event, productId, shadeName) {
    event.stopPropagation();
    const nameEl = document.getElementById(`qv-shade-name-${productId}`);
    if (nameEl) nameEl.textContent = shadeName;
    const container = document.getElementById(`qv-shades-${productId}`);
    if (container) {
        container.querySelectorAll('.shade-swatch').forEach(sw => {
            sw.classList.toggle('active', sw.getAttribute('title') === shadeName);
        });
    }
    // Store on modal for cart add
    const qvb = document.getElementById('quick-view-body');
    if (qvb) qvb.setAttribute('data-qv-shade', shadeName);

    // Update QV main image if shade has its own image
    const product = products.find(p => p.id === productId);
    if (product && product.shades) {
        const shade = product.shades.find(s => s.name === shadeName);
        if (shade && shade.image) {
            const qvImg = document.getElementById(`qv-main-img-${productId}`);
            if (qvImg) {
                qvImg.style.opacity = '0';
                qvImg.style.transition = 'opacity 0.2s ease';
                setTimeout(() => {
                    qvImg.src = shade.image;
                    qvImg.style.opacity = '1';
                }, 180);
            }
        }
    }
}

function addToCartFromQuickView(productId) {
    const qvb = document.getElementById('quick-view-body');
    const selectedShade = qvb ? qvb.getAttribute('data-qv-shade') : null;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const hasShades = product.shades && product.shades.length > 0;
    const shade = hasShades ? (selectedShade || (product.shades[0] && product.shades[0].name)) : null;
    const cartKey = shade ? `${productId}_${shade}` : `${productId}`;
    const existing = cart.find(i => i.cartKey === cartKey);
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, cartKey, name: product.name, shade, price: product.price, image: product.image, quantity: 1 });
    saveCart(); updateCartUI();
    const shadePart = shade ? ` — ${shade}` : '';
    showToast('success', 'Added to Cart', `${product.name}${shadePart} added to cart!`, 1500);
}

// ==========================================
// IMAGE LIGHTBOX (ZOOM ON CLICK)
// ==========================================
function openImageLightbox(src, alt) {
    // Remove existing lightbox if any
    const existing = document.getElementById('img-lightbox-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'img-lightbox-overlay';
    overlay.innerHTML = `
        <div id="img-lightbox-inner">
            <button id="img-lightbox-close" onclick="closeImageLightbox()" aria-label="Close">&#10005;</button>
            <img src="${src}" alt="${alt || ''}" id="img-lightbox-img" draggable="false">
        </div>
    `;
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeImageLightbox();
    });
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Keyboard close
    overlay._keyHandler = function(e) { if (e.key === 'Escape') closeImageLightbox(); };
    document.addEventListener('keydown', overlay._keyHandler);
}

function closeImageLightbox() {
    const overlay = document.getElementById('img-lightbox-overlay');
    if (!overlay) return;
    document.removeEventListener('keydown', overlay._keyHandler);
    overlay.classList.remove('active');
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 280);
}

// ==========================================
// FILTERS & SEARCH
// ==========================================
function filterCategory(category) {
    const filtered = products.filter(p => p.category === category);
    const container = document.getElementById('all-products-grid');
    if (container) { container.innerHTML = filtered.map(p => createProductCard(p)).join(''); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); updateShowingCount(filtered.length); }
    saveViewState({ type: 'category', category: category });
}

function applyFilters() {
    const checked = Array.from(document.querySelectorAll('.filter-list input[type="checkbox"]:checked')).map(cb => cb.value);
    const filtered = checked.length > 0 ? products.filter(p => checked.includes(p.category)) : products;
    const container = document.getElementById('all-products-grid');
    if (container) { container.innerHTML = filtered.map(p => createProductCard(p)).join(''); updateShowingCount(filtered.length); }
}

function filterByRating(minRating) {
    const filtered = products.filter(p => p.rating >= minRating);
    const container = document.getElementById('all-products-grid');
    if (container) { container.innerHTML = filtered.map(p => createProductCard(p)).join(''); updateShowingCount(filtered.length); }
}

function updatePriceLabel(value) {
    const el = document.getElementById('price-value');
    if (el) el.textContent = value;
    const filtered = products.filter(p => p.price <= value);
    const container = document.getElementById('all-products-grid');
    if (container) { container.innerHTML = filtered.map(p => createProductCard(p)).join(''); updateShowingCount(filtered.length); }
}

function sortProducts(sortType) {
    let sorted = [...products];
    if (sortType === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (sortType === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else if (sortType === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (sortType === 'newest') sorted.reverse();
    const container = document.getElementById('all-products-grid');
    if (container) container.innerHTML = sorted.map(p => createProductCard(p)).join('');
}

function globalSearch(query) {
    // Get query from parameter or from either search input
    let q = query;
    if (!q) {
        const desktopInput = document.getElementById('global-search-desktop');
        const mobileInput = document.getElementById('global-search-mobile');
        q = (desktopInput?.value || mobileInput?.value || '').toLowerCase().trim();
    } else {
        q = q.toLowerCase().trim();
    }

    const container = document.getElementById('all-products-grid');
    if (!container) return;

    // Show/hide other sections based on search
    toggleSectionsForSearch(q.length > 0);

    if (q.length === 0) {
        // Show all products when search is empty
        container.innerHTML = products.map(p => createProductCard(p)).join('');
        updateShowingCount(products.length);
        // Update clear button visibility
        updateClearSearchButtons();
        clearViewState();
        return;
    }

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
    container.innerHTML = filtered.map(p => createProductCard(p)).join(''); 
    updateShowingCount(filtered.length);

    // Scroll to products section
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update clear button visibility
    updateClearSearchButtons();
    saveViewState({ type: 'search', search: q });

    // Toast notifications removed - user requested no popups during search
}

// Toggle sections visibility during search
function toggleSectionsForSearch(isSearching) {
    const sectionsToHide = [
        '#home',                    // Hero slider
        '#categories',              // Categories
        '#new-arrivals',            // New Arrivals
        '#best-sellers',            // Best Sellers
        '#sale-section',            // Sale section
        '.testimonials-section',    // Testimonials
        '.social-feed-section',     // Social media
        '#contact',                 // Contact
        '.features-banner'          // Features banner
    ];

    sectionsToHide.forEach(selector => {
        const section = document.querySelector(selector);
        if (section) {
            if (isSearching) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
                // Restore original display for specific sections
                if (selector === '#sale-section') {
                    section.style.display = 'none'; // Sale is hidden by default
                }
            }
        }
    });

    // Always show products section when searching
    const productsSection = document.getElementById('products');
    if (productsSection && isSearching) {
        productsSection.style.display = 'block';
        // Hide sidebar filters during search for cleaner view
        const sidebar = document.getElementById('shop-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        // Expand products grid to full width
        const shopMain = document.querySelector('.shop-main');
        if (shopMain) {
            shopMain.style.gridColumn = '1 / -1';
        }
        // Hide shop toolbar during search
        const toolbar = document.querySelector('.shop-toolbar');
        if (toolbar) toolbar.style.display = 'none';
    } else if (productsSection && !isSearching) {
        // Restore original layout
        const sidebar = document.getElementById('shop-sidebar');
        if (sidebar) sidebar.style.display = '';
        const shopMain = document.querySelector('.shop-main');
        if (shopMain) shopMain.style.gridColumn = '';
        const toolbar = document.querySelector('.shop-toolbar');
        if (toolbar) toolbar.style.display = '';
    }
}

// Update clear search buttons visibility
function updateClearSearchButtons() {
    const desktopInput = document.getElementById('global-search-desktop');
    const mobileInput = document.getElementById('global-search-mobile');

    // Desktop clear button
    const desktopClear = document.getElementById('clear-search-desktop');
    if (desktopClear) {
        desktopClear.style.display = (desktopInput?.value?.length > 0) ? 'flex' : 'none';
    }

    // Mobile clear button
    const mobileClear = document.getElementById('clear-search-mobile');
    if (mobileClear) {
        mobileClear.style.display = (mobileInput?.value?.length > 0) ? 'flex' : 'none';
    }
}

// Clear search and restore all sections
function clearSearch() {
    const desktopInput = document.getElementById('global-search-desktop');
    const mobileInput = document.getElementById('global-search-mobile');

    if (desktopInput) desktopInput.value = '';
    if (mobileInput) mobileInput.value = '';

    // Hide clear buttons
    const desktopClear = document.getElementById('clear-search-desktop');
    const mobileClear = document.getElementById('clear-search-mobile');
    if (desktopClear) desktopClear.style.display = 'none';
    if (mobileClear) mobileClear.style.display = 'none';

    // Restore all sections
    toggleSectionsForSearch(false);

    // Show all products
    const container = document.getElementById('all-products-grid');
    if (container) {
        container.innerHTML = products.map(p => createProductCard(p)).join('');
        updateShowingCount(products.length);
    }

    // Close mobile search dropdown
    const mobileSearchBox = document.getElementById('mobile-search-box');
    if (mobileSearchBox) mobileSearchBox.classList.remove('active');

    clearViewState();

    // Toast removed - user requested no popups
}

function updateShowingCount(count = products.length) {
    const showingEl = document.getElementById('showing-count');
    const totalEl = document.getElementById('total-count');
    if (showingEl) showingEl.textContent = count;
    if (totalEl) totalEl.textContent = products.length;
}

// ==========================================
// TOAST
// ==========================================
function showToast(type, title, message, duration) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i><div class="toast-content"><h4>${title}</h4><p>${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'toastSlide 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, duration || 1500);
}

// ==========================================
// MOBILE MENU
// ==========================================
function toggleMobileMenu() {
    const mm = document.getElementById('mobile-menu');
    const ov = document.getElementById('overlay');
    if (!mm) return;

    const isOpening = !mm.classList.contains('active');

    if (isOpening) {
        // Save current scroll position before locking
        const scrollY = window.scrollY || window.pageYOffset;
        document.body.dataset.menuScrollY = scrollY;
        // Opening menu - lock background scroll (mobile-safe method)
        mm.classList.add('active');
        if (ov) ov.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        // Force z-index fix
        mm.style.zIndex = '1010';
        if (ov) ov.style.zIndex = '1005';
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    const mm = document.getElementById('mobile-menu');
    const ov = document.getElementById('overlay');
    if (mm) mm.classList.remove('active');
    if (ov) ov.classList.remove('active');
    // Restore scroll position
    const savedScrollY = document.body.dataset.menuScrollY;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.height = '';
    if (savedScrollY !== undefined) {
        window.scrollTo({ top: parseInt(savedScrollY, 10), left: 0, behavior: 'instant' });
        delete document.body.dataset.menuScrollY;
    }
}

function toggleMobileFilters() {
    const sidebar = document.getElementById('shop-sidebar');
    const ov = document.getElementById('overlay');
    if (sidebar) { sidebar.classList.toggle('mobile-active'); if (ov) ov.classList.toggle('active'); document.body.style.overflow = sidebar.classList.contains('mobile-active') ? 'hidden' : ''; }
}

function closeAll() {
    ['cart-sidebar', 'quick-view-modal', 'checkout-modal', 'mobile-menu', 
     'customer-service-modal', 'return-modal', 'policy-modal', 'gift-box-modal', 
     'order-success-modal'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.classList.remove('active');
    });
    const searchBox = document.getElementById('mobile-search-box');
    const searchIcon = document.querySelector('.search-icon-mobile');
    if (searchBox) searchBox.classList.remove('active');
    if (searchIcon) searchIcon.classList.remove('active');
    const ov = document.getElementById('overlay'); 
    if (ov) ov.classList.remove('active');
    const sb = document.getElementById('shop-sidebar'); 
    if (sb) sb.classList.remove('mobile-active');
    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    clearQuickViewState();
    document.body.style.top = '';
    // Restore scroll position from any saved state
    const savedScroll = document.body.dataset.cartScrollY || document.body.dataset.qvScrollY || document.body.dataset.scrollY || document.body.dataset.menuScrollY;
    if (savedScroll) {
        window.scrollTo({ top: parseInt(savedScroll), left: 0, behavior: 'instant' });
        delete document.body.dataset.cartScrollY;
        delete document.body.dataset.qvScrollY;
        delete document.body.dataset.scrollY;
        delete document.body.dataset.menuScrollY;
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 992) { closeMobileMenu(); const sb = document.getElementById('shop-sidebar'); if (sb) sb.classList.remove('mobile-active'); } });
}

function addMobileFilterButton() {
    const shopMain = document.querySelector('.shop-main');
    if (shopMain && window.innerWidth <= 992 && !document.querySelector('.filter-toggle-btn')) {
        const btn = document.createElement('button');
        btn.className = 'filter-toggle-btn';
        btn.innerHTML = '<i class="fas fa-filter"></i> Filters';
        btn.onclick = toggleMobileFilters;
        shopMain.insertBefore(btn, shopMain.firstChild);
    }
}

function setupMobileMenu() {
    document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', closeMobileMenu));
}

// ==========================================
// CONTACT & NEWSLETTER
// ==========================================
function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]')?.value;
    const email = form.querySelector('input[type="email"]')?.value;
    const subject = form.querySelectorAll('input[type="text"]')[1]?.value || 'Contact';
    const message = form.querySelector('textarea')?.value;
    let msg = `📩 *Contact - Aurevyn*%0AName: ${name}%0AEmail: ${email}%0ASubject: ${subject}%0AMessage: ${message}`;
    window.open(`https://wa.me/923258666803?text=${msg}`, '_blank');
    showToast('success', 'Sent!', 'Thank you for contacting us! We will get back to you soon.');
    form.reset();
}

function subscribeNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]')?.value;
    if (email) { showToast('success', 'Subscribed!', 'Thank you for subscribing to our newsletter.'); e.target.reset(); }
}

// ==========================================
// CUSTOMER SERVICE
// ==========================================
function openCustomerService() {
    const modal = document.getElementById('customer-service-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeCustomerService() {
    const modal = document.getElementById('customer-service-modal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function openWhatsAppChat(type) {
    const messages = { order: 'Hello! I have a question about my order.', product: 'Hello! I need help choosing a product.', complaint: 'Hello! I want to file a complaint about my order.', feedback: 'Hello! I want to share my feedback.', other: 'Hello! I have a question.' };
    const message = messages[type] || messages.other;
    whatsappWindow = window.open(`https://wa.me/923258666803?text=${encodeURIComponent(message)}`, '_blank');
    closeCustomerService();
}

// ==========================================
// RETURN MODAL
// ==========================================
function openReturnModal() {
    const modal = document.getElementById('return-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    updateFloatingButtons();
}

function closeReturnModal() {
    const modal = document.getElementById('return-modal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    updateFloatingButtons();
}

function previewReturnVideo(input) {
    const preview = document.getElementById('video-preview');
    const placeholder = document.getElementById('video-placeholder');
    const previewVideo = document.getElementById('preview-video');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 50 * 1024 * 1024) { showToast('error', 'File Too Large', 'Max 50MB'); input.value = ''; return; }
        if (!file.type.startsWith('video/')) { showToast('error', 'Invalid File', 'Please upload a valid video file'); input.value = ''; return; }
        if (previewVideo) previewVideo.src = URL.createObjectURL(file);
        if (preview) preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        showToast('success', 'Video Uploaded', 'Unboxing video attached!');
    }
}

function removeReturnVideo() {
    const input = document.getElementById('return-video');
    const preview = document.getElementById('video-preview');
    const placeholder = document.getElementById('video-placeholder');
    const pv = document.getElementById('preview-video');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (pv) { pv.src = ''; pv.load(); }
}

function handleReturnSubmit(e) {
    e.preventDefault();
    const orderId = document.getElementById('return-order-id')?.value;
    const name = document.getElementById('return-name')?.value;
    const phone = document.getElementById('return-phone')?.value;
    const product = document.getElementById('return-product')?.value;
    const price = document.getElementById('return-price')?.value;
    const reason = document.querySelector('input[name="return-reason"]:checked')?.value;
    const description = document.getElementById('return-description')?.value;
    const videoInput = document.getElementById('return-video');
    if (!videoInput?.files?.length) { showToast('error', 'Video Required', 'Please upload your unboxing video'); return; }
    let msg = `🔄 *RETURN REQUEST - Aurevyn*%0A%0AOrder ID: ${orderId}%0AName: ${name}%0APhone: ${phone}%0AProduct: ${product}%0APrice: PKR ${price}%0AReason: ${reason}%0ADescription: ${description}%0A%0A📹 VIDEO: Unboxing video attached%0ADate: ${new Date().toLocaleString()}`;
    window.open(`https://wa.me/923258666803?text=${msg}`, '_blank');
    showToast('success', 'Return Submitted', 'Please send the video via WhatsApp. Our team will review within 24-48 hours.');
    closeReturnModal();
    e.target.reset();
    removeReturnVideo();
}

function showReturnPolicy() {
    const modal = document.getElementById('policy-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeReturnPolicy() {
    const modal = document.getElementById('policy-modal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function showSizeGuide() {
    showToast('info', 'Size Guide', 'Our products are standard sizes. Contact us for specific sizing questions!');
}

// ==========================================
// GIFT BOX
// ==========================================
function openGiftBoxModal() {
    const modal = document.getElementById('gift-box-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeGiftBoxModal() {
    const modal = document.getElementById('gift-box-modal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

// ==========================================
// SCROLL TO TOP
// ==========================================
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ==========================================
// DARK MODE TOGGLE - HIDE ON SCROLL
// ==========================================
(function() {
    let scrollTimer = null;

    window.addEventListener('scroll', function() {
        const btn = document.getElementById('goToTop');
        const dmFloat = document.getElementById('dark-mode-float');

        // Hide go-to-top WHILE scrolling
        if (btn && window.pageYOffset > 300) {
            btn.classList.remove('visible');
        }

        // Hide dark mode float while scrolling
        if (dmFloat) dmFloat.classList.add('scroll-hidden');

        // Clear previous timer
        if (scrollTimer) clearTimeout(scrollTimer);

        // When scrolling STOPS (after 600ms) - show button
        scrollTimer = setTimeout(function() {
            if (btn) {
                btn.classList.toggle('visible', window.pageYOffset > 300);
            }
            if (dmFloat) dmFloat.classList.remove('scroll-hidden');
        }, 600);

    }, { passive: true });
})();

function confirmOrderWhatsApp() {
    const orderId = document.getElementById('success-order-id')?.textContent || 'N/A';

    // Check if expired
    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || '{}');
    if (pending && pending.expiryTime && Date.now() > pending.expiryTime) {
        showToast('error', 'Order Expired', '30 minutes have passed. Please place a new order.');
        return;
    }

    const msg = encodeURIComponent(
        `✅ *ORDER CONFIRMED*\n\n` +
        `Order ID: ${orderId}\n` +
        `Status: Confirmed ✔️\n` +
        `Confirmed at: ${new Date().toLocaleString('en-PK')}\n\n` +
        `I confirm my order. Please process it. 🙏`
    );
    window.open(`https://wa.me/923258666803?text=${msg}`, '_blank');

    // Mark confirmed in localStorage
    if (pending) {
        pending.confirmed = true;
        localStorage.setItem('aurevynPendingOrder', JSON.stringify(pending));
    }

    // Stop timer, update UI
    if (window._orderTimerInterval) clearInterval(window._orderTimerInterval);
    clearAllReminderTimers();
    closeReminderPopup();
    cancelPushNotifications();
    const timerEl = document.getElementById('order-confirm-timer');
    if (timerEl) timerEl.style.display = 'none';

    const btnConfirm = document.querySelector('.btn-confirm-order');
    const btnCancel = document.querySelector('.btn-cancel-order');
    const dividerB = document.getElementById('wa-divider-b');
    if (btnConfirm) { btnConfirm.disabled = true; btnConfirm.innerHTML = '<i class="fas fa-check-circle"></i><span>Order Confirmed!</span>'; btnConfirm.classList.add('is-done'); }
    if (btnCancel) { btnCancel.style.display = 'none'; }
    if (dividerB) { dividerB.style.display = 'none'; }

    showToast('success', 'Order Confirmed!', 'Your order has been confirmed. It will be delivered soon! 🎉');
}

function cancelOrderWhatsApp() {
    const orderId = document.getElementById('success-order-id')?.textContent || 'N/A';

    // Check if expired
    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || '{}');
    if (pending && pending.expiryTime && Date.now() > pending.expiryTime) {
        showToast('error', 'Order Expired', 'This order has already expired.');
        return;
    }

    const msg = encodeURIComponent(
        `❌ *ORDER CANCEL REQUEST*\n\n` +
        `Order ID: ${orderId}\n` +
        `Status: Cancel Request\n` +
        `Requested at: ${new Date().toLocaleString('en-PK')}\n\n` +
        `I want to cancel this order. Please cancel it. Thank you.`
    );
    window.open(`https://wa.me/923258666803?text=${msg}`, '_blank');

    // Mark cancelled
    if (pending) {
        pending.cancelled = true;
        localStorage.setItem('aurevynPendingOrder', JSON.stringify(pending));
    }

    // Stop timer, update UI
    if (window._orderTimerInterval) clearInterval(window._orderTimerInterval);
    clearAllReminderTimers();
    closeReminderPopup();
    cancelPushNotifications();
    const timerEl = document.getElementById('order-confirm-timer');
    if (timerEl) timerEl.style.display = 'none';

    const btnConfirm = document.querySelector('.btn-confirm-order');
    const btnCancel = document.querySelector('.btn-cancel-order');
    const dividerA = document.getElementById('wa-divider-a');
    if (btnConfirm) { btnConfirm.style.display = 'none'; }
    if (dividerA) { dividerA.style.display = 'none'; }
    if (btnCancel) { btnCancel.disabled = true; btnCancel.innerHTML = '<i class="fas fa-times-circle"></i><span>Order Cancelled</span>'; btnCancel.classList.add('is-done'); }

    showToast('info', 'Cancel Request Sent', 'Your cancellation request has been sent.');
}

function closeOrderSuccess() {
    const modal = document.getElementById('order-success-modal');
    if (modal) modal.classList.remove('active');

    // If the customer didn't confirm/cancel and closed the modal → first reminder
    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
    if (pending && !pending.confirmed && !pending.cancelled && Date.now() < pending.expiryTime) {
        setTimeout(() => showOrderReminderPopup('first'), 2000);
    }

    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.top = '';

    // Restore floating widgets
    const chatWidget = document.querySelector('.live-chat-widget');
    const darkModeFloat = document.getElementById('dark-mode-float');
    const goToTop = document.querySelector('.go-to-top');
    if (chatWidget) chatWidget.style.visibility = '';
    if (darkModeFloat) darkModeFloat.style.visibility = '';
    if (goToTop) {
        goToTop.style.visibility = '';
        goToTop.classList.remove('visible');
    }

    updateFloatingButtons();
    currentCheckoutStep = 1;
    checkoutData = { shipping: {}, payment: {}, items: [] };
    selectedPaymentMethod = 'cod';

    const phoneConfirm = document.getElementById('checkout-phone-confirm');
    if (phoneConfirm) { phoneConfirm.value = ''; phoneConfirm.style.borderColor = ''; phoneConfirm.style.boxShadow = ''; }
    const matchMsg = document.getElementById('phone-match-msg');
    if (matchMsg) { matchMsg.style.display = 'none'; }
    const codCheck = document.getElementById('cod-confirm-check');
    if (codCheck) codCheck.checked = false;

    setTimeout(() => {
        const productsSection = document.getElementById('products') || document.querySelector('.products-section');
        if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

// ==========================================
// ORDER REMINDER SYSTEM
// 3 reminders if customer doesn't confirm:
// 1st → immediately when modal closes
// 2nd → 10 minutes after order placed
// 3rd → 25 minutes after order placed (5 min before expiry)
// ==========================================

let _reminderTimer1 = null;
let _reminderTimer2 = null;
let _reminderTimer3 = null;

function clearAllReminderTimers() {
    if (_reminderTimer1) { clearTimeout(_reminderTimer1); _reminderTimer1 = null; }
    if (_reminderTimer2) { clearTimeout(_reminderTimer2); _reminderTimer2 = null; }
    if (_reminderTimer3) { clearTimeout(_reminderTimer3); _reminderTimer3 = null; }
}

function scheduleOrderReminders(expiryTime) {
    clearAllReminderTimers();
    const orderTime = expiryTime - (30 * 60 * 1000);

    // Reminder 2: 10 minutes after order placed
    const delay10min = (orderTime + 10 * 60 * 1000) - Date.now();
    if (delay10min > 0) {
        _reminderTimer2 = setTimeout(() => {
            const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
            if (pending && !pending.confirmed && !pending.cancelled && Date.now() < pending.expiryTime) {
                showOrderReminderPopup('second');
            }
        }, delay10min);
    }

    // Reminder 3: 25 minutes after order placed (5 min before expiry)
    const delay25min = (orderTime + 25 * 60 * 1000) - Date.now();
    if (delay25min > 0) {
        _reminderTimer3 = setTimeout(() => {
            const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
            if (pending && !pending.confirmed && !pending.cancelled && Date.now() < pending.expiryTime) {
                showOrderReminderPopup('last');
            }
        }, delay25min);
    }
}

function showOrderReminderPopup(type) {
    // Remove any existing reminder popup
    const existing = document.getElementById('aurevyn-reminder-popup');
    if (existing) existing.remove();

    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
    if (!pending) return;

    let emoji, title, msg, urgencyClass;

    if (type === 'first') {
        emoji = '🔔';
        title = 'Order Not Confirmed Yet!';
        msg = `<strong>Order #${pending.orderId}</strong> is still pending.<br>Please click "CONFIRM ORDER" so we can deliver it sooner.`;
        urgencyClass = 'reminder-normal';
    } else if (type === 'second') {
        emoji = '⚠️';
        title = '10 Minutes Have Passed – Confirm Now!';
        msg = `<strong>Order #${pending.orderId}</strong> – Expires in 20 minutes!<br>Confirm now, otherwise the order will be cancelled.`;
        urgencyClass = 'reminder-warning';
    } else {
        emoji = '🚨';
        title = 'ONLY 5 MINUTES LEFT! Order is About to Expire!';
        msg = `<strong>Order #${pending.orderId}</strong> – Only 5 minutes left!<br>Confirm "CONFIRM ORDER" right now, otherwise the order will be cancelled!`;
        urgencyClass = 'reminder-urgent';
    }

    const popup = document.createElement('div');
    popup.id = 'aurevyn-reminder-popup';
    popup.className = `aurevyn-reminder-popup ${urgencyClass}`;
    popup.innerHTML = `
        <div class="reminder-inner">
            <div class="reminder-emoji">${emoji}</div>
            <div class="reminder-body">
                <div class="reminder-title">${title}</div>
                <div class="reminder-msg">${msg}</div>
                <div class="reminder-actions">
                    <button class="reminder-confirm-btn" onclick="reminderConfirmNow()">
                        <i class="fas fa-check-circle"></i> CONFIRM ORDER
                    </button>
                    <button class="reminder-later-btn" onclick="closeReminderPopup()">
                        Later
                    </button>
                </div>
            </div>
            <button class="reminder-close" onclick="closeReminderPopup()" aria-label="Close">✕</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Animate in
    requestAnimationFrame(() => {
        popup.classList.add('reminder-visible');
    });

    // Auto-close after 15 seconds (except last reminder)
    if (type !== 'last') {
        setTimeout(() => {
            closeReminderPopup();
        }, 15000);
    }
}

function closeReminderPopup() {
    const popup = document.getElementById('aurevyn-reminder-popup');
    if (!popup) return;
    popup.classList.remove('reminder-visible');
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 400);
}

function reminderConfirmNow() {
    closeReminderPopup();
    // Open the order success modal to let customer confirm
    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
    if (!pending || pending.confirmed || pending.cancelled) return;

    const successModal = document.getElementById('order-success-modal');
    const successOrderId = document.getElementById('success-order-id');
    const waTimeEl = document.getElementById('wa-confirm-time');

    if (successOrderId) successOrderId.textContent = pending.orderId;
    if (waTimeEl) waTimeEl.textContent = pending.timeLabel || '';
    if (successModal) successModal.classList.add('active');

    // Resume timer
    if (window._orderTimerInterval) clearInterval(window._orderTimerInterval);
    startOrderConfirmTimer(pending.expiryTime);
}

window.reminderConfirmNow = reminderConfirmNow;
window.closeReminderPopup = closeReminderPopup;
window.scheduleOrderReminders = scheduleOrderReminders;
window.showOrderReminderPopup = showOrderReminderPopup;

// ==========================================
// BROWSER PUSH NOTIFICATION SYSTEM
// Customer ke phone/desktop pe actual notifications
// Even if tab is closed (via Service Worker)
// ==========================================

// Register Service Worker
async function registerPushServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register('/sw-notifications.js');
        return reg;
    } catch(e) {
        console.warn('SW registration failed:', e);
        return null;
    }
}

// Request notification permission from customer
async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// Schedule push notifications via Service Worker
async function schedulePushNotifications(expiryTime) {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const reg = await registerPushServiceWorker();
    if (!reg) return;

    const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
    if (!pending) return;

    const orderTime = expiryTime - (30 * 60 * 1000);
    const orderId = pending.orderId || '';

    // Store scheduled notification times in localStorage for SW to read
    const notifications = [
        {
            id: 'reminder_first',
            time: orderTime + (2 * 60 * 1000),
            title: '🔔 Aurevyn – Your Order is Still Pending!',
            body: `Your order ${orderId} hasn't been confirmed yet. Please confirm soon so we can deliver it!`,
            tag: 'order-reminder-1'
        },
        {
            id: 'reminder_10min',
            time: orderTime + (10 * 60 * 1000),
            title: '⚠️ Aurevyn – Only 20 Minutes Left!',
            body: `Order ${orderId} is still pending. Please confirm soon, otherwise the order will be cancelled automatically!`,
            tag: 'order-reminder-2'
        },
        {
            id: 'reminder_last',
            time: orderTime + (25 * 60 * 1000),
            title: '🚨 Aurevyn – LAST CHANCE! Only 5 Minutes!',
            body: `Order ${orderId} is about to expire! Confirm NOW — otherwise the order will be cancelled!`,
            tag: 'order-reminder-3'
        }
    ];

    localStorage.setItem('aurevynPendingNotifications', JSON.stringify(notifications));

    // Tell the service worker to schedule these
    if (reg.active) {
        reg.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', notifications });
    } else {
        navigator.serviceWorker.ready.then(r => {
            r.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', notifications });
        });
    }
}

// Cancel all scheduled push notifications
async function cancelPushNotifications() {
    localStorage.removeItem('aurevynPendingNotifications');
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active) {
        reg.active.postMessage({ type: 'CANCEL_NOTIFICATIONS' });
    }
    // Also close any visible notifications
    if (reg) {
        const notifications = await reg.getNotifications();
        notifications.forEach(n => n.close());
    }
}

window.schedulePushNotifications = schedulePushNotifications;
window.cancelPushNotifications = cancelPushNotifications;
window.requestNotificationPermission = requestNotificationPermission;

// Listen for Service Worker messages (e.g. notification tap → open modal)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'OPEN_CONFIRM_MODAL') {
            const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
            if (pending && !pending.confirmed && !pending.cancelled && Date.now() < pending.expiryTime) {
                const successModal = document.getElementById('order-success-modal');
                const successOrderId = document.getElementById('success-order-id');
                const waTimeEl = document.getElementById('wa-confirm-time');
                if (successOrderId) successOrderId.textContent = pending.orderId;
                if (waTimeEl) waTimeEl.textContent = pending.timeLabel || '';
                if (successModal) successModal.classList.add('active');
                if (window._orderTimerInterval) clearInterval(window._orderTimerInterval);
                startOrderConfirmTimer(pending.expiryTime);
            }
        }

        // Customer tapped "Cancel Order" on the push notification — actually cancel it
        if (event.data && event.data.type === 'OPEN_CANCEL_MODAL') {
            const pending = JSON.parse(localStorage.getItem('aurevynPendingOrder') || 'null');
            if (pending && !pending.confirmed && !pending.cancelled && Date.now() < pending.expiryTime) {
                const successModal = document.getElementById('order-success-modal');
                const successOrderId = document.getElementById('success-order-id');
                const waTimeEl = document.getElementById('wa-confirm-time');
                if (successOrderId) successOrderId.textContent = pending.orderId;
                if (waTimeEl) waTimeEl.textContent = pending.timeLabel || '';
                if (successModal) successModal.classList.add('active');
                if (window._orderTimerInterval) clearInterval(window._orderTimerInterval);
                startOrderConfirmTimer(pending.expiryTime);
                cancelOrderWhatsApp();
            }
        }
    });

    // SW silently register on page load — permission is NOT asked here.
    // Permission is asked only when customer adds to cart (better UX, higher accept rate).
    registerPushServiceWorker().catch(() => {});
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================
// ==========================================
// LANGUAGE TRANSLATION SYSTEM
// ==========================================

const translations = {
  en: {
    // Navigation
    categories: "Categories",
    new_arrivals: "New Arrivals",
    best_sellers: "Best Sellers",
    gift_box: "Gift Box",
    contact: "Contact",
    sale: "Sale",

    // Hero
    hero_title_1: "Discover Your Beauty",
    hero_desc_1: "Premium makeup products for the modern woman",
    hero_title_2: "New Collection 2026",
    hero_desc_2: "Get 20% off on all new arrivals",
    hero_title_3: "Free Delivery",
    hero_desc_3: "On all orders above 5000",
    shop_now: "Shop Now",
    explore_now: "Explore Now",
    start_shopping: "Start Shopping",

    // Features
    free_shipping: "Free Shipping",
    free_shipping_desc: "On orders above 5000",
    easy_returns: "Easy Returns",
    easy_returns_desc: "7 days return policy",
    secure_payment: "Secure Payment",
    secure_payment_desc: "100% secure checkout",
    support_24_7: "24/7 Support",
    support_desc: "Always available",

    // Categories
    shop_by_category: "Shop by Category",
    shop_by_category_desc: "Find the perfect products for your beauty routine",
    face_makeup: "Face Makeup",
    eye_makeup: "Eye Makeup",
    lip_products: "Lip Products",
    skincare: "Skincare",

    // Products
    new_collection: "New Collection",
    new_arrivals_title: "New Arrivals",
    popular_now: "Popular Now",
    best_sellers_title: "Best Sellers",
    special_offers: "Special Offers",
    sale_products: "Sale Products",
    sale_desc: "Amazing discounts on premium beauty products",
    our_collection: "Our Collection",
    all_products: "All Products",

    // Filters
    filter_categories: "Categories",
    price_range: "Price Range",
    rating: "Rating",
    sort_featured: "Sort by: Featured",
    sort_price_low: "Price: Low to High",
    sort_price_high: "Price: High to Low",
    sort_rating: "Highest Rated",
    sort_newest: "Newest First",

    // Testimonials
    testimonials: "Testimonials",
    what_customers_say: "What Our Customers Say",

    // Social
    follow_us: "Follow Us",
    connect_with_us: "Connect With Us",
    social_desc: "Stay updated with our latest products, offers, and beauty tips",

    // Contact
    get_in_touch: "Get in Touch",
    contact_us: "Contact Us",
    contact_desc: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
    address: "Address",
    phone: "Phone",
    email: "Email",
    working_hours: "Working Hours",
    open_24_7: "Open 24 Hours, 7 Days a Week",
    send_message: "Send Message",

    // Footer
    about_aurevyn: "About Aurevyn",
    about_desc: "Your trusted destination for premium makeup and beauty products. We believe every woman deserves to feel beautiful and confident.",
    quick_links: "Quick Links",
    customer_service: "Customer Service",
    return_exchange: "Return & Exchange",
    customer_support: "Customer Support",
    return_policy: "Return Policy",
    size_guide: "Size Guide",
    newsletter: "Newsletter",
    newsletter_desc: "Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.",

    // Cart
    your_cart: "Your Cart",
    cart_empty: "Your cart is empty",
    subtotal: "Subtotal:",
    shipping_note: "Shipping & taxes calculated at checkout",
    checkout: "Checkout",
    continue_shopping: "Continue Shopping",

    // Checkout
    secure_checkout: "Secure Checkout",
    shipping_step: "Shipping",
    payment_step: "Payment",
    review_step: "Review",
    shipping_info: "Shipping Information",
    full_name: "Full Name",
    phone_number: "Phone Number",
    email_address: "Email Address",
    complete_address: "Complete Address",
    city: "City",
    postal_code: "Postal Code",
    continue_payment: "Continue to Payment",
    payment_method: "Payment Method",
    cod: "Cash on Delivery",
    cod_desc: "Pay when you receive your order",
    most_popular: "Most Popular",
    review_order: "Review Order",
    review_your_order: "Review Your Order",
    shipping_to: "Shipping To",
    payment_method_label: "Payment Method",
    order_items: "Order Items",
    place_order: "Place Order",
    order_summary: "Order Summary",
    shipping: "Shipping",
    total: "Total",
    secure_checkout_badge: "Secure Checkout",

    // Order Success
    order_success: "Order Placed Successfully!",
    order_success_desc: "Thank you for your order. You will receive a confirmation message shortly.",
    continue_shopping_btn: "Continue Shopping",

    // Misc
    showing: "Showing",
    of: "of",
    products: "products",
    add_to_cart: "Add to Cart",
    quick_view: "Quick View",
    wishlist: "Wishlist",
    search: "Search",
    search_products: "Search products...",
    back_to_all: "Back to All Products",
    verified_buyer: "Verified Buyer",
    order_id: "Order ID",
    date: "Date",
    status: "Status",
    pending: "Pending Confirmation",
    free: "Free",
    discount: "Discount",
    savings: "You Save",
    total_value: "Total Value",
    explore_more: "Explore More",
    view_all_photos: "View all photos",
    watch_all_videos: "Watch all videos",
    follow: "Follow",
    like: "Like",
    order_inquiry: "Order Inquiry",
    product_question: "Product Question",
    complaint: "Complaint",
    feedback: "Feedback",
    other_query: "Other Query",
    available_24_7: "Available 24/7",
    record_video: "Record a video before opening your parcel",
    video_mandatory: "Video is Mandatory!",
    unboxing_video: "Upload Unboxing Video",
    return_reason: "Return Reason",
    damaged_product: "Damaged/Defective Product",
    wrong_item: "Wrong Item Received",
    not_as_described: "Not as Described",
    quality_issue: "Quality Not as Expected",
    changed_mind: "Changed My Mind",
    other_reason: "Other Reason",
    submit_return: "Submit Return Request via WhatsApp",
    luxury_gift_box: "Luxury Gift Box",
    gift_box_desc: "Complete skincare routine in one elegant package",
    add_gift_box: "Add Gift Box to Cart",
    gift_box_added: "Gift Box Added",
    gift_box_updated: "Gift Box quantity updated!",


    // Reviews
    customer_reviews_subtitle: "Real Feedback",
    customer_reviews_title: "What Our Customers Say",
    customer_reviews_desc: "Trusted reviews from verified buyers across Pakistan",
    view_all_products: "View All Products",
    all_reviews: "All Reviews",
    verified_purchase: "Verified Purchase",
    with_photos: "With Photos",
    write_review: "Write a Review",
    your_rating: "Your Rating",
    review_title: "Review Title",
    your_review: "Your Review",
    add_photos: "Add Photos",
    i_purchased: "I purchased this product",
    submit_review: "Submit Review",
    click_to_rate: "Click to rate",
    poor: "Poor",
    fair: "Fair",
    average: "Average",
    good: "Good",
    excellent: "Excellent",
    was_helpful: "Was this helpful?",
    customer_reviews: "Customer Reviews",
    review_stats: "Review Statistics",
    total_reviews_count: "reviews",
    star_5: "5 star",
    star_4: "4 star",
    star_3: "3 star",
    star_2: "2 star",
    star_1: "1 star",
    newest_first: "Newest First",
    highest_rated: "Highest Rated",
    lowest_rated: "Lowest Rated",
    most_helpful: "Most Helpful",
    no_reviews_found: "No reviews found for this filter.",
    be_first_review: "Be the first to write a review!",
    review_submitted: "Review Submitted!",
    thank_feedback: "Thank you for your feedback!",
    rating_required: "Rating Required",
    select_star_rating: "Please select a star rating",
    missing_fields: "Missing Fields",
    fill_required: "Please fill in all required fields",
    file_too_large: "File Too Large",
    max_photo_size: "Max 5MB per photo",
    max_3_photos: "Max 3 photos",
    reviews_link: "Customer Reviews",
    read_reviews: "Read Reviews",
    write_a_review: "Write a Review",
    verified_buyer: "Verified Buyer",
    helpful_count: "helpful",
    review_date: "Review Date",
    product_rating: "Product Rating",
    overall_rating: "Overall Rating",
    based_on: "Based on",
    reviews_total: "reviews",
    see_all_reviews: "See All Reviews",
    review_modal_title: "Customer Reviews & Ratings",
    review_filter_all: "All Reviews",
    review_filter_verified: "Verified Purchase",
    review_filter_5star: "5 Star",
    review_filter_4star: "4 Star",
    review_filter_3star: "3 Star",
    review_filter_photo: "With Photos",
    sort_by: "Sort by",
    back_to_reviews: "Back to Reviews",
    load_more_reviews: "Load More Reviews",
    showing_reviews: "Showing",
    of_reviews: "of",
    reviews_per_page: "reviews per page",
    previous: "Previous",
    next: "Next",
    page: "Page",
    rating_breakdown: "Rating Breakdown",
    recommend_product: "Would you recommend this product?",
    yes_recommend: "Yes, I recommend",
    no_recommend: "No, I don't recommend",
    review_guidelines: "Review Guidelines",
    honest_opinion: "Share your honest opinion",
    helpful_details: "Include helpful details",
    no_offensive: "No offensive language",
    review_approved: "Your review will be approved within 24 hours",
    thank_you_review: "Thank you for your review!",
    review_pending: "Pending Approval",
    review_approved_status: "Approved",
    review_rejected: "Rejected",
    edit_review: "Edit Review",
    delete_review: "Delete Review",
    confirm_delete: "Are you sure you want to delete this review?",
    review_deleted: "Review Deleted",
    review_updated: "Review Updated",
    update_review: "Update Review",
    cancel_edit: "Cancel",
    save_changes: "Save Changes",
    review_helpful: "Helpful",
    review_not_helpful: "Not Helpful",
    you_found_helpful: "You found this helpful",
    report_review: "Report Review",
    inappropriate_content: "Inappropriate Content",
    spam: "Spam",
    fake_review: "Fake Review",
    other_issue: "Other Issue",
    report_submitted: "Report Submitted",
    thank_report: "Thank you for reporting. We will review it.",
    trust_score: "Trust Score",
    based_on_reviews: "Based on customer reviews",
    excellent_rating: "Excellent",
    very_good_rating: "Very Good",
    good_rating: "Good",
    fair_rating: "Fair",
    poor_rating: "Poor",
    would_recommend: "of customers would recommend",
    to_friends: "this product to a friend",

    // Language label
    lang_label: "EN"
  },

  ur: {
    // Navigation
    categories: "زمرہ جات",
    new_arrivals: "نئی آمد",
    best_sellers: "بہترین فروخت ہونے والے",
    gift_box: "گفٹ باکس",
    contact: "رابطہ",
    sale: "سیل",

    // Hero
    hero_title_1: "اپنی خوبصورتی دریافت کریں",
    hero_desc_1: "جدید عورت کے لیے پریمیم میک اپ مصنوعات",
    hero_title_2: "نیا مجموعہ 2026",
    hero_desc_2: "تمام نئی آمد پر 20% رعایت",
    hero_title_3: "مفت ترسیل",
    hero_desc_3: "5000 سے زیادہ کے تمام آرڈرز پر",
    shop_now: "ابھی خریدیں",
    explore_now: "ابھی دریافت کریں",
    start_shopping: "خریداری شروع کریں",

    // Features
    free_shipping: "مفت ترسیل",
    free_shipping_desc: "5000 سے زیادہ کے آرڈرز پر",
    easy_returns: "آسان واپسی",
    easy_returns_desc: "7 دن کی واپسی کی پالیسی",
    secure_payment: "محفوظ ادائیگی",
    secure_payment_desc: "100% محفوظ چیک آؤٹ",
    support_24_7: "24/7 سپورٹ",
    support_desc: "ہمیشہ دستیاب",

    // Categories
    shop_by_category: "زمرہ کے مطابق خریداری",
    shop_by_category_desc: "اپنی خوبصورتی کے معمول کے لیے بہترین مصنوعات تلاش کریں",
    face_makeup: "چہرے کا میک اپ",
    eye_makeup: "آنکھوں کا میک اپ",
    lip_products: "ہونٹوں کی مصنوعات",
    skincare: "سکن کیئر",

    // Products
    new_collection: "نیا مجموعہ",
    new_arrivals_title: "نئی آمد",
    popular_now: "اب مقبول",
    best_sellers_title: "بہترین فروخت ہونے والے",
    special_offers: "خصوصی پیشکشیں",
    sale_products: "سیل کی مصنوعات",
    sale_desc: "پریمیم بیوٹی مصنوعات پر حیرت انگیز رعایتیں",
    our_collection: "ہمارا مجموعہ",
    all_products: "تمام مصنوعات",

    // Filters
    filter_categories: "زمرہ جات",
    price_range: "قیمت کی حد",
    rating: "ریٹنگ",
    sort_featured: "ترتیب: نمایاں",
    sort_price_low: "قیمت: کم سے زیادہ",
    sort_price_high: "قیمت: زیادہ سے کم",
    sort_rating: "سب سے زیادہ ریٹنگ",
    sort_newest: "نیا پہلے",

    // Testimonials
    testimonials: "تعریفیں",
    what_customers_say: "ہمارے صارفین کیا کہتے ہیں",

    // Social
    follow_us: "ہمیں فالو کریں",
    connect_with_us: "ہمارے ساتھ جڑیں",
    social_desc: "ہماری تازہ ترین مصنوعات، پیشکشوں اور بیوٹی ٹپس سے باخبر رہیں",

    // Contact
    get_in_touch: "رابطہ کریں",
    contact_us: "ہم سے رابطہ کریں",
    contact_desc: "کوئی سوال ہے؟ ہم آپ سے سننا پسند کریں گے۔ ہمیں پیغام بھیجیں اور ہم جلد از جلد جواب دیں گے۔",
    address: "پتہ",
    phone: "فون",
    email: "ای میل",
    working_hours: "کام کے اوقات",
    open_24_7: "24 گھنٹے، ہفتے کے 7 دن کھلا",
    send_message: "پیغام بھیجیں",

    // Footer
    about_aurevyn: "اوریون کے بارے میں",
    about_desc: "پریمیم میک اپ اور بیوٹی مصنوعات کے لیے آپ کا قابل اعتماد مقام۔ ہمارا ماننا ہے کہ ہر عورت خوبصورت اور پراعتماد محسوس کرنے کی مستحق ہے۔",
    quick_links: "فوری لنکس",
    customer_service: "کسٹمر سروس",
    return_exchange: "واپسی اور تبادلہ",
    customer_support: "کسٹمر سپورٹ",
    return_policy: "واپسی کی پالیسی",
    size_guide: "سائز گائیڈ",
    newsletter: "نیوز لیٹر",
    newsletter_desc: "خصوصی پیشکشیں، مفت تحفے اور ایک بار کی زندگی کے سودے حاصل کرنے کے لیے سبسکرائب کریں۔",

    // Cart
    your_cart: "آپ کا کارٹ",
    cart_empty: "آپ کا کارٹ خالی ہے",
    subtotal: "ذیلی کل:",
    shipping_note: "شپنگ اور ٹیکس چیک آؤٹ پر حساب کیے جائیں گے",
    checkout: "چیک آؤٹ",
    continue_shopping: "خریداری جاری رکھیں",

    // Checkout
    secure_checkout: "محفوظ چیک آؤٹ",
    shipping_step: "شپنگ",
    payment_step: "ادائیگی",
    review_step: "جائزہ",
    shipping_info: "شپنگ کی معلومات",
    full_name: "پورا نام",
    phone_number: "فون نمبر",
    email_address: "ای میل ایڈریس",
    complete_address: "مکمل پتہ",
    city: "شہر",
    postal_code: "پوسٹل کوڈ",
    continue_payment: "ادائیگی جاری رکھیں",
    payment_method: "ادائیگی کا طریقہ",
    cod: "کیش آن ڈیلیوری",
    cod_desc: "آپ اپنے آرڈر وصول کرنے پر ادائیگی کریں",
    most_popular: "سب سے مقبول",
    review_order: "آرڈر کا جائزہ",
    review_your_order: "اپنے آرڈر کا جائزہ لیں",
    shipping_to: "شپنگ کا پتہ",
    payment_method_label: "ادائیگی کا طریقہ",
    order_items: "آرڈر کی اشیاء",
    place_order: "آرڈر دیں",
    order_summary: "آرڈر کا خلاصہ",
    shipping: "شپنگ",
    total: "کل",
    secure_checkout_badge: "محفوظ چیک آؤٹ",

    // Order Success
    order_success: "آرڈر کامیابی سے دیا گیا!",
    order_success_desc: "آپ کے آرڈر کا شکریہ۔ آپ کو جلد ہی تصدیقی پیغام موصول ہوگا۔",
    continue_shopping_btn: "خریداری جاری رکھیں",

    // Misc
    showing: "دکھا رہا ہے",
    of: "میں سے",
    products: "مصنوعات",
    add_to_cart: "کارٹ میں شامل کریں",
    quick_view: "فوری نظارہ",
    wishlist: "خواہشات کی فہرست",
    search: "تلاش",
    search_products: "مصنوعات تلاش کریں...",
    back_to_all: "تمام مصنوعات پر واپس",
    verified_buyer: "تصدیق شدہ خریدار",
    order_id: "آرڈر آئی ڈی",
    date: "تاریخ",
    status: "حالت",
    pending: "تصدیق زیر التواء",
    free: "مفت",
    discount: "رعایت",
    savings: "آپ کی بچت",
    total_value: "کل قیمت",
    explore_more: "مزید دریافت کریں",
    view_all_photos: "تمام تصاویر دیکھیں",
    watch_all_videos: "تمام ویڈیوز دیکھیں",
    follow: "فالو کریں",
    like: "لائک کریں",
    order_inquiry: "آرڈر کی درخواست",
    product_question: "مصنوعات کا سوال",
    complaint: "شکایت",
    feedback: "رائے",
    other_query: "دیگر سوال",
    available_24_7: "24/7 دستیاب",
    record_video: "پارسل کھولنے سے پہلے ویڈیو ریکارڈ کریں",
    video_mandatory: "ویڈیو لازمی ہے!",
    unboxing_video: "ان باکسنگ ویڈیو اپ لوڈ کریں",
    return_reason: "واپسی کی وجہ",
    damaged_product: "نقصان شدہ/خراب مصنوع",
    wrong_item: "غلط شے موصول ہوئی",
    not_as_described: "تفصیل کے مطابق نہیں",
    quality_issue: "معیار توقع کے مطابق نہیں",
    changed_mind: "میرا ارادہ بدل گیا",
    other_reason: "دیگر وجہ",
    submit_return: "وٹس ایپ کے ذریعے واپسی کی درخواست جمع کرائیں",
    luxury_gift_box: "لگژری گفٹ باکس",
    gift_box_desc: "ایک خوبصورت پیکیج میں مکمل سکن کیئر معمول",
    add_gift_box: "گفٹ باکس کارٹ میں شامل کریں",
    gift_box_added: "گفٹ باکس شامل ہو گیا",
    gift_box_updated: "گفٹ باکس کی مقدار اپ ڈیٹ ہو گئی!",


    // Reviews
    customer_reviews_subtitle: "حقیقی آراء",
    customer_reviews_title: "ہمارے صارفین کیا کہتے ہیں",
    customer_reviews_desc: "پورے پاکستان سے تصدیق شدہ خریداروں کی قابل اعتماد آراء",
    view_all_products: "تمام مصنوعات دیکھیں",
    all_reviews: "تمام آراء",
    verified_purchase: "تصدیق شدہ خریداری",
    with_photos: "تصاویر کے ساتھ",
    write_review: "ایک جائزہ لکھیں",
    your_rating: "آپ کی ریٹنگ",
    review_title: "جائزے کا عنوان",
    your_review: "آپ کا جائزہ",
    add_photos: "تصاویر شامل کریں",
    i_purchased: "میں نے یہ مصنوع خریدی",
    submit_review: "جائزہ جمع کرائیں",
    click_to_rate: "ریٹ کرنے کے لیے کلک کریں",
    poor: "کمزور",
    fair: "مناسب",
    average: "اوسط",
    good: "اچھا",
    excellent: "بہترین",
    was_helpful: "کیا یہ مددگار تھا؟",
    customer_reviews: "صارفین کے جائزے",
    review_stats: "جائزوں کے اعداد و شمار",
    total_reviews_count: "جائزے",
    star_5: "5 ستارے",
    star_4: "4 ستارے",
    star_3: "3 ستارے",
    star_2: "2 ستارے",
    star_1: "1 ستارہ",
    newest_first: "نیا پہلے",
    highest_rated: "سب سے زیادہ ریٹنگ",
    lowest_rated: "سب سے کم ریٹنگ",
    most_helpful: "سب سے مددگار",
    no_reviews_found: "اس فلٹر کے لیے کوئی جائزہ نہیں ملا۔",
    be_first_review: "پہلا جائزہ لکھنے والے بنیں!",
    review_submitted: "جائزہ جمع کرایا گیا!",
    thank_feedback: "آپ کے تاثرات کا شکریہ!",
    rating_required: "ریٹنگ درکار ہے",
    select_star_rating: "براہ کرم ستارے کی ریٹنگ منتخب کریں",
    missing_fields: "فیلڈز غائب ہیں",
    fill_required: "براہ کرم تمام ضروری فیلڈز پر کریں",
    file_too_large: "فائل بہت بڑی ہے",
    max_photo_size: "فی تصویر زیادہ سے زیادہ 5MB",
    max_3_photos: "زیادہ سے زیادہ 3 تصاویر",
    reviews_link: "صارفین کے جائزے",
    read_reviews: "جائزے پڑھیں",
    write_a_review: "جائزہ لکھیں",
    verified_buyer: "تصدیق شدہ خریدار",
    helpful_count: "مددگار",
    review_date: "جائزے کی تاریخ",
    product_rating: "مصنوع کی ریٹنگ",
    overall_rating: "کل ریٹنگ",
    based_on: "کی بنیاد پر",
    reviews_total: "جائزے",
    see_all_reviews: "تمام جائزے دیکھیں",
    review_modal_title: "صارفین کے جائزے اور ریٹنگز",
    review_filter_all: "تمام آراء",
    review_filter_verified: "تصدیق شدہ خریداری",
    review_filter_5star: "5 ستارے",
    review_filter_4star: "4 ستارے",
    review_filter_3star: "3 ستارے",
    review_filter_photo: "تصاویر کے ساتھ",
    sort_by: "ترتیب دیں",
    back_to_reviews: "جائزوں پر واپس",
    load_more_reviews: "مزید جائزے لوڈ کریں",
    showing_reviews: "دکھا رہا ہے",
    of_reviews: "میں سے",
    reviews_per_page: "جائزے فی صفحہ",
    previous: "پچھلا",
    next: "اگلا",
    page: "صفحہ",
    rating_breakdown: "ریٹنگ کی تفصیل",
    recommend_product: "کیا آپ اس مصنوع کی سفارش کریں گے؟",
    yes_recommend: "ہاں، میں سفارش کرتا/کرتی ہوں",
    no_recommend: "نہیں، میں سفارش نہیں کرتا/کرتی",
    review_guidelines: "جائزے کی ہدایات",
    honest_opinion: "اپنی مخلص رائے شیئر کریں",
    helpful_details: "مددگار تفصیلات شامل کریں",
    no_offensive: "کوئی توہین آمیز زبان نہیں",
    review_approved: "آپ کا جائزہ 24 گھنٹوں کے اندر منظور کر دیا جائے گا",
    thank_you_review: "آپ کے جائزے کا شکریہ!",
    review_pending: "منظوری زیر التواء",
    review_approved_status: "منظور شدہ",
    review_rejected: "مسترد",
    edit_review: "جائزہ ترمیم کریں",
    delete_review: "جائزہ حذف کریں",
    confirm_delete: "کیا آپ واقعی اس جائزے کو حذف کرنا چاہتے ہیں؟",
    review_deleted: "جائزہ حذف کر دیا گیا",
    review_updated: "جائزہ اپ ڈیٹ ہو گیا",
    update_review: "جائزہ اپ ڈیٹ کریں",
    cancel_edit: "منسوخ کریں",
    save_changes: "تبدیلیاں محفوظ کریں",
    review_helpful: "مددگار",
    review_not_helpful: "مددگار نہیں",
    you_found_helpful: "آپ کو یہ مددگار لگا",
    report_review: "جائزہ رپورٹ کریں",
    inappropriate_content: "نامناسب مواد",
    spam: "اسپیم",
    fake_review: "جعلی جائزہ",
    other_issue: "دیگر مسئلہ",
    report_submitted: "رپورٹ جمع کرائی گئی",
    thank_report: "رپورٹ کرنے کا شکریہ۔ ہم اس کا جائزہ لیں گے۔",
    trust_score: "اعتماد کا اسکور",
    based_on_reviews: "صارفین کے جائزوں کی بنیاد پر",
    excellent_rating: "بہترین",
    very_good_rating: "بہت اچھا",
    good_rating: "اچھا",
    fair_rating: "مناسب",
    poor_rating: "کمزور",
    would_recommend: "صارفین اس مصنوع کی سفارش کریں گے",
    to_friends: "ایک دوست کو",

    // Language label
    lang_label: "اردو"
  }
};

let currentLanguage = localStorage.getItem('aurevynLanguage') || 'en';

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('aurevynLanguage', lang);

  // Update HTML lang attribute and direction
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ur' ? 'rtl' : 'ltr';

  // Update all elements with data-translate
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang] && translations[lang][key]) {
      // For input placeholders
      if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
        el.placeholder = translations[lang][key];
      }
      // For select options
      else if (el.tagName === 'OPTION') {
        el.textContent = translations[lang][key];
      }
      // For regular elements
      else {
        // Preserve child elements (like icons)
        const icon = el.querySelector('i, svg');
        if (icon && el.children.length > 0) {
          // Check if first child is icon
          if (el.children[0] === icon) {
            el.innerHTML = '';
            el.appendChild(icon);
            el.appendChild(document.createTextNode(' ' + translations[lang][key]));
          } else {
            el.textContent = translations[lang][key];
          }
        } else {
          el.textContent = translations[lang][key];
        }
      }
    }
  });

  // Update language button label
  const langLabel = document.getElementById('lang-label');
  if (langLabel) {
    langLabel.textContent = translations[lang].lang_label;
  }

  // Update page title
  if (lang === 'ur') {
    document.title = "اوریون - پریمیم میک اپ اور کاسمیٹکس";
  } else {
    document.title = "Aurevyn - Premium Makeup & Cosmetics";
  }

  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = lang === 'ur' 
      ? "پریمیم کوالٹی میک اپ مصنوعات، کاسمیٹکس، اور بیوٹی ضروریات۔ پورے پاکستان میں مفت ترسیل۔ 10 دن کی آسان واپسی کی پالیسی۔"
      : "Premium quality makeup products, cosmetics, and beauty essentials. Free delivery all over Pakistan. 10 Days Easy Return Policy.";
  }

  // Update product cards dynamically
  updateProductCardLanguage(lang);

  // Update cart UI
  updateCartUI();

  // Show toast (1 second only for language change)
  showToast('success', lang === 'ur' ? 'زبان تبدیل ہو گئی!' : 'Language Changed!', 
    lang === 'ur' ? 'ویب سائٹ اب اردو میں ہے' : 'Website is now in English', 1500);
}

function toggleLanguage() {
  const newLang = currentLanguage === 'en' ? 'ur' : 'en';
  setLanguage(newLang);
}

function updateProductCardLanguage(lang) {
  // Update category labels on product cards
  const categoryLabels = {
    en: { face: 'Face Makeup', eyes: 'Eye Makeup', lips: 'Lip Products', skincare: 'Skincare', tools: 'Tools & Brushes' },
    ur: { face: 'چہرے کا میک اپ', eyes: 'آنکھوں کا میک اپ', lips: 'ہونٹوں کی مصنوعات', skincare: 'سکن کیئر', tools: 'ٹولز اور برشز' }
  };

  // Also define reverse mapping to detect current language
  const urduCategories = {
    'چہرے کا میک اپ': 'face',
    'آنکھوں کا میک اپ': 'eyes', 
    'ہونٹوں کی مصنوعات': 'lips',
    'سکن کیئر': 'skincare',
    'ٹولز اور برشز': 'tools'
  };

  document.querySelectorAll('.product-category').forEach(el => {
    const currentText = el.textContent.trim();
    // Check if current text is Urdu, map back to key
    let catKey = null;

    // Try to find matching English key
    for (const [key, enVal] of Object.entries(categoryLabels.en)) {
      if (currentText === enVal || currentText.toLowerCase().includes(key)) {
        catKey = key;
        break;
      }
    }

    // If not found, check if it's Urdu
    if (!catKey) {
      for (const [urText, key] of Object.entries(urduCategories)) {
        if (currentText === urText) {
          catKey = key;
          break;
        }
      }
    }

    // Fallback: check data attribute
    if (!catKey) {
      const card = el.closest('.product-card');
      if (card) {
        catKey = card.dataset.category;
      }
    }

    if (catKey && categoryLabels[lang][catKey]) {
      el.textContent = categoryLabels[lang][catKey];
    }
  });

  // Update Add to Cart buttons
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    const icon = btn.querySelector('i');
    btn.innerHTML = '';
    if (icon) btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' ' + (lang === 'ur' ? 'کارٹ میں شامل کریں' : 'Add to Cart')));
  });

  // Update badge text - check both English and Urdu versions
  document.querySelectorAll('.product-badge').forEach(badge => {
    const text = badge.textContent.trim();
    const lowerText = text.toLowerCase();

    // Map any language to English first, then to target
    let badgeType = null;
    if (lowerText.includes('hot') || text === 'ہاٹ') badgeType = 'hot';
    else if (lowerText.includes('sale') || text === 'سیل') badgeType = 'sale';
    else if (lowerText.includes('new') || text === 'نیا') badgeType = 'new';
    else if (lowerText.includes('best') || text === 'بہترین') badgeType = 'best';

    if (badgeType) {
      const badgeLabels = {
        hot: { en: 'Hot', ur: 'ہاٹ' },
        sale: { en: 'Sale', ur: 'سیل' },
        new: { en: 'New', ur: 'نیا' },
        best: { en: 'Best', ur: 'بہترین' }
      };
      badge.textContent = badgeLabels[badgeType][lang];
    }
  });
}

// Initialize language on page load
function initLanguage() {
  const savedLang = localStorage.getItem('aurevynLanguage') || 'en';
  if (savedLang === 'ur') {
    setLanguage('ur');
  }
}

// Call init after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguage);
} else {
  initLanguage();
}

window.toggleMobileSearch = toggleMobileSearch;
window.globalSearch = globalSearch;
window.clearSearch = clearSearch;
window.toggleSectionsForSearch = toggleSectionsForSearch;
window.updateClearSearchButtons = updateClearSearchButtons;
window.toggleCart = toggleCart;
window.toggleWishlist = toggleWishlist;
window.toggleWishlistItem = toggleWishlistItem;
window.addToCart = addToCart;
window.addToCartWithShade = addToCartWithShade;
window.removeFromCart = removeFromCart;
window.removeFromCartByKey = removeFromCartByKey;
window.updateQuantity = updateQuantity;
window.updateQuantityByKey = updateQuantityByKey;
window.openQuickView = openQuickView;
window.selectVariant = selectVariant;
window.selectQVVariant = selectQVVariant;
window.closeQuickView = closeQuickView;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.goToStep = goToStep;
window.selectPaymentMethod = selectPaymentMethod;
window.placeOrder = placeOrder;
window.closeOrderSuccess = closeOrderSuccess;
window.confirmOrderWhatsApp = confirmOrderWhatsApp;
window.cancelOrderWhatsApp = cancelOrderWhatsApp;
window.filterCategory = filterCategory;
window.applyFilters = applyFilters;
window.filterByRating = filterByRating;
window.updatePriceLabel = updatePriceLabel;
window.sortProducts = sortProducts;
window.globalSearch = globalSearch;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleMobileFilters = toggleMobileFilters;
window.closeAll = closeAll;
window.handleContactSubmit = handleContactSubmit;
window.subscribeNewsletter = subscribeNewsletter;
window.openCustomerService = openCustomerService;
window.closeCustomerService = closeCustomerService;
window.openWhatsAppChat = openWhatsAppChat;
window.openReturnModal = openReturnModal;
window.closeReturnModal = closeReturnModal;
window.previewReturnVideo = previewReturnVideo;
window.removeReturnVideo = removeReturnVideo;
window.handleReturnSubmit = handleReturnSubmit;
window.showReturnPolicy = showReturnPolicy;
window.closeReturnPolicy = closeReturnPolicy;
window.showSizeGuide = showSizeGuide;
window.openGiftBoxModal = openGiftBoxModal;
window.closeGiftBoxModal = closeGiftBoxModal;
window.showSaleProducts = showSaleProducts;
window.showAllProducts = showAllProducts;
window.scrollToTop = scrollToTop;
window.hidePreloader = hidePreloader;
window.copyToClipboard = copyToClipboard;
window.verifyTxnId = verifyTxnId;
window.populateCityDropdown = populateCityDropdown;


// ==========================================
// MOBILE CART BUTTON INSTANT VISIBILITY FIX
// ==========================================
(function() {
    // Fix for mobile: ensure buttons are visible immediately when cart opens
    const originalToggleCart = window.toggleCart;
    window.toggleCart = function() {
        originalToggleCart();

        // On mobile, force buttons to be visible immediately
        if (window.innerWidth <= 768) {
            setTimeout(function() {
                const continueBtn = document.querySelector('.cart-footer .btn-continue');
                const checkoutBtn = document.querySelector('.cart-footer .btn-checkout');

                if (continueBtn) {
                    continueBtn.style.opacity = '1';
                    continueBtn.style.visibility = 'visible';
                    continueBtn.style.transform = 'none';
                    continueBtn.style.animation = 'none';
                    continueBtn.style.webkitAnimation = 'none';
                    continueBtn.style.transition = 'background-color 0.15s ease';
                }

                if (checkoutBtn) {
                    checkoutBtn.style.opacity = '1';
                    checkoutBtn.style.visibility = 'visible';
                    checkoutBtn.style.transform = 'none';
                    checkoutBtn.style.animation = 'none';
                    checkoutBtn.style.webkitAnimation = 'none';
                    checkoutBtn.style.transition = 'background-color 0.15s ease';
                }
            }, 0); // Run immediately after toggle
        }
    };
})();




// ==========================================
// CATEGORIES DROPDOWN TOGGLE
// ==========================================
function toggleCategoriesDropdown(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropdown = document.getElementById('categories-dropdown');
    const dropdownMenu = dropdown.querySelector('.dropdown');
    const isActive = dropdown.classList.contains('dropdown-active');

    // Close all other dropdowns first
    document.querySelectorAll('.has-dropdown').forEach(d => {
        d.classList.remove('dropdown-active');
    });

    // Toggle current dropdown
    if (!isActive) {
        dropdown.classList.add('dropdown-active');
        // Force dropdown to be visible and above everything
        if (dropdownMenu) {
            dropdownMenu.style.zIndex = '999999';
            dropdownMenu.style.position = 'absolute';
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('categories-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('dropdown-active');
    }
});

// Close dropdown on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const dropdown = document.getElementById('categories-dropdown');
        if (dropdown) dropdown.classList.remove('dropdown-active');
    }
});

// Export for global access
window.toggleCategoriesDropdown = toggleCategoriesDropdown;


console.log('✅ SHADE VERSION v3.0 — Aurevyn JS loaded with Shade Selector!');

// ==========================================
// NAVBAR SCROLL SHADOW EFFECT
// ==========================================
(function() {
    function updateNavbarShadow() {
        const header = document.getElementById('header') || document.querySelector('.main-header');
        if (!header) return;

        if (window.scrollY > 10) {
            header.style.boxShadow = '0 4px 30px rgba(139, 90, 43, 0.2)';
            header.classList.add('scrolled');
        } else {
            header.style.boxShadow = '0 2px 20px rgba(139, 90, 43, 0.1)';
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNavbarShadow, { passive: true });
    // Run once on load
    updateNavbarShadow();
})();

// ==========================================
// REVIEWS SYSTEM - COMPLETE FUNCTIONS
// Trust Building Reviews Feature
// ==========================================

// Reviews Data Storage
let productReviews = JSON.parse(localStorage.getItem('aurevynReviews')) || {};
let currentReviewProductId = null;
let currentReviewRating = 0;
let currentReviewFilter = 'all';
let currentReviewSort = 'newest';
let currentReviewPage = 1;
const REVIEWS_PER_PAGE = 5;

// Sample Reviews Data (pre-populated for trust building)
const sampleReviews = {
  1: [
    { id: 1, name: "Sarah Ahmed", rating: 5, title: "Absolutely love this lipstick!", text: "The color is so vibrant and it lasts all day without fading. I've received so many compliments. Will definitely buy again!", date: "2026-04-15", verified: true, helpful: 24, photos: [] },
    { id: 2, name: "Fatima Khan", rating: 5, title: "Best lipstick I've ever used", text: "Long-lasting, moisturizing, and the shade is perfect for my skin tone. Highly recommend to everyone!", date: "2026-04-10", verified: true, helpful: 18, photos: [] },
    { id: 3, name: "Ayesha Malik", rating: 4, title: "Great quality but slightly pricey", text: "The quality is amazing and it stays on for hours. Only reason for 4 stars is the price, but it's worth it for the quality.", date: "2026-04-05", verified: true, helpful: 12, photos: [] },
    { id: 4, name: "Zara Hassan", rating: 5, title: "Perfect for daily use", text: "I use this every day for work. It's not too heavy and gives a natural look. Love it!", date: "2026-03-28", verified: true, helpful: 8, photos: [] },
    { id: 5, name: "Maria Iqbal", rating: 5, title: "Gifted to my sister, she loved it!", text: "Bought this as a gift and my sister absolutely loved it. The packaging is also very elegant.", date: "2026-03-20", verified: true, helpful: 15, photos: [] },
    { id: 6, name: "Nadia Farooq", rating: 4, title: "Good but takes time to dry", text: "Color is beautiful but it takes a few minutes to completely dry. Once dry, it stays on perfectly.", date: "2026-03-15", verified: false, helpful: 5, photos: [] },
    { id: 7, name: "Hina Tariq", rating: 5, title: "My go-to lipstick now", text: "I've tried many brands but this one is by far the best. The texture is smooth and it doesn't dry out my lips.", date: "2026-03-10", verified: true, helpful: 22, photos: [] }
  ],
  2: [
    { id: 1, name: "Amina Shah", rating: 5, title: "Flawless coverage!", text: "This foundation gives the most natural finish. It covers all imperfections without looking cakey. Absolutely love it!", date: "2026-04-12", verified: true, helpful: 30, photos: [] },
    { id: 2, name: "Rabia Ali", rating: 5, title: "Best foundation for Pakistani skin", text: "Finally found a foundation that matches my skin tone perfectly. The shade range is amazing for South Asian skin tones.", date: "2026-04-08", verified: true, helpful: 25, photos: [] },
    { id: 3, name: "Sana Javed", rating: 4, title: "Great but needs setting powder", text: "The foundation itself is excellent but I recommend using a setting powder for oily skin types. Lasts about 6-7 hours without touch-ups.", date: "2026-04-01", verified: true, helpful: 14, photos: [] },
    { id: 4, name: "Kiran Aslam", rating: 5, title: "Wedding day essential", text: "Used this for my sister's wedding and it stayed perfect through all the crying and dancing! Highly recommend for special occasions.", date: "2026-03-25", verified: true, helpful: 20, photos: [] }
  ],
  3: [
    { id: 1, name: "Mehreen Akhtar", rating: 5, title: "Beautiful natural glow", text: "This blush gives such a natural rosy glow. It's not too pigmented so you can build it up. Perfect for everyday makeup!", date: "2026-04-14", verified: true, helpful: 16, photos: [] },
    { id: 2, name: "Tania Qureshi", rating: 4, title: "Nice color but small size", text: "The color is beautiful and blendable. I just wish it came in a bigger size because I use it so often!", date: "2026-04-06", verified: true, helpful: 9, photos: [] },
    { id: 3, name: "Bushra Khan", rating: 5, title: "Perfect for beginners", text: "As someone new to makeup, this blush is very forgiving. It's hard to over-apply and looks natural every time.", date: "2026-03-30", verified: true, helpful: 11, photos: [] }
  ],
  4: [
    { id: 1, name: "Laiba Ahmed", rating: 5, title: "Dramatic lashes in one coat!", text: "This mascara is incredible! One coat gives me dramatic volume and length. No clumping at all. My new favorite!", date: "2026-04-11", verified: true, helpful: 19, photos: [] },
    { id: 2, name: "Farah Naz", rating: 5, title: "No smudging even in humidity", text: "I live in Karachi where it's very humid, but this mascara never smudges. Even after 10 hours, it looks fresh!", date: "2026-04-03", verified: true, helpful: 21, photos: [] },
    { id: 3, name: "Samina Riaz", rating: 4, title: "Good but needs two coats", text: "One coat is nice but two coats give the best results. The formula is buildable without clumping which is great.", date: "2026-03-22", verified: true, helpful: 7, photos: [] }
  ],
  5: [
    { id: 1, name: "Noreen Fatima", rating: 5, title: "Precise application every time", text: "The tip is so fine that I can create the perfect winged liner every time. It's also very black and long-lasting.", date: "2026-04-09", verified: true, helpful: 13, photos: [] },
    { id: 2, name: "Asma Siddiqui", rating: 5, title: "Beginner friendly!", text: "I've always struggled with eyeliner but this one makes it so easy. The felt tip gives great control. Highly recommend for beginners!", date: "2026-04-02", verified: true, helpful: 17, photos: [] }
  ],
  6: [
    { id: 1, name: "Shazia Butt", rating: 5, title: "Professional quality brushes", text: "These brushes are as good as high-end brands! The bristles are soft and don't shed. The variety covers all makeup needs.", date: "2026-04-13", verified: true, helpful: 28, photos: [] },
    { id: 2, name: "Rukhsana Parveen", rating: 5, title: "Worth every penny", text: "I was hesitant because of the price but these brushes are worth it. They've improved my makeup application significantly.", date: "2026-04-07", verified: true, helpful: 22, photos: [] },
    { id: 3, name: "Humaira Sheikh", rating: 4, title: "Great set, one brush shed a bit", text: "9 out of 10 brushes are perfect. One brush shed a few bristles initially but stopped after washing. Overall great value.", date: "2026-03-29", verified: true, helpful: 10, photos: [] }
  ],
  7: [
    { id: 1, name: "Fauzia Rehman", rating: 5, title: "Gorgeous glow!", text: "This highlighter gives the most beautiful glow without looking glittery. It's subtle enough for daytime but buildable for night.", date: "2026-04-16", verified: true, helpful: 15, photos: [] },
    { id: 2, name: "Yasmin Zafar", rating: 5, title: "Multi-purpose product", text: "I use this as eyeshadow too and it looks stunning! Very versatile product. Love the champagne shade.", date: "2026-04-04", verified: true, helpful: 12, photos: [] }
  ],
  8: [
    { id: 1, name: "Sadia Malik", rating: 5, title: "Perfect contour kit", text: "All 4 shades are usable and blend beautifully. The contour shade is perfect for medium skin tones. Very pigmented so a little goes a long way.", date: "2026-04-10", verified: true, helpful: 18, photos: [] },
    { id: 2, name: "Tahira Bano", rating: 4, title: "Good but highlight could be better", text: "The contour and bronzer shades are perfect. The highlight is nice but not as blinding as I prefer. Still a great palette overall.", date: "2026-03-26", verified: true, helpful: 8, photos: [] }
  ],
  9: [
    { id: 1, name: "Riffat Ara", rating: 4, title: "Good oil control", text: "Keeps my oily skin matte for about 4-5 hours. Need to touch up after that but it's very finely milled and doesn't look cakey.", date: "2026-04-08", verified: true, helpful: 11, photos: [] },
    { id: 2, name: "Nuzhat Jahan", rating: 5, title: "Perfect setting powder", text: "Sets my foundation beautifully without adding extra coverage. The compact is also very sturdy and travel-friendly.", date: "2026-03-31", verified: true, helpful: 14, photos: [] }
  ],
  10: [
    { id: 1, name: "Shabina Kausar", rating: 5, title: "18 beautiful shades!", text: "Every single shade in this palette is gorgeous and pigmented. The mattes blend seamlessly and the shimmers are buttery. Best palette I've owned!", date: "2026-04-15", verified: true, helpful: 35, photos: [] },
    { id: 2, name: "Farkhanda Iqbal", rating: 5, title: "Wedding makeup essential", text: "Used this for my bridal makeup and created the most beautiful eye look. The shades are perfect for Pakistani wedding makeup.", date: "2026-04-05", verified: true, helpful: 27, photos: [] },
    { id: 3, name: "Nighat Abbas", rating: 5, title: "Versatile for day and night", text: "The neutral shades are perfect for everyday and the darker shades create beautiful smoky eyes for night. Very versatile palette.", date: "2026-03-28", verified: true, helpful: 19, photos: [] },
    { id: 4, name: "Razia Sultana", rating: 4, title: "Great pigmentation, some fallout", text: "The colors are very pigmented and blendable. There is some fallout with the shimmers but it's manageable. Use a primer for best results.", date: "2026-03-18", verified: true, helpful: 13, photos: [] }
  ],
  11: [
    { id: 1, name: "Kausar Parveen", rating: 5, title: "Quick dry and long lasting", text: "Dries in under a minute and lasts a whole week without chipping. The colors are very trendy and vibrant.", date: "2026-04-12", verified: true, helpful: 16, photos: [] },
    { id: 2, name: "Suraiya Begum", rating: 4, title: "Nice colors, need base coat", text: "Beautiful colors but I recommend using a base coat for better longevity. Without it, chips after 3-4 days.", date: "2026-04-01", verified: true, helpful: 9, photos: [] }
  ],
  12: [
    { id: 1, name: "Nafisa Khatoon", rating: 5, title: "Visible results in 2 weeks!", text: "My skin has never looked better! The dark spots have faded significantly and my skin looks brighter. Will repurchase forever!", date: "2026-04-14", verified: true, helpful: 32, photos: [] },
    { id: 2, name: "Shabana Aziz", rating: 5, title: "Best serum for Pakistani skin", text: "Living in Pakistan, our skin faces a lot of sun damage. This serum has really helped with pigmentation and dullness. Highly recommend!", date: "2026-04-06", verified: true, helpful: 26, photos: [] },
    { id: 3, name: "Rashida Tariq", rating: 4, title: "Good but expensive", text: "The results are amazing but the price is a bit high. However, a little goes a long way so the bottle lasts about 2 months. Worth the investment.", date: "2026-03-25", verified: true, helpful: 18, photos: [] },
    { id: 4, name: "Mussarat Ali", rating: 5, title: "Finally found my holy grail!", text: "I've tried countless Vitamin C serums and this is the only one that actually worked. My skin is glowing and even-toned now.", date: "2026-03-15", verified: true, helpful: 21, photos: [] }
  ]
};

// Initialize sample reviews if not already stored
function initializeSampleReviews() {
  if (!localStorage.getItem('aurevynReviewsInitialized')) {
    productReviews = { ...sampleReviews };
    saveReviews();
    localStorage.setItem('aurevynReviewsInitialized', 'true');
  }
}

// Save reviews to localStorage
function saveReviews() {
  localStorage.setItem('aurevynReviews', JSON.stringify(productReviews));
}

// Get reviews for a product
function getProductReviews(productId) {
  return productReviews[productId] || [];
}

// Get average rating for a product
function getAverageRating(productId) {
  const reviews = getProductReviews(productId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

// Get total reviews count for a product
function getTotalReviews(productId) {
  return getProductReviews(productId).length;
}

// Get rating distribution
function getRatingDistribution(productId) {
  const reviews = getProductReviews(productId);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (distribution[r.rating] !== undefined) distribution[r.rating]++;
  });
  return distribution;
}

// Open Reviews Modal
function openReviewsModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentReviewProductId = productId;
  currentReviewPage = 1;
  currentReviewFilter = 'all';
  currentReviewSort = 'newest';

  const modal = document.getElementById('reviews-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Scroll modal content to top
    const content = modal.querySelector('.reviews-content');
    if (content) content.scrollTop = 0;
    // Also scroll modal itself to top (for mobile)
    modal.scrollTop = 0;
  }

  // Load product info
  loadReviewsProductInfo(product);

  // Load stats
  loadReviewsStats(productId);

  // Load reviews
  loadReviewsList(productId);

  // Reset form
  resetReviewForm();
  updateFloatingButtons();
}

// Close Reviews Modal
function closeReviewsModal() {
  const modal = document.getElementById('reviews-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  currentReviewProductId = null;
  updateFloatingButtons();
}

// Load product info in reviews modal
function loadReviewsProductInfo(product) {
  const container = document.getElementById('reviews-product-info');
  if (!container) return;

  container.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <div class="product-meta">
      <h3>${product.name}</h3>
    </div>
  `;
}

// Load reviews stats
function loadReviewsStats(productId) {
  const container = document.getElementById('reviews-stats');
  if (!container) return;

  const avgRating = getAverageRating(productId);
  const totalReviews = getTotalReviews(productId);
  const distribution = getRatingDistribution(productId);

  let barsHTML = '';
  for (let i = 5; i >= 1; i--) {
    const count = distribution[i] || 0;
    const percentage = totalReviews > 0 ? (count / totalReviews * 100).toFixed(0) : 0;
    barsHTML += `
      <div class="rating-bar-item">
        <span class="star-label">${i} star</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
        <span class="bar-count">${count}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="overall-rating">
      <div class="big-rating">${avgRating}</div>
      <div class="stars">${generateStars(parseFloat(avgRating))}</div>
      <div class="total-count">${totalReviews} reviews</div>
    </div>
    <div class="rating-bars">
      ${barsHTML}
    </div>
  `;
}

// Load reviews list
function loadReviewsList(productId) {
  const container = document.getElementById('reviews-list');
  if (!container) return;

  let reviews = getProductReviews(productId);

  // Apply filter
  if (currentReviewFilter === 'verified') {
    reviews = reviews.filter(r => r.verified);
  } else if (currentReviewFilter === '5star') {
    reviews = reviews.filter(r => r.rating === 5);
  } else if (currentReviewFilter === '4star') {
    reviews = reviews.filter(r => r.rating === 4);
  } else if (currentReviewFilter === '3star') {
    reviews = reviews.filter(r => r.rating === 3);
  } else if (currentReviewFilter === 'photo') {
    reviews = reviews.filter(r => r.photos && r.photos.length > 0);
  }

  // Apply sort
  if (currentReviewSort === 'newest') {
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentReviewSort === 'highest') {
    reviews.sort((a, b) => b.rating - a.rating);
  } else if (currentReviewSort === 'lowest') {
    reviews.sort((a, b) => a.rating - b.rating);
  } else if (currentReviewSort === 'helpful') {
    reviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
  }

  // Pagination
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const start = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
  const paginatedReviews = reviews.slice(start, start + REVIEWS_PER_PAGE);

  if (paginatedReviews.length === 0) {
    container.innerHTML = `
      <div class="review-item" style="text-align: center; padding: 40px;">
        <i class="fas fa-comment-slash" style="font-size: 48px; color: var(--cream-dark); margin-bottom: 15px; display: block;"></i>
        <p style="color: var(--text-light); font-size: 16px;">No reviews found for this filter.</p>
        <p style="color: var(--text-light); font-size: 14px; margin-top: 8px;">Be the first to write a review!</p>
      </div>
    `;
  } else {
    container.innerHTML = paginatedReviews.map(review => createReviewItem(review)).join('');
  }

  // Load pagination
  loadReviewsPagination(totalPages);
}

// Create review item HTML
function createReviewItem(review) {
  const avatarLetter = review.name.charAt(0).toUpperCase();
  const verifiedBadge = review.verified ? `
    <span class="review-verified-badge">
      <i class="fas fa-check-circle"></i> Verified Purchase
    </span>
  ` : '';

  const photosHTML = review.photos && review.photos.length > 0 ? `
    <div class="review-photos">
      ${review.photos.map(photo => `<img src="${photo}" alt="Review photo" onclick="viewReviewPhoto('${photo}')">`).join('')}
    </div>
  ` : '';

  return `
    <div class="review-item" data-review-id="${review.id}">
      <div class="review-header">
        <div class="review-author">
          <div class="review-avatar">${avatarLetter}</div>
          <div class="review-author-info">
            <h5>${review.name}</h5>
            <span class="review-date">${formatReviewDate(review.date)}</span>
          </div>
        </div>
        ${verifiedBadge}
      </div>
      <div class="review-rating">
        <div class="stars">${generateStars(review.rating)}</div>
        <span class="review-title-text">${review.title}</span>
      </div>
      <div class="review-content">${review.text}</div>
      ${photosHTML}
      <div class="review-actions">
        <div class="review-helpful">
          <span>Was this helpful?</span>
          <button onclick="markReviewHelpful(${review.id})" class="${review.userHelped ? 'liked' : ''}">
            <i class="fas fa-thumbs-up"></i> ${review.helpful || 0}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Format review date
function formatReviewDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Load reviews pagination
function loadReviewsPagination(totalPages) {
  const container = document.getElementById('reviews-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `<button ${currentReviewPage === 1 ? 'disabled' : ''} onclick="goToReviewPage(${currentReviewPage - 1})"><i class="fas fa-chevron-left"></i></button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentReviewPage - 1 && i <= currentReviewPage + 1)) {
      html += `<button class="${i === currentReviewPage ? 'active' : ''}" onclick="goToReviewPage(${i})">${i}</button>`;
    } else if (i === currentReviewPage - 2 || i === currentReviewPage + 2) {
      html += `<button disabled>...</button>`;
    }
  }

  // Next button
  html += `<button ${currentReviewPage === totalPages ? 'disabled' : ''} onclick="goToReviewPage(${currentReviewPage + 1})"><i class="fas fa-chevron-right"></i></button>`;

  container.innerHTML = html;
}

// Go to review page
function goToReviewPage(page) {
  currentReviewPage = page;
  loadReviewsList(currentReviewProductId);
  const reviewsList = document.getElementById('reviews-list');
  if (reviewsList) reviewsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Filter reviews
function filterReviews(filter) {
  currentReviewFilter = filter;
  currentReviewPage = 1;

  // Update active button
  document.querySelectorAll('.review-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  loadReviewsList(currentReviewProductId);
}

// Sort reviews
function sortReviews(sortType) {
  currentReviewSort = sortType;
  currentReviewPage = 1;
  loadReviewsList(currentReviewProductId);
}

// Set review rating
function setReviewRating(rating) {
  currentReviewRating = rating;
  document.getElementById('review-rating-value').value = rating;

  const stars = document.querySelectorAll('#star-rating-input i');
  const ratingTexts = {
    1: 'Poor - 1 star',
    2: 'Fair - 2 stars',
    3: 'Average - 3 stars',
    4: 'Good - 4 stars',
    5: 'Excellent - 5 stars'
  };

  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.remove('far');
      star.classList.add('fas', 'selected');
    } else {
      star.classList.remove('fas', 'selected');
      star.classList.add('far');
    }
  });

  document.getElementById('rating-text').textContent = ratingTexts[rating] || 'Click to rate';
}

// Preview review photos
let reviewPhotoFiles = [];

function previewReviewPhotos(input) {
  const previewGrid = document.getElementById('photo-preview-grid');
  if (!previewGrid) return;

  if (input.files && input.files.length > 0) {
    const newFiles = Array.from(input.files).slice(0, 3 - reviewPhotoFiles.length);

    newFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Max 5MB per photo');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        reviewPhotoFiles.push(e.target.result);
        updatePhotoPreview();
      };
      reader.readAsDataURL(file);
    });
  }
}

function updatePhotoPreview() {
  const previewGrid = document.getElementById('photo-preview-grid');
  if (!previewGrid) return;

  previewGrid.innerHTML = reviewPhotoFiles.map((photo, index) => `
    <div class="photo-preview-item">
      <img src="${photo}" alt="Preview">
      <button type="button" class="remove-photo" onclick="removeReviewPhoto(${index})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
}

function removeReviewPhoto(index) {
  reviewPhotoFiles.splice(index, 1);
  updatePhotoPreview();
}

// Submit review
function submitReview(e) {
  e.preventDefault();

  if (currentReviewRating === 0) {
    showToast('error', 'Rating Required', 'Please select a star rating');
    return;
  }

  const name = document.getElementById('review-name').value.trim();
  const title = document.getElementById('review-title').value.trim();
  const text = document.getElementById('review-text').value.trim();
  const verified = document.getElementById('review-verified').checked;

  if (!name || !title || !text) {
    showToast('error', 'Missing Fields', 'Please fill in all required fields');
    return;
  }

  const newReview = {
    id: Date.now(),
    name: name,
    rating: currentReviewRating,
    title: title,
    text: text,
    date: new Date().toISOString().split('T')[0],
    verified: verified,
    helpful: 0,
    photos: [...reviewPhotoFiles],
    userHelped: false
  };

  if (!productReviews[currentReviewProductId]) {
    productReviews[currentReviewProductId] = [];
  }

  productReviews[currentReviewProductId].unshift(newReview);
  saveReviews();

  // ── Formspree mein save karo (email aayegi aapko) ──
  const product = products.find(p => p.id === currentReviewProductId);
  fetch(FORMSPREE_REVIEWS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      productId:   currentReviewProductId,
      productName: product ? product.name : 'Unknown',
      rating:      currentReviewRating,
      name:        name,
      title:       title,
      review:      text,
      verified:    verified ? 'Yes' : 'No',
      date:        new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
    })
  }).catch(function(err) {
    console.warn('Review save failed (Formspree):', err);
  });

  // Update product card rating display
  updateProductCardReviews(currentReviewProductId);

  // Reload reviews
  loadReviewsStats(currentReviewProductId);
  loadReviewsList(currentReviewProductId);

  // Reset form
  resetReviewForm();

  showToast('success', 'Review Submitted!', 'Thank you for your feedback!');
}

// Reset review form
function resetReviewForm() {
  currentReviewRating = 0;
  reviewPhotoFiles = [];

  document.getElementById('review-rating-value').value = '0';
  document.getElementById('review-name').value = '';
  document.getElementById('review-title').value = '';
  document.getElementById('review-text').value = '';
  document.getElementById('review-verified').checked = true;
  document.getElementById('rating-text').textContent = 'Click to rate';

  const stars = document.querySelectorAll('#star-rating-input i');
  stars.forEach(star => {
    star.classList.remove('fas', 'selected');
    star.classList.add('far');
  });

  const previewGrid = document.getElementById('photo-preview-grid');
  if (previewGrid) previewGrid.innerHTML = '';

  const photoInput = document.getElementById('review-photos');
  if (photoInput) photoInput.value = '';
}

// Mark review as helpful
function markReviewHelpful(reviewId) {
  const reviews = productReviews[currentReviewProductId];
  if (!reviews) return;

  const review = reviews.find(r => r.id === reviewId);
  if (!review) return;

  if (review.userHelped) {
    review.helpful = Math.max(0, (review.helpful || 0) - 1);
    review.userHelped = false;
  } else {
    review.helpful = (review.helpful || 0) + 1;
    review.userHelped = true;
  }

  saveReviews();
  loadReviewsList(currentReviewProductId);
}

// View review photo (simple alert for now, can be expanded)
function viewReviewPhoto(photo) {
  window.open(photo, '_blank');
}

// Update product card with reviews info
function updateProductCardReviews(productId) {
  const avgRating = getAverageRating(productId);
  const totalReviews = getTotalReviews(productId);

  const cards = document.querySelectorAll(`.product-card[data-id="${productId}"]`);
  cards.forEach(card => {
    const ratingEl = card.querySelector('.product-rating');
    if (ratingEl) {
      const existingLink = ratingEl.querySelector('.product-reviews-link');
      if (existingLink) existingLink.remove();

      const reviewsLink = document.createElement('span');
      reviewsLink.className = 'product-reviews-link';
      reviewsLink.innerHTML = `<i class="fas fa-comment"></i> ${totalReviews} reviews`;
      reviewsLink.style.cssText = 'position:relative;z-index:10;pointer-events:all;cursor:pointer;';
      reviewsLink.onclick = (e) => { e.stopPropagation(); openReviewsModal(productId); };
      reviewsLink.addEventListener('touchend', (e) => { e.stopPropagation(); e.preventDefault(); openReviewsModal(productId); }, { passive: false });
      ratingEl.appendChild(reviewsLink);
    }
  });
}

// Update all product cards with reviews
function updateAllProductCardsWithReviews() {
  products.forEach(product => {
    updateProductCardReviews(product.id);
  });
}

// Scroll to reviews section on homepage
function scrollToReviews() {
  const reviewsSection = document.getElementById('home-reviews');
  if (reviewsSection) {
    reviewsSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    // If no dedicated reviews section, scroll to testimonials
    const testimonials = document.querySelector('.testimonials-section');
    if (testimonials) testimonials.scrollIntoView({ behavior: 'smooth' });
  }
}

// Initialize reviews system
function initReviewsSystem() {
  initializeSampleReviews();

  // Add reviews link to product cards after they're loaded
  setTimeout(() => {
    updateAllProductCardsWithReviews();
  }, 1000);

  // Add star rating hover effects
  const starInputs = document.querySelectorAll('#star-rating-input i');
  starInputs.forEach((star, index) => {
    star.addEventListener('mouseenter', () => {
      starInputs.forEach((s, i) => {
        if (i <= index) {
          s.classList.add('hovered');
        } else {
          s.classList.remove('hovered');
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      starInputs.forEach(s => s.classList.remove('hovered'));
    });
  });
}

// Add reviews link to product card HTML generation
const originalCreateProductCard = window.createProductCard;
window.createProductCard = function(product) {
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
  const inWishlist = wishlist.includes(product.id);
  const avgRating = getAverageRating(product.id);
  const totalReviews = getTotalReviews(product.id);

  return `
    <div class="product-card" data-id="${product.id}" data-category="${product.category}" data-price="${product.price}" data-rating="${product.rating}">
      ${renderProductBadges(product)}
      <div class="product-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlistItem(${product.id})">
        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
      </div>
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-actions">
          <button class="action-btn" onclick="openQuickView(${product.id})" title="Quick View"><i class="fas fa-eye"></i></button>
          <button class="action-btn" onclick="addToCart(${product.id})" title="Add to Cart"><i class="fas fa-shopping-bag"></i></button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3>${product.name}</h3>
        <div class="product-rating">
          <div class="stars">${generateStars(product.rating)}</div>
          <span class="rating-count">(${formatNumber(product.reviews)})</span>
          <span class="product-reviews-link" onclick="openReviewsModal(${product.id})"><i class="fas fa-comment"></i> ${totalReviews} reviews</span>
        </div>
        <div class="product-price">
          <span class="current-price">PKR ${product.price}</span>
          ${product.oldPrice ? `<span class="old-price">PKR ${product.oldPrice}</span>` : ''}
          ${discount ? `<span class="discount">-${discount}%</span>` : ''}
        </div>
        <button class="add-to-cart" onclick="addToCart(${product.id})">
          <i class="fas fa-shopping-bag"></i> Add to Cart
        </button>
      </div>
    </div>
  `;
};

// Export functions for global access
window.openReviewsModal = openReviewsModal;
window.closeReviewsModal = closeReviewsModal;
window.filterReviews = filterReviews;
window.sortReviews = sortReviews;
window.setReviewRating = setReviewRating;
window.previewReviewPhotos = previewReviewPhotos;
window.removeReviewPhoto = removeReviewPhoto;
window.submitReview = submitReview;
window.markReviewHelpful = markReviewHelpful;
window.goToReviewPage = goToReviewPage;
window.viewReviewPhoto = viewReviewPhoto;
window.scrollToReviews = scrollToReviews;

// Initialize on app start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReviewsSystem);
} else {
  initReviewsSystem();
}

console.log('✅ Reviews System loaded - Trust building feature ready!');

// ==========================================
// DARK MODE SYSTEM
// ==========================================
// NOTE: Dark mode choice is intentionally NOT remembered between visits.
// Every time the page loads (even a refresh), it starts in light mode.
// Dark mode only turns on for the current visit if the customer taps
// the toggle button themselves.

let isDarkMode = false;

function initDarkMode() {
  // Always start in light mode - previous session's choice is ignored
  isDarkMode = false;
  enableLightMode(false);
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;

  if (isDarkMode) {
    enableDarkMode(true);
    showToast('success', 'Dark Mode Enabled', 'Switched to dark theme', 1500);
  } else {
    enableLightMode(true);
    showToast('success', 'Light Mode Enabled', 'Switched to light theme', 1500);
  }

  // Not saved to localStorage on purpose - resets to light mode next visit
}

function enableDarkMode(animate = true) {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark-mode');

  // Update floating button icon + label
  const icon = document.getElementById('dark-mode-icon');
  const floatBtn = document.getElementById('dark-mode-float');
  const label = floatBtn ? floatBtn.querySelector('.dm-float-label') : null;

  if (icon) {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }
  if (floatBtn) {
    floatBtn.classList.remove('light-state');
    floatBtn.title = 'Switch to Light Mode';
  }
  if (label) label.textContent = 'Light';

  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', '#16213e');
  }
}

function enableLightMode(animate = true) {
  document.documentElement.removeAttribute('data-theme');
  document.body.classList.remove('dark-mode');
  document.body.classList.add('light-mode');

  // Update floating button icon + label
  const icon = document.getElementById('dark-mode-icon');
  const floatBtn = document.getElementById('dark-mode-float');
  const label = floatBtn ? floatBtn.querySelector('.dm-float-label') : null;

  if (icon) {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  }
  if (floatBtn) {
    floatBtn.classList.add('light-state');
    floatBtn.title = 'Switch to Dark Mode';
  }
  if (label) label.textContent = 'Dark';

  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', '#A67B5B');
  }
}

// NOTE: We intentionally do NOT listen for system/OS theme changes anymore.
// The site always starts in light mode and only switches to dark mode
// when the customer manually taps the dark mode toggle button.

// Initialize dark mode on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}

// Export for global access
window.toggleDarkMode = toggleDarkMode;
window.enableDarkMode = enableDarkMode;
window.enableLightMode = enableLightMode;

console.log('✅ Dark Mode System loaded!');

// ==========================================
// FLOATING BUTTONS VISIBILITY HELPER
// Show go-to-top & whatsapp ONLY on home page (no modal/sidebar open)
// ==========================================
function updateFloatingButtons() {
    const goToTop = document.querySelector('.go-to-top');
    const chatWidget = document.querySelector('.live-chat-widget');

    const anyModalOpen =
        document.querySelector('.checkout-modal.active') ||
        document.querySelector('.quick-view-modal.active') ||
        document.querySelector('.order-success-modal.active') ||
        document.querySelector('.return-modal.active') ||
        document.querySelector('.reviews-modal.active') ||
        document.querySelector('.cart-sidebar.active') ||
        document.querySelector('.wishlist-modal.active');

    const hide = !!anyModalOpen;

    if (chatWidget) chatWidget.style.visibility = hide ? 'hidden' : '';
    if (goToTop) {
        if (hide) {
            goToTop.style.visibility = 'hidden';
            goToTop.classList.remove('visible');
        } else {
            goToTop.style.visibility = '';
        }
    }
}
window.updateFloatingButtons = updateFloatingButtons;

// ==========================================
// ANNOUNCEMENT BAR
// ==========================================
function initAnnouncementBar() {
  const bar = document.getElementById('announcement-bar');
  if (!bar) return;

  if (sessionStorage.getItem('announcementClosed') === 'true') {
    bar.classList.add('hidden');
    document.body.classList.remove('has-announcement-bar');
    return;
  }

  document.body.classList.add('has-announcement-bar');
}

function closeAnnouncementBar() {
  const bar = document.getElementById('announcement-bar');
  if (!bar) return;

  bar.classList.add('hidden');
  document.body.classList.remove('has-announcement-bar');
  sessionStorage.setItem('announcementClosed', 'true');
}

window.closeAnnouncementBar = closeAnnouncementBar;

// ==========================================
// LIVE CHAT WIDGET
// ==========================================
let chatOpen = false;

function toggleChatWidget() {
  chatOpen = !chatOpen;
  const popup = document.getElementById('chat-popup');
  const openIcon = document.querySelector('.chat-bubble-btn .open-icon');
  const closeIcon = document.querySelector('.chat-bubble-btn .close-icon');
  const notifDot = document.getElementById('chat-notif-dot');

  if (popup) popup.classList.toggle('open', chatOpen);

  if (openIcon) openIcon.style.display = chatOpen ? 'none' : 'flex';
  if (closeIcon) closeIcon.style.display = chatOpen ? 'flex' : 'none';

  // Hide notif dot once opened
  if (chatOpen && notifDot) notifDot.style.display = 'none';
}

function openWhatsApp(message) {
  const phone = '923258666803';
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}

window.toggleChatWidget = toggleChatWidget;
window.openWhatsApp = openWhatsApp;

// Show notif dot after 4 seconds to attract attention
setTimeout(() => {
  const dot = document.getElementById('chat-notif-dot');
  if (dot && !chatOpen) dot.style.display = 'block';
}, 4000);

// Init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnnouncementBar);
} else {
  initAnnouncementBar();
}

console.log('✅ Announcement Bar + Live Chat Widget loaded!');

// ==========================================
// GRAND OPENING SALE COUNTDOWN TIMER — Fixed: 31 July 2026, 11:59 PM PKT
// ==========================================
(function() {
  'use strict';

  // ── Fixed end date: 31 July 2026, 11:59 PM PKT (UTC+5) ──
  // 11:59 PM PKT = 18:59 UTC on 31 July 2026
  function getSaleEndTime() {
    const endDate = new Date('2026-07-31T18:59:00Z'); // 31 July 2026, 11:59 PM PKT
    const now = Date.now();
    if (endDate.getTime() > now) return endDate.getTime();
    return null; // expired
  }

  function padTwo(n) {
    return String(n).padStart(2, '0');
  }

  function hideSaleSection() {
    const section = document.getElementById('flash-sale');
    if (section) {
      section.style.transition = 'opacity 1s ease, max-height 1s ease';
      section.style.opacity = '0';
      setTimeout(() => { section.style.display = 'none'; }, 1000);
    }
  }

  function updateCountdown() {
    const daysEl    = document.getElementById('flash-days');
    const hoursEl   = document.getElementById('flash-hours');
    const minutesEl = document.getElementById('flash-minutes');
    const secondsEl = document.getElementById('flash-seconds');
    const progressEl = document.getElementById('flash-progress-bar');
    const soldEl    = document.getElementById('flash-sold-count');

    if (!hoursEl) return;

    const endTime = getSaleEndTime();

    // Sale expired — hide the section
    if (!endTime) {
      hideSaleSection();
      return;
    }

    // Total campaign duration: 1 June 2026 → 31 July 2026
    const campaignStart = new Date('2026-06-01T19:00:00Z').getTime();
    const totalMs = getSaleEndTime() ? (new Date('2026-07-31T18:59:00Z').getTime() - campaignStart) : 1;
    const now  = Date.now();
    const diff = Math.max(0, endTime - now);

    if (diff === 0) {
      hideSaleSection();
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    // Tick animation helper
    function animateBox(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const box = el.closest('.countdown-box');
      if (!box) return;
      box.classList.remove('tick');
      void box.offsetWidth;
      box.classList.add('tick');
      setTimeout(() => box.classList.remove('tick'), 150);
    }

    if (daysEl) {
      const prevD = daysEl.textContent;
      if (prevD !== padTwo(d)) animateBox('flash-days');
      daysEl.textContent = padTwo(d);
    }

    const prevS = secondsEl.textContent;
    if (prevS !== padTwo(s)) animateBox('flash-seconds');
    const prevM = minutesEl.textContent;
    if (prevM !== padTwo(m)) animateBox('flash-minutes');
    const prevH = hoursEl.textContent;
    if (prevH !== padTwo(h)) animateBox('flash-hours');

    hoursEl.textContent   = padTwo(h);
    minutesEl.textContent = padTwo(m);
    secondsEl.textContent = padTwo(s);

    // Progress bar shrinks as time runs out
    const elapsed   = totalMs - diff;
    const remaining = 100 - Math.min(100, (elapsed / totalMs) * 100);
    if (progressEl) progressEl.style.width = remaining + '%';

    // NOTE: Sold counter removed — was auto-incrementing fake data.
    // To show real orders, connect Google Sheets API and update soldEl here.
  }

  function initEidSale() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEidSale);
  } else {
    initEidSale();
  }
})();
