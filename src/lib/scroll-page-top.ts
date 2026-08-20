/** Window scroll naar top (client-only). */
export function scrollGidsPageToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}
