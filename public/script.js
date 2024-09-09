/**
 * DAG Lottery System - Hackathon Submission
 *
 * This script implements the frontend logic for a DAG-based lottery system.
 * It interacts with a Node.js backend and the Constellation Network API to
 * fetch and display real-time lottery data.
 *
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

// Import necessary modules
import {
    initializeGameStats,
    updateGameStats,
    calculateGameStats,
} from "./game-stats.js";
import {
    addGlowEffect,
    animateValue,
    pulseRefreshButton,
    initializeTooltips,
    addParallaxEffect,
    addTypingEffect,
} from "./effects.js";

// prize percentages
window.HOUSE_PERCENTAGE = 0.05;
window.PRIZE_POOL_PERCENTAGE = 0.95;
window.TOP_PRIZE_PERCENTAGE = 0.475;
window.startDatetime;
window.endDatetime;

// Constants
const API_BASE_URL = "https://be-integrationnet.constellationnetwork.io";
const DAG_ADDRESS = "DAG1tW4mphatvYGBJx2r3eEg1qkDna9uuRjYCSQQ";
const REFRESH_INTERVAL = 300000; // 5 minutes

// Global variables
let fullLeaderboard = [];
let filteredLeaderboard = [];

/**
 * Fetches current round information from the server.
 * @returns {Promise<Object>} An object containing start and end datetimes for the current round.
 */
async function fetchRoundInfo() {
    try {
        const response = await fetch("/current-round");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        window.startDatetime = new Date(data.start);
        window.endDatetime = new Date(data.end);
        return { startDatetime, endDatetime };
    } catch (error) {
        console.error("Failed to fetch round info:", error);
        // Use fallback dates if fetch fails
        window.startDatetime = new Date();
        window.endDatetime = new Date(
            startDatetime.getTime() + 24 * 60 * 60 * 1000,
        ); // 24 hours from now
    }
}

/**
 * Fetches and filters transactions for a given address.
 * @param {string} address - The address to fetch transactions for.
 * @returns {Array} An array of filtered transactions.
 */
async function fetchTransactions(address) {
    let allTransactions = [];

    try {
        // Fetch all transactions
        const transactionsResponse = await fetch("/all-transactions");
        if (!transactionsResponse.ok) {
            throw new Error(
                `HTTP error! status: ${transactionsResponse.status}`,
            );
        }

        // Parse the JSON response
        const transactionsData = await transactionsResponse.json();

        // Ensure transactionsData is an array before assigning
        if (Array.isArray(transactionsData)) {
            allTransactions = transactionsData;
        } else if (transactionsData && Array.isArray(transactionsData.data)) {
            allTransactions = transactionsData.data;
        } else {
            console.warn("Unexpected data structure:", transactionsData);
            allTransactions = [];
        }

        // Filter transactions by date range
        // Note: startDatetime and endDatetime should be defined elsewhere in your code
        const filteredTransactions = allTransactions.filter((tx) => {
            const txTime = new Date(tx.timestamp);
            return txTime >= startDatetime && txTime <= endDatetime;
        });

        // Log the results for debugging
        console.log("All transactions:", allTransactions);
        console.log("Filtered transactions:", filteredTransactions);

        return filteredTransactions;
    } catch (error) {
        console.error("Fetch error:", error);
        throw new Error(
            `Failed to fetch data for address ${address}: ${error.message}`,
        );
    }
}

//function to fetch deposit address
async function fetchDepositAddress() {
    try {
        const response = await fetch("/deposit-address");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.publickey;
    } catch (error) {
        console.error("Failed to fetch deposit address:", error);
        throw error;
    }
}

/**
 * Processes transactions and calculates the leaderboard.
 * @param {Array} transactions - Array of transaction objects.
 * @param {number} totalBalance - Total balance of the address.
 * @returns {Array} Sorted leaderboard array.
 */
function processTransactions(transactions) {
    const senders = {};

    console.log(transactions);

    transactions.forEach((tx) => {
        const sender = tx.source;
        const amount = parseFloat(tx.amount) / 1e8; // Convert from nanoDAG to DAG
        if (senders[sender]) {
            senders[sender].totalAmount += amount;
            senders[sender].transactions.push(tx);
        } else {
            senders[sender] = { totalAmount: amount, transactions: [tx] };
        }
    });

    return Object.entries(senders)
        .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
        .map(([address, data]) => ({
            address,
            ...data,
            prize: 0, // Prize will be calculated later
        }));
}

