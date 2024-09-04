/**
 * DAG-based Lottery System
 *
 * This application implements a decentralized lottery system using the Constellation Network's DAG technology.
 * It automates the process of selecting winners and distributing prizes based on transaction data.
 *
 * Features:
 * - Automatic prize calculations and distributions
 * - Integration with PostgreSQL for data persistence
 * - Scheduled tasks using node-cron
 * - RESTful API endpoints for querying current round and calculating prizes
 * - Configurable for both local development and Replit deployment
 * - Enhanced database configuration using granular environment variables
 * - Hardcoded URLs for non-sensitive endpoints
 *
 * @author Your Name
 * @version 1.3.0
 */

const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const { dag4 } = require("@stardust-collective/dag4");
const cron = require("node-cron");
const { format } = require("date-fns");

// Hardcoded URLs
const BE_URL = "https://be-integrationnet.constellationnetwork.io";
const L0_URL = "https://l0-lb-integrationnet.constellationnetwork.io";
const L1_URL = "https://l1-lb-integrationnet.constellationnetwork.io";

// Environment Configuration
let env;
if (typeof process.env.REPL_ID === "undefined") {
    // We're not on Replit, so use dotenv
    require("dotenv").config();
    env = process.env;
    console.log("Running locally - using .env file");
} else {
    console.log("Running on Replit - using Replit Secrets");
    env = process.env; // On Replit, process.env already contains the secrets
}

// Extract environment variables
const {
    DBUSER,
    PGHOST,
    PGDATABASE,
    DBUSERPASSWORD,
    PGPORT,
    PRIVATE_KEY,
    CRON_SCHEDULE,
    PUBLIC_KEY,
} = env;

// Constants
const FEE = 0.05;
const INDIVIDUAL_PRIZE_PERCENTAGE = 0.475;
const TOP_PRIZE_PERCENTAGE = 0.475;
const PERC = 0.00000001; // Smallest unit of DAG
const DELAY_MS = 5000; // Delay between transactions
const MIN_DAG_TX_AMOUNT = 5 * 100000000; // Minimum amount of DAG to be considered a transaction

// Initialize Express app
const app = express();

// PostgreSQL database configuration
const pool = new Pool({
    user: DBUSER,
    host: PGHOST,
    database: PGDATABASE,
    password: DBUSERPASSWORD,
    port: PGPORT || 5432, // Use PGPORT if available, otherwise default to 5432
    ssl: {
        rejectUnauthorized: false, // Note: In production, you should use a valid SSL certificate
    },
});

// Utility function to introduce delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Serve static files from 'public' directory
app.use(express.static("public"));

/**
 * GET /current-round
 * Fetches information about the current active round (draw)
 */
app.get("/current-round", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT draw_counter as round_number,
                   date_start as start_date,
                   date_end as end_date 
            FROM Draws
            WHERE status = 'Running'
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            throw new Error("No available draw found");
        }

        const { round_number, start_date, end_date } = result.rows[0];

        const formattedStartDate = format(
            start_date,
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        );
        const formattedEndDate = format(
            end_date,
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        );

        res.status(200).json({
            round_number,
            start: formattedStartDate,
            end: formattedEndDate,
        });
    } catch (error) {
        console.error("Error fetching current round:", error);
        res.status(500).json({
            error: "An error occurred while fetching the current round",
        });
    }
});

/**
 * GET /all-transactions
 * Fetches all transactions from the DAG network
 */
app.get("/all-transactions", async (req, res) => {
    try {
        const transactions = await fetchAllTransactions();
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        res.status(500).json({
            error: "An error occurred while fetching transactions",
        });
    }
});

/**
 * GET /calculate-prizes
 * Calculates and distributes prizes for the current round
 */
//app.get("/calculate-prizes", async (req, res) => {
const calculatePrizes = async () => {
    try {
        // Update draw statuses
        await updateDrawStatuses(draw_id, draw_counter);

        // Fetch and process transactions
        const filteredTransactions = await fetchAllTransactions();

        if (filteredTransactions.length === 0) {
            throw new Error("No transactions found in the given date range");
        }

        // Calculate prizes
        const amountsBySource = groupTransactionsBySource(filteredTransactions);
        const { winnerTransaction, totalAmount } =
            findWinnerAndTotal(amountsBySource);
        const topPrize = calculatePrize(
            totalAmount,
            TOP_PRIZE_PERCENTAGE,
            amountsBySource.length,
        );
        const individualPrize = calculatePrize(
            totalAmount,
            INDIVIDUAL_PRIZE_PERCENTAGE,
            amountsBySource.length,
        );

        // Process DAG transactions
        const transactionsSent = await processDAGTransactions(
            amountsBySource,
            winnerTransaction,
            topPrize,
            individualPrize,
        );

        // Update database
        await updateDatabase(
            transactionsSent,
            draw_id,
            totalAmount,
            FEE,
            winnerTransaction.source,
        );

        /* res.status(200).json({
            totalAmount,
            winner: winnerTransaction,
            topPrize,
            individualPrize,
        }); */

        return {
            totalAmount,
            winner: winnerTransaction,
            dagObject: txn_data,
            topPrize,
            individualPrize,
        };
    } catch (error) {
        console.error("Error processing prizes:", error);
        //res.status(500).json({ error: "Failed to process prizes" });
        throw new Error("Failed to fetch transactions");
    }
};

