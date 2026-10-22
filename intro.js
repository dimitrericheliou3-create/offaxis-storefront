(() => {
  "use strict";
  const intro = document.getElementById("offaxisIntro");
  if (!intro) return;

  const finish = () => {
    if (!intro.isConnected) return;
    document.body.classList.remove("offaxis-intro-active");
    intro.remove();
  };

  // Prefer the real Instagram avatar, with a wordmark fallback if the avatar
  // service is unavailable or Instagram blocks the request.
  const logo = intro.querySelector(".offaxis-intro-logo");
  const fallback = intro.querySelector(".offaxis-intro-word");
  const showFallback = () => {
    if (logo) logo.hidden = true;
    if (fallback) fallback.hidden = false;
  };
  if (logo && fallback) {
    logo.addEventListener("error", showFallback, { once: true });
    if (logo.complete && logo.naturalWidth === 0) showFallback();
  }

  const skipButton = document.getElementById("skipOffaxisIntro");
  const reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let alreadyPlayed = false;
  try {
    alreadyPlayed = window.sessionStorage.getItem("offaxisIntroPlayed") === "1";
  } catch (_) {
    // If browser storage is blocked, play the animation on this page only.
  }

  if (reducedMotion || alreadyPlayed) {
    intro.remove();
    return;
  }

  try {
    window.sessionStorage.setItem("offaxisIntroPlayed", "1");
  } catch (_) {}

  document.body.classList.add("offaxis-intro-active");
  intro.classList.add("is-playing");

  if (skipButton) {
    skipButton.removeAttribute("tabindex");
    skipButton.addEventListener("click", finish, { once: true });
  }

  intro.addEventListener("animationend", event => {
    if (event.animationName === "offaxis-intro-lifecycle") finish();
  });

  // Fallback in case an embedded browser does not fire animationend.
  window.setTimeout(finish, 2900);
})();