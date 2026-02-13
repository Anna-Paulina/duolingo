// Détecter si on est sur index ou lesson
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("themes")) {
    loadThemes();
  } else {
    loadLesson();
  }
});

async function loadThemes() {
  const res = await fetch("data/themes.json");
  const themes = await res.json();
  const container = document.getElementById("themes");

  themes.forEach(theme => {
    const btn = document.createElement("button");
    btn.innerText = theme.title;
    btn.onclick = () => {
      window.location.href = `lesson.html?theme=${theme.id}`;
    };
    container.appendChild(btn);
  });
}

let currentExercises = [];
let currentIndex = 0;

async function loadLesson() {
  const params = new URLSearchParams(window.location.search);
  const themeId = params.get("theme");

  const res = await fetch(`data/theme-${themeId}.json`);
  const lesson = await res.json();

  document.getElementById("lesson-title").innerText = lesson.title;
  currentExercises = lesson.exercises;

  showExercise();
}

function showExercise() {
  const ex = currentExercises[currentIndex];
  document.getElementById("question").innerText = ex.question;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
}

function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.trim();
  const correct = currentExercises[currentIndex].answer;

  if (userAnswer.toLowerCase() === correct.toLowerCase()) {
    document.getElementById("feedback").innerText = "Mat eo ! ✅";
    currentIndex++;
    if (currentIndex < currentExercises.length) {
      setTimeout(showExercise, 1000);
    } else {
      document.getElementById("feedback").innerText = "Leçon terminée 🎉";
    }
  } else {
    document.getElementById("feedback").innerText = "N'eo ket reizh ❌";
  }
}
