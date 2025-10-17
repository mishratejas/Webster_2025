document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM fully loaded - initializing ResolveX");
    
    const BASE_URL = "https://webster-2025.onrender.com";

    // Navbar scroll effect
    window.addEventListener("scroll", function () {
        const navbar = document.getElementById("navbar");
        const logo = document.getElementById("logo");
        const lbtn = document.getElementById("navLoginBtn")
        if (window.scrollY > 50) {
            navbar.classList.replace("nav-top", "nav-scrolled");
            logo.classList.replace("logo", "logo-scorlled");
            lbtn.classList.replace("lbtn", "lbtn-scrolled")
            
        } else {
            navbar.classList.replace("nav-scrolled", "nav-top");
            logo.classList.replace("logo-scorlled", "logo");
            lbtn.classList.replace("lbtn-scrolled", "lbtn")
        }
    });

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener("click", function () {
            const mobileMenu = document.getElementById("mobile-menu");
            if (mobileMenu) {
                mobileMenu.classList.toggle("hidden");
            }
        });
    }

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
                const mobileMenu = document.getElementById("mobile-menu");
                if (mobileMenu) {
                    mobileMenu.classList.add("hidden");
                }
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

    // Open modal triggers - with null checks
    const navLoginBtn = document.getElementById("navLoginBtn");
    const navRegisterBtn = document.getElementById("navRegisterBtn");
    const mobileLoginBtn = document.getElementById("mobileLoginBtn");
    const mobileRegisterBtn = document.getElementById("mobileRegisterBtn");
    const heroGetStartedBtn = document.getElementById("heroGetStartedBtn");
    
    // REMOVED: const ctaSignUpBtn = document.getElementById("ctaSignUpBtn"); // This element doesn't exist

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
        if (!authModal) return;
        
        authModal.classList.remove("hidden");
        resetUserTypeButtons();
        hideAllSections();

        if (userType === "user") {
            if (userBtn) userBtn.classList.add("active");
            if (userSection) {
                userSection.classList.remove("hidden-section");
                userSection.classList.add("visible-section");
            }

            if (formType === "signin" && userSignInTab) {
                userSignInTab.click();
            } else if (userSignUpTab) {
                userSignUpTab.click();
            }
        } else if (userType === "staff") {
            if (staffBtn) staffBtn.classList.add("active");
            if (staffSection) {
                staffSection.classList.remove("hidden-section");
                staffSection.classList.add("visible-section");
            }

            if (formType === "signin" && staffSignInTab) {
                staffSignInTab.click();
            } else if (staffSignUpTab) {
                staffSignUpTab.click();
            }
        } else if (userType === "admin") {
            if (adminBtn) adminBtn.classList.add("active");
            if (adminSection) {
                adminSection.classList.remove("hidden-section");
                adminSection.classList.add("visible-section");
            }
        }
    }

    // Function to reset all user type buttons
    function resetUserTypeButtons() {
        if (userBtn) userBtn.classList.remove("active");
        if (staffBtn) staffBtn.classList.remove("active");
        if (adminBtn) adminBtn.classList.remove("active");
    }

    // Function to hide all sections
    function hideAllSections() {
        if (userSection) {
            userSection.classList.remove("visible-section");
            userSection.classList.add("hidden-section");
        }
        if (staffSection) {
            staffSection.classList.remove("visible-section");
            staffSection.classList.add("hidden-section");
        }
        if (adminSection) {
            adminSection.classList.remove("visible-section");
            adminSection.classList.add("hidden-section");
        }
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
        if (!formElement || !submitBtnElement) {
            console.error("Form element or submit button not found");
            return;
        }

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
                otp: data.otp, 
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
                otp: data.otp,
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

        console.log("SENDING REQUEST:");
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

            console.log("RESPONSE RECEIVED:");
            console.log("Status:", response.status);
            console.log("Status Text:", response.statusText);
            console.log("OK:", response.ok);

            const responseText = await response.text();
            console.log("Raw Response Text:", responseText);

            // Check if the server responded but with an error status
            if (!response.ok) {
                console.log("SERVER RETURNED ERROR STATUS");
                
                let errorMessage = `Server returned status ${response.status}`;
                
                if (responseText) {
                    try {
                        const errorResult = JSON.parse(responseText);
                        errorMessage = errorResult.message || errorResult.error || JSON.stringify(errorResult);
                    } catch (e) {
                        errorMessage = `Server returned status ${response.status}: ${responseText}`;
                    }
                }
                
                console.log("Error Message:", errorMessage);
                throw new Error(errorMessage);
            }

            // If we got here, response is OK (200-299)
            console.log("SERVER RETURNED SUCCESS STATUS");
            
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

            console.log("SUCCESS - Processing result:", result);

            // Check if this is an ADMIN login
            if (endpoint === "/api/admin/login" && result.accessToken) {
                console.log("ADMIN LOGIN DETECTED - Storing admin token");
                localStorage.setItem("adminToken", result.accessToken);
                if (result.admin) {
                    localStorage.setItem("adminData", JSON.stringify(result.admin));
                }
                formElement.reset();
                if (authModal) authModal.classList.add("hidden");
                
                setTimeout(() => {
                    console.log("Redirecting to admin dashboard...");
                    window.location.href = "admin.html";
                }, 500);
            }
            // Check if this is a USER login
            else if (result.accessToken && result.user) {
                console.log("USER LOGIN DETECTED - Storing user token and data");
                localStorage.setItem('accessToken', result.accessToken);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                formElement.reset();
                if (authModal) authModal.classList.add("hidden");
                
                setTimeout(() => {
                    console.log("Redirecting to user homepage...");
                    window.location.href = 'home.html';
                }, 500);
            }
            // Check if this is a STAFF login  
            else if (endpoint === "/api/staff/login") {
                console.log("STAFF LOGIN DETECTED - Checking conditions:");
                console.log("Has accessToken:", !!result.accessToken);
                console.log("Has token:", !!result.token);
                console.log("Success status:", result.success);
                console.log("Full result:", result);
                
                const staffToken = result.accessToken || result.token;
                
                if (staffToken) {
                    console.log("STAFF LOGIN SUCCESS - Storing staff token");
                    localStorage.setItem("staffToken", staffToken);
                    if (result.staff) {
                        localStorage.setItem("staffData", JSON.stringify(result.staff));
                    }
                    formElement.reset();
                    if (authModal) authModal.classList.add("hidden");
                    
                    setTimeout(() => {
                        console.log("Redirecting to staff dashboard...");
                        window.location.href = "staff.html";
                    }, 500);
                } else {
                    console.warn("Staff login successful but no token found in response");
                    alert("Login successful but technical issue occurred. Please contact support.");
                }
            }
            // Handle successful signups
            else if (isSignUp && result.message && result.message.toLowerCase().includes("success")) {
                console.log("SIGNUP SUCCESSFUL");
                formElement.reset();
                if (authModal) authModal.classList.add("hidden");
                setTimeout(() => {
                    alert('Registration successful! Please login with your credentials.');
                    if (isStaff) {
                        openAuthModal("staff", "signin");
                    } else {
                        openAuthModal("user", "signin");
                    }
                }, 500);
            }
            // Generic success case
            else if (result.message) {
                console.log("OPERATION COMPLETED SUCCESSFULLY");
                formElement.reset();
                if (authModal) authModal.classList.add("hidden");
                alert(result.message);
            }
            // Fallback
            else {
                console.warn("No specific success handler matched");
                formElement.reset();
                if (authModal) authModal.classList.add("hidden");
                alert("Operation completed successfully");
            }

        } catch (error) {
            console.error("SUBMISSION FAILED:");
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            
            let userFriendlyMessage = error.message;
            
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
            console.log("Form submission process completed");
        }
    }

    // Event listeners for opening modal - with null checks
    if (navLoginBtn) {
        navLoginBtn.addEventListener("click", () => openAuthModal("user", "signin"));
    }

    if (navRegisterBtn) {
        navRegisterBtn.addEventListener("click", () => openAuthModal("user", "signup"));
    }

    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener("click", () => {
            openAuthModal("user", "signin");
            const mobileMenu = document.getElementById("mobile-menu");
            if (mobileMenu) mobileMenu.classList.add("hidden");
        });
    }

    if (mobileRegisterBtn) {
        mobileRegisterBtn.addEventListener("click", () => {
            openAuthModal("user", "signup");
            const mobileMenu = document.getElementById("mobile-menu");
            if (mobileMenu) mobileMenu.classList.add("hidden");
        });
    }

    if (heroGetStartedBtn) {
        heroGetStartedBtn.addEventListener("click", () => openAuthModal("user", "signup"));
    }

    // Close modal
    if (closeAuthModal) {
        closeAuthModal.addEventListener("click", () => {
            if (authModal) authModal.classList.add("hidden");
        });
    }

    // Close modal when clicking outside
    if (authModal) {
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) {
                authModal.classList.add("hidden");
            }
        });
    }

    // User type button event listeners
    if (userBtn) {
        userBtn.addEventListener("click", () => {
            resetUserTypeButtons();
            userBtn.classList.add("active");
            hideAllSections();
            if (userSection) {
                userSection.classList.remove("hidden-section");
                userSection.classList.add("visible-section");
            }
            if (userSignUpTab) userSignUpTab.click();
        });
    }

    if (staffBtn) {
        staffBtn.addEventListener("click", () => {
            resetUserTypeButtons();
            staffBtn.classList.add("active");
            hideAllSections();
            if (staffSection) {
                staffSection.classList.remove("hidden-section");
                staffSection.classList.add("visible-section");
            }
            if (staffSignUpTab) staffSignUpTab.click();
        });
    }

    if (adminBtn) {
        adminBtn.addEventListener("click", () => {
            resetUserTypeButtons();
            adminBtn.classList.add("active");
            hideAllSections();
            if (adminSection) {
                adminSection.classList.remove("hidden-section");
                adminSection.classList.add("visible-section");
            }
        });
    }

    // User authentication tab switching
    if (userSignUpTab) {
    userSignUpTab.addEventListener("click", () => {
        userSignUpTab.classList.add("active");
        if (userSignInTab) userSignInTab.classList.remove("active");
        if (userSignUpForm) userSignUpForm.classList.remove("hidden");
        if (userSignInForm) userSignInForm.classList.add("hidden");
        
        // Reset OTP state when switching to this tab
        const userOtpSection = document.getElementById("userOtpSection");
        if (userOtpSection) userOtpSection.classList.add("hidden");
        userSignUpForm.querySelectorAll('input').forEach(input => input.disabled = false);

        if (userSubmitBtn) userSubmitBtn.textContent = "SEND OTP";
    });
}

    if (userSignInTab) {
        userSignInTab.addEventListener("click", () => {
            userSignInTab.classList.add("active");
            if (userSignUpTab) userSignUpTab.classList.remove("active");
            if (userSignInForm) userSignInForm.classList.remove("hidden");
            if (userSignUpForm) userSignUpForm.classList.add("hidden");
            if (userSubmitBtn) userSubmitBtn.textContent = "SIGN IN";
        });
    }

    // Staff authentication tab switching
    if (staffSignUpTab) {
    staffSignUpTab.addEventListener("click", () => {
        staffSignUpTab.classList.add("active");
        if (staffSignInTab) staffSignInTab.classList.remove("active");
        if (staffSignUpForm) staffSignUpForm.classList.remove("hidden");
        if (staffSignInForm) staffSignInForm.classList.add("hidden");

        // Reset OTP state when switching to this tab
        const staffOtpSection = document.getElementById("staffOtpSection");
        if (staffOtpSection) staffOtpSection.classList.add("hidden");
        staffSignUpForm.querySelectorAll('input').forEach(input => input.disabled = false);
        
        if (staffSubmitBtn) staffSubmitBtn.textContent = "SEND OTP";
    });
    }

    if (staffSignInTab) {
        staffSignInTab.addEventListener("click", () => {
            staffSignInTab.classList.add("active");
            if (staffSignUpTab) staffSignUpTab.classList.remove("active");
            if (staffSignInForm) staffSignInForm.classList.remove("hidden");
            if (staffSignUpForm) staffSignUpForm.classList.add("hidden");
            if (staffSubmitBtn) staffSubmitBtn.textContent = "STAFF LOGIN";
        });
    }

    // --- FORM SUBMISSION HANDLERS ---

    // User Submission
    if (userSubmitBtn) {
    // Make the event listener async to handle the fetch call for OTP
    userSubmitBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        // If it's a Sign In, use the old logic
        const isSignIn = userSignInTab && userSignInTab.classList.contains("active");
        if (isSignIn) {
            handleFormSubmission(userSignInForm, userSubmitBtn, "/api/users/login", "User Login Successful", false, false);
            return;
        }

        // --- Handle Sign Up Flow ---
        const userOtpSection = document.getElementById("userOtpSection");
        
        // Phase 1: User fills details and clicks "SEND OTP"
        if (userOtpSection.classList.contains("hidden")) {
            // Basic validation
            if (!userSignUpForm.checkValidity()) {
                userSignUpForm.reportValidity();
                return;
            }
            if (userSignUpForm.password.value !== userSignUpForm.confirmPassword.value) {
                alert("Passwords do not match.");
                return;
            }

            const email = userSignUpForm.email.value;
            const originalBtnText = userSubmitBtn.textContent;
            userSubmitBtn.disabled = true;
            userSubmitBtn.textContent = "Sending...";

            try {
                // Assume your backend has an endpoint to send OTP
                const response = await fetch(`${BASE_URL}/api/otp/request`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ 
                        identifier: email,
                        purpose: "signup",
                        userType: "user",
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to send OTP.');

                alert(result.message); // e.g., "OTP sent successfully!"

                // Transition to Phase 2: Show OTP field
                userOtpSection.classList.remove("hidden");
                userSubmitBtn.textContent = "SIGN UP";
                
                // Disable other fields to prevent changes
                userSignUpForm.querySelectorAll('input:not([name="otp"])').forEach(input => {
                    if (input.type !== 'checkbox') input.disabled = true;
                });

            } catch (error) {
                alert(`Error: ${error.message}`);
                userSubmitBtn.textContent = originalBtnText;
            } finally {
                userSubmitBtn.disabled = false;
            }
        } 
        // Phase 2: User has entered OTP and clicks "SIGN UP"
        else {
            const otpValue = document.getElementById("userOtpInput").value;
            if (!otpValue) {
                alert("Please enter the OTP.");
                return;
            }

            // Re-enable all fields so FormData can collect their values
            userSignUpForm.querySelectorAll('input').forEach(input => input.disabled = false);

            // Call the main submission function
            handleFormSubmission(userSignUpForm, userSubmitBtn, "/api/users/signup", "User Registration Successful", true, false);
        }
    });
}

    // Staff Submission
    if (staffSubmitBtn) {
    staffSubmitBtn.addEventListener("click", async (e) => { // Make the function async
        e.preventDefault();
        
        const isSignUp = staffSignUpForm && !staffSignUpForm.classList.contains("hidden");
        
        // Handle Sign-In as before
        if (!isSignUp) {
            handleFormSubmission(staffSignInForm, staffSubmitBtn, "/api/staff/login", "Staff Login Successful", false, true);
            return;
        }

        // --- Handle Staff Registration OTP Flow ---
        const staffOtpSection = document.getElementById("staffOtpSection");

        // Phase 1: User clicks "SEND OTP"
        if (staffOtpSection.classList.contains("hidden")) {
            if (!staffSignUpForm.checkValidity()) {
                staffSignUpForm.reportValidity();
                return;
            }
            if (staffSignUpForm.password.value !== staffSignUpForm.confirmPassword.value) {
                alert("Passwords do not match.");
                return;
            }

            const email = staffSignUpForm.workEmail.value;
            const staffId = staffSignUpForm.staffId.value;
            const originalBtnText = staffSubmitBtn.textContent;
            staffSubmitBtn.disabled = true;
            staffSubmitBtn.textContent = "Sending OTP...";

            try {
                // Call your backend to send the OTP
                const response = await fetch(`${BASE_URL}/api/otp/request`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    // Send both email and staffId as your backend might need it
                    body: JSON.stringify({ identifier: email, purpose: "signup", userType: "staff" }) 
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to send OTP.');

                alert(result.message); // Show success message from backend

                // Transition to Phase 2
                staffOtpSection.classList.remove("hidden");
                staffSubmitBtn.textContent = "REGISTER AS STAFF";
                // Disable other fields
                staffSignUpForm.querySelectorAll('input:not([name="otp"])').forEach(input => {
                    if (input.type !== 'checkbox') input.disabled = true;
                });

            } catch (error) {
                alert(`Error: ${error.message}`);
                staffSubmitBtn.textContent = originalBtnText; // Restore button text on error
            } finally {
                staffSubmitBtn.disabled = false;
            }
        }
        // Phase 2: User clicks "REGISTER AS STAFF"
        else {
            if (!document.getElementById("staffOtpInput").value) {
                alert("Please enter the OTP.");
                return;
            }

            // Re-enable all fields so FormData can capture them
            staffSignUpForm.querySelectorAll('input').forEach(input => input.disabled = false);
            
            // Call the main submission handler for final registration
            handleFormSubmission(staffSignUpForm, staffSubmitBtn, "/api/staff/register", "Staff Registration Successful", true, true);
        }
    });
}

    // Admin Submission
    if (adminSubmitBtn) {
        adminSubmitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const endpoint = "/api/admin/login";
            const message = "Admin Login Successful";

            if (adminSignInForm) {
                handleFormSubmission(adminSignInForm, adminSubmitBtn, endpoint, message, false, false);
            }
        });
    }

    function checkLoginAndRedirect() {
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        
        if (accessToken && userData) {
            console.log("User already logged in. Redirecting to home.html...");
            window.location.href = 'home.html'; 
        }
    }

    // Check login status on page load
    checkLoginAndRedirect();

}); // END OF DOMContentLoaded