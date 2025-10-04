// // Sample data for demonstration
// const sampleIssues = {
//     'Open': [
//         {
//             id: 1,
//             title: "Large Pothole on Main Street",
//             description: "A large and dangerous pothole has formed near the intersection of Main St and 1st Ave. It has already caused damage to several vehicles.",
//             date: "2025-09-28",
//             postedBy: "Jane Doe",
//             location: "Downtown",
//             votes: 128,
//             userVoted: false
//         },
//         {
//             id: 2,
//             title: "Broken Streetlight at City Park",
//             description: "The streetlight on the corner of the park entrance has been out for over a week, making the area unsafe at night.",
//             date: "2025-08-27",
//             postedBy: "John Smith",
//             location: "City Park",
//             votes: 97,
//             userVoted: false
//         },
//         {
//             id: 3,
//             title: "Overflowing Public Trash Can",
//             description: "The trash can at the bus stop on Elm Street is constantly overflowing, causing litter to spread across the sidewalk.",
//             date: "2025-09-26",
//             postedBy: "Emily White",
//             location: "Elm Street",
//             votes: 75,
//             userVoted: false
//         }
//     ],
//     'In-Progress': [
//         {
//             id: 4,
//             title: "Graffiti on Library Wall",
//             description: "A large amount of graffiti was painted on the back wall of the public library over the weekend.",
//             date: "2025-09-25",
//             postedBy: "Michael Brown",
//             location: "Public Library",
//             votes: 52,
//             userVoted: false
//         },
//         {
//             id: 5,
//             title: "Damaged Playground Equipment",
//             description: "The swing set at the community playground has broken chains and needs immediate repair for safety.",
//             date: "2025-09-24",
//             postedBy: "Sarah Johnson",
//             location: "Community Park",
//             votes: 43,
//             userVoted: false
//         }
//     ],
//     'Closed': [
//         {
//             id: 6,
//             title: "Fallen Tree Blocking Road",
//             description: "A large tree fell during the storm last night, completely blocking Oak Avenue.",
//             date: "2025-09-20",
//             postedBy: "Robert Wilson",
//             location: "Oak Avenue",
//             votes: 89,
//             userVoted: false
//         },
//         {
//             id: 7,
//             title: "Water Leak on Maple Street",
//             description: "Constant water leakage from a broken pipe is causing pavement damage and water wastage.",
//             date: "2025-09-18",
//             postedBy: "Lisa Garcia",
//             location: "Maple Street",
//             votes: 67,
//             userVoted: false
//         }
//     ]
// };

// // Tab functionality
// const tabs = [
//     document.getElementById('openTab'),
//     document.getElementById('inProgressTab'),
//     document.getElementById('closedTab')
// ];
// const highlight = document.getElementById('highlight');

// function moveHighlight(tab) {
//     highlight.style.width = `${tab.offsetWidth}px`;
//     highlight.style.left = `${tab.offsetLeft}px`;

//     tabs.forEach(t => t.classList.remove('active'));
//     tab.classList.add('active');

//     // Load issues for the selected tab
//     loadIssues(tab.textContent.trim());
// }

// tabs.forEach(tab => {
//     tab.addEventListener('click', () => {
//         moveHighlight(tab);
//     });
// });

// // Display issues in the grid
// function displayIssues(issues) {
//     const container = document.getElementById('issuesContainer');
//     container.innerHTML = '';

//     issues.forEach(issue => {
//         const issueCard = `
//                     <div class="bg-white rounded-xl shadow-lg p-4 issue-card flex gap-4">
//                         <div class="flex flex-col items-center space-y-1">
//                             <button class="vote-btn ${issue.userVoted ? 'active' : ''}" onclick="handleVote(${issue.id})">
//                                 <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
//                                 </svg>
//                             </button>
//                             <span class="font-bold text-gray-800">${issue.votes}</span>
//                             <span class="text-xs text-gray-500">Vote</span>
//                         </div>
//                         <div class="flex-grow">
//                             <h3 class="font-bold text-lg text-gray-800">${issue.title}</h3>
//                             <p class="text-gray-600 text-sm mb-2">${issue.description}</p>
//                             <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
//                                 <span>Date: ${new Date(issue.date).toLocaleDateString()}</span>
//                                 <span>Posted by: ${issue.postedBy}</span>
//                                 <span>Location: ${issue.location}</span>
//                             </div>
//                         </div>
//                         <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500">
//                             <i class="fas fa-camera text-gray-400 text-xl"></i>
//                         </div>
//                     </div>
//                 `;
//         container.innerHTML += issueCard;
//     });
// }

