// DOM Element Selectors
const emailInput = document.getElementById('email');
const nameInput = document.getElementById('fullName');
const passwordInput = document.getElementById('password');
const continueBtn = document.getElementById('continueBtn');
const serverError = document.getElementById('server-error');
const loginForm = document.querySelector('form'); // Grabs the login form context wrapper

// ADMIN VALIDATION RULES
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const nameRegex = /^[a-zA-Z][a-zA-Z'-]*(\s+[a-zA-Z][a-zA-Z'-]*)+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// Track validation status of all fields
let formStatus = {
    email: false,
    fullName: false,
    password: false
};

// UI Feedback Helper Function
function updateFeedback(inputElement, feedbackElement, isValid, errorMessage) {
    if (inputElement.value.trim() === "") {
        inputElement.classList.remove('invalid');
        feedbackElement.className = "feedback";
        feedbackElement.innerHTML = "";
        return false;
    }

    if (isValid) {
        inputElement.classList.remove('invalid');
        feedbackElement.className = "feedback success";
        feedbackElement.innerHTML = "✔ Valid format";
        return true;
    } else {
        inputElement.classList.add('invalid');
        feedbackElement.className = "feedback error";
        feedbackElement.innerHTML = `❌ ${errorMessage}`;
        return false;
    }
}

// Real-Time Field Checkers
function validateEmail() {
    const val = emailInput.value.trim();
    const isValid = emailRegex.test(val);
    formStatus.email = updateFeedback(emailInput, document.getElementById('email-feedback'), isValid, "Invalid corporate email format.");
    checkFormValidity();
}

function validateName() {
    const val = nameInput.value.trim();
    const isValid = nameRegex.test(val);
    formStatus.fullName = updateFeedback(
        nameInput, 
        document.getElementById('fullName-feedback'), 
        isValid, 
        "Requires at least two names starting with letters."
    );
    checkFormValidity();
}

function validatePassword() {
    const val = passwordInput.value;
    const isValid = passwordRegex.test(val);
    formStatus.password = updateFeedback(
        passwordInput,
        document.getElementById('password-feedback'),
        isValid,
        "Password must be at least 8 characters long and include both letters and numbers."
    );
    checkFormValidity();
}

// Evaluates whether the "Secure Login" button should activate
function checkFormValidity() {
    if (formStatus.email && formStatus.fullName && formStatus.password) {
        continueBtn.disabled = false;
    } else {
        continueBtn.disabled = true;
    }
}

// Attach Input Event Listeners for real-time validation typing tracking
emailInput.addEventListener('input', () => { hideServerError(); validateEmail(); });
nameInput.addEventListener('input', () => { hideServerError(); validateName(); });
passwordInput.addEventListener('input', () => { hideServerError(); validatePassword(); });

function hideServerError() {
    if (serverError) serverError.style.display = 'none';
}

function showCustomServerError(msg) {
    if (serverError) {
        serverError.innerHTML = `❌ ${msg}`;
        serverError.style.display = 'block';
    }
}

function resetAdminButtonState() {
    continueBtn.disabled = false;
    continueBtn.innerHTML = "Secure Login";
    continueBtn.classList.remove('loading');
}

// Native Admin Login Authorization Request Pipeline
function handleAdminLogin(event) {
    event.preventDefault();
    
    hideServerError();
    
    continueBtn.disabled = true;
    continueBtn.innerHTML = `⏳ Authorizing Session...`;
    continueBtn.classList.add('loading'); 

    const payload = {
        email: emailInput.value.trim(),
        fullName: nameInput.value.trim(),
        password: passwordInput.value
    };

    // CORRECTED BACKEND ROUTING PREFIX ROUTE CALL
    fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(async (response) => {
        const data = await response.json();
        
        if (response.ok && data.success) {
            window.location.href = "dashboard.html"; 
        } else {
            showCustomServerError(data.message || "Invalid administrative credentials.");
            resetAdminButtonState();
        }
    })
    .catch((error) => {
        console.error("Network Communication Failure:", error);
        showCustomServerError("Network connection error. Please verify backend server state.");
        resetAdminButtonState();
    });
}

// Bind Submit Handler to the Form Lifecycle Engine
if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
} else {
    // Fallback hook mapping straight to the interactive execution button if form tag is absent
    continueBtn.addEventListener('click', handleAdminLogin);
}