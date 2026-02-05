const fs = require('fs');
const path = require('path');

const CREDITS_FILE = path.join(__dirname, 'social_credits.json');

let creditData = {};

function loadCredits() {
    try {
        if (fs.existsSync(CREDITS_FILE)) {
            const data = fs.readFileSync(CREDITS_FILE, 'utf8');
            creditData = JSON.parse(data);
        } else {
            creditData = {};
            saveCredits();
        }
    } catch (error) {
        console.error('Error loading social credits:', error);
        creditData = {}; // Fallback
    }
}

function saveCredits() {
    try {
        fs.writeFileSync(CREDITS_FILE, JSON.stringify(creditData, null, 2));
    } catch (error) {
        console.error('Error saving social credits:', error);
    }
}

/**
 * Get current credits for a user. Defaults to 1000 (everyone starts as a decent citizen).
 * @param {string} userId 
 * @returns {number}
 */
function getCredits(userId) {
    if (creditData[userId] === undefined) {
        creditData[userId] = 1000; // Initial social credit score
        saveCredits();
    }
    return creditData[userId];
}

/**
 * Modify credits for a user.
 * @param {string} userId 
 * @param {number} amount can be positive or negative
 * @returns {number} new total
 */
function modifyCredits(userId, amount) {
    const current = getCredits(userId); // Ensures initialization
    creditData[userId] = current + amount;
    saveCredits();
    return creditData[userId];
}

function getAllCredits() {
    return creditData;
}

// Initial load
loadCredits();

module.exports = {
    getCredits,
    modifyCredits,
    getAllCredits
};
