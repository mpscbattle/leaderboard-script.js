


const quizDiv = document.getElementById("quiz");
const timerDiv = document.getElementById("timer");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const reportCard = document.getElementById("reportCard");
const analysisCard = document.getElementById("analysisCard");
const viewAnalysisBtn = document.getElementById("viewAnalysisBtn");
const backToResultsBtn = document.getElementById("backToResultsBtn");
const initialStartScreen = document.getElementById("initialStartScreen");
const centerStartBtn = document.getElementById("centerStartBtn");
const quizBox = document.getElementById("quizBox");
const questionCountDisplay = document.getElementById('questionCountDisplay');
const progressBar = document.getElementById('progressBar'); 
const leaderboardCard = document.getElementById('leaderboardCard');
const viewLeaderboardBtnStart = document.getElementById('viewLeaderboardBtnStart');
const viewLeaderboardBtnReport = document.getElementById('viewLeaderboardBtnReport');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const userNameInput = document.getElementById('userName');
const saveMessage = document.getElementById('saveMessage');
const returnToStartBtn = document.getElementById('returnToStartBtn');

let selectedAnswers = [], quizLocked = [], correctCount = 0;
let timer = 5400; // 90 Minutes = 5400 Seconds
let timerInterval; 
const questions = [];

// --- 1. HTML से प्रश्न लोड करना ---
function loadQuestionsFromHTML() {
    questions.length = 0; // Clear array
    document.querySelectorAll(".question-data").forEach(qEl => {
        const q = qEl.querySelector(".q").innerText;
        const opts = Array.from(qEl.querySelectorAll(".opt")).map(el => el.innerText);
        const ans = parseInt(qEl.getAttribute("data-answer"));
        const explanation = qEl.getAttribute("data-explanation") || "";
        questions.push({ question: q, options: opts, answer : ans, explanation: explanation });
    });
}

// --- 2. प्रश्न रेंडर करना ---
function renderAllQuestions() {
    let html = "";
    let attemptedCount = 0;
    questions.forEach((q, index) => {
        if (selectedAnswers[index] !== undefined) attemptedCount++;
        html += `<div class="question-card">
            <div class="question-number-circle">${index + 1}</div>
            <div class="question">${q.question}</div>
            <div class="options">`;
        q.options.forEach((opt, i) => {
            const isSelected = selectedAnswers[index] === i ? " selected" : "";
            const onClickAttr = quizLocked[index] ? '' : `onclick='selectAnswer(${index}, ${i})'`; 
            html += `<div class='option${isSelected}' ${onClickAttr}>${opt}</div>`;
        });
        html += `</div></div>`;
    });
    quizDiv.innerHTML = html;
    if (questionCountDisplay) questionCountDisplay.textContent = `Questions : ${attemptedCount}/${questions.length}`;
    if (progressBar) progressBar.style.width = `${(attemptedCount / questions.length) * 100}%`;
}

window.selectAnswer = function(qIndex, aIndex) {
    if (quizLocked[qIndex]) return;
    selectedAnswers[qIndex] = aIndex;
    renderAllQuestions(); 
};

// --- 3. 01:30:00 फॉर्मेट वाला टाइमर ---
function updateTimer() {
    let hours = Math.floor(timer / 3600);
    let minutes = Math.floor((timer % 3600) / 60);
    let seconds = timer % 60;

    let hDisplay = hours < 10 ? '0' + hours : hours;
    let mDisplay = minutes < 10 ? '0' + minutes : minutes;
    let sDisplay = seconds < 10 ? '0' + seconds : seconds;

    timerDiv.textContent = `🕛 ${hDisplay}:${mDisplay}:${sDisplay}`;

    if (timer < 300) { // 5 मिनट से कम होने पर रेड अलर्ट
        timerDiv.style.color = "red";
    }

    if (timer <= 0) { 
        clearInterval(timerInterval); 
        submitResults(); 
    } else {
        timer--;
    }
}

