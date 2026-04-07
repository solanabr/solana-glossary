document.querySelectorAll("a[href^='http']").forEach((anchor) => {
  anchor.setAttribute("target", "_blank");
  anchor.setAttribute("rel", "noreferrer noopener");
});
