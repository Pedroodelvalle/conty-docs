const LLMS_LINK_ID = "conty-llms-link";

function syncLlmsLink() {
  const existing = document.getElementById(LLMS_LINK_ID);
  if (!window.location.pathname.startsWith("/api")) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const cta = document.getElementById("topbar-cta-button");
  if (!cta?.parentElement) return;
  const item = document.createElement("li");
  item.id = LLMS_LINK_ID;
  item.className = "whitespace-nowrap hidden lg:flex";
  const link = document.createElement("a");
  link.href = "/llms.txt";
  link.target = "_blank";
  link.textContent = "llms.txt";
  item.append(link);
  cta.parentElement.insertBefore(item, cta);
}

new MutationObserver(syncLlmsLink).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
syncLlmsLink();
