
const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

if(menu && menuLinks) {
  menu.addEventListener('click', function () {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
  });
}

async function loadWelcomeName() {
  try {
    const res = await fetch("/dashboard/api/user-info", { credentials: "include" });
    const data = await res.json();

    const name = data.firstName || "User";
    document.getElementById("welcomeMessage").textContent = `Welcome, ${name}!`;
  } catch (err) {
    console.error("Failed to fetch user info:", err);
    document.getElementById("welcomeMessage").textContent = "Welcome!";
  }
}


// Clock display
function updateDateTime() {
  const now = new Date();
  document.getElementById('currentDateTime').textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);

// Backend-driven pie chart totals
async function initializeTotals() {
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await fetch(`/dashboard/api/nutrient-history?start=${today}&end=${today}`, {
      credentials: "include"
    });


    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const { potassiumTotal, phosphorousTotal } = data[0];
      updatePieCharts(potassiumTotal, phosphorousTotal);
    } else {
      updatePieCharts(0, 0);
    }
  } catch (err) {
    console.error("❌ Error fetching nutrient data:", err);
    updatePieCharts(0, 0);
  }
}

// Update pie charts with nutrient totals
function updatePieCharts(totalPotassium, totalPhosphorus) {
  const potassiumRemaining = Math.max(3400 - totalPotassium, 0);
  const phosphorousRemaining = Math.max(700 - totalPhosphorus, 0);

  document.getElementById('phosphorousTotal').textContent = totalPhosphorus;
  document.getElementById('phosphorousRemaining').textContent = phosphorousRemaining;

  document.getElementById('potassiumTotal').textContent = totalPotassium;
  document.getElementById('potassiumRemaining').textContent = potassiumRemaining;

  potassiumChart.data.datasets[0].data = [totalPotassium, potassiumRemaining];
  potassiumChart.update();

  phosphorousChart.data.datasets[0].data = [totalPhosphorus, phosphorousRemaining];
  phosphorousChart.update();
}

// Chart.js pie chart setup
const ctxPotassium = document.getElementById('potassiumChart').getContext('2d');
const potassiumChart = new Chart(ctxPotassium, {
  type: 'pie',
  data: {
    labels: ['Consumed', 'Remaining'],
    datasets: [{
      data: [0, 3400],
      backgroundColor: ['#EF4056', '#81D3EB']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Potassium Intake (Max: 3400 mg)' }
    }
  }
});

const ctxPhosphorous = document.getElementById('phosphorousChart').getContext('2d');
const phosphorousChart = new Chart(ctxPhosphorous, {
  type: 'pie',
  data: {
    labels: ['Consumed', 'Remaining'],
    datasets: [{
      data: [0, 700],
      backgroundColor: ['#EF4056', '#70B865']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Phosphorous Intake (Max: 700 mg)' }
    }
  }
});

// Button card navigation
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".dashboard-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const target = card.getAttribute("data-target");
      if (target) window.location.href = target;
    });
  });
});

// Image preloading (optional)
["manual-icon.jpg", "ai-icon.jpg", "meal-icon.jpg", "history-icon.png"].forEach(img => {
  const preload = new Image();
  preload.src = `/public/images/${img}`;
});

// 🚀 Load testutils data into pie charts on page load
initializeTotals();
loadWelcomeName();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadWelcomeName,
    updatePieCharts,      // optional
    initializeTotals,   // optional
    updateDateTime
  };
}

