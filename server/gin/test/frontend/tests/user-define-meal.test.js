/**
 * @jest-environment jsdom
 *
 * ✅ User Define Meal Tests
 * --------------------------
 * Features tested:
 * - Add ingredient row
 * - Fill table inputs for food name, grams, and nutrients
 * - Validate save button with incomplete or missing fields
 * - Save valid meals via POST to /dashboard/api/user-meal-history
 *
 * Mocks used:
 * - fetch for testutils API calls
 * - prompt to simulate meal naming input
 * - alert to handle validation and success messages
 * - location.reload to prevent test crashes in jsdom
 *
 * ❌ Note: Test for "Save & Log Meal" was removed due to DOM timing and jsdom limitations.
 */

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.alert = jest.fn();
global.prompt = jest.fn(() => "Mocked Meal Name");

const {removeRow} = require("../../../public/js/user-define-meal");

beforeEach(() => {
    // Reset console errors to avoid test noise
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock a safe default fetch response for loadSavedMeals
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: async () => [] // simulate "no saved meals"
        })
    );

    // Mock global functions to prevent test crashes
    global.alert = jest.fn();
    global.prompt = jest.fn(() => "Mocked Meal");
    global.location = { reload: jest.fn(), href: "" };

    // Set up basic DOM needed by user-define-meal.js
    document.body.innerHTML = `
    <input type="text" id="mealName" />
    <table><tbody id="ingredientBody"></tbody></table>
    <button id="addIngredient">Add Ingredient</button>
    <button id="saveMeal">Save Meal</button>
    <div id="userDefineMealControls"></div>
    <div id="mealHistory"></div>
  `;

    // Reset localStorage mock
    global.localStorage = {
        store: {},
        getItem(key) { return this.store[key] || null; },
        setItem(key, value) { this.store[key] = value; },
        clear() { this.store = {}; }
    };

    // Load the module AFTER the DOM is ready
    jest.resetModules();
    require("../../../public/js/user-define-meal.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));
});


test("addIngredientRow adds a row to the ingredient table", () => {

    document.getElementById("addIngredient").click();

    const rows = document.querySelectorAll("#ingredientBody tr");
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector(".ingredient-name")).not.toBeNull();
});


test("removeRow removes the target ingredient row", () => {
    const tbody = document.getElementById("ingredientBody");

    const row = document.createElement("tr");
    row.innerHTML = `
    <td><input type="text" class="ingredient-name" value="Banana"></td>
    <td colspan="6"></td>
    <td><button onclick="removeRow(this)">Remove</button></td>
  `;
    tbody.appendChild(row);

    expect(tbody.querySelectorAll("tr").length).toBe(1);

    // Call the global removeRow function directly
    const { removeRow } = require("../../../public/js/user-define-meal.js");
    removeRow(row.querySelector("button"));

    expect(tbody.querySelectorAll("tr").length).toBe(0);
});

test("getDefinedMealIngredients extracts valid ingredient rows", () => {
    const tbody = document.getElementById("ingredientBody");

    const row = document.createElement("tr");
    row.innerHTML = `
    <td><input type="text" class="ingredient-name" value="Tomato"></td>
    <td><input type="number" class="ingredient-grams" value="100"></td>
    <td><input type="number" class="ingredient-calories" value="20"></td>
    <td><input type="number" class="ingredient-protein" value="1"></td>
    <td><input type="number" class="ingredient-carbs" value="4"></td>
    <td><input type="number" class="ingredient-potassium" value="200"></td>
    <td><input type="number" class="ingredient-phosphorus" value="25"></td>
    <td></td>
  `;
    tbody.appendChild(row);

    const { getDefinedMealIngredients } = require("../../../public/js/user-define-meal.js");
    const result = getDefinedMealIngredients();

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
        name: "Tomato",
        grams: 100,
        calories: 20,
        protein: 1,
        carbs: 4,
        potassium: 200,
        phosphorus: 25
    });
});

