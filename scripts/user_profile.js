// // =======================================================================
// // PROFILE PAGE JAVASCRIPT (`user_profile.js`)
// // =======================================================================

// // --- CONFIGURATION & GLOBAL VARIABLES ---
// const BASE_URL = "http://127.0.0.1:3000";
// let currentUser = null;
// let accessToken = localStorage.getItem('accessToken');
// let currentComplaints  = [];

// // --- AUTHENTICATION & DATA FETCHING ---

// // This is the same authFetch function from home.js, needed for this page
// async function authFetch(url, options = {}) {
//     const headers = { ...options.headers };
//     if (accessToken) {
//         headers['Authorization'] = `Bearer ${accessToken}`;
//     }
//     const response = await fetch(url, { ...options, headers, credentials: 'include' });
//     if (response.status === 401) {
//         const refreshed = await refreshAccessToken();
//         if (refreshed) {
//             headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
//             return fetch(url, { ...options, headers, credentials: 'include' });
//         } else {
//             logout();
//             throw new Error('Session expired.');
//         }
//     }
//     return response;
// }

// // Same refresh function from home.js
// async function refreshAccessToken() {
//     try {
//         const res = await fetch(`${BASE_URL}/api/users/refresh-token`, { method: 'POST', credentials: 'include' });
//         if (res.ok) {
//             const data = await res.json();
//             localStorage.setItem('accessToken', data.accessToken);
//             accessToken = data.accessToken;
//             return true;
//         }
//     } catch (error) { console.error('Token refresh failed:', error); }
//     return false;
// }

// // Same logout function from home.js
// function logout() {
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('user');
//     window.location.href = 'index.html';
// }

// function checkAuthAndRedirect() {
//     const user = localStorage.getItem('user');
//     if (!user) {
//         alert("You must be logged in to view this page.");
//         window.location.href = 'index.html';
//     } else {
//         currentUser = JSON.parse(user);
//     }
// }

// async function loadProfileData() {
//     try {
//         const [profileResponse, reportsResponse] = await Promise.all([
//             authFetch(`${BASE_URL}/api/users/profile`),
//             authFetch(`${BASE_URL}/api/user_issues/my-issues`)
//         ]);

//         if (!profileResponse.ok || !reportsResponse.ok) throw new Error("Failed to load profile data.");

//         const profileResult = await profileResponse.json();
//         const reportsResult = await reportsResponse.json();

//         if (profileResult.success && reportsResult.success) {
//             currentComplaints  = reportsResult.data;
//             populateProfileHeader(profileResult.data);
//             populateStats(reportsResult.data);
//             const openTab = document.getElementById('profileOpenTab');
//             if(openTab) {
//                 openTab.click(); // Programmatically click the 'Open' tab to load initial view
//             } 
//             else {
//                 // Fallback if the tab isn't found
//                 displayProfileReports(currentComplaints .filter(r => r.status === 'pending')); 
//             }
//         } else {
//             throw new Error("Error in API response.");
//         }
//     } catch (error) {
//         console.error("Error loading profile data:", error);
//         document.querySelector('main').innerHTML = `<div class="text-center text-red-500 p-8">Error BKL: ${error.message}</div>`;
//     }
// }

// // --- UI POPULATION FUNCTIONS ---

// function populateProfileHeader(user) {
//     document.getElementById('userName').textContent = user.name;
//     document.getElementById('userEmail').textContent = user.email;
//     const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
//     document.getElementById('userJoinDate').textContent = `Member since ${joinDate}`;
//     const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
//     document.getElementById('userInitials').textContent = initials;

//     // Also update the main nav header
//     document.getElementById('userWelcome').textContent = `Welcome, ${user.name}!`;
//     const logoutBtn = document.getElementById('logoutBtn');
//     logoutBtn.textContent = 'Logout';
//     logoutBtn.onclick = logout;
// }

// function populateStats(reports) {
//     const totalReports = reports.length;
//     const resolvedReports = reports.filter(r => r.status === 'resolved').length;
//     const totalVotes = reports.reduce((sum, report) => sum + (report.voteCount || 0), 0);
//     document.getElementById('totalReports').textContent = totalReports;
//     document.getElementById('resolvedReports').textContent = resolvedReports;
//     document.getElementById('totalVotes').textContent = totalVotes;
// }