// --- 4. रिजल्ट सबमिट करना ---
function submitResults() {
    clearInterval(timerInterval);
    quizLocked = questions.map(() => true);
    renderAllQuestions();
    
    submitBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    reportCard.style.display = 'block';
    
    let attempted = selectedAnswers.filter(v => v !== undefined).length;
    correctCount = selectedAnswers.filter((v, i) => v === questions[i].answer).length;
    
    document.getElementById("total").textContent = questions.length;
    document.getElementById("attempted").textContent = attempted;
    document.getElementById("correct").textContent = correctCount;
    document.getElementById("wrong").textContent = attempted - correctCount;
    document.getElementById("score").textContent = correctCount;
    document.getElementById("totalScore").textContent = questions.length;
    
    const percent = ((correctCount / questions.length) * 100).toFixed(2);
    document.getElementById("percentage").textContent = percent;
    
    setTimeout(() => reportCard.scrollIntoView({ behavior: "smooth" }), 300);
}

// --- 5. एनालिसिस (Correct/Wrong Answers) दिखाना ---
function showAnalysis() {
    analysisCard.style.display = 'block';
    const container = document.getElementById("analysisContent");
    container.innerHTML = questions.map((q, i) => {
        const userAns = selectedAnswers[i];
        let feedbackClass = userAns === undefined ? "not-attempted-feedback" : (userAns === q.answer ? "correct-feedback" : "wrong-feedback");
        return `<div class='analysis-box'>
            <div class="question-number-circle">${i + 1}</div>
            <b>${q.question}</b>
            ${q.options.map((opt, j) => `<div class='option ${j === q.answer ? "correct" : (j === userAns ? "wrong" : "")}'>${opt}</div>`).join('')}
            <div class='feedback ${feedbackClass}'>${userAns === undefined ? "Not Attempted" : (userAns === q.answer ? "Correct" : "Wrong")}</div>
            ${q.explanation ? `<div class='explanation-box'><b>📝 स्पष्टीकरण :</b> ${q.explanation}</div>` : ""}
        </div>`;
    }).join('');
    setTimeout(() => analysisCard.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
}

// --- 6. गूगल शीट पर स्कोर सेव करना ---
async function saveToGoogleSheet(name, score) {
    if (!name || name.trim() === "") {
        saveMessage.textContent = "Please enter your name";
        return;
    }
    saveMessage.textContent = "Saving...";
    saveMessage.style.color = "blue";
    saveScoreBtn.disabled = true;

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ name: name.trim(), score: score, testId: TEST_ID })
        });
        saveMessage.textContent = `Saved`;
        saveMessage.style.color = '#008f6b';
        displayLeaderboard();
    } catch (e) {
        saveMessage.textContent = "Error. Try again";
        saveScoreBtn.disabled = false;
    }
}

// --- 7. लीडरबोर्ड दिखाना ---
async function displayLeaderboard() {  
    leaderboardCard.style.display = 'block';
    leaderboardCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const tbody = document.querySelector('#leaderboardTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading...</td></tr>';

    try {
        const response = await fetch(`${SCRIPT_URL}?testId=${TEST_ID}`);
        const data = await response.json();
        tbody.innerHTML = ''; 
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No scores yet</td></tr>';
        } else {
            data.forEach((row, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${i + 1}</td><td>${row[0]}</td><td>${row[1]} / ${questions.length}</td>`;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3">Check Connection</td></tr>';
    }
}

// --- इवेंट लिसनर्स ---
centerStartBtn.onclick = () => {
    loadQuestionsFromHTML();
    initialStartScreen.style.display = 'none';
    quizBox.style.display = 'block';
    timerInterval = setInterval(updateTimer, 1000);
    renderAllQuestions(); 
};

submitBtn.onclick = submitResults;
resetBtn.onclick = returnToStartBtn.onclick = () => location.reload();
viewAnalysisBtn.onclick = showAnalysis;
backToResultsBtn.onclick = () => { analysisCard.style.display='none'; reportCard.scrollIntoView({ behavior: 'smooth' }); };
saveScoreBtn.onclick = () => saveToGoogleSheet(userNameInput.value, correctCount);
viewLeaderboardBtnStart.onclick = viewLeaderboardBtnReport.onclick = displayLeaderboard;

// Initial Load
loadQuestionsFromHTML();
renderAllQuestions();