// // Load issues for the selected tab
// function loadIssues(status = 'Open') {
//     const issues = sampleIssues[status] || [];
//     displayIssues(issues);
// }

// // Handle voting
// function handleVote(issueId) {
//     // Find the issue in any category and toggle vote
//     for (const status in sampleIssues) {
//         const issue = sampleIssues[status].find(item => item.id === issueId);
//         if (issue) {
//             if (issue.userVoted) {
//                 issue.votes--;
//                 issue.userVoted = false;
//             } else {
//                 issue.votes++;
//                 issue.userVoted = true;
//             }
//             break;
//         }
//     }

//     // Reload current tab to reflect vote changes
//     const activeTab = document.querySelector('.tab.active');
//     loadIssues(activeTab.textContent.trim());
// }

// // Report Issue Modal
// const reportModal = document.getElementById("reportModal");
// const closeReportModal = document.getElementById("closeReportModal");
// const reportIssueBtn = document.getElementById("reportIssueBtn");
// const floatingReportBtn = document.getElementById("floatingReportBtn");

// reportIssueBtn.addEventListener("click", () => {
//     reportModal.classList.remove("hidden");
// });

// floatingReportBtn.addEventListener("click", () => {
//     reportModal.classList.remove("hidden");
// });

// closeReportModal.addEventListener("click", () => {
//     reportModal.classList.add("hidden");
// });

// reportModal.addEventListener("click", (e) => {
//     if (e.target === reportModal) {
//         reportModal.classList.add("hidden");
//     }
// });

// // Handle form submission (demo only - no backend)
// document.getElementById('reportIssueForm').addEventListener('submit', function (e) {
//     e.preventDefault();

//     const formData = new FormData(this);
//     const newIssue = {
//         id: Date.now(), // Simple ID generation
//         title: formData.get('title'),
//         description: formData.get('description'),
//         location: formData.get('location'),
//         date: new Date().toISOString(),
//         postedBy: "You",
//         votes: 1,
//         userVoted: true
//     };

//     // Add to Open issues
//     sampleIssues.Open.unshift(newIssue);

//     alert('Issue reported successfully! (This is a demo - no data is saved)');
//     reportModal.classList.add('hidden');
//     this.reset();

//     // Reload Open tab to show new issue
//     moveHighlight(tabs[0]);
// });

// // Initialize page
// document.addEventListener('DOMContentLoaded', function () {
//     moveHighlight(tabs[0]); // Initialize with Open tab
// });

// // Handle window resize
// window.addEventListener('resize', () => {
//     const activeTab = document.querySelector('.tab.active');
//     if (activeTab) {
//         moveHighlight(activeTab);
//     }
// });



// ################################################################################################


// // DEFINE THE BASE URL FOR YOUR BACKEND HERE
// const BASE_URL = "http://localhost:3000";

// // Check if user is logged in (optional for public page)
// function checkAuth() {
//     const token = localStorage.getItem('token');
//     const user = localStorage.getItem('user');

//     // For public page, auth is optional - only needed for submitting complaints
//     if (user) {
//         return JSON.parse(user);
//     }
//     return null;
// }

// // Tab functionality (same as before)
// const tabs = [
//     document.getElementById('openTab'),
//     document.getElementById('inProgressTab'),
//     document.getElementById('closedTab')
// ];
// const highlight = document.getElementById('highlight');

// function moveHighlight(tab) {
//     highlight.style.width = `${tab.offsetWidth}px`;
//     highlight.style.left = `${tab.offsetLeft}px`;

//     tabs.forEach(t => t.classList.remove('active'));
//     tab.classList.add('active');

//     loadComplaints(tab.textContent.trim());
// }

// tabs.forEach(tab => {
//     tab.addEventListener('click', () => {
//         moveHighlight(tab);
//     });
// });

