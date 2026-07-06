// DOM Element Selectors
const emailInput = document.getElementById('email');
const nameInput = document.getElementById('fullName');
const matricInput = document.getElementById('matricNumber');
const continueBtn = document.getElementById('continueBtn');
const serverError = document.getElementById('server-error');
const studentLoginForm = document.querySelector('form'); // Enforces lifecycle event capture

// UPGRADED REGEX VALIDATION RULES
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const nameRegex = /^[a-zA-Z][a-zA-Z'-]*(\s+[a-zA-Z][a-zA-Z'-]*)+$/;
const matricRegex = /^KASU\/\d{2}\/[A-Z]{2,8}\/\d{4}$/;

// Track validation status of all fields
let formStatus = {
    email: false,
    fullName: false,
    matricNumber: false
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
    formStatus.email = updateFeedback(emailInput, document.getElementById('email-feedback'), isValid, "Invalid email format (e.g., student@domain.com)");
    checkFormValidity();
}

// Deep match logic handles compound naming configurations elegantly
function validateName() {
    const val = nameInput.value.trim();
    const isValid = nameRegex.test(val);
    formStatus.fullName = updateFeedback(
        nameInput, 
        document.getElementById('fullName-feedback'), 
        isValid, 
        "Requires at least two names. Each name must begin with a letter."
    );
    checkFormValidity();
}

function validateMatric() {
    const val = matricInput.value.trim();
    const isValid = matricRegex.test(val);
    formStatus.matricNumber = updateFeedback(
        matricInput, 
        document.getElementById('matricNumber-feedback'), 
        isValid, 
        "Expected format: KASU/22/CSC/1125"
    );
    checkFormValidity();
}

// Evaluates whether the "Continue" button should activate
function checkFormValidity() {
    if (formStatus.email && formStatus.fullName && formStatus.matricNumber) {
        continueBtn.disabled = false;
    } else {
        continueBtn.disabled = true;
    }
}

// Attach Event Listeners for real-time validation typing tracking
emailInput.addEventListener('input', () => { hideServerError(); validateEmail(); });
nameInput.addEventListener('input', () => { hideServerError(); validateName(); });
matricInput.addEventListener('input', () => { hideServerError(); validateMatric(); });

function hideServerError() {
    if (serverError) serverError.style.display = 'none';
}

function showCustomServerError(msg) {
    if (serverError) {
        serverError.innerHTML = `❌ ${msg}`;
        serverError.style.display = 'block';
    }
}

function resetButtonState() {
    continueBtn.disabled = false;
    continueBtn.innerHTML = "Continue";
    continueBtn.classList.remove('loading');
}

// Native Form Submission Async Pipeline
function handleVerification(event) {
    event.preventDefault(); // Securely intercepts form transmission teardowns
    
    hideServerError();
    
    // Trigger Loading UI State
    continueBtn.disabled = true;
    continueBtn.innerHTML = `⏳ Verifying Candidate...`;
    continueBtn.classList.add('loading'); 

    const payload = {
        email: emailInput.value.trim(),
        fullName: nameInput.value.trim(),
        matricNumber: matricInput.value.trim()
    };

    // ACTUAL BACKEND API CALL
    fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(async (response) => {
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Redirects dynamically to the clean crypto session route: verify.html?session=EPS-XXXXXXXX
            window.location.href = data.redirectUrl; 
        } else {
            showCustomServerError(data.message || "Candidate record verification failed.");
            resetButtonState();
        }
    })
    .catch((error) => {
        console.error("Network Communication Failure:", error);
        showCustomServerError("Network connection error. Please verify backend server state.");
        resetButtonState();
    });
}

// CRITICAL INTEGRATION: Bind form submit handling to execution runtime context
if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', handleVerification);
} else {
    // Fail-safe action mapping directly to continuous selection element click
    continueBtn.addEventListener('click', handleVerification);
}