// function displayProfileReports(reportsToDisplay) {
//     const container = document.getElementById('profileReportsContainer');
//     container.innerHTML = '';
//     if (reportsToDisplay.length === 0) {
//         container.innerHTML = `<p class="text-center text-gray-500 py-8">No reports found.</p>`;
//         return;
//     }
//     reportsToDisplay.forEach(report => {
//         const statusColor = getStatusColor(report.status);
//         const reportCard = `
//             <div class="bg-gray-50 rounded-lg p-4 flex gap-4 border hover:shadow-md transition">
//                 <div class="flex-grow">
//                     <div class="flex justify-between items-start mb-2">
//                         <h3 class="font-semibold text-lg text-gray-800">${report.title}</h3>
//                         <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">${report.status}</span>
//                     </div>
//                     <p class="text-gray-600 text-sm mb-3">${report.description}</p>
//                     <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
//                         <span><i class="fas fa-calendar mr-1"></i>${new Date(report.createdAt).toLocaleDateString()}</span>
//                         <span><i class="fas fa-arrow-up mr-1"></i>${report.voteCount || 0} Votes</span>
//                     </div>
//                 </div>
//             </div>`;
//         container.innerHTML += reportCard;
//     });
// }

// function getStatusColor(status) {
//     const colors = {
//         'pending': 'bg-yellow-100 text-yellow-800',
//         'in-progress': 'bg-blue-100 text-blue-800',
//         'resolved': 'bg-green-100 text-green-800',
//         'rejected': 'bg-red-100 text-red-800'
//     };
//     return colors[status] || 'bg-gray-100 text-gray-800';
// }

// // --- PAGE INITIALIZATION ---

// document.addEventListener('DOMContentLoaded', () => {
//     const tabs = [
//         document.getElementById('profileOpenTab'),
//         document.getElementById('profileInProgressTab'),
//         document.getElementById('profileResolvedTab')
//     ];
    
//     const highlight = document.getElementById('profileHighlight');

//     function moveHighlight(tab) {
//         if (!tab || !highlight) return;
//         highlight.style.width = `${tab.offsetWidth}px`;
//         highlight.style.left = `${tab.offsetLeft}px`;

//         tabs.forEach(t => t.classList.remove('active'));
//         tab.classList.add('active');
//     }

//     function filterAndDisplayReports(status) {
//         // IMPORTANT: We may need to change these status values based on your schema
//         const statusMap = {
//             'Open': 'pending',
//             'In-Progress': 'in-progress',
//             'Resolved': 'resolved'
//         };

//         const backendStatus = statusMap[status];
//         const filteredReports = currentComplaints .filter(report => report.status === backendStatus);
//         displayProfileReports(filteredReports);
//     }

//     tabs.forEach(tab => {
//         if (tab) {
//             tab.addEventListener('click', () => {
//                 const status = tab.textContent.trim();
//                 moveHighlight(tab);
//                 filterAndDisplayReports(status);
//             });
//         }
//     });
    
//     // Ensure highlight is positioned correctly on window resize
//     window.addEventListener('resize', () => {
//         const activeTab = document.querySelector('#profileReportsContainer .tab.active');
//         if (activeTab) {
//             moveHighlight(activeTab);
//         }
//     });
// });

// =======================================================================
// PROFILE PAGE JAVASCRIPT (`user_profile.js`)
// =======================================================================

// --- CONFIGURATION & GLOBAL VARIABLES ---
const BASE_URL = "http://127.0.0.1:3000";
let currentUser = null;
let accessToken = localStorage.getItem('accessToken');
let currentComplaints = [];
let profileImageFile = null;

// --- AUTHENTICATION & DATA FETCHING ---

async function authFetch(url, options = {}) {
    const headers = { ...options.headers };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const response = await fetch(url, { ...options, headers, credentials: 'include' });
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
            return fetch(url, { ...options, headers, credentials: 'include' });
        } else {
            logout();
            throw new Error('Session expired.');
        }
    }
    return response;
}

