const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

if (menu && menuLinks) {
  menu.addEventListener('click', function () {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
  });
}

if (typeof window !== "undefined") {
  const selectedFoods = window.selectedFoods || [];
  const analysisResults = window.analysisResults || [];
  window.selectedFoods = selectedFoods;
  window.analysisResults = analysisResults;
}
let allResults = []; // Store all fetched results so we can sort/filter without re-fetching

document.addEventListener("DOMContentLoaded", function () {
  renderRecentSearches();

  document.getElementById("searchButton").addEventListener("click", () => {
    handleSearch().catch(console.error);
  });
  document.getElementById("sortSelect").addEventListener("change", applyFilters);
  });

document.getElementById("queryInput").addEventListener("input",  function () {
  const query = this.value.trim();
  const list = document.getElementById("autocompleteList");
  if (query.length < 2) {
    list.innerHTML = '';
    return;
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#queryInput") && !e.target.closest("#autocompleteList")) {
      document.getElementById("autocompleteList").innerHTML = '';
    }
  });

  (async () => {
    try {
      const res = await fetch(`/dashboard/autocomplete?q=${encodeURIComponent(query)}`, {
        credentials: "include"
      });
      const data = await res.json();
      renderSuggestions(data.suggestions);
    } catch (err) {
      console.error("Autocomplete fetch error", err);
    }
  })();
});

function renderSuggestions(suggestions) {
  const list = document.getElementById("autocompleteList");
  list.innerHTML = suggestions.map(item => `<li>${item}</li>`).join("");

  // Clicking a suggestion sets input and triggers search
  list.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      document.getElementById("queryInput").value = li.textContent;
      list.innerHTML = '';
      handleSearch();
    });
  });
}


document.addEventListener("click", function (e) {
  if (e.target.closest("#recentContainer li")) {
    document.getElementById("queryInput").value = e.target.textContent;
    handleSearch();
  }
});

// Handle the user's search action
async function handleSearch() {
  const query = document.getElementById('queryInput').value; // Get user input from the text box
  if (!query) return; // Prevent empty search
  saveToRecent(query);
   // Call API (mocked here)
  allResults = await fetchNutrientData(query); // Store the results globally
  renderResults(allResults); // Display the results on the page
}

// Apply sorting filters when a user selects a category
function applyFilters() {
  const sortBy = document.getElementById('sortSelect').value; // Get selected sort option
  let sortedResults = [...allResults]; // Copy original results to avoid mutation

  // Sort logic based on selected value
  switch (sortBy) {
    case "calories-asc":
      sortedResults.sort((a, b) => a.calories - b.calories);
      break;
    case "calories-desc":
      sortedResults.sort((a, b) => b.calories - a.calories);
      break;
    case "protein-desc":
      sortedResults.sort((a, b) => b.protein - a.protein);
      break;
    case "phosphorus-desc":
      sortedResults.sort((a, b) => b.phosphorus - a.phosphorus);
      break;
    case "potassium-desc":
      sortedResults.sort((a, b) => b.potassium - a.potassium);
      break;
    case "carbs-desc":
      sortedResults.sort((a, b) => b.carbs - a.carbs);
      break;
  }

  renderResults(sortedResults); // Display sorted results
}

// Render results as cards inside the results container
function renderResults(results) {
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';

  results.forEach(item => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const foodData = JSON.stringify(item).replace(/'/g, "&#39;");

    card.innerHTML = `
      <h3>${item.name || item["Description"]}</h3>
      <ul>
        <li><strong>Grams:</strong> ${item.grams}g</li>
        <li><strong>Calories:</strong> ${item.calories}</li>
        <li><strong>Protein:</strong> ${item.protein}g</li>
        <li><strong>Phosphorus:</strong> ${item.phosphorus}mg</li>
        <li><strong>Potassium:</strong> ${item.potassium}mg</li>
        <li><strong>Carbs:</strong> ${item.carbs}g</li>
      </ul>
    `;

    // ⬇️ Create button container
    const buttonGroup = document.createElement("div");
    buttonGroup.style.display = "flex";
    buttonGroup.style.justifyContent = "space-between";
    buttonGroup.style.alignItems = "center";
    buttonGroup.style.marginTop = "10px";


    // 🟨 Add to Meal History button (existing)
    // Existing button (left side)
    const addButton = document.createElement("button");
    addButton.className = "btn add-to-meal";
    addButton.textContent = "Add to Meal History";
    addButton.dataset.food = foodData;
    addButton.style.flex = "1";
    addButton.style.marginRight = "10px";

// New log button (right side, larger)
    const logButton = document.createElement("button");
    logButton.className = "btn log-meal";
    logButton.textContent = "Log This Meal";
    logButton.dataset.food = foodData;
    logButton.style.flex = "2";
    logButton.style.padding = "12px 18px";
    logButton.style.fontSize = "1rem";
    logButton.style.backgroundColor = "#4CAF50";
    logButton.style.color = "white";
    logButton.style.border = "none";
    logButton.style.borderRadius = "6px";
    logButton.style.boxShadow = "0px 2px 4px rgba(0,0,0,0.2)";
    logButton.style.cursor = "pointer";


    buttonGroup.appendChild(addButton);
    buttonGroup.appendChild(logButton);
    card.appendChild(buttonGroup);

    container.appendChild(card);
  });
}