const retry = async () => {
    try {
        const distributionsResult = await pool.query(`
            SELECT 
                id,
                public_key,
                prize,
                fee_paid as paid,
                retry
            From Distributions
            WHERE 1=1
                AND status <> 'POSTED'
                AND retry  <= 3
        `);

        if (distributionsResult.rows.length > 0) {
            dag4.account.connect(
                {
                    id: "integration2",
                    networkVersion: "2.0",
                    beUrl: "https://be-integrationnet.constellationnetwork.io",
                    l0Url: "https://l0-lb-integrationnet.constellationnetwork.io",
                    l1Url: "https://l1-lb-integrationnet.constellationnetwork.io",
                },
                false,
            );

            dag4.account.loginPrivateKey(pk);

            // Iterate over each distribution record
            distributionsResult.rows.forEach(async (distribution) => {
                const { id, public_key, prize, paid } = distribution;

                try {
                    // Attempt to resend the distribution using the DAG transfer endpoint
                    const transaction = await dag4.account.transferDag(
                        public_key,
                        prize,
                        paid,
                    );

                    const { timestamp, hash, amount, receiver, fee, status } =
                        transaction;
                    const date = new Date(timestamp).toISOString();

                    console.log(
                        `Successfully transferred for distribution ID: ${id}, transaction hash: ${hash}`,
                    );

                    // Update the status to 'POSTED' and increment the retry count
                    await pool.query(
                        `
                        UPDATE Distributions
                        SET status = $1, hash = $2, transaction_datetime = $3, retry = retry + 1, updated_at = CURRENT_TIMESTAMP, error_message=''
                        WHERE id = $4
                    `,
                        [status, hash, date, id],
                    );
                } catch (error) {
                    console.error(
                        `Failed to transfer for distribution ID: ${id}, error:${error.message}`,
                    );

                    // Increment the retry count and update the error message
                    await pool.query(
                        `
                        UPDATE Distributions
                        SET retry = retry + 1, error_message = $1
                        WHERE id = $2
                    `,
                        [error.message, id],
                    );
                }
            });
        } else {
            console.log("No pending distributions found for retry.");
        }
    } catch (error) {
        console.error("Error running the retry functions:", error);
    }
};

/**
 * Fetches the current active draw from the database
 * @returns {Object} Draw information
 */
async function fetchCurrentDraw() {
    const result = await pool.query(`
        SELECT 
            id AS draw_id,
            date_start,
            date_end,
            draw_counter
        FROM draws
        WHERE status = 'Running'
        LIMIT 1
    `);

    if (result.rows.length === 0) {
        throw new Error("No available draw found");
    }

    return result.rows[0];
}

/**
 * Updates the statuses of draws in the database
 * @param {number} currentDrawId - ID of the current draw
 * @param {number} currentDrawCounter - Counter of the current draw
 */
async function updateDrawStatuses(currentDrawId, currentDrawCounter) {
    await pool.query(
        `UPDATE draws
         SET status = 'Processing', updated_at = CURRENT_DATE
         WHERE id = $1`,
        [currentDrawId],
    );

    const nextDrawCounter = currentDrawCounter + 1;
    await pool.query(
        `UPDATE draws
         SET status = 'Running', updated_at = CURRENT_DATE
         WHERE draw_counter = $1`,
        [nextDrawCounter],
    );
}

/**
 * Fetches all transactions from the DAG network
 * @returns {Array} Array of transactions
 */
async function fetchAllTransactions() {
    let transactions = [];
    let nextToken = null;
    let baseUrl = `${BE_URL}/addresses/${PUBLIC_KEY}/transactions/received?limit=50`;
    do {
        try {
            const url = nextToken ? `${baseUrl}&next=${nextToken}` : baseUrl;
            const response = await axios.get(url);
            const data = response.data;

            if (data && data.data) {
                transactions = transactions.concat(data.data);
                nextToken = data.meta && data.meta.next ? data.meta.next : null;
            } else {
                console.warn("Unexpected response structure:", data);
                break;
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(
                    "Received 404 error. Assuming no more transactions.",
                );
                break; // Exit the loop as we've reached the end of available transactions
            } else {
                console.error("Error fetching transactions:", error.message);
                throw error; // Re-throw other errors
            }
        }
    } while (nextToken);

    const drawResult = await fetchCurrentDraw();
    const { date_start, date_end, draw_id, draw_counter } = drawResult;

    const filteredTransactions = filterTransactions(
        transactions,
        date_start,
        date_end,
    );

    return filteredTransactions;
}

/**
 * Filters transactions based on a date range and minimum amount
 * @param {Array} transactions - Array of transactions to filter
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @returns {Array} Filtered transactions
 */
