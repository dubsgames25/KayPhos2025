const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

if (menu && menuLinks) {
  menu.addEventListener('click', function () {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
  });
}
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("addIngredient").addEventListener("click", addIngredientRow);
  document.getElementById("saveMeal").addEventListener("click", saveMeal);

  const logBtn = document.createElement("button");
  logBtn.textContent = "Save & Log Meal";
  logBtn.classList.add("btn", "btn-success", "log-btn");

  logBtn.addEventListener("click", async () => {
    const mealName = document.getElementById("mealName").value || `User Meal - ${new Date().toISOString().split("T")[0]}`;
    const ingredients = getDefinedMealIngredients();

    if (!ingredients.length) {
      alert("Nothing to log.");
      return;
    }

    const now = new Date().toISOString();

    const favoritePayload = {
      mealName,
      time: now,
      mealType: "favorite",
      ingredients
    };

    const historyPayload = {
      mealName,
      time: now,
      mealType: "history",
      ingredients
    };

    try {
      const [favRes, logRes] = await Promise.all([
        fetch("/dashboard/api/user-meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(favoritePayload)
        }),
        fetch("/dashboard/api/user-meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(historyPayload)
        })
      ]);

      if (!favRes.ok || !logRes.ok) {
        const errMsg = await (favRes.ok ? logRes.text() : favRes.text());
        console.error("❌ One or both requests failed:", errMsg);
        alert("Meal save or log failed.");
        return;
      }

      alert("✅ Meal saved to favorites and logged to history!");
      updateTotals(ingredients);

      window.location.href = "/dashboard/user-meal-history";

    } catch (err) {
      console.error("❌ Save & Log error:", err);
      alert("Unexpected error occurred.");
    }
  });


  document.getElementById("userDefineMealControls").appendChild(logBtn);
  loadSavedMeals();
});

function addIngredientRow() {
  const tbody = document.getElementById("ingredientBody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" class="ingredient-name"></td>
    <td><input type="number" class="ingredient-grams"></td>
    <td><input type="number" class="ingredient-calories"></td>
    <td><input type="number" class="ingredient-protein"></td>
    <td><input type="number" class="ingredient-carbs"></td>
    <td><input type="number" class="ingredient-potassium"></td>
    <td><input type="number" class="ingredient-phosphorus"></td>
    <td><button type="button" onclick="removeRow(this)">Remove</button></td>
  `;
  tbody.appendChild(row);
}

function removeRow(button) {
  button.closest("tr").remove();
}

function getDefinedMealIngredients() {
  const rows = document.querySelectorAll("#ingredientBody tr");
  const ingredients = [];

  for (const row of rows) {
    const name = row.querySelector(".ingredient-name").value.trim();
    const grams = parseFloat(row.querySelector(".ingredient-grams").value);
    const calories = parseFloat(row.querySelector(".ingredient-calories").value);
    const protein = parseFloat(row.querySelector(".ingredient-protein").value);
    const carbs = parseFloat(row.querySelector(".ingredient-carbs").value);
    const potassium = parseFloat(row.querySelector(".ingredient-potassium").value);
    const phosphorus = parseFloat(row.querySelector(".ingredient-phosphorus").value);

    if (!name || isNaN(grams)) continue;

    ingredients.push({ name, grams, calories, protein, carbs, potassium, phosphorus });
  }

  return ingredients;
}


async function saveMeal() {
  const mealName = document.getElementById("mealName").value.trim();
  if (!mealName) {
    alert("Please enter a meal name.");
    return;
  }

  const rows = document.querySelectorAll("#ingredientBody tr");
  const ingredients = [];

  for (const row of rows) {
    const name = row.querySelector(".ingredient-name").value.trim();
    const grams = parseFloat(row.querySelector(".ingredient-grams").value);
    const calories = parseFloat(row.querySelector(".ingredient-calories").value);
    const protein = parseFloat(row.querySelector(".ingredient-protein").value);
    const carbs = parseFloat(row.querySelector(".ingredient-carbs").value);
    const potassium = parseFloat(row.querySelector(".ingredient-potassium").value);
    const phosphorus = parseFloat(row.querySelector(".ingredient-phosphorus").value);

    if (!name || isNaN(grams)) continue;

    ingredients.push({ name, grams, calories, protein, carbs, potassium, phosphorus });
  }

  if (ingredients.length === 0) {
    alert("Please add at least one valid ingredient.");
    return;
  }

  const payload = {
    mealName,
    time: new Date().toISOString(),
    mealType: "favorite",
    ingredients
  };

  try {
    const res = await fetch("/dashboard/api/user-meal-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Error saving meal:", err);
      alert("Failed to save meal.");
      return;
    }

    alert("Meal saved successfully!");
    location.reload();
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("Something went wrong.");
  }
}

async function loadSavedMeals() {
  try {
    const meals = await fetchMeals();
    const container = document.getElementById("mealHistory");

    if (!meals || meals.length === 0) {
      container.innerHTML = "<p>No meals saved yet.</p>";
      return;
    }

    const groupedMeals = groupMeals(meals);
    container.innerHTML = generateMealsHTML(groupedMeals);

    setupDeleteButtons();
    setupLogAgainButtons();
  } catch (err) {
    console.error("Failed to load meal history", err);
    document.getElementById("mealHistory").innerHTML = "<p>Could not load meal history.</p>";
  }
}

async function fetchMeals() {
  const res = await fetch("/dashboard/api/user-meal-history", { credentials: "include" });
  return res.json();
}

function groupMeals(meals) {
  return meals.reduce((grouped, entry) => {
    const key = `${entry.mealName}||${entry.time}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(entry);
    return grouped;
  }, {});
}