/**
 * Renders the leaderboard in the UI.
 * @param {number} prizePools - Total prize pool amount.
 * @param {number} participantCount - Number of participants.
 */
function renderLeaderboard(prizePools, participantCount) {
    const leaderboardBody = document.getElementById("leaderboardBody");
    leaderboardBody.innerHTML = "";

    filteredLeaderboard.forEach((entry, index) => {
        // Calculate the prize for each participant
        const prize =
            index === 0
                ? prizePools * 0.5 + (prizePools * 0.5) / participantCount
                : (prizePools * 0.5) / participantCount;

        const row = document.createElement("tr");
        row.className =
            index === 0 ? "bg-blue-900 hover:bg-blue-800" : "hover:bg-gray-700";
        row.className += " transition-colors duration-150 cursor-pointer";

        const truncatedAddress = `${entry.address.slice(0, 5)}...${entry.address.slice(-5)}`;

        row.innerHTML = `
            <td class="py-3 px-6 text-left">
                ${index === 0 ? '<i class="ti ti-crown text-yellow-400 mr-2"></i>' : ""}
                ${index + 1}
            </td>
            <td class="py-3 px-6 text-left flex items-center">
                <span class="mr-2">${truncatedAddress}</span>
                <button class="copy-address bg-gray-700 hover:bg-gray-600 text-white rounded p-1" data-address="${entry.address}">
                    <i class="ti ti-copy text-sm"></i>
                </button>
            </td>
            <td class="py-3 px-6 text-right">${entry.totalAmount.toFixed(2)} DAG</td>
            <td class="py-3 px-6 text-right font-semibold ${index === 0 ? "text-green-400" : ""}">${prize.toFixed(2)} DAG</td>
        `;

        row.querySelector("td:nth-child(2)").addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent row click event when clicking on the address cell
        });

        row.addEventListener("click", () =>
            showTransactionDetails(
                entry,
                index + 1,
                prizePools,
                participantCount,
            ),
        );
        leaderboardBody.appendChild(row);
    });

    addGlowEffect();
    addCopyFunctionality();
}

/**
 * Shows transaction details in a modal.
 * @param {Object} entry - Leaderboard entry object.
 * @param {number} rank - Rank of the entry.
 * @param {number} prizePools - Total prize pool amount.
 * @param {number} participantCount - Number of participants.
 */
