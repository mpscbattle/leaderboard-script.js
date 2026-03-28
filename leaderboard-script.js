let selectedAnswers = [], quizLocked = [], correctCount = 0;
let timer = 5400, timerStarted = false, timerInterval; 
const questions = [];

function loadQuestions() {
    document.querySelectorAll(".question-data").forEach(qEl => {
        questions.push({
            question: qEl.querySelector(".q").innerText,
            options: Array.from(qEl.querySelectorAll(".opt")).map(el => el.innerText),
            answer: parseInt(qEl.getAttribute("data-answer")),
            explanation: qEl.getAttribute("data-explanation") || ""
        });
    });
}

function renderAllQuestions() {
    let html = "";
    let attemptedCount = 0;
    questions.forEach((q, index) => {
        if (selectedAnswers[index] !== undefined) attemptedCount++;
        let optionsHtml = q.options.map((opt, i) => {
            const isSelected = selectedAnswers[index] === i ? " selected" : "";
            const onClickAttr = quizLocked[index] ? '' : `onclick='selectAnswer(${index}, ${i})'`;
            return `<div class='option${isSelected}' ${onClickAttr}>${opt}</div>`;
        }).join('');
        
        html += `<div class="question-card">
            <div class="question-number-circle">${index + 1}</div>
            <div class="question">${q.question}</div>
            <div class="options">${optionsHtml}</div>
        </div>`;
    });
    document.getElementById("quiz").innerHTML = html;
    document.getElementById('questionCountDisplay').textContent = `Attempted: ${attemptedCount}/${questions.length}`;
    document.getElementById('progressBar').style.width = `${(attemptedCount / questions.length) * 100}%`;
}

window.selectAnswer = function(qIndex, aIndex) {
    if (quizLocked[qIndex]) return;
    selectedAnswers[qIndex] = aIndex;
    renderAllQuestions();
};

async function saveToGoogleSheet(name, score) {
    if (!name.trim()) return alert("Please enter name");
    document.getElementById('saveMessage').textContent = "Saving...";
    document.getElementById('saveScoreBtn').disabled = true;
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ name: name.trim(), score: `${score}/${questions.length}`, testId: TEST_ID })
        });
        document.getElementById('saveMessage').textContent = "Saved! ✅";
        displayLeaderboard();
    } catch (e) {
        document.getElementById('saveScoreBtn').disabled = false;
    }
}

async function displayLeaderboard() {
    document.getElementById('leaderboardCard').style.display = 'block';
    const tbody = document.querySelector('#leaderboardTable tbody');
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    try {
        const response = await fetch(`${SCRIPT_URL}?testId=${TEST_ID}`);
        const data = await response.json();
        tbody.innerHTML = data.map((row, i) => `<tr><td>${i+1}</td><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3">Connection Error</td></tr>';
    }
}

function submitResults() {
    clearInterval(timerInterval);
    quizLocked = questions.map(() => true);
    renderAllQuestions();
    document.getElementById("submitBtn").style.display = 'none';
    document.getElementById("reportCard").style.display = 'block';
    correctCount = selectedAnswers.filter((v, i) => v === questions[i].answer).length;
    document.getElementById("total").textContent = questions.length;
    document.getElementById("correct").textContent = correctCount;
    document.getElementById("score").textContent = correctCount;
    document.getElementById("totalScore").textContent = questions.length;
    document.getElementById("percentage").textContent = ((correctCount / questions.length) * 100).toFixed(2);
}

document.getElementById("centerStartBtn").onclick = () => {
    loadQuestions();
    document.getElementById("initialStartScreen").style.display = 'none';
    document.getElementById("quizBox").style.display = 'block';
    timerInterval = setInterval(() => {
        let min = Math.floor(timer / 60), sec = timer % 60;
        document.getElementById("timer").textContent = `🕛 ${min}:${sec < 10 ? '0'+sec : sec}`;
        if (--timer < 0) submitResults();
    }, 1000);
    renderAllQuestions();
};

document.getElementById("submitBtn").onclick = submitResults;
document.getElementById("saveScoreBtn").onclick = () => saveToGoogleSheet(document.getElementById('userName').value, correctCount);
document.getElementById("viewLeaderboardBtnStart").onclick = document.getElementById("viewLeaderboardBtnReport").onclick = displayLeaderboard;
document.getElementById("returnToStartBtn").onclick = () => location.reload();
