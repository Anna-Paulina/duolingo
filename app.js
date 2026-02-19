// =============================================
// BREZHONEG 29 — app.js (version améliorée)
// =============================================

// ── Détection de page ──────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("themes")) {
    loadThemes();
  } else {
    loadLesson();
  }
});

// ── INDEX : chargement des thèmes ──────────
const THEME_ICONS = {
  "salutations": "👋",
  "mutations":   "🔤",
  "default":     "📚"
};

const LEVEL_LABELS = ["", "Débutant", "Intermédiaire", "Avancé"];

async function loadThemes() {
  const res = await fetch("data/themes.json");
  const themes = await res.json();
  const container = document.getElementById("themes");

  themes.forEach((theme, i) => {
    const btn = document.createElement("button");
    btn.className = "theme-btn";
    btn.style.animationDelay = `${i * 80}ms`;

    const icon  = THEME_ICONS[theme.id] || THEME_ICONS["default"];
    const level = LEVEL_LABELS[theme.level] || `Niveau ${theme.level}`;

    btn.innerHTML = `
      <span class="theme-icon">${icon}</span>
      <span class="theme-info">
        <span class="theme-name">${theme.title}</span>
        <span class="theme-level">⭐ ${level}</span>
      </span>
      <span class="theme-arrow">›</span>
    `;
    btn.onclick = () => {
      window.location.href = `lesson.html?theme=${theme.id}`;
    };
    container.appendChild(btn);
  });
}

// ── LEÇON : état global ────────────────────
let currentExercises = [];
let currentIndex     = 0;
let score            = 0;
let answered         = false;   // évite le double-clic
let reorderSelected  = [];      // mots choisis (reorder)
let reorderBank      = [];      // mots restants (reorder)

// ── LEÇON : chargement ────────────────────
async function loadLesson() {
  const params  = new URLSearchParams(window.location.search);
  const themeId = params.get("theme");

  // ✅ BUG FIX : parenthèse manquante dans l'original
  const res    = await fetch(`data/theme-${themeId}.json`);
  const data   = await res.json();

  // Le JSON est un tableau — on prend le premier objet
  const lesson = Array.isArray(data) ? data[0] : data;

  document.getElementById("lesson-title").innerText = lesson.title;
  currentExercises = lesson.exercises;
  currentIndex     = 0;
  score            = 0;
  showExercise();
}

// ── Mise à jour de la progression ─────────
function updateProgress() {
  const pct = Math.round((currentIndex / currentExercises.length) * 100);
  document.getElementById("progress-bar").style.width   = pct + "%";
  document.getElementById("progress-label").innerText  =
    `${currentIndex} / ${currentExercises.length}`;
}

// ── Affichage d'un exercice ────────────────
function showExercise() {
  answered = false;

  // Cacher l'écran de fin au cas où
  document.getElementById("finish-card").classList.add("hidden");
  document.getElementById("exercise-container").classList.remove("hidden");

  const ex = currentExercises[currentIndex];
  updateProgress();

  // Badge type
  const badgeLabels = {
    translate: "🔁 Traduction",
    write:     "✏️ Rédaction",
    mutation:  "🔤 Mutation",
    reorder:   "🔀 Réordonner",
  };
  document.getElementById("exercise-badge").innerText =
    badgeLabels[ex.type] || "📝 Exercice";

  // Question
  document.getElementById("question").innerText = ex.question || "Remets les mots dans l'ordre";

  // Réinitialiser le feedback
  const feedbackBox = document.getElementById("feedback-box");
  feedbackBox.className = "feedback-box";
  document.getElementById("feedback").innerText      = "";
  document.getElementById("correct-answer").innerText = "";

  // Bouton Valider réactivé
  const btn = document.getElementById("validate-btn");
  btn.textContent = "Valider";
  btn.disabled    = false;
  btn.onclick     = checkAnswer;

  // ── Affichage selon le type ──────────────
  if (ex.type === "reorder") {
    showReorder(ex);
  } else {
    showTextInput();
  }
}

// ── Mode texte libre ───────────────────────
function showTextInput() {
  document.getElementById("text-zone").classList.remove("hidden");
  document.getElementById("reorder-zone").classList.add("hidden");

  const input = document.getElementById("answer");
  input.value = "";
  input.className = "";
  input.focus();

  // Valider avec Entrée
  input.onkeydown = (e) => {
    if (e.key === "Enter" && !answered) checkAnswer();
  };
}

