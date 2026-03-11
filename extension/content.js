// ══════════════════════════════════════════════════════════════════
//  content.js — Sentience Context Detection Engine v2
//  ─────────────────────────────────────────────────────────────────
//  Detects 6 financial context types on any webpage:
//  1. checkout   — e-commerce checkout/payment pages
//  2. banking    — bank dashboards and account views
//  3. crypto     — cryptocurrency exchanges and wallets
//  4. budget     — budgeting tools, spreadsheets, finance apps
//  5. investing  — brokerage and stock market pages
//  6. shopping   — product pages and shopping carts
//
//  Also injects:
//  · Mini HUD — persistent unobtrusive indicator at top-right
//  · Context banner — richer checkout banner with product + price
//
//  Context data sent to background includes:
//  · contextType, store, productName, price, totalAmount
//  · visiblePrices[], pageCategory, pageTitle, url, timestamp
//  · budgetCategory (inferred from product/category text)
// ══════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────
//  CONTEXT DETECTION RULES
// ──────────────────────────────────────────────────────────────────

const RULES = {
  checkout: {
    urls: [
      /amazon\.(com|co\.uk|ca|de|fr|it|es).*(gp\/buy|checkout|cart)/i,
      /ebay\.com.*(checkout|order-confirm)/i,
      /walmart\.com.*checkout/i,
      /target\.com.*checkout/i,
      /bestbuy\.com.*checkout/i,
      /etsy\.com.*(checkout|purchase)/i,
      /shopify\.(com|store).*checkout/i,
      // ── Daraz (BD, PK, NP, LK, MM) ──
      /daraz\.(com\.bd|pk|com\.np|lk|com\.mm).*(checkout|cart|order)/i,
      /\/checkout/i,
      /\/cart\/checkout/i,
      /\/order\/review/i,
      /\/buy\/confirm/i,
      /\/payment/i,
      /paypal\.com.*(checkout|pay)/i,
      /stripe\.com.*checkout/i,
    ],
    selectors: [
      '[id*="placeOrder"]', '[id*="place-order"]',
      '[name*="placeYourOrder"]', '[data-testid*="checkout"]',
      'button[class*="checkout"]', 'input[value*="Place your order"]',
      'button[aria-label*="Place your order"]', '#buy-now-button',
      '[data-action="place-order"]', '.btn-checkout', '[id*="submit-order"]',
      // Daraz checkout selectors
      '.next-btn', '[class*="checkout-btn"]', '[data-spm*="checkout"]',
      '[class*="place-order"]', '#place-order-btn',
    ],
    text: [
      'place your order', 'place order', 'complete purchase',
      'confirm and pay', 'review your order', 'pay now', 'confirm order',
      'buy now', 'complete order', 'finish purchase',
      // Daraz-specific
      'proceed to pay', 'place order now', 'cod', 'cash on delivery',
      'bkash', 'nagad', 'confirm payment',
    ],
    priority: 1,
  },

  banking: {
    urls: [
      /chase\.com/i, /bankofamerica\.com/i, /wellsfargo\.com/i,
      /citi(bank)?\.com/i, /usbank\.com/i, /capitalone\.com/i,
      /barclays\.(com|co\.uk)/i, /hsbc\.(com|co\.uk)/i,
      /lloydsbank\.com/i, /nationwide\.co\.uk/i,
      /nationsbank/i, /regions\.com/i, /tdbank\.com/i,
      /online.*banking/i, /bank.*dashboard/i,
    ],
    selectors: [
      '[id*="account-balance"]', '[class*="account-summary"]',
      '[class*="transaction"]', '[id*="balance"]',
      '[data-testid*="balance"]', '.account-card',
    ],
    text: [
      'available balance', 'account balance', 'current balance',
      'recent transactions', 'transfer funds', 'pay bills',
      'account summary', 'bank statement',
    ],
    priority: 2,
  },

  crypto: {
    urls: [
      /coinbase\.com/i, /binance\.(com|us)/i, /kraken\.com/i,
      /crypto\.com/i, /gemini\.com/i, /bitfinex\.com/i,
      /kucoin\.com/i, /ftx\.(com|us)/i, /robinhood\.com.*crypto/i,
      /blockchain\.com/i, /metamask\.io/i, /uniswap\.org/i,
      /opensea\.io/i, /nft/i, /defi/i, /web3/i,
    ],
    selectors: [
      '[id*="crypto"]', '[class*="bitcoin"]', '[class*="eth"]',
      '[data-currency]', '.wallet-balance', '[class*="portfolio"]',
    ],
    text: [
      'buy bitcoin', 'sell crypto', 'wallet balance', 'gas fee',
      'btc', 'ethereum', 'nft', 'defi', 'blockchain',
      'convert crypto', 'trade crypto', 'market cap',
    ],
    priority: 2,
  },

  investing: {
    urls: [
      /etrade\.com/i, /fidelity\.com/i, /schwab\.com/i,
      /vanguard\.com/i, /td.*ameritrade\.com/i, /robinhood\.com/i,
      /webull\.com/i, /acorns\.com/i, /stash\.com/i,
      /wealthfront\.com/i, /betterment\.com/i, /m1finance\.com/i,
      /finance\.yahoo\.com/i, /bloomberg\.com/i, /markets/i,
    ],
    selectors: [
      '[class*="portfolio"]', '[class*="stock"]', '[class*="ticker"]',
      '[id*="quote"]', '[class*="watchlist"]', '[class*="holdings"]',
    ],
    text: [
      'buy shares', 'sell shares', 'stock price', 'portfolio value',
      'market order', 'limit order', 'dividend', 'p/e ratio',
      'mutual fund', 'etf', 'asset allocation', 'market cap',
    ],
    priority: 2,
  },

  budget: {
    urls: [
      /mint\.com/i, /ynab\.com/i, /personalcapital\.com/i,
      /copilot\.money/i, /monarch(money)?/i, /tiller\.com/i,
      /spreadsheets\.google\.com/i, /docs\.google\.com.*spreadsheet/i,
      /notion\.so/i, /airtable\.com/i,
    ],
    selectors: [
      '[class*="budget"]', '[id*="budget"]', '[class*="expense"]',
      '[class*="spending"]', '[class*="income"]', '[class*="savings"]',
    ],
    text: [
      'monthly budget', 'spending plan', 'budget category',
      'expenses this month', 'budget remaining', 'savings goal',
      'total expenses', 'net worth', 'cash flow',
    ],
    priority: 3,
  },

  insurance: {
    urls: [
      /geico\.com/i, /progressive\.com/i, /allstate\.com/i,
      /statefarm\.com/i, /aetna\.com/i, /anthem\.com/i,
      /insurance/i, /policy/i, /premium/i, /coverage/i,
    ],
    selectors: [
      '[class*="premium"]', '[class*="coverage"]',
      '[class*="policy"]', '[id*="insurance"]',
    ],
    text: [
      'monthly premium', 'policy details', 'coverage amount',
      'deductible', 'insurance quote', 'pay premium',
    ],
    priority: 4,
  },

  shopping: {
    urls: [
      /amazon\.(com|co\.uk|ca|de|fr|it|es)/i,
      /ebay\.(com|co\.uk)/i, /walmart\.com/i, /target\.com/i,
      /bestbuy\.com/i, /etsy\.com/i, /wayfair\.com/i,
      /zappos\.com/i, /newegg\.com/i, /overstock\.com/i,
      /shop\.app/i, /wish\.com/i,
      // ── South Asia ──
      /daraz\.(com\.bd|pk|com\.np|lk|com\.mm)/i,
      /chaldal\.com/i,
      /pickaboo\.com/i,
      /rokomari\.com/i,
      /shajgoj\.com/i,
      /shopup\.com\.bd/i,
      /lazada\.(com|sg|com\.my|co\.th|com\.ph|vn)/i,
      /flipkart\.com/i,
      /myntra\.com/i,
    ],
    selectors: [
      '#add-to-cart-button', '[id*="add-to-cart"]',
      '[class*="add-to-cart"]', '[data-action="add-to-cart"]',
      '[class*="buy-now"]', '#buy-now-button',
      '[class*="product-price"]', '[id*="product-price"]',
      // Daraz selectors
      '[class*="pdp-cart"]', '[data-spm*="addcart"]',
      '.btn-cart', '.btn-buynow', '[class*="add-to-wishlist"]',
      '[class*="pd-price"]', '.pdp-price',
    ],
    text: [
      'add to cart', 'add to basket', 'buy now', 'add to bag',
      'in stock', 'free shipping', 'product details',
      // Daraz / South Asia
      'add to cart', 'buy now', 'flash sale', 'voucher',
      'cash on delivery', 'bkash', 'nagad', 'daraz mall',
      'tk.', '৳', 'add to wishlist',
    ],
    priority: 5,
  },
};

