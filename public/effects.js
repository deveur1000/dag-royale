/**
 * effects.js
 *
 * This module provides various visual effects and animations for the DAG Royale.
 * It includes functions for adding glow effects, animating values, pulsing elements,
 * initializing tooltips, creating parallax effects, and adding typing animations.
 *
 */

/**
 * Adds a glowing effect to leaderboard rows on hover.
 * @param {string} [selector='#leaderboardBody tr'] - CSS selector for the rows.
 */
export function addGlowEffect(selector = "#leaderboardBody tr") {
  const rows = document.querySelectorAll(selector);
  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.classList.add("glow", "z-10");
      row.style.transition = "all 0.3s ease";
      row.style.transform = "scale(1.02)";
    });
    row.addEventListener("mouseleave", () => {
      row.classList.remove("glow", "z-10");
      row.style.transform = "scale(1)";
    });
  });
}

/**
 * Animates a numeric value from start to end.
 * @param {HTMLElement} element - The element to update with the animated value.
 * @param {number} start - The starting value.
 * @param {number} end - The ending value.
 * @param {number} duration - The duration of the animation in milliseconds.
 * @param {function} [formatter=(value) => value.toFixed(2)] - A function to format the displayed value.
 */
export function animateValue(
  element,
  start,
  end,
  duration,
  formatter = (value) => value.toFixed(2),
) {
  if (!element) {
    console.error("Invalid element provided to animateValue");
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = formatter(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Adds a pulse animation to the refresh button.
 * @param {string} [buttonId='refreshButton'] - The ID of the refresh button.
 * @param {number} [duration=1000] - The duration of the pulse animation in milliseconds.
 */
export function pulseRefreshButton(
  buttonId = "refreshButton",
  duration = 1000,
) {
  const refreshButton = document.getElementById(buttonId);
  if (!refreshButton) {
    console.error(`Refresh button with id '${buttonId}' not found`);
    return;
  }
  refreshButton.classList.add("animate-pulse");
  setTimeout(() => {
    refreshButton.classList.remove("animate-pulse");
  }, duration);
}

/**
 * Initializes tooltips for elements with data-bs-toggle="tooltip" attribute.
 * Requires Bootstrap's Tooltip plugin.
 */
export function initializeTooltips() {
  if (
    typeof bootstrap === "undefined" ||
    typeof bootstrap.Tooltip === "undefined"
  ) {
    console.warn(
      "Bootstrap Tooltip plugin not found. Tooltips will not be initialized.",
    );
    return;
  }
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]'),
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

/**
 * Adds a parallax effect to elements with the 'parallax' class.
 * @param {number} [sensitivity=0.1] - The sensitivity of the parallax effect.
 */
export function addParallaxEffect(sensitivity = 0.1) {
  const parallaxElements = document.querySelectorAll(".parallax");
  let ticking = false;

  window.addEventListener("mousemove", (e) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        parallaxElements.forEach((el) => {
          const speed = parseFloat(el.getAttribute("data-speed")) || 1;
          const x = (window.innerWidth - mouseX * speed * sensitivity) / 100;
          const y = (window.innerHeight - mouseY * speed * sensitivity) / 100;
          el.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  });
}

/**
 * Adds a typing effect to a text element.
 * @param {HTMLElement} element - The element to apply the typing effect to.
 * @param {string} text - The text to type.
 * @param {number} [speed=50] - The typing speed in milliseconds.
 * @param {function} [onComplete] - Callback function to execute when typing is complete.
 */
export function addTypingEffect(element, text, speed = 50, onComplete = null) {
  if (!element) {
    console.error("Invalid element provided to addTypingEffect");
    return;
  }

  let i = 0;
  element.textContent = "";
  const typing = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typing);
      if (onComplete && typeof onComplete === "function") {
        onComplete();
      }
    }
  }, speed);
}

/**
 * Creates a confetti explosion effect.
 * @param {number} [duration=3000] - Duration of the confetti animation in milliseconds.
 * @param {number} [particleCount=100] - Number of confetti particles.
 */
export function createConfettiExplosion(duration = 3000, particleCount = 100) {
  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];
  const confettiContainer = document.createElement("div");
  confettiContainer.style.position = "fixed";
  confettiContainer.style.top = "0";
  confettiContainer.style.left = "0";
  confettiContainer.style.width = "100%";
  confettiContainer.style.height = "100%";
  confettiContainer.style.pointerEvents = "none";
  confettiContainer.style.zIndex = "9999";
  document.body.appendChild(confettiContainer);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = "10px";
    particle.style.height = "10px";
    particle.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    particle.style.borderRadius = "50%";
    particle.style.top = "50%";
    particle.style.left = "50%";
    confettiContainer.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 5 + Math.random() * 5;
    const x = Math.cos(angle) * velocity;
    const y = Math.sin(angle) * velocity - 9.8; // Add gravity effect

    animate(particle, x, y, duration);
  }

  setTimeout(() => {
    confettiContainer.remove();
  }, duration);

  function animate(particle, x, y, duration) {
    let startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;
      if (progress < 1) {
        particle.style.transform = `translate(${x * progress * 100}px, ${(y * progress + 4.9 * progress * progress) * 100}px)`;
        requestAnimationFrame(step);
      } else {
        particle.remove();
      }
    }
    requestAnimationFrame(step);
  }
}

// Export all functions as a single object for easier importing
export const effects = {
  addGlowEffect,
  animateValue,
  pulseRefreshButton,
  initializeTooltips,
  addParallaxEffect,
  addTypingEffect,
  createConfettiExplosion,
};
