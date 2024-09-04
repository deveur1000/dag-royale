/**
 * game-stats.js
 *
 * This module handles the game statistics for the DAG Lottery System.
 * It manages the display and calculation of various game metrics including
 * total deposits, prizes, and time remaining in the current round.
 *
 * @author Your Name
 * @version 1.1.0
 * @license MIT
 */

// DOM elements for stats display
let statsElements = {
  totalDeposits: null,
  topPrize: null,
  participantPrize: null,
  averageDeposit: null,
  timeRemaining: null,
};

/**
 * Initializes the game stats by getting DOM elements.
 */
export function initializeGameStats() {
  statsElements = {
    totalDeposits: document.getElementById("totalDeposits"),
    topPrize: document.getElementById("topPrize"),
    participantPrize: document.getElementById("participantPrize"),
    averageDeposit: document.getElementById("averageDeposit"),
    timeRemaining: document.getElementById("timeRemaining"),
  };

  // Validate that all elements are found
  Object.entries(statsElements).forEach(([key, element]) => {
    if (!element) {
      console.error(`Element with id '${key}' not found in the DOM`);
    }
  });
}

/**
 * Updates the game stats display with new data.
 * @param {Object} data - The game stats data.
 */
export function updateGameStats(data) {
  if (statsElements.totalDeposits)
    statsElements.totalDeposits.textContent = formatDAG(data.totalDeposits);
  if (statsElements.topPrize)
    statsElements.topPrize.textContent = formatDAG(data.topPrize);
  if (statsElements.participantPrize)
    statsElements.participantPrize.textContent = formatDAG(
      data.participantPrize,
    );
  if (statsElements.averageDeposit)
    statsElements.averageDeposit.textContent = formatDAG(data.averageDeposit);
  updateTimeRemaining(data.endTime);
}

/**
 * Formats a number as a DAG amount string.
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted DAG amount string.
 */
function formatDAG(amount) {
  return `${amount.toFixed(2)} DAG`;
}

/**
 * Updates the time remaining display.
 * @param {Date} endTime - The end time of the current round.
 */
function updateTimeRemaining(endTime) {
  if (!statsElements.timeRemaining) return;

  let animationFrameId;

  function update() {
    const now = new Date().getTime();
    const distance = endTime - now;

    if (distance < 0) {
      statsElements.timeRemaining.textContent = "Round Ended";
      cancelAnimationFrame(animationFrameId);
      return;
    }

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const milliseconds = Math.floor((distance % 1000) / 10);

    statsElements.timeRemaining.textContent = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds)}`;

    animationFrameId = requestAnimationFrame(update);
  }

  update();

  // Clean up function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}

/**
 * Pads a number with leading zeros.
 * @param {number} num - The number to pad.
 * @returns {string} The padded number as a string.
 */
function padZero(num) {
  return num.toString().padStart(2, "0");
}

/**
 * Calculates game statistics based on total transferred amount and number of participants.
 * @param {number} totalTransferred - Total amount transferred.
 * @param {number} participantCount - Number of participants.
 * @returns {Object} Calculated game statistics.
 */
export function calculateGameStats(totalTransferred, participantCount) {
  if (totalTransferred < 0 || participantCount < 0) {
    console.error("Invalid input for calculateGameStats");
    return null;
  }

  const totalDeposits = totalTransferred;
  const prizePools = totalDeposits * window.PRIZE_POOL_PERCENTAGE;
  const topPrizePool = totalDeposits * window.TOP_PRIZE_PERCENTAGE;
  console.log(
    "topPrizePool",
    prizePools,
    window.TOP_PRIZE_PERCENTAGE,
    topPrizePool,
  );
  const participantPrizePool = topPrizePool;

  let topPrize, participantPrize, averageDeposit;

  if (participantCount === 0) {
    topPrize = prizePools; // All prize money goes to top prize if no participants
    participantPrize = 0;
    averageDeposit = 0;
  } else {
    participantPrize = participantPrizePool / participantCount;
    topPrize = topPrizePool + participantPrize;
    console.log(participantPrizePool, participantCount);
    averageDeposit = totalDeposits / participantCount;
  }

  // Ensure endDatetime is properly set
  const endTime =
    window.endDatetime instanceof Date
      ? window.endDatetime
      : new Date(window.endDatetime);

  const result = {
    totalDeposits,
    topPrize,
    participantPrize,
    averageDeposit,
    endTime,
  };

  console.log("Calculated stats:", result);

  return result;
}
