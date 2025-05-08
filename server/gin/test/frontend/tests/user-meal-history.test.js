/**
 * @jest-environment jsdom
 *
 * ✅ User Meal History Tests
 * ----------------------------
 * Features tested:
 * - window.onload correctly sets default date inputs
 * - Nutrient history fetch triggers graph rendering via Chart.js
 * - Logged meal history renders and groups meals by mealName
 * - Graceful fallback when testutils returns error or fails
 *
 * Mocks used:
 * - fetch: nutrient totals and meal logs (ordered response mocking)
 * - Chart: mocked to avoid canvas crash in jsdom
 * - window.alert: silenced
 * - HTMLCanvasElement.getContext: patched to prevent render crash
 *
 * ✅ Final Status: All tests passing with realistic DOM + testutils logic simulated
 */


global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const { JSDOM } = require("jsdom");


beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    const dom = new JSDOM(`<!DOCTYPE html><html lang=""><body></body></html>`, { url: "http://localhost" });
    global.window = dom.window;
    global.document = dom.window.document;

    HTMLCanvasElement.prototype.getContext = () => ({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(() => ({ data: [] })),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        fillText: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
    });


    // Silence unsupported
    global.fetch = jest.fn();
    global.Chart = jest.fn().mockImplementation(() => ({
        destroy: jest.fn()
    }));

    document.body.innerHTML = `
    <form id="dateRangeForm">
      <input type="date" id="beginDate" />
      <input type="date" id="endDate" />
    </form>
    <canvas id="historyChart"></canvas>
    <canvas id="potassiumChart"></canvas>
    <div id="loggedMeals"></div>
  `;

    jest.resetModules();
    require("../../../public/js/user-meal-history.js");
});

test("window.onload sets default date inputs", () => {
    window.onload();
    const beginDate = document.getElementById("beginDate").value;
    expect(beginDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

});

test("loads graph data from testutils and triggers Chart render", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
            { date: "2025-04-01", phosphorousTotal: 250, potassiumTotal: 1800 },
            { date: "2025-04-02", phosphorousTotal: 300, potassiumTotal: 2100 }
        ]
    });

    await new Promise(r => setTimeout(r, 20));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/dashboard/api/nutrient-history"), expect.anything());
    expect(global.Chart).toHaveBeenCalled();
});

test("fallback UI on graph fetch error", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await new Promise(r => setTimeout(r, 20));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("❌ Error loading nutrient history from DB:"), expect.any(Error));
    errorSpy.mockRestore();
});

test("loads and renders grouped logged meals", async () => {
    global.fetch
        .mockResolvedValueOnce({
            ok: true,
            json: async () => [] // nutrient-history fetch
        })
        .mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    mealName: "Breakfast",
                    time: "2025-04-01T08:00:00Z",
                    ingredients: [
                        {
                            name: "Oats",
                            grams: 100,
                            calories: 250,
                            protein: 8,
                            carbs: 40,
                            phosphorus: 100,
                            potassium: 200
                        },
                        {
                            name: "Banana",
                            grams: 120,
                            calories: 110,
                            protein: 1,
                            carbs: 27,
                            phosphorus: 25,
                            potassium: 450
                        }
                    ]
                }
            ]
        });

    window.onload();
    await new Promise(r => setTimeout(r, 30));

    const html = document.getElementById("loggedMeals").innerHTML;
    expect(html).toContain("Breakfast");
    expect(html).toContain("Oats");
    expect(html).toContain("Banana");
    expect(html).toContain("Calories");
    expect(document.querySelectorAll(".meal-block").length).toBe(1);
});

test("submitting date range triggers nutrient history fetch", async () => {
    const form = document.getElementById("dateRangeForm");
    form.dispatchEvent(new window.Event("submit", { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/dashboard/api/nutrient-history"), expect.anything());
});




test("fallback when logged meals fetch fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    window.onload(); // ✅ required for code to execute

    await new Promise(r => setTimeout(r, 20));
    expect(document.getElementById("loggedMeals").innerHTML).toContain("Could not load meal logs.");
});