// // Load complaints from backend (NO AUTH REQUIRED)
// async function loadComplaints(status = 'Open') {
//     try {
//         showLoading();
//         const response = await fetch(`${BASE_URL}/api/issues?status=${status}`); // No auth header needed

//         if (!response.ok) {
//             throw new Error('Failed to fetch complaints');
//         }

//         const complaints = await response.json();
//         displayComplaints(complaints, status);
//     } catch (error) {
//         console.error('Error loading complaints:', error);
//         displaySampleComplaints(status);
//     } finally {
//         hideLoading();
//     }
// }

// // Display complaints in the grid
// function displayComplaints(complaints, status) {
//     const container = document.getElementById('issuesContainer');
//     container.innerHTML = '';

//     if (complaints.length === 0) {
//         container.innerHTML = `
//             <div class="bg-white rounded-xl shadow-lg p-8 text-center">
//                 <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
//                 <h3 class="text-xl font-semibold text-gray-600 mb-2">No ${status.toLowerCase()} complaints</h3>
//                 <p class="text-gray-500">Be the first to report an issue in your area!</p>
//             </div>
//         `;
//         return;
//     }

//     complaints.forEach(complaint => {
//         const statusColor = getStatusColor(complaint.status);
//         const priorityColor = getPriorityColor(complaint.priority);
//         const categoryIcon = getCategoryIcon(complaint.category);
//         const voteCount = complaint.voteCount || 0;

//         const complaintCard = `
//             <div class="bg-white rounded-xl shadow-lg p-4 issue-card flex gap-4">
//                 <!-- Voting & Priority -->
//                 <div class="flex flex-col items-center space-y-3">
//                     <button class="vote-btn group" onclick="handleVote('${complaint._id}')">
//                         <svg class="w-6 h-6 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
//                         </svg>
//                         <span class="font-bold text-gray-800 text-sm">${voteCount}</span>
//                         <span class="text-xs text-gray-500">Votes</span>
//                     </button>

//                     <div class="flex flex-col items-center">
//                         <div class="w-3 h-3 rounded-full ${priorityColor} mb-1"></div>
//                         <span class="text-xs text-gray-500">Priority</span>
//                     </div>
//                 </div>

//                 <!-- Category Icon -->
//                 <div class="flex flex-col items-center justify-center">
//                     <div class="text-2xl ${getCategoryColor(complaint.category)}">
//                         ${categoryIcon}
//                     </div>
//                 </div>

//                 <!-- Main Content -->
//                 <div class="flex-grow">
//                     <div class="flex justify-between items-start mb-2">
//                         <h3 class="font-bold text-lg text-gray-800">${complaint.title}</h3>
//                         <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
//                             ${mapStatusToFrontend(complaint.status)}
//                         </span>
//                     </div>

//                     <p class="text-gray-600 text-sm mb-3">${complaint.description}</p>

//                     <!-- Complaint Details -->
//                     <div class="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
//                         <div class="flex items-center">
//                             <i class="fas fa-map-marker-alt mr-2"></i>
//                             <span class="truncate">${complaint.location?.address || 'Location not specified'}</span>
//                         </div>
//                         <div class="flex items-center">
//                             <i class="fas fa-tag mr-2"></i>
//                             <span class="capitalize">${complaint.category}</span>
//                         </div>
//                     </div>

//                     <!-- Footer -->
//                     <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
//                         <div class="flex items-center">
//                             <i class="fas fa-user mr-1"></i>
//                             <span>${complaint.user?.name || 'Anonymous'}</span>
//                         </div>
//                         <div class="flex items-center">
//                             <i class="fas fa-calendar mr-1"></i>
//                             <span>${formatDate(complaint.createdAt)}</span>
//                         </div>
//                         ${complaint.assignedTo ? `
//                         <div class="flex items-center">
//                             <i class="fas fa-user-tie mr-1"></i>
//                             <span>Assigned</span>
//                         </div>
//                         ` : ''}
//                     </div>

//                     <!-- Comments Count -->
//                     ${complaint.comments && complaint.comments.length > 0 ? `
//                     <div class="mt-2 flex items-center text-xs text-blue-600">
//                         <i class="fas fa-comments mr-1"></i>
//                         <span>${complaint.comments.length} update${complaint.comments.length > 1 ? 's' : ''}</span>
//                     </div>
//                     ` : ''}
//                 </div>

