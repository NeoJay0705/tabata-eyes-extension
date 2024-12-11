// Parse URL parameters to get timer details
const params = new URLSearchParams(window.location.search);
const title = params.get("title");
const message = params.get("message");
const duration = parseInt(params.get("duration"), 10);
const playSound = params.get("playSound") === "true";

// Display timer details on the page
function displayNotification(title, message) {
    document.getElementById("title").textContent = title;
    document.getElementById("message").textContent = message;
}

// Play an alert sound if enabled
function playAlertSound() {
    if (playSound) {
        const audio = new Audio("alert.mp3");
        audio.volume = 0.5; // Set volume to 50% for a smoother effect
        audio.play().catch((error) => {
            console.error("Error playing alert sound:", error);
        });
    }
}

// Close the window after the specified duration
function autoCloseWindow(timeoutDuration) {
    return setTimeout(() => {
        window.close();
    }, timeoutDuration * 1000);
}

// Event listener for manual close
function setupManualClose(timeout) {
    document.getElementById("close-btn").addEventListener("click", () => {
        clearTimeout(timeout); // Prevent auto-close if manually closed
        window.close();
    });
}

// Main function to initialize the timer
function initializeTimer() {
    displayNotification(title, message);
    playAlertSound();

    // Set up auto-close and manual close functionality
    const timeout = autoCloseWindow(duration);
    setupManualClose(timeout);
}

// Initialize when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeTimer);
