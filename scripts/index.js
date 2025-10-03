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
    endpoint,
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

    console.log("🔍 Form data collected:", data);

    // Password Mismatch Check for Sign Up forms
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
            email: data.loginIdentifier,
            password: data.password,
        };
    } else if (isStaff && isSignUp) {
        // Staff Signup
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

    const finalUrl = BASE_URL + endpoint;

    console.log("🚀 SENDING REQUEST:");
    console.log("URL:", finalUrl);
    console.log("Method: POST");
    console.log("Payload:", payload);
    console.log("Is Signup:", isSignUp);
    console.log("Is Staff:", isStaff);

    try {
        const response = await fetch(finalUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("📨 RESPONSE RECEIVED:");
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        console.log("OK:", response.ok);
        console.log("Headers:", Object.fromEntries(response.headers.entries()));

        // Get response as text first to see what we're getting
        const responseText = await response.text();
        console.log("Raw Response Text:", responseText);

        // Check if the server responded but with an error status
        if (!response.ok) {
            console.log("❌ SERVER RETURNED ERROR STATUS");
            
            // Try to parse as JSON, but if it fails, use the raw text
            let errorMessage = `Server returned status ${response.status}`;
            
            if (responseText) {
                try {
                    const errorResult = JSON.parse(responseText);
                    errorMessage = errorResult.message || errorResult.error || JSON.stringify(errorResult);
                } catch (e) {
                    // If it's not JSON, use the raw text
                    errorMessage = `Server returned status ${response.status}: ${responseText}`;
                }
            }
            
            console.log("Error Message:", errorMessage);
            throw new Error(errorMessage);
        }

        // If we got here, response is OK (200-299)
        console.log("✅ SERVER RETURNED SUCCESS STATUS");
        
        let result;
        if (responseText) {
            try {
                result = JSON.parse(responseText);
                console.log("Parsed JSON Result:", result);
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                throw new Error("Server returned invalid JSON response");
            }
        } else {
            console.warn("Server returned empty response");
            result = { message: "Empty response from server" };
        }

        // 🚨 UPDATED SUCCESS PATH - STORE TOKENS AND REDIRECT
        console.log("🎉 SUCCESS - Processing result:", result);

        // Store token and user data for homepage
        if (result.accessToken && result.user) {
            console.log("📦 Storing token and user data");
            localStorage.setItem('accessToken', result.accessToken);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            formElement.reset();
            authModal.classList.add("hidden");
            
            // Redirect to homepage after successful login/signup
            setTimeout(() => {
                console.log("🔄 Redirecting to homepage...");
                window.location.href = 'home.html';
            }, 1000);
            
        } else if (isSignUp && result.message && result.message.toLowerCase().includes("success")) {
            // For signup without auto-login, show success and switch to login
            console.log("📝 Signup successful, switching to login");
            formElement.reset();
            authModal.classList.add("hidden");
            setTimeout(() => {
                alert('Registration successful! Please login with your credentials.');
                openAuthModal("user", "signin");
            }, 500);
            
        } else if (result.message) {
            // Generic success case
            console.log("✅ Operation completed successfully");
            formElement.reset();
            authModal.classList.add("hidden");
            
            if (result.message.toLowerCase().includes("login")) {
                // If it's a login but no token, something went wrong
                console.warn("Login successful but no token received");
                alert("Login successful but technical issue occurred. Please try again.");
            } else {
                alert(result.message);
            }
            
        } else {
            // Fallback for other cases
            console.warn("No specific success handler, using fallback");
            formElement.reset();
            authModal.classList.add("hidden");
            window.location.reload();
        }

    } catch (error) {
        // NETWORK OR GENERAL JS ERROR PATH
        console.error("💥 SUBMISSION FAILED:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Full error:", error);
        
        let userFriendlyMessage = error.message;
        
        // Provide more specific error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userFriendlyMessage = "Network error: Cannot connect to server. Make sure the backend is running.";
        } else if (error.message.includes('Failed to fetch')) {
            userFriendlyMessage = "Network error: Cannot connect to server. Check if the backend is running on port 3000.";
        } else if (error.message.includes('CORS')) {
            userFriendlyMessage = "CORS error: Browser blocked the request. Check server CORS configuration.";
        }
        
        alert(`Error: ${userFriendlyMessage}`);
        
    } finally {
        submitBtnElement.disabled = false;
        submitBtnElement.textContent = originalText;
        console.log("🏁 Form submission process completed");
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