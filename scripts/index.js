// DEFINE THE BASE URL FOR YOUR BACKEND HERE (CRITICAL FIX)
const BASE_URL = "http://localhost:3000";

// Navbar scroll effect
window.addEventListener("scroll", function () {
    const navbar = document.getElementById("navbar");
    if (window.scrollY > 50) {
        navbar.classList.add("nav-scrolled");
    } else {
        navbar.classList.remove("nav-scrolled");
    }
});

// Mobile menu toggle
document
    .getElementById("mobile-menu-button")
    .addEventListener("click", function () {
        const mobileMenu = document.getElementById("mobile-menu");
        mobileMenu.classList.toggle("hidden");
    });

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: "smooth",
            });

            // Close mobile menu if open
            document.getElementById("mobile-menu").classList.add("hidden");
        }
    });
});

// Section fade-in animation on scroll
const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("section-visible");
        }
    });
}, observerOptions);

document.querySelectorAll(".section-fade-in").forEach((section) => {
    observer.observe(section);
});

// Authentication Modal Logic
const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");

// Open modal triggers
const navLoginBtn = document.getElementById("navLoginBtn");
const navRegisterBtn = document.getElementById("navRegisterBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const mobileRegisterBtn = document.getElementById("mobileRegisterBtn");
const heroGetStartedBtn = document.getElementById("heroGetStartedBtn");
const ctaSignUpBtn = document.getElementById("ctaSignUpBtn");

// User type selection
const userBtn = document.getElementById("userBtn");
const staffBtn = document.getElementById("staffBtn");
const adminBtn = document.getElementById("adminBtn");

const userSection = document.getElementById("userSection");
const staffSection = document.getElementById("staffSection");
const adminSection = document.getElementById("adminSection");

// User authentication tabs
const userSignUpTab = document.getElementById("userSignUpTab");
const userSignInTab = document.getElementById("userSignInTab");
const userSignUpForm = document.getElementById("userSignUpForm");
const userSignInForm = document.getElementById("userSignInForm");
const userSubmitBtn = document.getElementById("userSubmitBtn");

// Staff authentication tabs
const staffSignUpTab = document.getElementById("staffSignUpTab");
const staffSignInTab = document.getElementById("staffSignInTab");
const staffSignUpForm = document.getElementById("staffSignUpForm");
const staffSignInForm = document.getElementById("staffSignInForm");
const staffSubmitBtn = document.getElementById("staffSubmitBtn");

// Admin authentication tabs
const adminSignInTab = document.getElementById("adminSignInTab");
const adminSignInForm = document.getElementById("adminSignInForm");
const adminSubmitBtn = document.getElementById("adminSubmitBtn");

// Function to open modal with specific user type and form
function openAuthModal(userType = "user", formType = "signup") {
    authModal.classList.remove("hidden");
    resetUserTypeButtons();

    // Hide all sections initially
    hideAllSections();

    if (userType === "user") {
        userBtn.classList.add("active");
        userSection.classList.remove("hidden-section");
        userSection.classList.add("visible-section");

        // Trigger tab click to set form/button state
        if (formType === "signin") {
            userSignInTab.click();
        } else {
            userSignUpTab.click();
        }
    } else if (userType === "staff") {
        staffBtn.classList.add("active");
        staffSection.classList.remove("hidden-section");
        staffSection.classList.add("visible-section");

        // Trigger tab click to set form/button state
        if (formType === "signin") {
            staffSignInTab.click();
        } else {
            staffSignUpTab.click();
        }
    } else if (userType === "admin") {
        adminBtn.classList.add("active");
        adminSection.classList.remove("hidden-section");
        adminSection.classList.add("visible-section");
        // Admin only has a sign-in tab visible
    }
}

// Function to reset all user type buttons
function resetUserTypeButtons() {
    userBtn.classList.remove("active");
    staffBtn.classList.remove("active");
    adminBtn.classList.remove("active");
}

// Function to hide all sections
function hideAllSections() {
    userSection.classList.remove("visible-section");
    userSection.classList.add("hidden-section");
    staffSection.classList.remove("visible-section");
    staffSection.classList.add("hidden-section");
    adminSection.classList.remove("visible-section");
    adminSection.classList.add("hidden-section");
}

// --- CORE FORM SUBMISSION LOGIC ---
async function handleFormSubmission(
    formElement,
    submitBtnElement,
    endpoint, // <-- Changed 'url' to 'endpoint' for clarity
    successMessage,
    isSignUp = false,
    isStaff = false
) {
    // Simple client-side validation check
    if (!formElement.checkValidity()) {
        formElement.reportValidity();
        return;
    }

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    // Password Mismatch Check for Sign Up forms (applied before sending)
    if (isSignUp) {
        if (data.password !== data.confirmPassword) {
            alert("Error: Passwords do not match.");
            return;
        }
    }

    // Prevent double submission
    const originalText = submitBtnElement.textContent;
    submitBtnElement.disabled = true;
    submitBtnElement.textContent = "Processing...";

    // Prepare data structure for the backend
    let payload = {};
    if (isSignUp && !isStaff) {
        // User Signup
        payload = {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            street: data.street,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
        };
    } else if (!isSignUp && !isStaff) {
        // User Sign In
        payload = {
            email: data.loginIdentifier, // Matches the backend's `email` parameter
            password: data.password,
        };
    } else if (isStaff && isSignUp) {
        // Staff Signup: Concatenate first/last name as required by the backend
        payload = {
            name: `${data.firstname} ${data.lastname}`,
            email: data.workEmail,
            staffId: data.staffId,
            phone: data.phone,
            password: data.password,
        };
    } else if (isStaff && !isSignUp) {
        // Staff Sign In
        payload = {
            staffIdOrEmail: data.staffIdOrEmail,
            password: data.password,
        };
    } else {
        // Admin Sign In
        payload = {
            adminId: data.adminId,
            password: data.password,
        };
    }

    // 🚨 CRITICAL FIX: Use the absolute URL with BASE_URL
    const finalUrl = BASE_URL + endpoint;

    try {
        const response = await fetch(finalUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Check if the server responded but with an error status (4xx, 5xx)
        if (!response.ok) {
            // If the response is not valid JSON (e.g., empty body), .json() will throw the "Unexpected end of JSON input" error.
            // We attempt to read it, but catch the error if it fails and provide a generic status message.
            try {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Server responded with status ${response.status}`);
            } catch (e) {
                // This handles the 'Unexpected end of JSON input' error
                throw new Error(`Server returned status ${response.status}. Please check backend console for crash details.`);
            }
        }

        const result = await response.json();

        // SUCCESS PATH
        alert(`${successMessage}: ${result.message}`);

        formElement.reset();
        authModal.classList.add("hidden");
        window.location.reload();

    } catch (error) {
        // NETWORK OR GENERAL JS ERROR PATH
        console.error("Submission failed:", error);
        alert(`Error: ${error.message || "A network error occurred. Please check your server connection."}`);
    } finally {
        submitBtnElement.disabled = false;
        submitBtnElement.textContent = originalText;
    }
}

// Event listeners for opening modal
navLoginBtn.addEventListener("click", () =>
    openAuthModal("user", "signin")
);
navRegisterBtn.addEventListener("click", () =>
    openAuthModal("user", "signup")
);
mobileLoginBtn.addEventListener("click", () => {
    openAuthModal("user", "signin");
    document.getElementById("mobile-menu").classList.add("hidden");
});
mobileRegisterBtn.addEventListener("click", () => {
    openAuthModal("user", "signup");
    document.getElementById("mobile-menu").classList.add("hidden");
});
heroGetStartedBtn.addEventListener("click", () =>
    openAuthModal("user", "signup")
);
ctaSignUpBtn.addEventListener("click", () =>
    openAuthModal("user", "signup")
);

// Close modal
closeAuthModal.addEventListener("click", () => {
    authModal.classList.add("hidden");
});

// Close modal when clicking outside
authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
        authModal.classList.add("hidden");
    }
});

// User type button event listeners
userBtn.addEventListener("click", () => {
    resetUserTypeButtons();
    userBtn.classList.add("active");
    hideAllSections();
    userSection.classList.remove("hidden-section");
    userSection.classList.add("visible-section");
    userSignUpTab.click();
});

staffBtn.addEventListener("click", () => {
    resetUserTypeButtons();
    staffBtn.classList.add("active");
    hideAllSections();
    staffSection.classList.remove("hidden-section");
    staffSection.classList.add("visible-section");
    staffSignUpTab.click();
});

adminBtn.addEventListener("click", () => {
    resetUserTypeButtons();
    adminBtn.classList.add("active");
    hideAllSections();
    adminSection.classList.remove("hidden-section");
    adminSection.classList.add("visible-section");
});

// User authentication tab switching
userSignUpTab.addEventListener("click", () => {
    userSignUpTab.classList.add("active");
    userSignInTab.classList.remove("active");
    userSignUpForm.classList.remove("hidden");
    userSignInForm.classList.add("hidden");
    userSubmitBtn.textContent = "SIGN UP";
});

userSignInTab.addEventListener("click", () => {
    userSignInTab.classList.add("active");
    userSignUpTab.classList.remove("active");
    userSignInForm.classList.remove("hidden");
    userSignUpForm.classList.add("hidden");
    userSubmitBtn.textContent = "SIGN IN";
});

// Staff authentication tab switching
staffSignUpTab.addEventListener("click", () => {
    staffSignUpTab.classList.add("active");
    staffSignInTab.classList.remove("active");
    staffSignUpForm.classList.remove("hidden");
    staffSignInForm.classList.add("hidden");
    staffSubmitBtn.textContent = "REGISTER AS STAFF";
});

staffSignInTab.addEventListener("click", () => {
    staffSignInTab.classList.add("active");
    staffSignUpTab.classList.remove("active");
    staffSignInForm.classList.remove("hidden");
    staffSignUpForm.classList.add("hidden");
    staffSubmitBtn.textContent = "STAFF LOGIN";
});

// --- FORM SUBMISSION HANDLERS ---

// User Submission
userSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isSignUp = !userSignUpForm.classList.contains("hidden");
    const formElement = isSignUp ? userSignUpForm : userSignInForm;
    const endpoint = isSignUp ? "/api/users/signup" : "/api/users/login";
    const message = isSignUp
        ? "User Registration Successful"
        : "User Login Successful";

    handleFormSubmission(
        formElement,
        userSubmitBtn,
        endpoint,
        message,
        isSignUp,
        false
    );
});

// Staff Submission
staffSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isSignUp = !staffSignUpForm.classList.contains("hidden");
    const formElement = isSignUp ? staffSignUpForm : staffSignInForm;
    const endpoint = isSignUp ? "/api/staff/register" : "/api/staff/login";
    const message = isSignUp
        ? "Staff Registration Successful"
        : "Staff Login Successful";

    handleFormSubmission(
        formElement,
        staffSubmitBtn,
        endpoint,
        message,
        isSignUp,
        true
    );
});

// Admin Submission
adminSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const endpoint = "/api/admin/login";
    const message = "Admin Login Successful";

    handleFormSubmission(
        adminSignInForm,
        adminSubmitBtn,
        endpoint,
        message,
        false,
        true
    );
});