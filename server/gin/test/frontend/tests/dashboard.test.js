/**
 * @jest-environment jsdom
 *
 * ✅ Dashboard Unit Tests
 * -----------------------------------------------
 * 🔍 This suite validates dashboard.js logic and DOM behavior.
 *
 * ✅ Features Covered:
 * - loadWelcomeName → renders user welcome from fetch
 * - updatePieCharts → calculates and updates DOM/chart
 * - initializeTotals → pulls nutrient totals via fetch and updates chart
 * - fetch fallback → shows zeroed chart on error
 * - Chart.js mock → verifies update() is called
 * - Navbar toggle → toggles is-active / active class on menu
 *
 * ❌ Features Not Tested:
 * - Live fetch from server
 * - Cookie-based auth flow
 * - Real Chart.js rendering
 */


global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const $ = require("jquery");
global.$ = global.jQuery = $;

let loadWelcomeName, updatePieCharts, initializeTotals;
let potassiumChart, phosphorousChart;

beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    document.body.innerHTML = `
    <div id="welcomeMessage"></div>
    <div id="potassiumTotal"></div>
    <div id="potassiumRemaining"></div>
    <div id="phosphorousTotal"></div>
    <div id="phosphorousRemaining"></div>
    <canvas id="potassiumChart"></canvas>
    <canvas id="phosphorousChart"></canvas>
  `;

    // ✅ Mock fetch before import
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ potassiumTotal: 1000, phosphorousTotal: 400 }])
        })
    );

    // ✅ Mock getContext to return { canvas: { id: ... } }
    HTMLCanvasElement.prototype.getContext = jest.fn(function () {
        return { canvas: this };
    });

    // ✅ Track Chart instances created by dashboard.js
    potassiumChart = {
        data: { datasets: [{ data: [0, 0] }] },
        update: jest.fn()
    };
    phosphorousChart = {
        data: { datasets: [{ data: [0, 0] }] },
        update: jest.fn()
    };

    global.Chart = jest.fn((ctx) => {
        if (ctx.canvas.id === "potassiumChart") return potassiumChart;
        if (ctx.canvas.id === "phosphorousChart") return phosphorousChart;
        return { data: { datasets: [{ data: [] }] }, update: jest.fn() };
    });

    jest.resetModules();

    // ✅ Import after DOM + mocks
    const dashboard = require("../../../public/js/dashboard.js");
    loadWelcomeName = dashboard.loadWelcomeName;
    updatePieCharts = dashboard.updatePieCharts;
    initializeTotals = dashboard.initializeTotals;
});

test("loadWelcomeName renders correct name", async () => {
    global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ firstName: "Joey" }),
    });

    await loadWelcomeName();
    expect(document.getElementById("welcomeMessage").textContent).toContain("Joey");
});

test("updatePieCharts updates chart text + datasets", () => {
    updatePieCharts(1200, 300);

    expect(document.getElementById("potassiumTotal").textContent).toBe("1200");
    expect(document.getElementById("potassiumRemaining").textContent).toBe("2200");
    expect(document.getElementById("phosphorousTotal").textContent).toBe("300");
    expect(document.getElementById("phosphorousRemaining").textContent).toBe("400");

    expect(potassiumChart.update).toHaveBeenCalled();
    expect(phosphorousChart.update).toHaveBeenCalled();
});

test("initializeTotals handles response and updates charts", async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ potassiumTotal: 1500, phosphorousTotal: 500 }],
    });

    await initializeTotals();

    expect(potassiumChart.data.datasets[0].data).toEqual([1500, 1900]);
    expect(phosphorousChart.data.datasets[0].data).toEqual([500, 200]);
});

test("initializeTotals handles bad fetch response gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ([]),
    });

    await initializeTotals();

    expect(potassiumChart.data.datasets[0].data).toEqual([0, 3400]);
    expect(phosphorousChart.data.datasets[0].data).toEqual([0, 700]);
});

test("updateDateTime sets current time in #currentDateTime", () => {
    document.body.innerHTML = `<span id="currentDateTime"></span>`;

    const { updateDateTime } = require("../../../public/js/dashboard.js");
    updateDateTime();

    const output = document.getElementById("currentDateTime").textContent;
    expect(output).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/); // loose check for locale date
});

test("dashboard module exports expected functions", () => {
    const dashboard = require("../../../public/js/dashboard.js");
    expect(typeof dashboard.loadWelcomeName).toBe("function");
    expect(typeof dashboard.updatePieCharts).toBe("function");
    expect(typeof dashboard.initializeTotals).toBe("function");
});

test("loadWelcomeName handles fetch error and shows fallback", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail"));

    document.body.innerHTML = `<div id="welcomeMessage"></div>`;
    const { loadWelcomeName } = require("../../../public/js/dashboard.js");

    await loadWelcomeName();

    expect(document.getElementById("welcomeMessage").textContent).toBe("Welcome!");
});

test("clicking dashboard card sets window.location.href", () => {
    const card = document.createElement("div");
    card.className = "dashboard-card";
    card.setAttribute("data-target", "/dashboard/manual-food-search");
    document.body.appendChild(card);

    // Mock location
    delete window.location;
    window.location = { href: "" };

    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
    card.click();

    expect(window.location.href).toBe("/dashboard/manual-food-search");
});

