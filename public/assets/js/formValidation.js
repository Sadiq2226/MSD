// Show popup with a message
function showPopup(message) {
    document.getElementById("popup-message").innerText = message;
    document.getElementById("popup").style.display = "block";
    setTimeout(closePopup, 4000); // Close the popup after 4 seconds
}

// Close the popup
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// Validate form fields based on form type
function validateForm(formType) {
    let fields = {};

    // Collect form field values based on the form type (student or admin)
    if (formType === "studentLogin") {
        fields = {
            email: document.forms["studentLoginForm"]["email"].value,
            password: document.forms["studentLoginForm"]["password"].value
        };
    } else if (formType === "adminLogin") {
        fields = {
            username: document.forms["adminLoginForm"]["username"].value,
            password: document.forms["adminLoginForm"]["password"].value
        };
    }

    // Common validation: Check if required fields are filled
    for (let field in fields) {
        if (fields[field].trim() === "") {
            showPopup("All fields are required.");
            return false;
        }
    }

    // Additional validation for email format (only for student login)
    if (formType === "studentLogin" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
        showPopup("Invalid email format.");
        return false;
    }

    // Submit form data via AJAX
    fetch(`/${formType}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success === false) {
            // Show error message if credentials are invalid
            showPopup("Invalid credentials");
        } else {
            // On success, redirect to the respective dashboard page
            window.location.href = `/${formType}_dashboard`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showPopup("Something went wrong. Please try again.");
    });

    // Prevent the default form submission
    return false;
}

// Attach event listeners to forms
document.forms["studentLoginForm"].onsubmit = (event) => {
    event.preventDefault();
    return validateForm("studentLogin");
};

document.forms["adminLoginForm"].onsubmit = (event) => {
    event.preventDefault();
    return validateForm("adminLogin");
};
