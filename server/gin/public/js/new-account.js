document.getElementById('new-account-form').addEventListener('submit',  function(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = '';

    if (username.length < 5) {
        errorMessage.textContent = 'Username must be at least 5 characters long.';
        return;
    }

    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters long.';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        return;
    }

    (async () => {
        try {
            const response = await fetch('/new-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstname: firstName,
                    lastname: lastName,
                    username: username,
                    inputpassword: password
                })
            });

            const result = await response.json();

            if (response.status === 400) {
                if (result.error === 'Username already exists') {
                    errorMessage.textContent = 'This username is already taken. Please choose another.';
                } else {
                    errorMessage.textContent = result.error;
                }
            } else if (response.status === 500) {
                errorMessage.textContent = 'Server error. Please try again later.';
            } else {
                alert(result.message);
                window.location.href = '/';
            }
        } catch (error) {
            errorMessage.textContent = 'Network error. Please check your connection and try again.';
        }
    })()
});