//                 <!-- Image Preview -->
//                 <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
//                     ${complaint.images && complaint.images.length > 0 ? 
//                         `<img src="${complaint.images[0]}" class="w-full h-full object-cover" alt="Complaint image" onclick="openImage('${complaint.images[0]}')">` : 
//                         `<i class="fas fa-camera text-gray-400 text-xl"></i>`
//                     }
//                 </div>
//             </div>
//         `;
//         container.innerHTML += complaintCard;
//     });
// }

// // Handle voting (no auth required)
// async function handleVote(complaintId) {
//     try {
//         const response = await fetch(`${BASE_URL}/api/issues/${complaintId}/vote`, {
//             method: 'PUT'
//         });

//         if (!response.ok) {
//             throw new Error('Failed to vote');
//         }

//         const result = await response.json();

//         // Reload current tab to reflect vote changes
//         const activeTab = document.querySelector('.tab.active');
//         loadComplaints(activeTab.textContent.trim());

//     } catch (error) {
//         console.error('Error voting:', error);
//         alert('Error voting on complaint. Please try again.');
//     }
// }

// // Report Complaint Modal - Check if user is logged in
// const reportModal = document.getElementById("reportModal");
// const closeReportModal = document.getElementById("closeReportModal");
// const reportIssueBtn = document.getElementById("reportIssueBtn");
// const floatingReportBtn = document.getElementById("floatingReportBtn");

// reportIssueBtn.addEventListener("click", () => {
//     const user = checkAuth();
//     if (!user) {
//         alert('Please login to report a complaint');
//         // Optionally open login modal here
//         return;
//     }
//     reportModal.classList.remove("hidden");
// });

// floatingReportBtn.addEventListener("click", () => {
//     const user = checkAuth();
//     if (!user) {
//         alert('Please login to report a complaint');
//         return;
//     }
//     reportModal.classList.remove("hidden");
// });

// // Rest of the helper functions remain the same...
// // getStatusColor, getPriorityColor, getCategoryIcon, formatDate, etc.

// // Handle complaint submission (requires auth)
// document.getElementById('reportIssueForm').addEventListener('submit', async function(e) {
//     e.preventDefault();

//     const user = checkAuth();
//     if (!user) {
//         alert('Please login to submit a complaint');
//         return;
//     }

//     const formData = new FormData(this);
//     const token = localStorage.getItem('token');

//     const complaintData = {
//         title: formData.get('title'),
//         description: formData.get('description'),
//         location: formData.get('location'),
//         category: formData.get('category')
//     };

//     // Show loading state
//     const submitBtn = this.querySelector('button[type="submit"]');
//     const originalText = submitBtn.textContent;
//     submitBtn.disabled = true;
//     submitBtn.textContent = 'Submitting...';

//     try {
//         const response = await fetch(`${BASE_URL}/api/issues`, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(complaintData)
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || 'Failed to submit complaint');
//         }

//         const result = await response.json();
//         alert('Complaint submitted successfully!');
//         reportModal.classList.add('hidden');
//         this.reset();
//         loadComplaints('Open'); // Reload to show new complaint

//     } catch (error) {
//         console.error('Error submitting complaint:', error);
//         alert(`Error: ${error.message}`);
//     } finally {
//         submitBtn.disabled = false;
//         submitBtn.textContent = originalText;
//     }
// });

// // Update header for public page
// function updateHeaderForPublic() {
//     const user = checkAuth();
//     const welcomeElement = document.getElementById('userWelcome');
//     const logoutBtn = document.getElementById('logoutBtn');
//     const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

//     if (user) {
//         // User is logged in
//         if (welcomeElement) welcomeElement.textContent = `Welcome, ${user.name}!`;
//         if (logoutBtn) logoutBtn.style.display = 'block';
//         if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
//     } else {
//         // User is not logged in - show login/signup buttons
//         if (welcomeElement) welcomeElement.textContent = 'Welcome, Guest!';
//         if (logoutBtn) {
//             logoutBtn.textContent = 'Login';
//             logoutBtn.onclick = () => window.location.href = 'index.html';
//         }
//         if (mobileLogoutBtn) {
//             mobileLogoutBtn.textContent = 'Login';
//             mobileLogoutBtn.onclick = () => window.location.href = 'index.html';
//         }
//     }
// }