async function refreshAccessToken() {
    try {
        const res = await fetch(`${BASE_URL}/api/users/refresh-token`, { method: 'POST', credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            accessToken = data.accessToken;
            return true;
        }
    } catch (error) { console.error('Token refresh failed:', error); }
    return false;
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function checkAuthAndRedirect() {
    const user = localStorage.getItem('user');
    if (!user) {
        alert("You must be logged in to view this page.");
        window.location.href = 'index.html';
    } else {
        currentUser = JSON.parse(user);
    }
}

async function loadProfileData() {
  try {
    const [profileResponse, reportsResponse] = await Promise.all([
      authFetch(`${BASE_URL}/api/users/profile`),
      authFetch(`${BASE_URL}/api/user_issues/my-issues`)
    ]);

    console.log("Profile response status:", profileResponse.status);
    console.log("Reports response status:", reportsResponse.status);

    const profileResult = await profileResponse.json();
    const reportsResult = await reportsResponse.json();

    console.log("Profile result:", profileResult);
    console.log("Reports result:", reportsResult);

    // ✅ handle if your backend doesn’t use .success
    const profileData = profileResult.data || profileResult.user || profileResult;
    const reportsData = reportsResult.data || reportsResult.issues || reportsResult;

    if (!profileData || !reportsData) {
      throw new Error("Profile or reports data missing in API response");
    }

    currentComplaints = reportsData;
    populateProfileHeader(profileData);
    populateStats(currentComplaints );

    const openTab = document.getElementById('profileOpenTab');
    if (openTab) openTab.click();
    else displayProfileReports(currentComplaints .filter(r => r.status === 'pending'));

  } catch (error) {
    console.error("Error loading profile data:", error);
    document.querySelector('main').innerHTML = `<div class="text-center text-red-500 p-8">Error: ${error.message}</div>`;
  }
}

// --- UI POPULATION FUNCTIONS ---

function populateProfileHeader(user) {
    if (!user) {
        console.error("populateProfileHeader function was called without user data.");
        return;
    }

    // --- Update Name, Email, Join Date ---
    const name = user.name || '';
    document.getElementById('userName').innerHTML = name;
    document.getElementById('userEmail').innerHTML = user.email || '';
    if (user.createdAt) {
        const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('userJoinDate').innerHTML = `Member since ${joinDate}`;
    }

    // --- NEW LOGIC: Display Profile Image or Initials ---
    const imageContainer = document.querySelector('section.gradient-bg > div:first-child');
    if (imageContainer) {
        if (user.profileImage) {
            // If user has a profile image, display it
            imageContainer.innerHTML = `<img src="${user.profileImage}" alt="Profile Picture" class="w-full h-full object-cover rounded-full">`;
        } else {
            // Otherwise, calculate and display initials
            const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
            imageContainer.innerHTML = `<span id="userInitials" class="text-4xl md:text-5xl font-bold">${initials}</span>`;
        }
    }
    
    // --- Update main navigation header ---
    document.getElementById('userWelcome').textContent = `Welcome, ${name}!`;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = logout;
    }
}

function populateStats(reports) {
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const totalVotes = reports.reduce((sum, report) => sum + (report.voteCount || 0), 0);
    document.getElementById('totalReports').textContent = totalReports;
    document.getElementById('resolvedReports').textContent = resolvedReports;
    document.getElementById('totalVotes').textContent = totalVotes;
}

function openDetailModal(complaintId) {
    // This function uses the 'currentComplaints' variable
    const complaint = currentComplaints.find(c => c._id === complaintId);
    if (!complaint) return;

    const detailModalBody = document.getElementById('detailModalBody');
    const issueDetailModal = document.getElementById('issueDetailModal');
    if (!detailModalBody || !issueDetailModal) return;

   detailModalBody.innerHTML = `
    ${complaint.images && complaint.images.length > 0 ?
        `<img src="${complaint.images[0]}" class="w-full h-64 object-contain rounded-lg mb-4 shadow-md" alt="Complaint image">` :
        ''
    }
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
        <span class="px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}">${complaint.status}</span>
        <span><i class="fas fa-user mr-2"></i><strong>Posted by:</strong> ${complaint.user?.name || 'Anonymous'}</span>
        <span><i class="fas fa-calendar mr-2"></i><strong>On:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</span>
        <span><i class="fas fa-thumbs-up mr-2"></i><strong>Votes:</strong> ${complaint.voteCount || 0}</span>
    </div>
    <h3 class="text-3xl font-bold text-gray-900 mb-3">${complaint.title}</h3>
    <p class="text-gray-700 text-base mb-6 whitespace-pre-wrap break-words">${complaint.description}</p> <div class="border-t pt-4">
        <h4 class="font-semibold text-lg mb-2 text-gray-800">Location</h4>
        <p class="text-gray-600"><i class="fas fa-map-marker-alt mr-2 text-red-500"></i>${complaint.location?.address || 'No location provided'}</p>
    </div>
    <div>
        <a href="${complaint.location?.latitude ? `https://maps.google.com/?q=${complaint.location?.latitude},${complaint.location?.longitude}`:``}" class="text-blue-600 hover:underline" target="_blank"><h5>Visit the Location</h5></a>
    </div>
`;
    issueDetailModal.classList.remove('hidden');
}

function displayProfileReports(reportsToDisplay) {
    const container = document.getElementById('profileReportsContainer');
    container.innerHTML = '';

    if (reportsToDisplay.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-8">No reports found for this status.</p>`;
        return;
    }

    reportsToDisplay.forEach(report => {
        const statusColor = getStatusColor(report.status);
        const imageHtml = (report.images && report.images.length > 0)
            ? `<img src="${report.images[0]}" class="w-full h-full object-cover" alt="Report Image">`
            : `<i class="fas fa-camera text-gray-400 text-2xl"></i>`;

        // This HTML is for the clickable card WITHOUT the vote section
        const reportCard = `
        <div class="bg-white rounded-xl shadow-lg p-4 issue-card flex gap-4 cursor-pointer hover:shadow-xl transition-shadow" onclick="openDetailModal('${report._id}')">
            <div class="flex-grow min-w-0">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800">${report.title}</h3>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor} flex-shrink-0">${report.status}</span>
                </div>
                <p class="text-gray-600 text-sm mb-3 break-words">${report.description}</p> <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                    <span><i class="fas fa-calendar mr-1"></i>${new Date(report.createdAt).toLocaleDateString()}</span>
                    <span><i class="fas fa-map-marker-alt mr-1"></i>${report.location?.address || 'No location'}</span>
                    <span><i class="fas fa-arrow-up mr-1"></i>${report.voteCount || 0} Votes</span>
                </div>
            </div>
            <div class="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                ${imageHtml}
            </div>
        </div>`;
        container.innerHTML += reportCard;
    });
}

