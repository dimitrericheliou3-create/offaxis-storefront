(() => {
  "use strict";
  const intro = document.getElementById("offaxisIntro");
  if (!intro) return;

  const finish = () => {
    if (!intro.isConnected) return;
    document.body.classList.remove("offaxis-intro-active");
    intro.remove();
  };

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