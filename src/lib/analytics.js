// ─── GA4 helper ───────────────────────────────────────────
// Thin wrapper around window.gtag so call sites don't need to guard against
// it being undefined (blocked by an ad-blocker, not yet loaded, etc.).

export function trackPageView(path) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