document.addEventListener("click",  function (e) {
  if (e.target.classList.contains("log-meal")) {
    const foodItem = JSON.parse(e.target.dataset.food);

    const payload = {
      mealName: prompt("Enter a name for this meal:", foodItem.name) || `Manual Meal - ${new Date().toISOString().split("T")[0]}`,
      time: new Date().toISOString(),
      mealType: "history",
      ingredients: [{
        name: foodItem.name,
        grams: foodItem.grams,
        calories: foodItem.calories,
        protein: foodItem.protein,
        phosphorus: foodItem.phosphorus,
        potassium: foodItem.potassium,
        carbs: foodItem.carbs
      }]
    };

    (async () => {
      try {
        const res = await fetch("/dashboard/api/user-meal-history", {
          method: "POST",
          credentials: "include",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const msg = await res.text();
          console.error("❌ Log failed:", msg);
          alert("Failed to log meal.");
          return;
        }

        // ✅ Redirect to user meal history
        window.location.href = "/dashboard/user-meal-history";

      } catch (err) {
        console.error("❌ Log error:", err);
        alert("Unexpected error during meal log.");
      }
    })();
  }
});

// Event delegation to handle all "Add to Meal" buttons
document.addEventListener("click",  function (e) {
  if (e.target.classList.contains("add-to-meal")) {
    const foodItem = JSON.parse(e.target.dataset.food);
    (async () => {
      await addToMealHistory(foodItem);
    })();
  }
});

// api call function to testutils
async function fetchNutrientData(query) {
  const gramsInput = document.getElementById("gramsInput");
  const grams = parseFloat(gramsInput.value) || 100;

  const res = await fetch(`/dashboard/search-food?q=${encodeURIComponent(query)}`, {
    credentials: "include"
  });
  const json = await res.json();

  return json.results.map(item => {
    const multiplier = grams / 100;
    return {
      foodCode: item["Food Code"],
      name: item["Description"],
      grams: grams,
      calories: +(item["Calories"] * multiplier).toFixed(2),      // ✅ number
      protein: +(item["Protein (g)"] * multiplier).toFixed(2),    // ✅ number
      phosphorus: +(item["Phosphorus (mg)"] * multiplier).toFixed(2),
      potassium: +(item["Potassium (mg)"] * multiplier).toFixed(2),
      carbs: +(item["Carbohydrate (g)"] * multiplier).toFixed(2)
    };
  });

}


//Recent Search Functionality
function saveToRecent(query) {
  let recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
  recent = [query, ...recent.filter(q => q !== query)].slice(0, 5); // max 5 items
  localStorage.setItem("recentSearches", JSON.stringify(recent));
}

function renderRecentSearches() {
  const container = document.getElementById("recentContainer");
  const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");

  container.innerHTML = recent.map(q => `<li data-query="${q}">${q}</li>`).join("");
}
document.addEventListener("click", function (e) {
  const li = e.target.closest("#recentContainer li");
  if (li) {
    document.getElementById("queryInput").value = li.dataset.query;
    handleSearch();
  }
});


//add to meal histroy function
async function addToMealHistory(item) {
  const gramsInput = document.getElementById("gramsInput");
  const grams = parseFloat(gramsInput.value) || 100;

  if (!item.foodCode) {
    alert("Could not find food code for: " + item.name);
    return;
  }

  const payload = {
    mealName: prompt("Enter a name for this meal:", item.name),
    time: new Date().toISOString(),
    mealType: "favorite",
    ingredients: [{
      name: item.name,
      foodCode: item.foodCode,
      grams: grams,
      calories: item.calories,
      protein: item.protein,
      phosphorus: item.phosphorus,
      potassium: item.potassium,
      carbs: item.carbs
    }]
  };
  console.log("📤 Sending payload to testutils:", JSON.stringify(payload, null, 2));


  try {
    const res = await fetch("/dashboard/api/user-meal-history", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("❌ Failed to save meal:", msg);
      alert("Failed to save meal.");
      return;
    }

    alert("✅ Meal saved to history!");
    updateTotals(payload.ingredients);
    gramsInput.value = "";
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    alert("Something went wrong.");
  }
}

function updateTotals(ingredients) {
  let totalPotassium = 0, totalPhosphorus = 0;
  ingredients.forEach(i => {
    totalPotassium += i.potassium || 0;
    totalPhosphorus += i.phosphorus || 0;
  });

  const newK = totalPotassium + (parseFloat(localStorage.getItem("totalPotassium")) || 0);
  const newP = totalPhosphorus + (parseFloat(localStorage.getItem("totalPhosphorus")) || 0);

  localStorage.setItem("totalPotassium", newK);
  localStorage.setItem("totalPhosphorus", newP);
  localStorage.setItem("mealUpdated", "true");
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateTotals
  };
}