// // Initialize page
// document.addEventListener('DOMContentLoaded', function() {
//     updateHeaderForPublic();
//     moveHighlight(tabs[0]);
// });

// // Handle window resize
// window.addEventListener('resize', () => {
//     const activeTab = document.querySelector('.tab.active');
//     if (activeTab) {
//         moveHighlight(activeTab);
//     }
// });

// ################################################################################################################


// DEFINE THE BASE URL FOR YOUR BACKEND HERE
const BASE_URL = "http://127.0.0.1:3000";

// Token management
let accessToken = localStorage.getItem('accessToken');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Tab functionality
const tabs = [
    document.getElementById('openTab'),
    document.getElementById('inProgressTab'),
    document.getElementById('closedTab')
];
const highlight = document.getElementById('highlight');

// Function to refresh token
async function refreshAccessToken() {
    try {
        const response = await fetch(`${BASE_URL}/api/users/refresh-token`, {
            method: 'POST',
            credentials: 'include' // Important for cookies
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.accessToken;
            localStorage.setItem('accessToken', accessToken);
            if (data.user) {
                currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    return false;
}

// Authenticated fetch function
async function authFetch(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    // Only set JSON content-type if body is NOT FormData
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log('🌐 authFetch called:', {
        url,
        method: options.method,
        hasBody: !!options.body,
        isFormData: options.body instanceof FormData,
        headers: headers
    });

    try {
        let response = await fetch(url, {
            ...options,
            headers: headers,
            credentials: 'include'
        });

        console.log('📡 Response received:', response.status, response.statusText);

        // If token expired, try to refresh
        if (response.status === 401) {
            console.log('🔄 Token expired, refreshing...');
            const refreshed = await refreshAccessToken();
            if (refreshed && accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
                response = await fetch(url, {
                    ...options,
                    headers: headers,
                    credentials: 'include'
                });
            } else {
                logout();
                throw new Error('Session expired. Please login again.');
            }
        }

        return response;
    } catch (error) {
        console.error('🚨 authFetch error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
}


// Move highlight and switch tabs
function moveHighlight(tab) {
    if (!highlight) return;

    highlight.style.width = `${tab.offsetWidth}px`;
    highlight.style.left = `${tab.offsetLeft}px`;

    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    loadComplaints(tab.textContent.trim());
}

// Load complaints (PUBLIC - no auth needed)
async function loadComplaints(status = 'Open') {
    try {
        showLoading();
        const response = await fetch(`${BASE_URL}/api/user_issues?status=${status}`);

        if (!response.ok) {
            throw new Error('Failed to fetch complaints');
        }

        const result = await response.json();

        if (result.success) {
            displayComplaints(result.data, status);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Error loading complaints:', error);
        displaySampleComplaints(status);
    } finally {
        hideLoading();
    }
}

// Display complaints in the grid
function displayComplaints(complaints, status) {
    const container = document.getElementById('issuesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!complaints || complaints.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No ${status.toLowerCase()} complaints</h3>
                <p class="text-gray-500">${status === 'Open' ? 'Be the first to report an issue!' : 'No complaints match the current filter.'}</p>
            </div>
        `;
        return;
    }

    complaints.forEach(complaint => {
        const statusColor = getStatusColor(complaint.status);
        const priorityColor = getPriorityColor(complaint.priority);
        const voteCount = complaint.voteCount || 0;

        const complaintCard = `
            <div class="bg-white rounded-xl shadow-lg p-4 issue-card flex gap-4">
                <!-- Voting -->
                <div class="flex flex-col items-center space-y-1">
                    <button class="vote-btn" onclick="handleVote('${complaint._id}')">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                        </svg>
                    </button>
                    <span class="font-bold text-gray-800">${voteCount}</span>
                    <span class="text-xs text-gray-500">Votes</span>
                </div>
                
                <!-- Main Content -->
                <div class="flex-grow">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-gray-800">${complaint.title}</h3>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                            ${complaint.status}
                        </span>
                    </div>
                    
                    <p class="text-gray-600 text-sm mb-3">${complaint.description}</p>
                    
                    <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                        <span><i class="fas fa-calendar mr-1"></i>${new Date(complaint.createdAt).toLocaleDateString()}</span>
                        <span><i class="fas fa-user mr-1"></i>${complaint.user?.name || 'Anonymous'}</span>
                        <span><i class="fas fa-map-marker-alt mr-1"></i>${complaint.location?.address || 'No location'}</span>
                    </div>
                </div>
                
                <!-- Image Preview -->
                <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    ${complaint.images && complaint.images.length > 0 ?
                `<img src="${complaint.images[0]}" class="w-full h-full object-cover" alt="Complaint image">` :
                `<i class="fas fa-camera text-gray-400 text-xl"></i>`
            }
                </div>
            </div>
        `;
        container.innerHTML += complaintCard;
    });
}

// Handle voting
async function handleVote(complaintId) {
    try {
        const response = await fetch(`${BASE_URL}/api/user_issues/${complaintId}/vote`, {
            method: 'PUT'
        });

        const result = await response.json();

        if (result.success) {
            // Reload complaints to show updated vote count
            const activeTab = document.querySelector('.tab.active');
            loadComplaints(activeTab.textContent.trim());
        } else {
            alert('Error: ' + result.message);
        }

    } catch (error) {
        console.error('Error voting:', error);
        alert('Error voting on complaint');
    }
}

// Handle complaint submission (WITH AUTH)
// Handle complaint submission (WITH AUTH)
document.getElementById('reportIssueForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Please login to submit a complaint');
        return;
    }

    const formData = new FormData(this);

    // Extract text fields
    const complaintData = {
        title: formData.get('title'),
        description: formData.get('description'),
        location: formData.get('location'),
        category: formData.get('category'),
        images: [] // will be filled after upload
    };

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Step 1: Upload image if present
        const file = formData.get('image');
        console.log('🔍 File details:', {
            name: file?.name,
            size: file?.size,
            type: file?.type
        });

        if (file && file.size > 0) {
            console.log('📤 Starting upload to:', `${BASE_URL}/api/upload`);

            const uploadForm = new FormData();
            uploadForm.append('image', file);

            console.log('📦 FormData created, calling authFetch...');

            const uploadRes = await authFetch(`${BASE_URL}/api/upload`, {
                method: 'POST',
                body: uploadForm
            });

            console.log('✅ Upload response received:', uploadRes.status);

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error('❌ Upload failed:', errorText);
                throw new Error(`Upload failed: ${uploadRes.status} - ${errorText}`);
            }

            const uploadResult = await uploadRes.json();
            console.log('📝 Upload result:', uploadResult);

            if (!uploadResult.success) {
                throw new Error(uploadResult.message || 'Image upload failed');
            }

            complaintData.images = uploadResult.urls;
        }

        // Step 2: Send complaint as JSON
        console.log('📨 Sending complaint data:', complaintData);

        const response = await authFetch(`${BASE_URL}/api/user_issues`, {
            method: 'POST',
            body: JSON.stringify(complaintData)
        });

        console.log('✅ Complaint response received:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Complaint submission failed:', errorText);
            throw new Error(`Request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📝 Final result:', result);

        if (result.success) {
            alert('Complaint submitted successfully!');
            reportModal.classList.add('hidden');
            this.reset();
            loadComplaints('Open');
        } else {
            alert('Error: ' + result.message);
        }

    } catch (error) {
        console.error('💥 Error submitting complaint:', error);
        alert('Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});


// Update UI based on auth status
function updateAuthUI() {
    const welcomeElement = document.getElementById('userWelcome');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    if (currentUser && welcomeElement) {
        welcomeElement.textContent = `Welcome, ${currentUser.name}!`;
    }
    else if (welcomeElement) {
        welcomeElement.textContent = 'Welcome, Guest!';
    }
    if (logoutBtn) {
        if (currentUser) {
            logoutBtn.style.display = 'block';
            logoutBtn.textContent = 'Logout';
        } else {
            logoutBtn.style.display = 'block';
            logoutBtn.textContent = 'Login';
            logoutBtn.onclick = () => window.location.href = 'index.html';
        }
    }

    if (mobileLogoutBtn) {
        if (currentUser) {
            mobileLogoutBtn.style.display = 'block';
            mobileLogoutBtn.textContent = 'Logout';
        } else {
            mobileLogoutBtn.style.display = 'block';
            mobileLogoutBtn.textContent = 'Login';
            mobileLogoutBtn.onclick = () => window.location.href = 'index.html';
        }
    }
}

// Logout function
async function logout() {
    try {
        await fetch(`${BASE_URL}/api/users/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        accessToken = null;
        currentUser = null;
        updateAuthUI();
        window.location.href = 'index.html';
    }
}

// Helper functions for styling
function getStatusColor(status) {
    const colors = {
        'pending': 'bg-green-100 text-green-800',
        'in-progress': 'bg-yellow-100 text-yellow-800',
        'resolved': 'bg-blue-100 text-blue-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority) {
    const colors = {
        'high': 'bg-red-500',
        'medium': 'bg-yellow-500',
        'low': 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
}

function showLoading() {
    const container = document.getElementById('issuesContainer');
    if (container) {
        container.innerHTML = `
            <div class="flex justify-center items-center h-32">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        `;
    }
}

function hideLoading() {
    // Loading is handled by displayComplaints
}

// Display sample complaints if API fails
function displaySampleComplaints(status = 'Open') {
    const sampleComplaints = {
        'Open': [
            {
                _id: '1',
                title: "Large Pothole on Main Street",
                description: "A large and dangerous pothole has formed near the intersection of Main St and 1st Ave.",
                location: { address: "Main Street & 1st Ave" },
                category: "road",
                status: "pending",
                priority: "high",
                user: { name: "Jane Doe" },
                createdAt: new Date().toISOString(),
                voteCount: 5,
                images: []
            }
        ],
        'In-Progress': [
            {
                _id: '2',
                title: "Broken Streetlight",
                description: "The streetlight on the corner has been out for over a week.",
                location: { address: "City Park Area" },
                category: "electricity",
                status: "in-progress",
                priority: "medium",
                user: { name: "John Smith" },
                createdAt: new Date().toISOString(),
                voteCount: 3,
                images: []
            }
        ],
        'Closed': [
            {
                _id: '3',
                title: "Garbage Collection Issue",
                description: "Garbage hasn't been collected for 3 days in our area.",
                location: { address: "Maple Street" },
                category: "sanitation",
                status: "resolved",
                priority: "medium",
                user: { name: "Mike Johnson" },
                createdAt: new Date().toISOString(),
                voteCount: 8,
                images: []
            }
        ]
    };

    const complaints = sampleComplaints[status] || [];
    displayComplaints(complaints, status);
}

// Modal functionality
const reportModal = document.getElementById("reportModal");
const closeReportModal = document.getElementById("closeReportModal");
const reportIssueBtn = document.getElementById("reportIssueBtn");
const floatingReportBtn = document.getElementById("floatingReportBtn");

// Setup event listeners for modals
if (reportIssueBtn) {
    reportIssueBtn.addEventListener("click", () => {
        if (!currentUser) {
            alert('Please login to submit a complaint');
            window.location.href = 'index.html';
            return;
        }
        if (reportModal) reportModal.classList.remove("hidden");
    });
}

if (floatingReportBtn) {
    floatingReportBtn.addEventListener("click", () => {
        if (!currentUser) {
            alert('Please login to submit a complaint');
            window.location.href = 'index.html';
            return;
        }
        if (reportModal) reportModal.classList.remove("hidden");
    });
}

if (closeReportModal && reportModal) {
    closeReportModal.addEventListener("click", () => {
        reportModal.classList.add("hidden");
    });

    reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) {
            reportModal.classList.add("hidden");
        }
    });
}

// Setup tab functionality
if (tabs.length > 0 && highlight) {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            moveHighlight(tab);
        });
    });
}

// Setup logout buttons
function setupLogoutButtons() {
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    if (logoutBtn && currentUser) {
        logoutBtn.onclick = logout;
    }

    if (mobileLogoutBtn && currentUser) {
        mobileLogoutBtn.onclick = logout;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    updateAuthUI();
    setupLogoutButtons();

    // Load initial complaints if we have tabs
    if (tabs.length > 0) {
        moveHighlight(tabs[0]);
    } else {
        // Fallback: just load open complaints
        loadComplaints('Open');
    }
});