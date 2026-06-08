//checking if flashcards exists, if not sends an empty array
let flashcards = JSON.parse(localStorage.getItem("flashcards")) || [];

//INITIALIZES USER STATS BY RETRIEVING AND PARSING DATA FROM BROWER LOCAL STORAGE
let userStats = JSON.parse(localStorage.getItem("flashcardStats")) || {
  xp: 0,
  streak: 0,
  lastStudyDate: null,
}; //checking if flashcardstats exists, if not sends an that array

function saveStats() {
  localStorage.setItem("flashcardStats", JSON.stringify(userStats));
  updateStatsUI();
} //save userstats to flashcardstats and updates stats ui

function updateStatsUI() {
  const streakDisplay = document.getElementById("streakDisplay");
  const levelDisplay = document.getElementById("levelDisplay");
  const xpDisplay = document.getElementById("xpDisplay");

  if (streakDisplay) {
    streakDisplay.textContent = userStats.streak;
    streakDisplay.style.fontWeight = "bold";
  }
  if (xpDisplay) {
    xpDisplay.textContent = userStats.xp;
    xpDisplay.style.fontWeight = "bold";
  }

  if (levelDisplay) {
    const currentLevel = Math.floor(userStats.xp / 50) + 1;
    levelDisplay.textContent = currentLevel;
    levelDisplay.style.fontWeight = "bold";
  }
}

function checkAndLogStudySession() {
  const today = new Date().toDateString();

  if (userStats.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (userStats.lastStudyDate === yesterday.toDateString()) {
      userStats.streak += 1;
    } else {
      userStats.streak = 1;
    }
    userStats.lastStudyDate = today;
  }
}

// Initialize stats immediately
updateStatsUI();

// DASHBOARD LOGIC (Categories & Modal)
const categoriesGrid = document.getElementById("categoriesGrid");
const modal = document.getElementById("flashcardModal");
const addCardBtn = document.getElementById("addCardBtn");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("flashcardForm");

// --- Category Rendering ---
function renderCategories() {
  if (!categoriesGrid) return; // Only run if we are on the Dashboard

  const categoryCounts = {};
  flashcards.forEach((card) => {
    // Loop through flashcards and count how many cards are in each category
    const cat = card.category || "Uncategorized";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  categoriesGrid.innerHTML = "";

  if (Object.keys(categoryCounts).length === 0) {
    categoriesGrid.innerHTML =
      "<p style='color: var(--text-muted); font-size: 14px;'>No categories yet. Add some flashcards!</p>";
    return;
  }

  for (const [cat, count] of Object.entries(categoryCounts)) {
    // Loop through each category and create a clickable card for it
    const a = document.createElement("a");
    a.href = `flashcards.html?category=${encodeURIComponent(cat)}`; // Link to flashcards page with category filter
    a.style.textDecoration = "none";
    a.style.color = "inherit";

    a.innerHTML = `
      <div class="category-item">
        <div class="category-info">
          <h4>${cat}</h4>
          <span>${count} card${count !== 1 ? "s" : ""}</span>
        </div>
        <div class="category-icon">
          <i class="fa-solid fa-folder-open"></i>
        </div>
      </div>
    `;
    categoriesGrid.appendChild(a);
  }
}

// Initialize categories
renderCategories();

// --- Modal & Form ---
if (modal && addCardBtn && closeBtn) {
  addCardBtn.addEventListener("click", () => modal.classList.add("show"));
  closeBtn.addEventListener("click", () => modal.classList.remove("show"));

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("questionInput").value;
    const a = document.getElementById("answerInput").value;
    const c = document.getElementById("categoryInput").value;

    flashcards.push({ id: Date.now(), question: q, answer: a, category: c });
    localStorage.setItem("flashcards", JSON.stringify(flashcards));

    form.reset();
    modal.classList.remove("show");
    renderCategories(); // Update UI

    alert("Flashcard added successfully!");
  });
}

// ==========================================
// 4. FOCUS STUDY MODE LOGIC (Flashcards Page)
// ==========================================
const activeCardContainer = document.getElementById("activeCard");

if (activeCardContainer) {
  const activeCategory = document.getElementById("activeCategory");
  const activeQuestion = document.getElementById("activeQuestion");
  const activeAnswer = document.getElementById("activeAnswer");
  const cardCounter = document.getElementById("cardCounter");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let currentIndex = 0;
  let currentSessionReviewed = new Set();

  // URL Filtering for Categories
  const urlParams = new URLSearchParams(window.location.search);
  const filterCategory = urlParams.get("category");

  let studyDeck = flashcards;
  if (filterCategory) {
    studyDeck = flashcards.filter((card) => card.category === filterCategory);
  }

  function loadCard(index) {
    if (studyDeck.length === 0) {
      activeCategory.textContent = filterCategory
        ? `No cards in ${filterCategory}`
        : "No Cards";
      activeQuestion.textContent =
        "You haven't created any flashcards for this deck yet!";
      activeAnswer.textContent = "Go back to the dashboard to add some.";
      cardCounter.textContent = "0";
      return;
    }

    if (index < 0) index = studyDeck.length - 1;
    if (index >= studyDeck.length) index = 0;

    currentIndex = index;
    const card = studyDeck[currentIndex];

    activeCardContainer.classList.remove("flipped");

    setTimeout(() => {
      activeCategory.textContent = card.category;
      activeQuestion.textContent = card.question;
      activeAnswer.textContent = card.answer;
      cardCounter.textContent = `${currentIndex + 1} / ${studyDeck.length}`;
    }, 150);
  }

  activeCardContainer.addEventListener("click", () => {
    if (studyDeck.length === 0) return;

    activeCardContainer.classList.toggle("flipped");

    if (
      !currentSessionReviewed.has(currentIndex) &&
      activeCardContainer.classList.contains("flipped")
    ) {
      userStats.xp += 10;
      currentSessionReviewed.add(currentIndex);
      checkAndLogStudySession();
      saveStats();
    }
  });

  prevBtn.addEventListener("click", () => loadCard(currentIndex - 1));
  nextBtn.addEventListener("click", () => loadCard(currentIndex + 1));

  loadCard(currentIndex);

  // MOVE THESE FUNCTIONS INSIDE THE BLOCK
  window.editCard = function () {
    // Added 'window.' to make them globally accessible
    const card = studyDeck[currentIndex];
    const newQ = prompt("Edit Question:", card.question);
    const newA = prompt("Edit Answer:", card.answer);
    if (newQ !== null && newA !== null) {
      card.question = newQ;
      card.answer = newA;
      localStorage.setItem("flashcards", JSON.stringify(flashcards));
      loadCard(currentIndex);
    }
  };

  window.deleteCard = function () {
    if (confirm("Are you sure you want to delete this card?")) {
      const idToDelete = studyDeck[currentIndex].id;
      flashcards = flashcards.filter((c) => c.id !== idToDelete);
      localStorage.setItem("flashcards", JSON.stringify(flashcards));

      // Re-filter the deck after deletion
      studyDeck = flashcards.filter((c) => c.category === filterCategory);
      loadCard(0);
    }
  };
}
// <--- Only one closing brace here to close the 'if (activeCardContainer)' block
