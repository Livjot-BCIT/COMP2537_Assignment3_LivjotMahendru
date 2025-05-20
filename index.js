// ======= MODAL HANDLER (Pop-up) =======
function showModal(title, message) {
  console.log("🔔 showModal called");
  $("#modal-title").text(title);
  $("#modal-message").text(message);
  $("#game-modal").fadeIn();
}

// Modal button hides the modal
$(document).ready(() => {
  $("#modal-button").click(() => {
    $("#game-modal").fadeOut();
  });
});

// ======= GAME STATE =======
// track pieces of the game
let gameState = {
  cards: [],
  firstCard: null,
  secondCard: null,
  isLocked: false,
  clickCount: 0,
  pairsMatched: 0,
  totalPairs: 0,
  timer: null,
  timeLeft: 0,
  difficulty: "easy",
  powerUpAvailable: false,
};

// ======= DIFFICULTY SETTINGS =======
const DIFFICULTY_SETTINGS = {
  easy: { pairs: 3, time: 60 },
  medium: { pairs: 6, time: 90 },
  hard: { pairs: 9, time: 120 },
};

// ======= INITIALIZE GAME =======
async function initGame() {
  const difficulty = $("#difficulty").val();
  gameState.difficulty = difficulty;
  gameState.totalPairs = DIFFICULTY_SETTINGS[difficulty].pairs;
  gameState.timeLeft = DIFFICULTY_SETTINGS[difficulty].time;

  gameState.firstCard = null;
  gameState.secondCard = null;
  gameState.isLocked = false;
  gameState.clickCount = 0;
  gameState.pairsMatched = 0;
  clearInterval(gameState.timer);
  gameState.timer = null;

  $("#game_grid").empty();
  await createCards();
  updateStats();

  gameState.powerUpAvailable = false;
  $("#power-up-btn").prop("disabled", true);
}

// ======= CREATE CARDS =======
async function createCards() {
  try {
    // pull img from api 
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500");
    const data = await response.json();
    const pokemonList = data.results;

    // rand select & shuffle
    const selectedPokemon = shuffleArray(pokemonList)
      .slice(0, gameState.totalPairs)
      .map((pokemon) => pokemon.url);

    const cardPairs = [...selectedPokemon, ...selectedPokemon];
    gameState.cards = shuffleArray(cardPairs);

    gameState.cards.forEach((pokemonUrl, index) => {
      const card = $(`
        <div class="card" data-index="${index}">
          <img class="front_face" src="" alt="Pokemon" data-url="${pokemonUrl}">
          <img class="back_face" src="back.png" alt="Card Back">
        </div>
      `);
      $("#game_grid").append(card);

    // fetch img from pokeurl
      fetch(pokemonUrl)
        .then((res) => res.json())
        .then((data) => {
          const imgUrl = data.sprites.other["official-artwork"].front_default;
          card.find(".front_face").attr("src", imgUrl);
        });
    });
  } catch (error) {
    console.error("Error loading Pokemon:", error);
  }
}

// ======= SHUFFLE ARRAY =======
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ======= HANDLE CARD CLICK =======
function handleCardClick() {
    // prevent already flipped cards from having more actions
  if (gameState.isLocked || $(this).hasClass("flip") || $(this).hasClass("matched")) return;

// begin timer on card click
  if (!gameState.timer) {
    startTimer();
  }

// flip anim
  $(this).addClass("flip");
  gameState.clickCount++;

// track 1st & 2nd card clicked & check if match
  if (!gameState.firstCard) {
    gameState.firstCard = this;
  } else {
    gameState.secondCard = this;
    gameState.isLocked = true;
    checkForMatch();
  }

  updateStats();
}

// ======= CHECK FOR MATCH =======
function checkForMatch() {
  const firstImg = $(gameState.firstCard).find(".front_face").attr("src");
  const secondImg = $(gameState.secondCard).find(".front_face").attr("src");

// marks cards as "matched"
  if (firstImg === secondImg) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

// ======= HANDLE MATCH =======
function handleMatch() {
  gameState.pairsMatched++;
  $(gameState.firstCard).addClass("matched").off("click");
  $(gameState.secondCard).addClass("matched").off("click");

// power up req
  if (gameState.pairsMatched === 1) {
    gameState.powerUpAvailable = true;
    $("#power-up-btn").prop("disabled", false);
  }

  if (gameState.pairsMatched === gameState.totalPairs) {
    setTimeout(() => handleWin(), 500);
  }

  resetTurn();
}

// ======= HANDLE MISMATCH =======
function handleMismatch() {
  setTimeout(() => {
    $(gameState.firstCard).removeClass("flip");
    $(gameState.secondCard).removeClass("flip");
    resetTurn();
  }, 1000);
}

// ======= RESET TURN =======
function resetTurn() {
  gameState.firstCard = null;
  gameState.secondCard = null;
  gameState.isLocked = false;
}

// ======= UPDATE STATS =======
function updateStats() {
  $("#click-count").text(gameState.clickCount);
  $("#pairs-left").text(Math.max(0, gameState.totalPairs - gameState.pairsMatched));
  $("#pairs-matched").text(gameState.pairsMatched);
  $("#total-pairs").text(gameState.totalPairs);
  $("#timer").text(gameState.timeLeft);
// called after each key event 
}

// ======= START TIMER =======
function startTimer() {
  if (gameState.timer) clearInterval(gameState.timer);

  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    updateStats();

    if (gameState.timeLeft <= 0) {
      handleGameOver();
    }
  }, 1000);
}

// ======= HANDLE WIN =======
function handleWin() {
  console.log("🎉 handleWin() called");
  clearInterval(gameState.timer);
  $("#game_grid .card").off("click");
  showModal("🎉 You Won!", "Congratulations! You've matched all pairs.");
}

// ======= HANDLE GAME OVER =======
function handleGameOver() {
  clearInterval(gameState.timer);
  $("#game_grid .card").off("click");
  showModal("⏰ Time's Up!", "Game Over. Better luck next time!");
}

// ======= POWER UP: REVEAL CARDS =======
function handlePowerUp() {
  if (!gameState.powerUpAvailable) return;

  $("#power-up-btn").prop("disabled", true);
  gameState.powerUpAvailable = false;

  $("#game_grid .card:not(.matched)").addClass("flip");
  setTimeout(() => {
    $("#game_grid .card:not(.matched)").removeClass("flip");
  }, 3000);
}

// ======= THEME SWITCHER =======
function handleThemeChange() {
  const theme = $("#theme").val();
  $("body").removeClass("light-theme dark-theme").addClass(`${theme}-theme`);
}

// ======= EVENT LISTENERS =======
$(document).ready(() => {
  initGame();

  $(document).on("click", ".card", handleCardClick);

  $("#start-btn").click(() => {
    initGame();
    startTimer();
  });

  $("#reset-btn").click(() => {
    clearInterval(gameState.timer);
    initGame();
  });

  $("#difficulty").change(() => {
    clearInterval(gameState.timer);
    initGame();
  });

  $("#theme").change(handleThemeChange);
  $("#power-up-btn").click(handlePowerUp);
});
