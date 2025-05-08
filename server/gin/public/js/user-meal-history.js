let chart, potassiumChart;

const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

if (menu && menuLinks) {
  menu.addEventListener('click', function () {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
  });
}
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const header = lines[0].split(",").map(h => h.trim());
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line !== "") {
      const values = line.split(",").map(v => v.trim());
      const record = {};
      for (let j = 0; j < header.length; j++) {
        record[header[j]] = values[j];
      }
      records.push(record);
    }
  }
  return records;
}

async function loadGraphDataFromDB(beginDate, endDate) {
  try {
    const response = await fetch(`/dashboard/api/nutrient-history?start=${beginDate}&end=${endDate}`, {
      credentials: "include"
    });

    if (!response.ok) throw new Error("Failed to load graph data");

    const data = await response.json();

    console.log("🔍 Nutrient history raw response:", data);

    if (!Array.isArray(data)) throw new Error("Invalid format");

    const labels = data.map(row => row.date);
    const phosphorousData = data.map(row => row.phosphorousTotal);
    const potassiumData = data.map(row => row.potassiumTotal);

    renderChart("historyChart", "Phosphorous Intake (mg)", labels, phosphorousData, "#1E5288");
    renderChart("potassiumChart", "Potassium Intake (mg)", labels, potassiumData, "#EF4056");
  } catch (err) {
    console.error("❌ Error loading nutrient history from DB:", err);
  }
}

function renderChart(canvasId, label, labels, dataPoints, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const chartInstance = canvasId === "historyChart" ? chart : potassiumChart;
  if (chartInstance) chartInstance.destroy();

  const newChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + "33", // semi-transparent fill
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Date" }},
        y: { title: { display: true, text: label }}
      }
    }
  });

  if (canvasId === "historyChart") chart = newChart;
  else potassiumChart = newChart;
}


document.getElementById("dateRangeForm").addEventListener("submit", function(event) {
  event.preventDefault();
  const beginDate = document.getElementById("beginDate").value;
  const endDate = document.getElementById("endDate").value;
  loadGraphDataFromDB(beginDate, endDate);
});


window.onload = function () {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const formattedToday = today.toISOString().split("T")[0];
  const formattedOneWeekAgo = oneWeekAgo.toISOString().split("T")[0];

  document.getElementById("beginDate").value = formattedOneWeekAgo;
  document.getElementById("endDate").value = formattedToday;

  loadGraphDataFromDB(formattedOneWeekAgo, formattedToday);
  loadLoggedMeals();  // ✅ This was not firing before

};

async function loadLoggedMeals() {
  try {
    const res = await fetch("/dashboard/api/user-logged-meals", { credentials: "include" });
    const meals = await res.json();

    renderLoggedMeals(meals);
  } catch (err) {
    console.error("❌ Failed to fetch meal history logs:", err);
    document.getElementById("loggedMeals").innerHTML = "<p>Could not load meal logs.</p>";
  }
}

function renderLoggedMeals(meals) {
  const container = document.getElementById("loggedMeals");
  container.innerHTML = "";

  if (!meals || meals.length === 0) {
    container.innerHTML = "<p>No logged meals found.</p>";
    return;
  }

  let html = "";
  for (const meal of meals) {
    const mealTime = new Date(meal.time).toLocaleString();
    const ingredients = meal.ingredients || [];

    // If no ingredients array, fallback to flat rendering
    if (!Array.isArray(ingredients)) {
      console.warn("⚠️ Skipping malformed meal (no ingredients):", meal);
      continue;
    }

    // ✅ Calculate totals
    const totals = ingredients.reduce((acc, i) => {
      acc.grams += i.grams || 0;
      acc.calories += i.calories || 0;
      acc.protein += i.protein || 0;
      acc.carbs += i.carbs || 0;
      acc.phosphorus += i.phosphorus || 0;
      acc.potassium += i.potassium || 0;
      return acc;
    }, { grams: 0, calories: 0, protein: 0, carbs: 0, phosphorus: 0, potassium: 0 });

    html += `
      <div class="meal-block">
        <div class="meal-header">
          <div class="meal-meta">
            <h4>${meal.mealName}</h4>
            <small>${mealTime}</small>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ingredient</th><th>Grams</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Phosphorus</th><th>Potassium</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const ing of ingredients) {
      html += `
        <tr>
          <td>${ing.name}</td>
          <td>${ing.grams}</td>
          <td>${ing.calories}</td>
          <td>${ing.protein}</td>
          <td>${ing.carbs}</td>
          <td>${ing.phosphorus}</td>
          <td>${ing.potassium}</td>
        </tr>
      `;
    }

    html += `
      <tr class="nutrient-summary">
        <td><strong>Total</strong></td>
        <td>${totals.grams}</td>
        <td>${totals.calories}</td>
        <td>${totals.protein}</td>
        <td>${totals.carbs}</td>
        <td>${totals.phosphorus}</td>
        <td>${totals.potassium}</td>
      </tr>
    `;

    html += `
        </tbody>
      </table>
    </div>`;
  }

  container.innerHTML = html;
}

