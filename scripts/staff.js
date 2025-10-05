console.log("Staff.js Loaded");
const staffToken=localStorage.getItem("staffToken");
if(!staffToken){
    console.log("No staff Token");
    alert("please login as staff first");
    window.location.href="index.html";
}
else{
    console.log("Staff token verified");
    const staffData = JSON.parse(localStorage.getItem("staffData") || "{}");
    console.log("Staff data:", staffData);
    
    // Update welcome message
    const welcomeElements = document.querySelectorAll('span');
    welcomeElements.forEach(el => {
        if (el.textContent.includes("Welcome,")) {
            el.textContent = `Welcome, ${staffData.name || 'Staff Member'}!`;
        }
    });
    
    // Update profile initial
    const profileInitials = document.querySelectorAll('.w-8.h-8.rounded-full');
    profileInitials.forEach(el => {
        if (staffData.name) {
            el.textContent = staffData.name.charAt(0).toUpperCase();
        }
    });
}

const BASE_URL = "http://localhost:3000";

// Add logout functionality
function setupLogout() {
    const logoutButtons = document.querySelectorAll('a, button');
    logoutButtons.forEach(button => {
        if (button.textContent.includes('Logout') || button.innerHTML.includes('fa-sign-out-alt')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem("staffToken");
                localStorage.removeItem("staffData");
                window.location.href = "index.html";
            });
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupLogout();
    console.log("Staff dashboard initialized successfully!");
});