function showTransactionDetails(entry, rank, prizePools, participantCount) {
    const modal = document.getElementById("transactionModal");
    document.getElementById("modalAddress").textContent = entry.address;
    document.getElementById("modalRank").textContent = `#${rank}`;

    const totalSentElement = document.getElementById("modalTotalSent");
    const estimatedPrizeElement = document.getElementById(
        "modalEstimatedPrize",
    );

    const totalAmountSent = entry.totalAmount;
    totalSentElement.textContent = `${totalAmountSent.toFixed(2)} DAG`;

    let estimatedPrize =
        rank === 1 ? prizePools * 0.5 : (prizePools * 0.5) / participantCount;
    estimatedPrizeElement.textContent = `${estimatedPrize.toFixed(2)} DAG`;

    // Render transaction history
    const transactionBody = document.getElementById("modalTransactionBody");
    transactionBody.innerHTML = "";
    entry.transactions.forEach((tx) => {
        const row = document.createElement("tr");
        row.className =
            "border-b border-gray-700 hover:bg-gray-750 transition-colors duration-150";
        row.innerHTML = `
            <td class="py-3 px-4 text-left">
                <span class="font-mono text-sm">${tx.hash.slice(0, 8)}...${tx.hash.slice(-8)}</span>
            </td>
            <td class="py-3 px-4 text-right font-semibold text-green-400">
                ${(parseFloat(tx.amount) / 1e8).toFixed(2)}
            </td>
            <td class="py-3 px-4 text-right text-gray-400">
                ${new Date(tx.timestamp).toLocaleString()}
            </td>
        `;
        transactionBody.appendChild(row);
    });

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

/**
 * Hides the transaction details modal.
 */
function hideTransactionDetails() {
    const modal = document.getElementById("transactionModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

/**
 * Shows an error message to the user.
 * @param {string} message - Error message to display.
 */
function showError(message) {
    const errorAlert = document.getElementById("errorAlert");
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = "";
    addTypingEffect(errorMessage, message, 30);
    errorAlert.classList.remove("hidden");
}

/**
 * Hides the error message.
 */
function hideError() {
    const errorAlert = document.getElementById("errorAlert");
    errorAlert.classList.add("hidden");
}

/**
 * Loads and processes leaderboard data.
 */
async function loadLeaderboard() {
    try {
        await fetchRoundInfo(); // Fetch the latest round info
        const transactions = await fetchTransactions(DAG_ADDRESS);

        fullLeaderboard = processTransactions(transactions);

        console.log(fullLeaderboard);

        filteredLeaderboard = fullLeaderboard;

        const totalTransferred = transactions.reduce(
            (sum, tx) => sum + parseFloat(tx.amount) / 1e8,
            0,
        );
        const participantCount = fullLeaderboard.length;

        console.log("Leaderboard data:", {
            totalTransferred,
            participantCount,
        });

        const gameStats = calculateGameStats(
            totalTransferred,
            participantCount,
        );

        if (gameStats) {
            updateGameStats(gameStats);
            const prizePools =
                gameStats.totalDeposits * window.PRIZE_POOL_PERCENTAGE; // Use constant for consistency

            renderLeaderboard(prizePools, participantCount);
        } else {
            console.warn(
                "Invalid game stats calculated. Rendering empty leaderboard.",
            );
            renderLeaderboard(0, 0);
        }

        hideError();
        pulseRefreshButton();
    } catch (error) {
        console.error("Load leaderboard error:", error);
        showError("Failed to load leaderboard. Please try again later.");
        renderLeaderboard(0, 0); // Render empty leaderboard on error
    }
}

/**
 * Copies the deposit address to clipboard.
 */
function copyAddress() {
    const addressElement = document.getElementById("depositAddress");
    const address = addressElement.textContent;
    const button = document.getElementById("copyAddressBtn");

    navigator.clipboard
        .writeText(address)
        .then(() => {
            const originalText = button.textContent;
            addTypingEffect(button, "Copied!", 50);
            setTimeout(() => {
                addTypingEffect(button, originalText, 50);
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy address: ", err);
        });
}

/**
 * Handles search functionality for the leaderboard.
 */
function handleSearch() {
    const searchTerm = document
        .getElementById("addressSearch")
        .value.toLowerCase();
    filteredLeaderboard = fullLeaderboard.filter((entry) =>
        entry.address.toLowerCase().includes(searchTerm),
    );
    renderLeaderboard();
}

/**
 * Adds copy functionality to address buttons in the leaderboard.
 */
function addCopyFunctionality() {
    const copyButtons = document.querySelectorAll(".copy-address");
    copyButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent row click event
            const address = button.getAttribute("data-address");
            navigator.clipboard
                .writeText(address)
                .then(() => {
                    // Visual feedback
                    const originalHTML = button.innerHTML;
                    button.innerHTML =
                        '<i class="ti ti-check text-green-400"></i>';
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                    }, 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy address: ", err);
                });
        });
    });
}

/**
 * Initializes event listeners for various UI elements.
 */
function initializeEventListeners() {
    document
        .getElementById("closeModal")
        .addEventListener("click", hideTransactionDetails);
    document
        .getElementById("refreshButton")
        .addEventListener("click", loadLeaderboard);
    document
        .getElementById("addressSearch")
        .addEventListener("input", handleSearch);
    document
        .getElementById("copyAddressBtn")
        .addEventListener("click", copyAddress);
}

/**
 * Initializes the application.
 */
async function initialize() {
    try {
        await fetchRoundInfo(); // Fetch initial round info
        initializeGameStats();

        const depositAddress = await fetchDepositAddress();
        document.getElementById("depositAddress").textContent = depositAddress;

        await loadLeaderboard();
        initializeEventListeners();
        initializeTooltips();
        addParallaxEffect();
        setInterval(loadLeaderboard, REFRESH_INTERVAL);
    } catch (error) {
        console.error("Initialization error:", error);
        showError(
            "Failed to initialize the application. Please refresh the page.",
        );
    }
}

// Run initialization when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initialize);

// Make necessary functions available globally
window.showTransactionDetails = showTransactionDetails;

// Export functions for potential use in other modules or testing
export {
    fetchRoundInfo,
    fetchTransactions,
    processTransactions,
    renderLeaderboard,
    showTransactionDetails,
    loadLeaderboard,
    initialize,
};
