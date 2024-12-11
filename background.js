let timers = [];
let timerIdCounter = 1;

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "start-timer") {
        startTimer(message.data);
    } else if (message.action === "cancel-timer") {
        cancelTimer(message.timerId);
    }
});

function startTimer(data) {
    const timerId = timerIdCounter++;
    const timer = {
        id: timerId,
        ...data,
        currentRound: 1,
        phase: "work",
        remainingTime: data.workTime, // Start with work time
        windowId: null
    };

    timers.push(timer);
    chrome.storage.local.set({ timers }, () => runTimer(timer));
}

function runTimer(timer) {
    const interval = setInterval(() => {
        // Check if the timer still exists (i.e., it has not been canceled)
        if (!timers.find((t) => t.id === timer.id)) {
            clearInterval(interval);
            return; // Exit the function early if the timer is canceled
        }

        if (timer.remainingTime <= 0) {
            clearInterval(interval);

            if (timer.phase === "work") {
                timer.phase = "rest";
                timer.remainingTime = timer.restTime;
            } else {
                timer.phase = "work";
                timer.remainingTime = timer.workTime;
                timer.currentRound++;
            }

            if (timer.currentRound > timer.rounds) {
                // Timer complete
                closeTimerWindow(timer);
                timers = timers.filter((t) => t.id !== timer.id);
                chrome.storage.local.set({ timers });
                return;
            }

            // Start the next phase
            const nextPhase = timer.phase === "work" ? "Work Time!" : "Rest Time!";
            const message = `Round ${timer.currentRound}: ${nextPhase} (${timer.remainingTime} seconds)`;

            // Open or update the pop-up window for the new phase
            openOrUpdateTimerPopup(timer, nextPhase, message);

            runTimer(timer);
        } else {
            timer.remainingTime--;
            chrome.storage.local.set({ timers }); // Update storage for UI sync

            // Update popup window in real time
            const currentPhase = timer.phase === "work" ? "Work Time!" : "Rest Time!";
            const message = `Round ${timer.currentRound}: ${currentPhase} (${timer.remainingTime} seconds)`;
            openOrUpdateTimerPopup(timer, currentPhase, message);
        }
    }, 1000);
}

function cancelTimer(timerId) {
    const timer = timers.find((t) => t.id === timerId);
    if (timer) {
        // Close any associated window
        closeTimerWindow(timer);

        // Remove the timer from the list
        timers = timers.filter((t) => t.id !== timerId);
        chrome.storage.local.set({ timers }); // Update storage
    }
}


function openOrUpdateTimerPopup(timer, title, message) {
    const popupUrl = `timer.html?title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}&duration=${timer.autoClose}&playSound=${timer.alertSound}`;
    console.log("Opening or updating timer popup with URL:", popupUrl); // Debug log

    if (timer.windowId) {
        // Update existing window
        chrome.windows.update(timer.windowId, { focused: true }, (updatedWindow) => {
            if (chrome.runtime.lastError) {
                console.error("Error updating window:", chrome.runtime.lastError.message);
            } else {
                console.log("Timer popup updated:", updatedWindow.id);
            }
        });
    } else {
        // Create a new window
        chrome.windows.create(
            {
                url: popupUrl,
                type: "popup",
                width: 400,
                height: 300
            },
            (newWindow) => {
                if (chrome.runtime.lastError) {
                    console.error("Error creating window:", chrome.runtime.lastError.message);
                } else {
                    console.log("Timer popup created with ID:", newWindow.id);
                    timer.windowId = newWindow.id;
                    chrome.storage.local.set({ timers }); // Update timer with window ID
                }
            }
        );
    }
}

function closeTimerWindow(timer) {
    if (timer.windowId) {
        chrome.windows.remove(timer.windowId, () => {
            timer.windowId = null;
            chrome.storage.local.set({ timers });
        });
    }
}
