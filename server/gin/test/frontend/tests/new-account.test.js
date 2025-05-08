/**
 * @jest-environment jsdom
 */

beforeEach(() => {
    document.body.innerHTML = `
    <form id="new-account-form">
      <input id="first-name" />
      <input id="last-name" />
      <input id="username" />
      <input id="password" />
      <input id="confirm-password" />
      <p id="error-message"></p>
      <button type="submit" class="submit-button">Create</button>
    </form>
  `;

    // Mock global dependencies
    global.fetch = jest.fn();
    delete window.location;
    window.location = { href: "" };

    // Load script AFTER DOM is built
    jest.resetModules();
    require("../../../public/js/new-account.js");
});


test("successful form submission sends POST and redirects to /", async () => {
    // Fill in valid form values
    document.getElementById("first-name").value = "John";
    document.getElementById("last-name").value = "Doe";
    document.getElementById("username").value = "johndoe";
    document.getElementById("password").value = "abcdef";
    document.getElementById("confirm-password").value = "abcdef";

    global.alert = jest.fn();

    global.fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ message: "Welcome!" })
    });

    // Submit the form
    const form = document.getElementById("new-account-form");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 10));

    // ✅ Check fetch call
    expect(global.fetch).toHaveBeenCalledWith(
        "/new-account",
        expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstname: "John",
                lastname: "Doe",
                username: "johndoe",
                inputpassword: "abcdef"
            })
        })
    );

    // ✅ Check redirect
    expect(global.alert).toHaveBeenCalledWith("Welcome!");
    expect(window.location.href).toBe("/");
});


test("handles all JSON response cases from testutils", async () => {
    const form = document.getElementById("new-account-form");

    // Helper to reuse valid inputs
    const setValidFormValues = () => {
        document.getElementById("first-name").value = "Jane";
        document.getElementById("last-name").value = "Doe";
        document.getElementById("username").value = "janedoe";
        document.getElementById("password").value = "abcdef";
        document.getElementById("confirm-password").value = "abcdef";
    };

    // Helper for dispatching and waiting
    const submitAndWait = async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 10));
    };

    const errorEl = document.getElementById("error-message");

    // Case 1: Username already exists (400)
    setValidFormValues();
    global.fetch.mockResolvedValueOnce({
        status: 400,
        json: async () => ({ error: "Username already exists" })
    });
    await submitAndWait();
    expect(errorEl.textContent).toBe("This username is already taken. Please choose another.");

    // Case 2: Generic 400 error
    setValidFormValues();
    global.fetch.mockResolvedValueOnce({
        status: 400,
        json: async () => ({ error: "Generic error from testutils" })
    });
    await submitAndWait();
    expect(errorEl.textContent).toBe("Generic error from testutils");

    // Case 3: 500 server error
    setValidFormValues();
    global.fetch.mockResolvedValueOnce({
        status: 500,
        json: async () => ({ error: "Doesn't matter" })
    });
    await submitAndWait();
    expect(errorEl.textContent).toBe("Server error. Please try again later.");

    // Case 4: Successful registration
    setValidFormValues();
    global.alert = jest.fn();
    global.fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ message: "Success!" })
    });
    await submitAndWait();
    expect(global.alert).toHaveBeenCalledWith("Success!");
    expect(window.location.href).toBe("/");

    // Case 5: Network failure
    setValidFormValues();
    global.fetch.mockRejectedValueOnce(new Error("network fail"));
    await submitAndWait();
    expect(errorEl.textContent).toBe("Network error. Please check your connection and try again.");
});

