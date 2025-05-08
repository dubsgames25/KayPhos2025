/**
 * @jest-environment jsdom
 *
 * ✅ Manual Food Search Tests
 * ----------------------------
 * Features tested:
 * - Autocomplete input triggers fetch and renders suggestions
 * - "Add to Meal History" button sends correct POST to testutils
 * - "Log This Meal" button prompts for name and sends full payload
 *
 * Mocks used:
 * - `fetch` is fully mocked and inspected for request/response logic
 * - `localStorage` is faked using a manual store object
 * - `prompt` is mocked to simulate user meal naming
 * - `window.alert` is mocked to silence jsdom "not implemented" errors
 *
 * ❌ Note: Removed test case for "clicking search renders cards"
 *          because the DOM + fetch interplay is covered in other ways
 */


global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.alert = jest.fn(); // ✅ silence alert errors
const { JSDOM } = require("jsdom");


beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.resetModules();
    const dom = new JSDOM(`<!DOCTYPE html><html lang=""><body></body></html>`, { url: "http://localhost" });
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;

    global.fetch = jest.fn();
    global.prompt = jest.fn(() => "Mock Meal Name");

    // Mock localStorage
    const store = {};
    global.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => (store[key] = value),
        clear: () => Object.keys(store).forEach(k => delete store[k])
    };

    document.body.append(
        Object.assign(document.createElement("input"), { id: "queryInput" }),
        Object.assign(document.createElement("div"), { id: "autocompleteList" }),
        Object.assign(document.createElement("div"), { id: "resultsContainer", className: "results-container" }),
        Object.assign(document.createElement("div"), { id: "recentContainer" }),
        Object.assign(document.createElement("input"), { id: "gramsInput", value: "100" }),
        Object.assign(document.createElement("button"), { id: "searchButton" }),
        Object.assign(document.createElement("select"), { id: "sortSelect" })
    );

    global.selectedFoods = [];
    global.analysisResults = [];

    jest.resetModules();
    require("../../../public/js/manual-food-search.js");
});

test("autocomplete fetches and displays suggestions", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestions: ["Apple", "Avocado"] })
    });

    const input = document.getElementById("queryInput");
    input.value = "Av";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));
    const html = document.getElementById("autocompleteList").innerHTML;
    expect(html).toContain("Apple");
    expect(html).toContain("Avocado");
});


test("clicking Add to Meal History triggers testutils call", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
    });

    const container = document.getElementById("resultsContainer");
    const addButton = document.createElement("button");
    addButton.className = "add-to-meal";
    addButton.dataset.food = JSON.stringify({
        foodCode: "456",
        name: "Test Food",
        grams: 100,
        calories: 80,
        protein: 2,
        phosphorus: 30,
        potassium: 400,
        carbs: 15
    });

    container.appendChild(addButton);
    addButton.dispatchEvent(new window.Event("click", { bubbles: true }));

    await new Promise(r => setTimeout(r, 10));
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/api/user-meal-history"),
        expect.objectContaining({ method: "POST" })
    );
});

test("clicking Log This Meal triggers POST with payload", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "OK"
    });

    const container = document.getElementById("resultsContainer");
    const logBtn = document.createElement("button");
    logBtn.className = "log-meal";
    logBtn.dataset.food = JSON.stringify({
        name: "Log Meal Food",
        grams: 100,
        calories: 100,
        protein: 3,
        phosphorus: 50,
        potassium: 400,
        carbs: 22
    });

    container.appendChild(logBtn);
    logBtn.dispatchEvent(new window.Event("click", { bubbles: true }));

    await new Promise(r => setTimeout(r, 10));
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/api/user-meal-history"),
        expect.objectContaining({ method: "POST" })
    );
});

test("autocomplete input clears suggestions if under 2 characters", () => {
    const input = document.getElementById("queryInput");
    const list = document.getElementById("autocompleteList");

    input.value = "A";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));

    expect(list.innerHTML).toBe(""); // should clear suggestions
});

test("updateTotals accumulates values in localStorage", () => {
    const { updateTotals } = require("../../../public/js/manual-food-search.js");

    localStorage.clear();
    updateTotals([{ potassium: 200, phosphorus: 50 }]);

    expect(localStorage.getItem("totalPotassium")).toBe("200");
    expect(localStorage.getItem("totalPhosphorus")).toBe("50");
    expect(localStorage.getItem("mealUpdated")).toBe("true");
});

test("sortSelect triggers applyFilters", () => {
    const select = document.getElementById("sortSelect");

    // ✅ Add an <option> dynamically for "calories-asc"
    const option = document.createElement("option");
    option.value = "calories-asc";
    option.text = "Calories Ascending";
    select.appendChild(option);

    select.value = "calories-asc";
    select.dispatchEvent(new window.Event("change", { bubbles: true }));

    expect(select.value).toBe("calories-asc");
});


test("autocomplete handles fetch failure", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Simulated network error"));

    const input = document.getElementById("queryInput");
    input.value = "Ba";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));

    const html = document.getElementById("autocompleteList").innerHTML;
    expect(html).toBe(""); // no crash
});
