function login(event) {
    // Prevent form submission
    if (event) event.preventDefault();
    console.log("login function running")

    let username = $('#username').val().trim();
    let password = $('#password').val().trim();

    // Check if fields are empty
    if (!username || !password) {
        $('#error-message').text("Please enter both username and password.");
        return;
    }

    let txdata = {

        username: username,
        inputpassword: password
    };


    $.ajax({
        url: '/',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(txdata),
        dataType: 'json',
        //enable cookies in ajax request
        xhrFields: {
            withCredentials: true
        }
    })
        .done(function (data) {
            //should redirect if correct username and password or send error message if not
            console.log("Success response:", data);
            if (data.message) {
                localStorage.setItem("message", data.message);
                //add 500ms delay to change of page after pressing submit
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 500);
            } else {
                console.log("Login failed: No message received.");
                $('#rxData').text("Login failed: No message received.");
            }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            let errorMsg;
            console.log("AJAX Error:", jqXHR);
            console.log("Text Status:", textStatus);
            console.log("Error Thrown:", errorThrown);


            if (jqXHR.status === 400 && jqXHR.responseJSON) {
                console.log("Error Response JSON:", jqXHR.responseJSON);
                //checking error
                if (jqXHR.responseJSON.error === "User not found") {
                    errorMsg = "Wrong username";
                } else if (jqXHR.responseJSON.error === "Incorrect password") {
                    errorMsg = "Wrong password";
                } else {
                    errorMsg = "Invalid username or password";
                }
            } else if (jqXHR.status === 0) {
                errorMsg = "Server not responding. Is it running?";
            } else {
                errorMsg = "Unexpected error occurred.";
            }
            //print out error for incorrect username and password
            $('#rxData').text(errorMsg).css("color", "red");
        });
}

$(function () {
    console.log("running here too!");
    $('#username, #password').on('input', function () {
        $('#error-message').text("");  // Clear the error message
    });

    $('#submit').click(function (event) {
        event.preventDefault();
        console.log("submit running!");
        login(event);
    });

    $('#button').click(function () {
        console.log("button running!");
        setTimeout(() => {
            window.location.href = "/new-account";
        }, 500);
    });
});
// Export for testing

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = login;
}
