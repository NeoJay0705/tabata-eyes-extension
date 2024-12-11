document.getElementById("start-timer").addEventListener("click", () => {
    console.log("Start Timer button clicked"); // Debug log to verify action

    const rounds = parseInt(document.getElementById("rounds").value, 10);
    const workTime = parseInt(document.getElementById("work-time").value, 10);
    const restTime = parseInt(document.getElementById("rest-time").value, 10);
    const autoClose = parseInt(document.getElementById("auto-close").value, 10);
    const alertSound = document.getElementById("alert-sound").checked;

    if (isNaN(rounds) || isNaN(workTime) || isNaN(restTime) || isNaN(autoClose)) {
        alert("Please fill in all fields with valid numbers.");
        return;
    }

    chrome.runtime.sendMessage({
        action: "start-timer",
        data: { rounds, workTime, restTime, autoClose, alertSound }
    });

    loadTimers();
});

function loadTimers() {
    chrome.storage.local.get(["timers"], (data) => {
        const timerList = document.getElementById("timer-list");
        timerList.innerHTML = "";

        (data.timers || []).forEach((timer, index) => {
            const li = document.createElement("li");
            li.className = "timer-item";

            const timerInfo = document.createElement("span");
            timerInfo.textContent = `Timer ${index + 1}: Round ${timer.currentRound}/${timer.rounds}, ${timer.phase}`;

            const countdown = document.createElement("span");
            countdown.className = "countdown";
            countdown.textContent = formatTime(timer.remainingTime);

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: "cancel-timer", timerId: timer.id });
                loadTimers();
            });

            li.appendChild(timerInfo);
            li.appendChild(countdown);
            li.appendChild(cancelButton);
            timerList.appendChild(li);

            startCountdown(timer.id, timer.remainingTime, countdown);
        });
    });
}

function startCountdown(timerId, time, countdownElement) {
    const interval = setInterval(() => {
        chrome.storage.local.get(["timers"], (data) => {
            const timer = (data.timers || []).find((t) => t.id === timerId);
            if (!timer) {
                clearInterval(interval); // Stop if timer is removed
                return;
            }

            countdownElement.textContent = formatTime(timer.remainingTime);

            if (timer.remainingTime <= 0) {
                clearInterval(interval); // Stop countdown when time is up
            }
        });
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

document.addEventListener("DOMContentLoaded", loadTimers);