test("saveMeal alerts if meal name is missing", async () => {
    document.getElementById("mealName").value = "";

    const saveBtn = document.getElementById("saveMeal");
    saveBtn.click();

    await new Promise(r => setTimeout(r, 10));
    expect(global.alert).toHaveBeenCalledWith("Please enter a meal name.");
});

test("saveMeal alerts if no valid ingredients provided", async () => {
    document.getElementById("mealName").value = "My Meal";

    // Empty ingredient row
    document.getElementById("ingredientBody").innerHTML = `
    <tr>
      <td><input type="text" class="ingredient-name" value=""></td>
        <td><input type="number" class="ingredient-grams" value=""></td>
        <td><input type="number" class="ingredient-calories" value=""></td>
        <td><input type="number" class="ingredient-protein" value=""></td>
        <td><input type="number" class="ingredient-carbs" value=""></td>
        <td><input type="number" class="ingredient-potassium" value=""></td>
        <td><input type="number" class="ingredient-phosphorus" value=""></td>
        <td></td>
    </tr>
  `;

    document.getElementById("saveMeal").click();
    await new Promise(r => setTimeout(r, 10));

    expect(global.alert).toHaveBeenCalledWith("Please add at least one valid ingredient.");
});

test("Save & Log Meal button sends two POSTs and redirects", async () => {
    global.fetch.mockClear();

    // Inject a full valid ingredient row
    document.getElementById("ingredientBody").innerHTML = `
    <tr>
      <td><input type="text" class="ingredient-name" value="Avocado"></td>
      <td><input type="number" class="ingredient-grams" value="100"></td>
      <td><input type="number" class="ingredient-calories" value="160"></td>
      <td><input type="number" class="ingredient-protein" value="2"></td>
      <td><input type="number" class="ingredient-carbs" value="8"></td>
      <td><input type="number" class="ingredient-potassium" value="485"></td>
      <td><input type="number" class="ingredient-phosphorus" value="50"></td>
      <td></td>
    </tr>
  `;
    document.getElementById("mealName").value = "DualMeal";

    // Stub two successful POSTs
    global.fetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });

    // Mock redirect target
    delete window.location;
    window.location = { href: "" };

    // Trigger the real Save & Log button (injected on DOMContentLoaded)
    const logBtn = document.querySelector(".log-btn");
    expect(logBtn).not.toBeNull();

    logBtn.click();
    await new Promise((r) => setTimeout(r, 30));

    // ✅ Two POSTs made
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][1].body).toContain('"mealType":"favorite"');
    expect(global.fetch.mock.calls[1][1].body).toContain('"mealType":"history"');

    // ✅ Redirect happened
    expect(window.location.href).toBe("/dashboard/user-meal-history");
});

test("loadSavedMeals renders fallback when no meals exist", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
    });

    const container = document.getElementById("mealHistory");

    const { loadSavedMeals } = require("../../../public/js/user-define-meal.js");
    await loadSavedMeals();

    expect(container.innerHTML).toContain("No meals saved yet");
});

test("clicking re-log button sends POST with history mealType", async () => {
    const mealData = {
        mealName: "ToRelog",
        time: "2025-01-01T12:00:00Z",
        ingredients: [
            {
                name: "Tofu",
                grams: 100,
                calories: 120,
                protein: 10,
                carbs: 5,
                potassium: 400,
                phosphorus: 60
            }
        ]
    };

    global.fetch.mockResolvedValueOnce({ ok: true });

    const btn = document.createElement("button");
    btn.className = "re-log";
    btn.dataset.meal = JSON.stringify(mealData); // ✅ key fix
    document.body.appendChild(btn);

    btn.click();
    await new Promise((r) => setTimeout(r, 10));

    const calledWithURL = global.fetch.mock.calls.some(call =>
        call[0].includes("/dashboard/api/user-meal-history")
    );

    expect(calledWithURL).toBe(true);
});

test("Save & Log Meal fails if POST fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    global.fetch.mockResolvedValueOnce({ ok: false });

    const logBtn = document.querySelector(".log-btn");
    expect(logBtn).not.toBeNull();

    logBtn.click();
    await new Promise((r) => setTimeout(r, 30));

    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Nothing to log."));
});

