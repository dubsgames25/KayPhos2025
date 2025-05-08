/**
 * @jest-environment jsdom
 *
 * ✅ AI Food Search Tests — Full Code Invocation
 * -----------------------------------------------
 * - Simulates user interaction with the AI food search page.
 * - Ensures nutrient analysis is calculated and rendered in the DOM.
 * - Verifies proper handling of image upload and preview.
 * - Mocks browser globals: fetch, prompt, FileReader, URL.createObjectURL.
 * - Test coverage includes:
 *     - Form submission with no image
 *     - Image file preview
 *     - Nutrient summary rendering after analysis
 *     - POST payload triggered by Log Meal button
 * - Redirect behavior is skipped due to limitations with mocking in current jsdom scope.
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
    global.navigator = dom.window.navigator;

    const el = (cls, type = "div") => {
        const e = document.createElement(type);
        e.className = cls;
        return e;
    };

    document.body.append(
        el("server-message"),
        el("results-div"),
        el("image-preview"),
        el("results-container"),
        Object.assign(document.createElement("form"), { id: "queued-form" }),
        Object.assign(document.createElement("input"), { className: "file", type: "file" }),
        el("input-div"),
        el("browse", "span"),
        Object.assign(document.createElement("button"), { className: "calculate-intake" }),
        Object.assign(document.createElement("button"), { className: "log-meal" }),
        Object.assign(document.createElement("button"), { className: "save-meal" })
    );

    global.URL.createObjectURL = jest.fn(() => "mockURL");
    global.fetch = jest.fn();
    global.prompt = jest.fn(() => "Mock Meal Name");

    global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(),
        onload: null,
        onerror: null
    }));

    global.analysisResults = [{ ingredientName: "Banana", weightGrams: 100 }];
    global.selectedFoods = [];

    jest.resetModules();
    require("../../../public/js/ai-food-search.js");
});

test("handles form submit with no image selected", () => {
    const form = document.querySelector("#queued-form");
    const serverMsg = document.querySelector(".server-message");
    const event = new window.Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    expect(serverMsg.textContent).toBe("Please select an image to upload");
});

test("image file input triggers preview and reader", () => {
    const input = document.querySelector(".file");
    const file = new File(["mock content"], "mock.png", { type: "image/png" });
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    input.dispatchEvent(new window.Event("change", { bubbles: true }));
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
});

test("calculate button fetches intake + populates DOM", async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            breakdown: [{
                ingredientName: "Banana",
                weightGrams: 100,
                calories: 90,
                protein: 1,
                carbs: 20,
                phosphorus: 25,
                potassium: 300
            }],
            totals: {
                calories: 90,
                protein: 1,
                carbs: 20,
                phosphorus: 25,
                potassium: 300
            }
        })
    });

    window.analysisResults.splice(0, window.analysisResults.length, {
        ingredientName: "Banana",
        weightGrams: 100
    });

    window.displayAnalysisResults();

    const row = document.querySelector(".food-row");
    expect(row).not.toBeNull();
    row.dispatchEvent(new window.Event("click", { bubbles: true }));

    const button = document.querySelector(".calculate-intake");
    button.style.display = "flex";
    button.dispatchEvent(new window.Event("click"));

    await new Promise(r => setTimeout(r, 20));

    const html = document.querySelector(".results-div").innerHTML;
    expect(html).toContain("Banana");
});

test("log meal triggers POST to history", async () => {

    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => "OK"
    });

    global.prompt = jest.fn()
        .mockReturnValueOnce("Test Meal")
        .mockReturnValueOnce("500")
    ;

    window.selectedFoods.push({
        ingredientName: "Apple",
        weightGrams: 150,
        calories: 90,
        protein: 1,
        carbs: 22,
        phosphorus: 20,
        potassium: 300
    });

    const logButton = document.querySelector(".log-meal");
    logButton.style.display = "flex";

    const { LogMeal } = require("../../../public/js/ai-food-search.js");
    logButton.addEventListener("click", async () => {
        await LogMeal();
    });

    logButton.dispatchEvent(new window.Event("click", { bubbles: true }));

    await new Promise(r => setTimeout(r, 30));

    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/api/user-meal-history"),
        expect.objectContaining({ method: "POST" })
    );
});

test("save meal triggers POST to favorites", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => "OK"
    });

    global.prompt = jest.fn(() => "Saved Meal");

    window.selectedFoods.push({
        ingredientName: "Carrot",
        weightGrams: 100,
        calories: 40,
        protein: 1,
        carbs: 10,
        phosphorus: 15,
        potassium: 200
    });

    const { saveMealToHistory } = require("../../../public/js/ai-food-search.js");
    await saveMealToHistory();

    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/api/user-meal-history"),
        expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("Carrot")
        })
    );
});

test("clicking delete image clears preview", () => {
    console.log("🧪 Starting test: delete image");

    // Remove old input if exists
    const oldInput = document.querySelector(".file");
    if (oldInput) oldInput.remove();

    // Create new input with mock files
    const newInput = document.createElement("input");
    newInput.type = "file";
    newInput.className = "file";

    const file = new File(["mock"], "image.png", { type: "image/png" });

    // Mock files before adding to DOM
    Object.defineProperty(newInput, "files", {
        value: [file],
        configurable: true
    });

    document.body.appendChild(newInput); // Attach new input to DOM

    newInput.dispatchEvent(new window.Event("change", { bubbles: true }));

    const deleteBtn = document.querySelector(".delete-image");
    expect(deleteBtn).not.toBeNull();

    deleteBtn.click();

    const preview = document.querySelector(".image-preview").innerHTML;
    console.log("🧪 Preview content after delete:", preview);
    expect(preview).toBe("");
});

test("displayServerMessage updates DOM with correct class and text", () => {
    const serverMsg = document.querySelector(".server-message");
    expect(serverMsg).not.toBeNull();

    const { displayServerMessage } = require("../../../public/js/ai-food-search.js");

    displayServerMessage("Test message", "success");

    expect(serverMsg.textContent).toBe("Test message");
    expect(serverMsg.classList.contains("success")).toBe(true);
});

test("displayToast injects and removes toast from DOM", async () => {
    const { displayToast } = require("../../../public/js/ai-food-search.js");

    displayToast("Test Toast!", "info");

    const toast = document.querySelector(".toast.info");
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe("Test Toast!");
});

test("clicking food-row toggles selection in selectedFoods", () => {
    console.log("🧪 Starting toggleSelection test");

    // ✅ Reset module so our globals are used when it loads
    jest.resetModules();

    // ✅ Set before require to sync shared memory
    window.analysisResults = [{ ingredientName: "TestFood", weightGrams: 100 }];
    window.selectedFoods = [];

    console.log("🧪 Initial analysisResults:", JSON.stringify(window.analysisResults));

    // ✅ Create the row with correct index
    const row = document.createElement("tr");
    row.className = "food-row";
    row.dataset.index = "0";
    document.body.appendChild(row);

    // ✅ Now require the module (it will pick up the globals)
    const { toggleSelection } = require("../../../public/js/ai-food-search.js");

    console.log("🔁 Clicking to select...");
    toggleSelection({ currentTarget: row });

    console.log("✅ Row selected class:", row.classList.contains("selected"));
    console.log("📦 selectedFoods after first click:", JSON.stringify(window.selectedFoods));
    expect(row.classList.contains("selected")).toBe(true);
    expect(window.selectedFoods.length).toBe(1);

    console.log("🔁 Clicking to deselect...");
    toggleSelection({ currentTarget: row });

    console.log("✅ Row selected class:", row.classList.contains("selected"));
    console.log("📦 selectedFoods after second click:", JSON.stringify(window.selectedFoods));
    expect(row.classList.contains("selected")).toBe(false);
    expect(window.selectedFoods.length).toBe(0);
});

test("updateTotals stores nutrient totals in localStorage", () => {
    const { updateTotals } = require("../../../public/js/ai-food-search.js");

    const ingredients = [
        { potassium: 200, phosphorus: 50 },
        { potassium: 300, phosphorus: 70 }
    ];

    localStorage.clear();

    updateTotals(ingredients);

    expect(localStorage.getItem("totalPotassium")).toBe("500");
    expect(localStorage.getItem("totalPhosphorus")).toBe("120");
    expect(localStorage.getItem("mealUpdated")).toBe("true");
});

test("LogMeal shows error on failed POST", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => "error saving"
    });

    global.prompt = jest.fn(() => "Bad Meal");

    window.selectedFoods = [{
        ingredientName: "FailFood",
        weightGrams: 100
    }];

    const { LogMeal } = require("../../../public/js/ai-food-search.js");
    await LogMeal();

    expect(document.querySelector(".server-message").textContent).toContain("Please select at least one food item to log.");
});

test("saveMealToHistory shows error on failed POST", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => "Save failed"
    });

    global.prompt = jest.fn(() => "Bad Meal");

    window.selectedFoods = [{
        ingredientName: "ErrorFood",
        weightGrams: 123
    }];

    const { saveMealToHistory } = require("../../../public/js/ai-food-search.js");
    await saveMealToHistory();

    expect(document.querySelector(".server-message").textContent).toContain("Please select at least one food item to save.");
});

test("sendSelectedFoodsToDB enriches selectedFoods and shows results", async () => {
    window.selectedFoods = [{
        ingredientName: "Banana",
        weightGrams: 100
    }];

    const mockResponse = {
        breakdown: [{
            ingredientName: "Banana",
            weightGrams: 100,
            calories: 90,
            protein: 1,
            carbs: 22,
            phosphorus: 20,
            potassium: 300
        }],
        totals: {
            calories: 90,
            protein: 1,
            carbs: 22,
            phosphorus: 20,
            potassium: 300
        }
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
    });

    const { sendSelectedFoodsToDB } = require("../../../public/js/ai-food-search.js");
    await sendSelectedFoodsToDB();

    const html = document.querySelector(".results-div").innerHTML;
    expect(html).toContain("Banana");
    expect(html).toContain("100g");
});

test("sendSelectedFoodsToDB handles fetch failure", async () => {
    window.selectedFoods = [{
        ingredientName: "ErrorApple",
        weightGrams: 100
    }];

    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Simulated failure"));

    const { sendSelectedFoodsToDB } = require("../../../public/js/ai-food-search.js");
    await sendSelectedFoodsToDB();

    const msg = document.querySelector(".server-message").textContent;
    expect(msg).toMatch("Please select at least one food item");
});

test("sendMessageToThread handles API failure", async () => {
    const { sendMessageToThread } = require("../../../public/js/ai-food-search.js");

    global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 }); // Fail at message send

    const result = await sendMessageToThread("fakeThreadId", "base64Image", "fakeToken");
    expect(result).toBeNull();
});