function filterTransactions(transactions, startDate, endDate) {
    minAmount = MIN_DAG_TX_AMOUNT;

    return transactions.filter((tx) => {
        const txDate = new Date(tx.timestamp);
        const isWithinDateRange = txDate >= startDate && txDate <= endDate;
        const isAboveMinAmount = tx.amount >= minAmount;
        console.log(tx.amount, minAmount);
        return isWithinDateRange && isAboveMinAmount;
    });
}

/**
 * Groups transactions by source address and sums amounts
 * @param {Array} transactions - Array of transactions
 * @returns {Array} Grouped transactions
 */
function groupTransactionsBySource(transactions) {
    const groupedTransactions = transactions.reduce((acc, transaction) => {
        const { source, amount } = transaction;
        if (!acc[source]) {
            acc[source] = 0;
        }
        acc[source] += amount;
        return acc;
    }, {});

    return Object.entries(groupedTransactions).map(([source, amount]) => ({
        source,
        amount,
    }));
}

/**
 * Finds the winner transaction and calculates total amount
 * @param {Array} transactions - Array of grouped transactions
 * @returns {Object} Winner transaction and total amount
 */
function findWinnerAndTotal(transactions) {
    let winnerTransaction = transactions[0];
    let totalAmount = 0;

    transactions.forEach((tx) => {
        totalAmount += tx.amount;
        if (tx.amount > winnerTransaction.amount) {
            winnerTransaction = tx;
        }
    });

    return { winnerTransaction, totalAmount };
}

/**
 * Calculates prize amount
 * @param {number} totalAmount - Total amount in the pool
 * @param {number} prizePercentage - Percentage of the prize
 * @param {number} participantCount - Number of participants
 * @returns {number} Calculated prize amount
 */
function calculatePrize(totalAmount, prizePercentage, participantCount) {
    return parseFloat(
        (
            (totalAmount * prizePercentage +
                (totalAmount / participantCount) *
                    INDIVIDUAL_PRIZE_PERCENTAGE) *
            PERC
        ).toFixed(2),
    );
}

/**
 * Processes DAG transactions for prize distribution
 * @param {Array} amountsBySource - Grouped transactions by source
 * @param {Object} winnerTransaction - Winner transaction
 * @param {number} topPrize - Top prize amount
 * @param {number} individualPrize - Individual prize amount
 * @returns {Array} Processed transactions
 */
async function processDAGTransactions(
    amountsBySource,
    winnerTransaction,
    topPrize,
    individualPrize,
) {
    let transactionsSent = [];

    // Connect to DAG network
    dag4.account.connect(
        {
            id: "integration2",
            networkVersion: "2.0",
            beUrl: BE_URL,
            l0Url: L0_URL,
            l1Url: L1_URL,
        },
        false,
    );

    dag4.account.loginPrivateKey(PRIVATE_KEY);

    for (const transaction of amountsBySource) {
        const toAddress = transaction.source;
        const amount =
            toAddress === winnerTransaction.source ? topPrize : individualPrize;
        const fee = 0.002; // Transaction fee

        const hash = await dag4.account.transferDag(toAddress, amount, fee);
        transactionsSent = transactionsSent.concat(hash);

        await delay(DELAY_MS);
    }

    return transactionsSent;
}

/**
 * Updates the database with processed transactions and draw information
 * @param {Array} transactionsSent - Processed transactions
 * @param {number} drawId - ID of the current draw
 * @param {number} totalAmount - Total amount in the pool
 * @param {number} fee - Transaction fee
 * @param {string} winnerPublicKey - Public key of the winner
 */
async function updateDatabase(
    transactionsSent,
    drawId,
    totalAmount,
    fee,
    winnerPublicKey,
) {
    for (const transaction of transactionsSent) {
        const { timestamp, hash, amount, receiver, fee, status } = transaction;
        const date = new Date(timestamp).toISOString();

        await pool.query(
            `INSERT INTO distributions (draw_id, public_key, prize, fee_paid, transaction_datetime, status, hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [drawId, receiver, amount, fee, date, status, hash],
        );
    }

    await pool.query(
        `UPDATE draws
         SET status = 'Done', total_collected = $2, fee = $3, winner_public_key = $4
         WHERE id = $1`,
        [drawId, totalAmount, fee, winnerPublicKey],
    );

    console.log("Processing completed and database updated.");
}

// Configure scheduled task
cron.schedule(CRON_SCHEDULE || "0 21 * * *", async () => {
    try {
        console.log("Executing scheduled task to calculate prizes");
        //const response = await axios.get(`${APP_URL}/calculate-prizes`);
        const result = await calculatePrizes();
        console.log("Prize calculation completed:", result.data);
    } catch (error) {
        console.error("Error during scheduled prize calculation:", error);
    }
});

cron.schedule("*/10 * * * *", async () => {
    try {
        console.log("Executing scheduled task every 30 minutes");
        const result = await retry();
        console.log("Function return:", result);
    } catch (error) {
        console.error("Error calling retry:", error.message);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