function getStatusColor(status) {
    const colors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'resolved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('editProfileError');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    errorDiv.classList.add('hidden');

    try {
        let profileImageUrl = currentUser.profileImage; // Start with the existing image URL

        // Step 1: Upload a new image if one was selected, just like in home.js
        if (profileImageFile) {
            const uploadForm = new FormData();
            uploadForm.append('image', profileImageFile);

            // This call to the /api/upload route handles the image
            const uploadRes = await authFetch(`${BASE_URL}/api/upload`, {
                method: 'POST',
                body: uploadForm,
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                throw new Error(`Image upload failed: ${errorText}`);
            }
            
            const uploadResult = await uploadRes.json();
            if (!uploadResult.success) {
                throw new Error(uploadResult.message || 'Image upload failed on the server.');
            }
            // Assuming your upload route returns an object with a 'urls' array
            profileImageUrl = uploadResult.urls[0]; 
        }

        // Step 2: Gather all other form data into a JSON object
        const form = e.target;
        const updatedData = {
            name: form.name.value,
            phone: form.phone.value,
            profileImage: profileImageUrl, // Use the new or existing URL
            address: {
                street: form.street.value,
                city: form.city.value,
                state: form.state.value,
                pincode: form.pincode.value,
            },
        };

        // Step 3: Send the final JSON data to the profile update route
        const response = await authFetch(`${BASE_URL}/api/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to update profile.');
        }

        const result = await response.json();
        
        // Step 4: Update UI and local storage with the new data from the server
        currentUser = result.data;
        localStorage.setItem('user', JSON.stringify(currentUser));
        populateProfileHeader(currentUser); // Refresh the header with new data
        document.getElementById('editProfileModal').classList.add('hidden');

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
        profileImageFile = null; // Reset the file variable after submission
    }
}

// --- PAGE INITIALIZATION & TAB FUNCTIONALITY ---

// document.addEventListener('DOMContentLoaded', () => {
    
//     // --- 1. ADD THESE TWO LINES BACK IN TO START EVERYTHING ---
//     checkAuthAndRedirect();
//     loadProfileData();

//     const closeDetailModalBtn = document.getElementById('closeDetailModal');
//     const issueDetailModal = document.getElementById('issueDetailModal');
//     if (closeDetailModalBtn && issueDetailModal) {
//         closeDetailModalBtn.addEventListener("click", () => issueDetailModal.classList.add("hidden"));
//         issueDetailModal.addEventListener("click", (e) => {
//             if (e.target === issueDetailModal) issueDetailModal.classList.add("hidden");
//         });
//     }

//     // --- 2. THE REST OF YOUR TAB LOGIC STAYS THE SAME ---
//     const tabs = [
//         document.getElementById('profileOpenTab'),
//         document.getElementById('profileInProgressTab'),
//         document.getElementById('profileResolvedTab')
//     ];
    
//     const highlight = document.getElementById('profileHighlight');

//     function moveHighlight(tab) {
//         if (!tab || !highlight) return;
//         highlight.style.width = `${tab.offsetWidth}px`;
//         highlight.style.left = `${tab.offsetLeft}px`;

//         tabs.forEach(t => {
//             if (t) t.classList.remove('active');
//         });
//         if (tab) tab.classList.add('active');
//     }

//     function filterAndDisplayReports(status) {
//         const statusMap = {
//             'Open': 'pending',
//             'In-Progress': 'in-progress',
//             'Resolved': 'resolved'
//         };

//         const backendStatus = statusMap[status];
//         const filteredReports = currentComplaints .filter(report => report.status === backendStatus);
//         displayProfileReports(filteredReports);
//     }

//     tabs.forEach(tab => {
//         if (tab) {
//             tab.addEventListener('click', () => {
//                 const status = tab.textContent.trim();
//                 moveHighlight(tab);
//                 filterAndDisplayReports(status);
//             });
//         }
//     });
    
//     window.addEventListener('resize', () => {
//         const activeTab = document.querySelector('.tab-container .tab.active');
//         if (activeTab) {
//             moveHighlight(activeTab);
//         }
//     });
// });

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIAL SETUP ---
    checkAuthAndRedirect();
    loadProfileData();

    // --- 2. ISSUE DETAIL MODAL LOGIC (for card pop-ups) ---
    const closeDetailModalBtn = document.getElementById('closeDetailModal');
    const issueDetailModal = document.getElementById('issueDetailModal');
    if (closeDetailModalBtn && issueDetailModal) {
        closeDetailModalBtn.addEventListener("click", () => issueDetailModal.classList.add("hidden"));
        issueDetailModal.addEventListener("click", (e) => {
            if (e.target === issueDetailModal) issueDetailModal.classList.add("hidden");
        });
    }

    // --- 3. EDIT PROFILE MODAL LOGIC ---
    const editProfileBtn = document.querySelector('button.bg-white'); // Find the "Edit Profile" button
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');

    if (editProfileBtn && editProfileModal && editProfileForm) {
        // Open the modal and populate it with current user data
        editProfileBtn.addEventListener('click', () => {
            if (!currentUser) return;
            
            // Populate the form with existing data
            editProfileForm.name.value = currentUser.name || '';
            editProfileForm.phone.value = currentUser.phone || '';
            editProfileForm.street.value = currentUser.address?.street || '';
            editProfileForm.city.value = currentUser.address?.city || '';
            editProfileForm.state.value = currentUser.address?.state || '';
            editProfileForm.pincode.value = currentUser.address?.pincode || '';
            profileImagePreview.src = currentUser.profileImage || 'https://via.placeholder.com/150';

            editProfileModal.classList.remove('hidden');
        });

        // Handle form submission
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Handle closing the modal
    if (editProfileModal && closeEditModalBtn && cancelEditBtn) {
        const closeModal = () => editProfileModal.classList.add('hidden');
        closeEditModalBtn.addEventListener('click', closeModal);
        cancelEditBtn.addEventListener('click', closeModal);
    }

    // Handle the image preview when a new file is chosen
    if (profileImageInput && profileImagePreview) {
        profileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                profileImageFile = file; // Store the file object for later upload
                const reader = new FileReader();
                reader.onload = (event) => {
                    profileImagePreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // --- 4. TAB LOGIC ---
    const tabs = [
        document.getElementById('profileOpenTab'),
        document.getElementById('profileInProgressTab'),
        document.getElementById('profileResolvedTab')
    ];
    
    const highlight = document.getElementById('profileHighlight');

    function moveHighlight(tab) {
        if (!tab || !highlight) return;
        highlight.style.width = `${tab.offsetWidth}px`;
        highlight.style.left = `${tab.offsetLeft}px`;

        tabs.forEach(t => {
            if (t) t.classList.remove('active');
        });
        if (tab) tab.classList.add('active');
    }

    function filterAndDisplayReports(status) {
        const statusMap = {
            'Open': 'pending',
            'In-Progress': 'in-progress',
            'Resolved': 'resolved'
        };

        const backendStatus = statusMap[status];
        const filteredReports = currentComplaints.filter(report => report.status === backendStatus);
        displayProfileReports(filteredReports);
    }

    tabs.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', () => {
                const status = tab.textContent.trim();
                moveHighlight(tab);
                filterAndDisplayReports(status);
            });
        }
    });
    
    // --- 5. RESIZE LISTENER ---
    window.addEventListener('resize', () => {
        const activeTab = document.querySelector('.tab-container .tab.active');
        if (activeTab) {
            moveHighlight(activeTab);
        }
    });
});
