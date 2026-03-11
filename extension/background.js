// ══════════════════════════════════════════════════════════════════
//  background.js — Sentience Service Worker v2
//  ─────────────────────────────────────────────────────────────────
//  New in v2:
//  · Badge color shows context type (red=checkout, amber=banking…)
//  · Routes 6 financial context types to side panel
//  · Proactive non-checkout contexts stored for retrieval on open
//  · Tab navigation clears badge automatically
// ══════════════════════════════════════════════════════════════════

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: true });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
});

const BADGE_COLORS = {
  checkout:  '#f87171',
  banking:   '#fbbf24',
  crypto:    '#a78bfa',
  budget:    '#60a5fa',
  investing: '#34d399',
  insurance: '#94a3b8',
  shopping:  '#fb923c',
  finance:   '#10b981',
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Open side panel from HUD click ──────────────────────────────
  if (message.type === 'open_panel') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.sidePanel.open({ tabId }).catch(() => {});
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'financial_context_detected') {
    const tabId   = sender.tab?.id;
    const ctx     = message.data;
    const ctxType = ctx.contextType || 'finance';
    if (!tabId) { sendResponse({ ok: false }); return true; }

    // Badge
    const color  = BADGE_COLORS[ctxType] || BADGE_COLORS.finance;
    const badge  = ctxType === 'checkout' ? '!' : '●';
    chrome.action.setBadgeText({ text: badge, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
    chrome.action.setTitle({
      title: `Sentience — ${ctxType.charAt(0).toUpperCase() + ctxType.slice(1)} context`,
      tabId,
    });

    if (ctxType === 'checkout') {
      // Auto-open side panel for checkout
      chrome.sidePanel.open({ tabId })
        .then(() => {
          setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'checkout_context', data: ctx })
              .catch(() => chrome.storage.session.set({ pending_checkout: ctx }));
          }, 750);
        })
        .catch(() => {});
    } else {
      // Other contexts: store for side panel to pick up
      chrome.storage.session.set({ pending_context: ctx });
    }

    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'get_pending_checkout') {
    chrome.storage.session.get('pending_checkout', (r) => {
      sendResponse({ data: r.pending_checkout || null });
      chrome.storage.session.remove('pending_checkout');
    });
    return true;
  }

  if (message.type === 'get_pending_context') {
    chrome.storage.session.get('pending_context', (r) => {
      sendResponse({ data: r.pending_context || null });
      chrome.storage.session.remove('pending_context');
    });
    return true;
  }
});

// Clear badge on tab navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId }).catch(() => {});
  }
});