// ── Mode réordonnement ─────────────────────
function showReorder(ex) {
  document.getElementById("text-zone").classList.add("hidden");
  document.getElementById("reorder-zone").classList.remove("hidden");

  reorderSelected = [];
  reorderBank     = [...ex.words].sort(() => Math.random() - 0.5);

  renderReorder();
}

function renderReorder() {
  const slots    = document.getElementById("answer-slots");
  const bank     = document.getElementById("word-bank");

  slots.innerHTML = "";
  bank.innerHTML  = "";

  // Mots choisis (slots)
  if (reorderSelected.length === 0) {
    slots.classList.remove("active");
  } else {
    slots.classList.add("active");
    reorderSelected.forEach((word, i) => {
      const chip = document.createElement("button");
      chip.className   = "word-chip slot-chip";
      chip.textContent = word;
      chip.title       = "Cliquer pour retirer";
      chip.onclick     = () => {
        reorderBank.push(reorderSelected.splice(i, 1)[0]);
        renderReorder();
      };
      slots.appendChild(chip);
    });
  }

  // Mots disponibles (banque)
  reorderBank.forEach((word, i) => {
    const chip = document.createElement("button");
    chip.className   = "word-chip bank-chip";
    chip.textContent = word;
    chip.onclick     = () => {
      reorderSelected.push(reorderBank.splice(i, 1)[0]);
      renderReorder();
    };
    bank.appendChild(chip);
  });
}

// ── Vérification de la réponse ─────────────
function checkAnswer() {
  if (answered) return;

  const ex = currentExercises[currentIndex];
  let userAnswer;

  if (ex.type === "reorder") {
    userAnswer = reorderSelected.join(" ");
  } else {
    userAnswer = document.getElementById("answer").value.trim();
  }

  if (!userAnswer) return;

  const correct      = ex.answer;
  const isCorrect    = userAnswer.toLowerCase() === correct.toLowerCase();
  const feedbackBox  = document.getElementById("feedback-box");
  const feedbackText = document.getElementById("feedback");
  const hintText     = document.getElementById("correct-answer");

  answered = true;

  if (isCorrect) {
    score++;
    feedbackBox.className    = "feedback-box correct show";
    feedbackText.innerText   = "Mat eo ! ✅  Correct !";
    hintText.innerText       = "";

    if (ex.type !== "reorder") {
      document.getElementById("answer").classList.add("input-correct");
    }
  } else {
    feedbackBox.className    = "feedback-box wrong show";
    feedbackText.innerText   = "N'eo ket reizh ❌";
    hintText.innerText       = `Réponse : ${correct}`;

    if (ex.type !== "reorder") {
      document.getElementById("answer").classList.add("input-wrong");
    }
  }

  // Changer le bouton en "Suivant"
  const btn    = document.getElementById("validate-btn");
  btn.textContent = currentIndex + 1 < currentExercises.length
    ? "Suivant →"
    : "Voir le résultat 🏁";

  btn.onclick = nextExercise;
}

// ── Exercice suivant ───────────────────────
function nextExercise() {
  currentIndex++;

  if (currentIndex < currentExercises.length) {
    showExercise();
  } else {
    showFinish();
  }
}

// ── Écran de fin ──────────────────────────
function showFinish() {
  document.getElementById("exercise-container").classList.add("hidden");
  const finishCard = document.getElementById("finish-card");
  finishCard.classList.remove("hidden");

  const total   = currentExercises.length;
  const pct     = Math.round((score / total) * 100);
  let   mention = pct === 100 ? "🏆 Parfait !" : pct >= 70 ? "👍 Bien joué !" : "💪 Continue !";

  document.getElementById("finish-score").innerText =
    `${score} / ${total} bonnes réponses (${pct}%) — ${mention}`;

  // Barre à 100%
  document.getElementById("progress-bar").style.width = "100%";
  document.getElementById("progress-label").innerText = `${total} / ${total}`;
}

// ── Recommencer la leçon ──────────────────
function restartLesson() {
  currentIndex = 0;
  score        = 0;
  showExercise();
}