function generateMealsHTML(grouped) {
  let html = "";

  for (const key in grouped) {
    const meal = grouped[key][0];
    const mealTime = new Date(meal.time).toLocaleString();
    const ingredients = meal.ingredients;

    const totals = ingredients.reduce((acc, item) => {
      acc.grams += item.grams || 0;
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.carbs += item.carbs || 0;
      acc.phosphorus += item.phosphorus || 0;
      acc.potassium += item.potassium || 0;
      return acc;
    }, { grams: 0, calories: 0, protein: 0, carbs: 0, phosphorus: 0, potassium: 0 });

    html += `
      <table class="meal-table">
        <thead>
          <tr class="meal-subheader">
            <th colspan="7">
              <strong>${meal.mealName}</strong> <small>(${mealTime})</small>
              <button class="log-again-btn" data-name="${meal.mealName}" data-ingredients='${JSON.stringify(meal.ingredients)}'>Log This Meal Again</button>
              <button class="delete-meal-btn" data-mealname="${meal.mealName}" data-mealtime="${meal.time}">🗑 Delete</button>
            </th>
          </tr>
          <tr>
            <th>Ingredient</th><th>Grams</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Phosphorus</th><th>Potassium</th>
          </tr>
        </thead>
        <tbody>
          ${ingredients.map(ing => `
            <tr>
              <td>${ing.name}</td>
              <td>${ing.grams}</td>
              <td>${ing.calories}</td>
              <td>${ing.protein}</td>
              <td>${ing.carbs}</td>
              <td>${ing.phosphorus}</td>
              <td>${ing.potassium}</td>
            </tr>
          `).join('')}
          <tr class="nutrient-summary">
            <td><strong>Total</strong></td>
            <td>${totals.grams}</td>
            <td>${totals.calories}</td>
            <td>${totals.protein}</td>
            <td>${totals.carbs}</td>
            <td>${totals.phosphorus}</td>
            <td>${totals.potassium}</td>
          </tr>
        </tbody>
      </table><br>
    `;
  }

  return html;
}

function setupDeleteButtons() {
  document.querySelectorAll(".delete-meal-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { mealname: mealName, mealtime: mealTime } = btn.dataset;
      if (confirm(`Delete all entries for "${mealName}" at ${new Date(mealTime).toLocaleString()}?`)) {
        await deleteMealByNameAndTime(mealName, mealTime);
        await loadSavedMeals();
      }
    });
  });
}

function setupLogAgainButtons() {
  document.querySelectorAll(".log-again-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        const mealName = btn.dataset.name;
        const ingredients = JSON.parse(btn.dataset.ingredients);

        const portionInput = prompt("How many grams did you eat from this meal?");
        const portionGrams = parseFloat(portionInput);

        if (isNaN(portionGrams) || portionGrams <= 0) {
          alert("Invalid portion size. Please enter a number.");
          return;
        }

        const totalGrams = ingredients.reduce((sum, i) => sum + (i.grams || 0), 0);
        const scaleFactor = portionGrams / totalGrams;

        const scaledIngredients = ingredients.map(i => ({
          name: i.name,
          grams: Math.round(i.grams * scaleFactor),
          calories: Math.round(i.calories * scaleFactor),
          protein: Math.round(i.protein * scaleFactor),
          carbs: Math.round(i.carbs * scaleFactor),
          phosphorus: Math.round(i.phosphorus * scaleFactor),
          potassium: Math.round(i.potassium * scaleFactor)
        }));

        const payload = {
          mealName,
          time: new Date().toISOString(),
          mealType: "history",
          ingredients: scaledIngredients
        };

        const res = await fetch("/dashboard/api/user-meal-history", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.text();
          console.error("❌ Failed to re-log meal:", err);
          alert("Could not re-log meal.");
          return;
        }

        alert("✅ Meal logged!");
        window.location.href = "/dashboard/user-meal-history";

      } catch (err) {
        console.error("❌ Re-log error:", err);
        alert("Unexpected error.");
      }
    });
  });
}


async function deleteMealByNameAndTime(mealName, time) {
  try {
    const res = await fetch("/dashboard/user-meal-history", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealName, time })
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("❌ Failed to delete meal:", msg);
      alert("Failed to delete meal.");
      return;
    }

    alert("✅ Meal deleted.");
  } catch (err) {
    console.error("❌ Error deleting meal:", err);
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
  module.exports = {    removeRow,
    getDefinedMealIngredients,
    loadSavedMeals
};}