// ──────────────────────────────────────────────────────────────────
//  CONTEXT DETECTION
// ──────────────────────────────────────────────────────────────────

function detectContextType() {
  const url      = location.href.toLowerCase();
  const bodyText = document.body?.innerText?.toLowerCase() || '';

  // Priority order: checkout first (most urgent)
  const order = ['checkout', 'banking', 'crypto', 'investing',
                  'budget', 'insurance', 'shopping'];

  for (const type of order) {
    const rule = RULES[type];
    if (!rule) continue;

    const urlMatch      = rule.urls?.some((p) => p.test(url));
    const selectorMatch = rule.selectors?.some((s) => { try { return !!document.querySelector(s); } catch { return false; } });
    const textMatch     = rule.text?.some((t) => bodyText.includes(t));

    const score = (urlMatch ? 2 : 0) + (selectorMatch ? 2 : 0) + (textMatch ? 1 : 0);
    if (score >= 2) return type;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────
//  PAGE METADATA EXTRACTION
// ──────────────────────────────────────────────────────────────────

function extractVisiblePrices() {
  const pricePatterns = /\$[\d,]+\.?\d{0,2}|£[\d,]+\.?\d{0,2}|€[\d,]+\.?\d{0,2}|৳[\d,]+\.?\d{0,2}|Tk\.?\s*[\d,]+|Rs\.?\s*[\d,]+/g;
  const text = document.body?.innerText || '';
  const matches = text.match(pricePatterns) || [];
  // Deduplicate and take top 5
  return [...new Set(matches)].slice(0, 5);
}

function extractPageContext(contextType) {
  const hostname = location.hostname.replace(/^www\./, '');
  let productName = '', price = '', totalAmount = '', budgetCategory = '';

  // ── Amazon ──
  if (hostname.includes('amazon')) {
    productName = document.querySelector(
      '#productTitle, .a-truncate-full, [data-feature-name="title"]'
    )?.textContent?.trim().slice(0, 80) || '';
    price = document.querySelector(
      '.a-price .a-offscreen, #price, .grand-total-price, #corePriceDisplay_desktop_feature_div .a-price .a-offscreen'
    )?.textContent?.trim() || '';
    totalAmount = document.querySelector(
      '.order-total .grand-total-price, #subtotals-marketplace-table .a-price'
    )?.textContent?.trim() || price;
  }

  // ── eBay ──
  if (hostname.includes('ebay')) {
    productName = document.querySelector('.x-item-title__mainTitle span, h1.it-ttl')
      ?.textContent?.trim().slice(0, 80) || '';
    price = document.querySelector('.x-price-primary span, #prcIsum')
      ?.textContent?.trim() || '';
  }

  // ── Walmart / Target / Best Buy ──
  if (hostname.includes('walmart') || hostname.includes('target') || hostname.includes('bestbuy')) {
    productName = document.querySelector('h1, [data-automation-id="product-title"]')
      ?.textContent?.trim().slice(0, 80) || '';
    price = document.querySelector('[itemprop="price"], [class*="price"]')
      ?.textContent?.trim().slice(0, 20) || '';
  }

  // ── Crypto exchanges ──
  if (contextType === 'crypto') {
    const amtEl = document.querySelector('[class*="balance"], [class*="portfolio-value"]');
    totalAmount = amtEl?.textContent?.trim().slice(0, 30) || '';
  }

  // ── Banking ──
  if (contextType === 'banking') {
    const balEl = document.querySelector('[class*="balance"], [id*="balance"]');
    totalAmount = balEl?.textContent?.trim().slice(0, 30) || '';
  }

  // ── Daraz ──
  if (hostname.includes('daraz')) {
    productName = document.querySelector(
      '.pdp-product-title, [class*="pdp-mod-product-badge-title"], h1[class*="title"]'
    )?.textContent?.trim().slice(0, 80) || '';
    price = document.querySelector(
      '.pdp-price, [class*="pdp-price_size_xl"], .notranslate'
    )?.textContent?.trim().slice(0, 20) || '';
    totalAmount = document.querySelector(
      '[class*="checkout-summary"] [class*="price"], .order-total'
    )?.textContent?.trim() || price;
    // Daraz uses ৳ (taka) and Tk. notation
    if (!price) {
      const priceEl = document.querySelector('[class*="price"]');
      price = priceEl?.textContent?.trim().slice(0, 20) || '';
    }
  }

  // ── Fallback: og:title / document.title ──
  if (!productName) {
    productName =
      document.querySelector('meta[property="og:title"]')?.content?.slice(0, 80) ||
      document.title.slice(0, 80) || '';
  }

  // ── Generic price fallback ──
  if (!price) {
    price = document.querySelector(
      '[class*="price"],[data-testid*="price"],[id*="price"],[itemprop="price"]'
    )?.textContent?.trim().slice(0, 20) || '';
  }

  // ── Infer budget category ──
  const combined = (productName + ' ' + document.title).toLowerCase();
  if (/food|restaurant|grocery|dining|pizza|coffee|meal/i.test(combined)) budgetCategory = 'Food & Dining';
  else if (/laptop|phone|computer|tablet|electronics|gpu|monitor/i.test(combined)) budgetCategory = 'Technology';
  else if (/shoe|shirt|dress|cloth|fashion|apparel|outfit/i.test(combined)) budgetCategory = 'Shopping';
  else if (/hotel|flight|travel|airbnb|vacation|trip/i.test(combined)) budgetCategory = 'Travel';
  else if (/gym|health|medicine|pharmacy|doctor|vitamin/i.test(combined)) budgetCategory = 'Health';
  else if (/netflix|spotify|amazon prime|subscription|hulu/i.test(combined)) budgetCategory = 'Subscriptions';
  else if (/daraz|chaldal|rokomari|pickaboo/i.test(combined)) budgetCategory = 'Shopping';
  else if (contextType === 'crypto' || contextType === 'investing') budgetCategory = 'Investing';
  else if (contextType === 'banking' || contextType === 'budget') budgetCategory = 'Finance';

  return {
    contextType,
    store: hostname,
    productName: productName.trim(),
    price: price.trim(),
    totalAmount: totalAmount.trim() || price.trim(),
    visiblePrices: extractVisiblePrices(),
    budgetCategory: budgetCategory || 'Other',
    pageTitle: document.title.slice(0, 80),
    url: location.href,
    timestamp: Date.now(),
  };
}

// ──────────────────────────────────────────────────────────────────
//  MINI HUD OVERLAY  — persistent, unobtrusive top-right indicator
// ──────────────────────────────────────────────────────────────────

const HUD_COLORS = {
  checkout:  '#f87171',
  banking:   '#fbbf24',
  crypto:    '#a78bfa',
  investing: '#34d399',
  budget:    '#60a5fa',
  insurance: '#94a3b8',
  shopping:  '#fb923c',
  finance:   '#10b981',
};

const HUD_ICONS = {
  checkout:  '🛒',
  banking:   '🏦',
  crypto:    '₿',
  investing: '📈',
  budget:    '📊',
  insurance: '🛡',
  shopping:  '🛍',
  finance:   '🧠',
};

const HUD_LABELS = {
  checkout:  'Checkout',
  banking:   'Banking',
  crypto:    'Crypto',
  investing: 'Investing',
  budget:    'Budget',
  insurance: 'Insurance',
  shopping:  'Shopping',
  finance:   'Finance',
};

function injectMiniHUD(contextType) {
  if (document.getElementById('sentience-hud')) return;

  const color = HUD_COLORS[contextType] || HUD_COLORS.finance;
  const icon  = HUD_ICONS[contextType]  || HUD_ICONS.finance;
  const label = HUD_LABELS[contextType] || 'Finance';

  const hud = document.createElement('div');
  hud.id = 'sentience-hud';
  hud.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px 5px 7px;
    background: rgba(13,17,23,0.92);
    border: 1px solid ${color}55;
    border-left: 3px solid ${color};
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 11px;
    color: #e6edf3;
    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    cursor: grab;
    transition: opacity 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(4px);
    user-select: none;
  `;
  hud.title = `Sentience: ${label} — drag to move, click to open`;
  hud.innerHTML = `
    <span style="font-size:13px;line-height:1">${icon}</span>
    <div style="display:flex;flex-direction:column;gap:1px">
      <span style="font-weight:700;color:${color};font-size:10px;letter-spacing:.04em;text-transform:uppercase">${label}</span>
      <span style="color:#8b949e;font-size:9px">Sentience active</span>
    </div>
    <button id="sentience-hud-close" style="
      background:none;border:none;color:#6e7681;cursor:pointer;
      font-size:10px;padding:0 0 0 4px;line-height:1;
    " title="Dismiss">✕</button>
  `;

  document.body.appendChild(hud);

  // ── DRAG LOGIC ────────────────────────────────────────────────
  let dragging = false, dragStartX = 0, dragStartY = 0,
      originLeft = 0, originTop = 0, movedPx = 0;

  hud.addEventListener('mousedown', (e) => {
    if (e.target.id === 'sentience-hud-close') return;
    dragging  = true;
    movedPx   = 0;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = hud.getBoundingClientRect();
    originLeft = rect.left;
    originTop  = rect.top;
    hud.style.cursor     = 'grabbing';
    hud.style.transition = 'none';
    hud.style.boxShadow  = `0 4px 24px ${color}55`;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    movedPx = Math.max(movedPx, Math.abs(dx) + Math.abs(dy));
    const newLeft = Math.max(0, Math.min(window.innerWidth  - hud.offsetWidth,  originLeft + dx));
    const newTop  = Math.max(0, Math.min(window.innerHeight - hud.offsetHeight, originTop  + dy));
    hud.style.left   = newLeft + 'px';
    hud.style.top    = newTop  + 'px';
    hud.style.right  = 'auto';
    hud.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    hud.style.cursor     = 'grab';
    hud.style.transition = 'opacity 0.2s, box-shadow 0.2s';
    hud.style.boxShadow  = '0 2px 12px rgba(0,0,0,0.5)';

    // Snap to nearest edge so it doesn't float in middle of page
    const rect     = hud.getBoundingClientRect();
    const midX     = rect.left + rect.width  / 2;
    const midY     = rect.top  + rect.height / 2;
    const snapLeft = midX < window.innerWidth / 2;
    const snapTop  = midY < window.innerHeight / 2;
    if (snapLeft) {
      hud.style.left  = '12px';
      hud.style.right = 'auto';
    } else {
      hud.style.left  = 'auto';
      hud.style.right = '12px';
    }
    if (snapTop) {
      hud.style.top    = Math.max(12, rect.top) + 'px';
      hud.style.bottom = 'auto';
    } else {
      hud.style.top    = 'auto';
      hud.style.bottom = Math.max(12, window.innerHeight - rect.bottom) + 'px';
    }

    // Only open panel if it was a click (moved < 5px)
    if (movedPx < 5) {
      if (e.target.id === 'sentience-hud-close') {
        hud.style.opacity = '0';
        setTimeout(() => hud.remove(), 200);
      } else {
        chrome.runtime.sendMessage({ type: 'open_panel' });
      }
    }
  });

  // Auto-fade after 12s (non-checkout contexts)
  if (contextType !== 'checkout') {
    setTimeout(() => {
      if (document.getElementById('sentience-hud')) {
        hud.style.opacity = '0.35';
      }
    }, 12000);
  }
}

// ──────────────────────────────────────────────────────────────────
//  CHECKOUT BANNER  — more prominent, shows price
// ──────────────────────────────────────────────────────────────────

function injectCheckoutBanner(ctx) {
  if (document.getElementById('sentience-banner')) return;

  const price = ctx.price ? ` · ${ctx.price}` : '';
  const product = ctx.productName ? ctx.productName.slice(0, 50) : 'this purchase';

  const banner = document.createElement('div');
  banner.id = 'sentience-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 2147483647;
    background: linear-gradient(90deg, #0d1117 0%, #161b22 100%);
    border-bottom: 2px solid rgba(248,113,113,.5);
    padding: 9px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    color: #e6edf3;
    box-shadow: 0 2px 20px rgba(0,0,0,.5);
  `;
  banner.innerHTML = `
    <span style="font-size:16px;flex-shrink:0">⚠️</span>
    <div style="flex:1;min-width:0">
      <span style="font-weight:700;color:#f87171">Sentience</span>
      <span style="color:#8b949e"> — checkout detected</span>
      <span style="color:#e6edf3;margin-left:6px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;max-width:280px;vertical-align:middle">${product}${price}</span>
    </div>
    <span style="font-size:11px;color:#fbbf24;white-space:nowrap;flex-shrink:0">Checking your profile…</span>
    <button id="sentience-banner-close" style="
      background:none; border:1px solid rgba(255,255,255,.12);
      color:#8b949e; border-radius:6px; padding:2px 8px; cursor:pointer;
      font-size:11px; font-family:inherit; flex-shrink:0;
    ">✕</button>
  `;

  document.body.prepend(banner);
  document.body.style.paddingTop =
    (parseInt(document.body.style.paddingTop || '0') + 44) + 'px';

  document.getElementById('sentience-banner-close')?.addEventListener('click', () => {
    banner.remove();
    document.body.style.paddingTop = '';
  });

  // Auto-dismiss after 10s
  setTimeout(() => {
    const el = document.getElementById('sentience-banner');
    if (el) { el.remove(); document.body.style.paddingTop = ''; }
  }, 10000);
}

// ──────────────────────────────────────────────────────────────────
//  MAIN DETECTION + DISPATCH
// ──────────────────────────────────────────────────────────────────

let detected       = false;
let currentContext = null;

function runDetection() {
  if (detected) return;

  const ctxType = detectContextType();
  if (!ctxType) return;

  detected = true;
  currentContext = extractPageContext(ctxType);

  // Inject appropriate UI
  if (ctxType === 'checkout') {
    injectCheckoutBanner(currentContext);
  }
  injectMiniHUD(ctxType);

  // Send to background
  chrome.runtime.sendMessage(
    { type: 'financial_context_detected', data: currentContext },
    (response) => { if (chrome.runtime.lastError) {} }
  );
}

// Run on load
runDetection();

// Watch SPA navigation (Amazon, React apps)
const navObserver = new MutationObserver(() => {
  if (!detected) runDetection();
});
navObserver.observe(document.body || document.documentElement,
  { childList: true, subtree: true });

// Poll for URL changes (hash/pushState)
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl  = location.href;
    detected = false;
    currentContext = null;
    // Remove old HUD/banner
    document.getElementById('sentience-hud')?.remove();
    document.getElementById('sentience-banner')?.remove();
    document.body.style.paddingTop = '';
    runDetection();
  }
}, 1200);
