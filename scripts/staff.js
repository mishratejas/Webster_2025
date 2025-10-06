// STAFF.JS - COMPLETE FIXED VERSION
console.log("STAFF.JS LOADED - Starting initialization");

const BASE_URL = "http://localhost:3000";

// Global variables
let staffComplaints = [];
let currentStaffId = null;
let currentActiveTab = 'Assigned';
let isGridView = false;
let chatMessages = {};

// DOM Elements - will be initialized in DOMContentLoaded
let tabs = [];
let highlight = null;
let issuesContainer = null;
let taskCount = null;

// ========== DOM INITIALIZATION FUNCTION ==========
function initializeDOMElements() {
    tabs = [
        document.getElementById('assignedTab'),
        document.getElementById('inProgressTab'),
        document.getElementById('onHoldTab'),
        document.getElementById('closedTab')
    ];
    highlight = document.getElementById('highlight-staff');
    issuesContainer = document.getElementById('issuesContainer');
    taskCount = document.getElementById('taskCount');
    
}

// ========== GLOBAL FUNCTION DEFINITIONS ==========

window.openTaskDetails = function(complaintId) {
    console.log("Opening task details for:", complaintId);
    try {
        const complaint = staffComplaints.find(c => c._id === complaintId);
        if (!complaint) {
            showError('Complaint not found');
            return;
        }

        loadChatMessages(complaintId).then(chatMessages => {
            const modal = document.getElementById('taskDetailModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            
            if (modalTitle) modalTitle.textContent = complaint.title;
            
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-hidden">
                        <!-- Left column - Task details -->
                        <div class="space-y-4 overflow-y-auto">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">Task Details</h4>
                                <p class="text-sm mb-3">${escapeHtml(complaint.description)}</p>
                                <div class="space-y-2 text-sm">
                                    <div><strong>Priority:</strong> <span class="capitalize">${complaint.priority}</span></div>
                                    <div><strong>Category:</strong> <span class="capitalize">${complaint.category}</span></div>
                                    <div><strong>Submitted by:</strong> ${complaint.user?.name || 'Anonymous'}</div>
                                    <div><strong>Submitted on:</strong> ${formatDate(complaint.createdAt)}</div>
                                    <div><strong>Status:</strong> <span class="capitalize">${complaint.status.replace('-', ' ')}</span></div>
                                </div>
                            </div>
                            
                            <!-- Status update -->
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-semibold mb-2">Update Status</h4>
                                <select onchange="updateComplaintStatus('${complaint._id}', this.value)" 
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Assigned</option>
                                    <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="on-hold" ${complaint.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                                    <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                </select>
                            </div>

                            ${complaint.images && complaint.images.length > 0 ? `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <h4 class="font-semibold mb-2">Attached Images</h4>
                                    <div class="grid grid-cols-2 gap-2">
                                        ${complaint.images.map((img, index) => `
                                            <img src="${BASE_URL}${img}" 
                                                 alt="Issue image ${index + 1}" 
                                                 class="w-full h-24 object-cover rounded cursor-pointer border"
                                                 onclick="openImageModal('${BASE_URL}${img}')">
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Right column - Chat -->
                        <div class="md:col-span-2 bg-gray-50 p-4 rounded-lg flex flex-col">
                            <h4 class="font-semibold mb-2">Communication</h4>
                            <div class="flex-1 bg-white rounded-lg p-4 mb-3 overflow-y-auto" id="chatMessagesContainer">
                                ${chatMessages.length > 0 ? 
                                    chatMessages.map(msg => `
                                        <div class="mb-4 p-3 rounded-lg ${msg.sender === 'staff' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}">
                                            <div class="flex justify-between items-start mb-1">
                                                <span class="font-semibold text-sm">
                                                    ${msg.sender === 'staff' ? 'You' : 'Admin'}
                                                </span>
                                                <span class="text-xs opacity-75">${formatTime(msg.timestamp)}</span>
                                            </div>
                                            <div class="text-sm">${escapeHtml(msg.message)}</div>
                                        </div>
                                    `).join('') : 
                                    `<div class="text-center text-gray-500 py-8">
                                        <i class="fas fa-comments text-3xl mb-2"></i>
                                        <p>No messages yet</p>
                                        <p class="text-sm">Start the conversation!</p>
                                    </div>`
                                }
                            </div>
                            <div class="flex gap-2">
                                <input type="text" id="chatInput" placeholder="Type your message..." 
                                       class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       onkeypress="if(event.key === 'Enter') sendStaffMessage('${complaint._id}')">
                                <button onclick="sendStaffMessage('${complaint._id}')" 
                                        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (modal) modal.classList.remove('hidden');
            
            setTimeout(() => {
                const chatContainer = document.getElementById('chatMessagesContainer');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 100);
        });
        
    } catch (error) {
        console.error('Error opening task details:', error);
        showError('Failed to load task details');
    }
};

window.sendStaffMessage = function(complaintId) {
    const input = document.getElementById('chatInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    try {
        fetchWithAuth(`${BASE_URL}/api/staff/issues/${complaintId}/chat`, {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                sender: 'staff',
                timestamp: new Date().toISOString()
            })
        }).then(response => {
            if (response.ok) {
                if (input) input.value = '';
                const complaint = staffComplaints.find(c => c._id === complaintId);
                if (complaint) {
                    openTaskDetails(complaintId);
                }
            } else {
                throw new Error('Failed to send message');
            }
        }).catch(error => {
            console.error('Error sending message:', error);
            showError('Failed to send message');
        });
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
};

window.openImageModal = function(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold">Image Preview</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <img src="${imageUrl}" alt="Full size" class="w-full h-auto rounded-lg mb-4">
            <div class="flex gap-2 justify-center">
                <a href="${imageUrl}" download 
                   class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    <i class="fas fa-download mr-2"></i>Download
                </a>
                <button onclick="this.closest('.fixed').remove()" 
                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.updateComplaintStatus = function(complaintId, newStatus) {
    try {
        let comments = '';
        if (newStatus === 'resolved') {
            comments = prompt("Add resolution notes (required):");
            if (comments === null) return;
            if (!comments.trim()) {
                showError('Resolution notes are required');
                return;
            }
        } else if (newStatus === 'in-progress') {
            comments = prompt("Add work notes (optional):") || 'Work started';
        }

        fetchWithAuth(`${BASE_URL}/api/staff/issues/${complaintId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: newStatus,
                comments: comments,
                updatedAt: new Date().toISOString()
            })
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        }).then(data => {
            if (data.success) {
                showSuccess(`Status updated to ${getStatusDisplay(newStatus)}!`);
                fetchStaffComplaints().then(() => {
                    updateStatistics();
                    loadIssues(currentActiveTab);
                });
            } else {
                throw new Error(data.message || 'Failed to update status');
            }
        }).catch(error => {
            console.error("Error updating complaint status:", error);
            showError('Failed to update status: ' + error.message);
        });
    } catch (error) {
        console.error("Error updating complaint status:", error);
        showError('Failed to update status: ' + error.message);
    }
};

window.logout = function() {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    window.location.href = 'index.html';
};

window.fetchStaffComplaints = fetchStaffComplaints;

// ========== UTILITY FUNCTIONS ==========

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// ========== CORE APPLICATION FUNCTIONS ==========

// Initialize currentStaffId from token
function initializeStaffId() {
    try {
        const staffToken = localStorage.getItem("staffToken");
        if (staffToken) {
            const payload = JSON.parse(atob(staffToken.split('.')[1]));
            currentStaffId = payload.id || payload.userId || payload.staffId;
        }
    } catch (error) {
        console.error("Error initializing staff ID:", error);
    }
}

// Enhanced authentication check
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (error) {
        return true;
    }
}

function handleTokenExpiration() {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    alert('Your session has expired. Please login again.');
    window.location.href = 'staff-login.html';
}

async function fetchWithAuth(url, options = {}) {
    const staffToken = localStorage.getItem("staffToken");
    
    if (!staffToken || isTokenExpired(staffToken)) {
        handleTokenExpiration();
        throw new Error('Token expired');
    }
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${staffToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        handleTokenExpiration();
        throw new Error('Token expired');
    }
    
    return response;
}

// Initialize staff dashboard
async function initializeStaffDashboard() {
    
    const staffToken = localStorage.getItem("staffToken");
    
    if (!staffToken) {
        alert("Please login as staff first");
        window.location.href = "staff-login.html";
        return;
    }

    try {
        // Initialize DOM elements FIRST
        initializeDOMElements();
        
        // Initialize staff ID
        initializeStaffId();
        
        // Update UI with staff info
        updateStaffUI();
        
        // Set up event listeners
        setupEventListeners();
        
        // Try to load complaints
        await fetchStaffComplaints();
        
        // Initialize the first tab
        if (tabs[0]) {
            moveHighlight(tabs[0]);
        } else {
            // Load issues anyway
            loadIssues(currentActiveTab);
        }
        
        // Start auto-refresh
        startAutoRefresh();
                
    } catch (error) {
        showError('Failed to initialize dashboard: ' + error.message);
    }
}

// Update UI with staff data
function updateStaffUI() {
    const staffDataText = localStorage.getItem("staffData");
    const userDataText = localStorage.getItem("user");
    
    let staffData = {};
    
    if (staffDataText && staffDataText !== 'undefined') {
        try {
            staffData = JSON.parse(staffDataText);
        } catch (e) {
            console.error("Failed to parse staffData:", e);
        }
    }
    
    if ((!staffData || !staffData.name) && userDataText && userDataText !== 'undefined') {
        try {
            staffData = JSON.parse(userDataText);
        } catch (e) {
            console.error("Failed to parse userData:", e);
        }
    }
    
    if ((!staffData || !staffData.name)) {
        try {
            const staffToken = localStorage.getItem("staffToken");
            if (staffToken) {
                const payload = JSON.parse(atob(staffToken.split('.')[1]));
                staffData = staffData || {};
                staffData.name = payload.name || 'Staff Member';
            }
        } catch (error) {
            console.error("Error getting name from token:", error);
        }
    }
    
    if (staffData && staffData.name) {
        const staffWelcome = document.getElementById('staffWelcome');
        const mobileStaffName = document.getElementById('mobileStaffName');
        const staffInitial = document.getElementById('staffInitial');
        
        if (staffWelcome) staffWelcome.textContent = `Welcome, ${staffData.name}!`;
        if (mobileStaffName) mobileStaffName.textContent = staffData.name;
        if (staffInitial) staffInitial.textContent = staffData.name.charAt(0).toUpperCase();
    } else {
        console.warn("⚠️ No staff name found in storage, using default");
        const staffWelcome = document.getElementById('staffWelcome');
        if (staffWelcome) staffWelcome.textContent = "Welcome, Staff Member!";
    }
}

// Fetch complaints assigned to this staff member
async function fetchStaffComplaints() {
    try {
        
        const response = await fetchWithAuth(`${BASE_URL}/api/staff/issues`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            staffComplaints = data.data || [];
            
            // Sort by priority (High -> Medium -> Low) and then by creation date
            staffComplaints.sort((a, b) => {
                const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
                const priorityA = priorityOrder[a.priority] || 4;
                const priorityB = priorityOrder[b.priority] || 4;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Update statistics and UI
            updateStatistics();
            
        } else {
            throw new Error(data.message || 'Failed to fetch complaints');
        }
    } catch (error) {
        if (!error.message.includes('Token expired')) {
            showError('Failed to load complaints: ' + error.message);
            
            // Show fallback UI
            if (issuesContainer) {
                issuesContainer.innerHTML = `
                    <div class="bg-white rounded-xl shadow-md p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-500 mb-2">Unable to load tasks</h3>
                        <p class="text-gray-400 mb-4">${error.message}</p>
                        <button onclick="window.fetchStaffComplaints()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
        throw error;
    }
}

// Update statistics
function updateStatistics() {
    try {
        
        const myOpenTasks = staffComplaints.filter(c => 
            c.status === 'pending' || c.status === 'in-progress'
        ).length;
        
        const slaRiskTasks = staffComplaints.filter(c => 
            c.priority === 'high' && 
            (c.status === 'pending' || c.status === 'in-progress') &&
            isNearDueDate(c)
        ).length;
        
        const resolvedComplaints = staffComplaints.filter(c => c.status === 'resolved');
        const avgResolutionTime = calculateAverageResolutionTime(resolvedComplaints);
        
        const unreadMessages = staffComplaints.filter(c => hasUnreadMessages(c)).length;
        
        
        updateStatCard(0, myOpenTasks, 'MY OPEN TASKS', 'gray', `${myOpenTasks > 0 ? 'Active tasks' : 'No tasks'}`);
        updateStatCard(1, slaRiskTasks, 'SLA RISK', 'red', slaRiskTasks > 0 ? 'Due soon' : 'No urgent tasks');
        updateStatCard(2, avgResolutionTime, 'AVG RESOLUTION TIME', 'blue', 'Based on resolved tasks');
        updateStatCard(3, unreadMessages, 'UNREAD MESSAGES', 'orange', unreadMessages > 0 ? 'Requires attention' : 'All read');
        
        updateNotificationCount(unreadMessages);
        updateProgressBars();
        
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

function updateStatCard(index, value, title, color, subtitle) {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards[index]) {
        const titleEl = statCards[index].querySelector('.text-sm');
        const valueEl = statCards[index].querySelector('.text-4xl');
        const subtitleEl = statCards[index].querySelector('.text-xs');
        
        if (titleEl) titleEl.textContent = title;
        if (valueEl) {
            if (title === 'AVG RESOLUTION TIME') {
                valueEl.textContent = value === 'N/A' ? 'N/A' : `${value} DAYS`;
            } else if (title === 'SLA RISK') {
                valueEl.textContent = value > 0 ? `${value} URGENT` : '0 URGENT';
            } else if (title === 'UNREAD MESSAGES') {
                valueEl.textContent = value > 0 ? `${value} CHATS` : '0 CHATS';
            } else {
                valueEl.textContent = value;
            }
        }
        if (subtitleEl) {
            const colorMap = {
                'gray': '#6B7280',
                'red': '#DC2626', 
                'blue': '#2563EB',
                'orange': '#EA580C'
            };
            subtitleEl.innerHTML = `
                <span class="w-2 h-2 rounded-full mr-2 inline-block" style="background-color: ${colorMap[color] || '#6B7280'}"></span>
                <span>${subtitle}</span>
            `;
        }
    }
}

function updateNotificationCount(count) {
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        if (count > 0) {
            notificationCount.textContent = count > 9 ? '9+' : count;
            notificationCount.classList.remove('hidden');
        } else {
            notificationCount.classList.add('hidden');
        }
    }
}

function calculateAverageResolutionTime(resolvedComplaints) {
    if (resolvedComplaints.length === 0) return 'N/A';
    
    const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const created = new Date(complaint.createdAt);
        const resolved = new Date(complaint.resolvedAt || complaint.updatedAt);
        const days = (resolved - created) / (1000 * 60 * 60 * 24);
        return sum + days;
    }, 0);
    
    return (totalTime / resolvedComplaints.length).toFixed(1);
}

function isNearDueDate(complaint) {
    if (!complaint.dueDate) return false;
    const dueDate = new Date(complaint.dueDate);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 2;
}

function hasUnreadMessages(complaint) {
    return complaint.comments && complaint.comments.some(comment => 
        comment.sender === 'admin' && !comment.seenByStaff
    );
}

function updateProgressBars() {
    const highPriority = staffComplaints.filter(c => 
        c.priority === 'high' && (c.status === 'pending' || c.status === 'in-progress')
    ).length;
    
    const mediumPriority = staffComplaints.filter(c => 
        c.priority === 'medium' && (c.status === 'pending' || c.status === 'in-progress')
    ).length;
    
    const lowPriority = staffComplaints.filter(c => 
        c.priority === 'low' && (c.status === 'pending' || c.status === 'in-progress')
    ).length;
    
    const total = highPriority + mediumPriority + lowPriority;
    
    const progressBars = document.querySelectorAll('.progress-bar .h-full');
    if (progressBars[0]) progressBars[0].style.width = total > 0 ? `${(highPriority / total) * 100}%` : '0%';
    if (progressBars[1]) progressBars[1].style.width = total > 0 ? `${(mediumPriority / total) * 100}%` : '0%';
    if (progressBars[2]) progressBars[2].style.width = total > 0 ? `${(lowPriority / total) * 100}%` : '0%';
    
    const countElements = document.querySelectorAll('.flex.justify-between.text-sm.mb-1 span:last-child');
    if (countElements[0]) countElements[0].textContent = highPriority;
    if (countElements[1]) countElements[1].textContent = mediumPriority;
    if (countElements[2]) countElements[2].textContent = lowPriority;
}

// Tab management
function moveHighlight(tab) {
    if (!highlight || !tab) return;
    
    highlight.style.width = `${tab.offsetWidth}px`;
    highlight.style.left = `${tab.offsetLeft}px`;

    tabs.forEach(t => {
        if (t) t.classList.remove('active', 'text-blue-600', 'font-semibold');
    });
    
    tab.classList.add('active', 'text-blue-600', 'font-semibold');
    
    currentActiveTab = tab.textContent.trim();
    loadIssues(currentActiveTab);
}

function loadIssues(status) {
    console.log(`Loading issues for status: ${status}`);
    
    let filteredComplaints = [];
    
    if (!currentStaffId) {
        initializeStaffId();
    }
    
    switch(status) {
        case 'Assigned':
            filteredComplaints = staffComplaints.filter(c => 
                c.status === 'pending' && isAssignedToCurrentStaff(c)
            );
            break;
        case 'In-Progress':
            filteredComplaints = staffComplaints.filter(c => 
                c.status === 'in-progress' && isAssignedToCurrentStaff(c)
            );
            break;
        case 'On Hold':
            filteredComplaints = staffComplaints.filter(c => 
                c.status === 'on-hold' && isAssignedToCurrentStaff(c)
            );
            break;
        case 'Resolved':
            filteredComplaints = staffComplaints.filter(c => 
                (c.status === 'resolved' || c.status === 'rejected') && isAssignedToCurrentStaff(c)
            );
            break;
        default:
            filteredComplaints = staffComplaints.filter(c => isAssignedToCurrentStaff(c));
    }
    
    console.log(`Filtered complaints: ${filteredComplaints.length} for status ${status}`);
    
    // If no complaints found, show all complaints for debugging
    if (filteredComplaints.length === 0 && staffComplaints.length > 0) {
        console.log("No filtered complaints, showing all for debugging");
        filteredComplaints = staffComplaints;
    }
    
    displayIssues(filteredComplaints);
}

// Helper function to check if complaint is assigned to current staff
// Helper function to check if complaint is assigned to current staff
function isAssignedToCurrentStaff(complaint) {
    console.log("Checking assignment for complaint:", complaint._id);
    console.log("Current staff ID:", currentStaffId);
    console.log("AssignedTo data:", complaint.assignedTo);
    
    if (!currentStaffId) {
        console.log("No current staff ID, returning true");
        return true;
    }
    
    if (!complaint.assignedTo) {
        console.log("No assignedTo data, returning true");
        return true;
    }
    
    // Check various possible assignment structures
    let assignedStaffId = null;
    
    if (typeof complaint.assignedTo === 'string') {
        assignedStaffId = complaint.assignedTo;
        console.log("AssignedTo is string:", assignedStaffId);
    } else if (complaint.assignedTo._id) {
        assignedStaffId = complaint.assignedTo._id;
        console.log("AssignedTo has _id:", assignedStaffId);
    } else if (complaint.assignedTo.id) {
        assignedStaffId = complaint.assignedTo.id;
        console.log("AssignedTo has id:", assignedStaffId);
    } else if (complaint.assignedTo.userId) {
        assignedStaffId = complaint.assignedTo.userId;
        console.log("AssignedTo has userId:", assignedStaffId);
    }
    
    const isAssigned = assignedStaffId === currentStaffId;    
    return isAssigned;
}

// Display issues
function displayIssues(issues) {
    console.log("Displaying issues:", issues.length, issues);
    
    if (!issuesContainer) {
        console.error("Issues container not found!");
        // Try to reinitialize
        issuesContainer = document.getElementById('issuesContainer');
        if (!issuesContainer) {
            console.error("Still no issues container!");
            return;
        }
    }
    
    issuesContainer.innerHTML = '';
    
    if (taskCount) {
        taskCount.textContent = issues.length;
    }

    if (issues.length === 0) {
        issuesContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-8 text-center col-span-full">
                <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-500 mb-2">No tasks found</h3>
                <p class="text-gray-400">There are no tasks in ${currentActiveTab} category.</p>
            </div>
        `;
        return;
    }

    issues.forEach(complaint => {
        const priorityColor = getPriorityColor(complaint.priority);
        const statusBadge = getStatusBadge(complaint.status);
        const borderColorClass = getPriorityBorderClass(complaint.priority);
        
        const dueInfo = getDueDateInfo(complaint);
        const quickActionButton = getQuickActionButton(complaint);
        const hasUnread = hasUnreadMessages(complaint);
        
        const complaintCard = `
            <div class="bg-white rounded-xl shadow-md p-4 issue-card-staff relative cursor-pointer border-l-4 ${borderColorClass} ${isGridView ? 'md:w-80' : ''}" 
                 onclick="openTaskDetails('${complaint._id}')">
                ${complaint.status === 'pending' ? `
                    <span class="pulse-glow absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        <span class="text-xs">NEW</span>
                    </span>
                ` : ''}
                
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800 flex-1 pr-4 truncate">${escapeHtml(complaint.title)}</h3>
                    <div class="flex flex-col items-end space-y-1 flex-shrink-0">
                        <span class="px-3 py-1 rounded-full font-semibold text-xs ${priorityColor}">
                            ${complaint.priority?.charAt(0).toUpperCase() + complaint.priority?.slice(1) || 'Unknown'}
                        </span>
                        <span class="status-badge px-2 py-1 rounded-full text-xs ${statusBadge}">
                            ${getStatusDisplay(complaint.status)}
                        </span>
                    </div>
                </div>
                
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(complaint.description || 'No description')}</p>
                
                ${getAdminNotes(complaint)}
                
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center space-x-2 text-xs text-gray-500 flex-wrap">
                        <span class="flex items-center">
                            <i class="fas fa-user mr-1"></i> ${complaint.user?.name || 'Anonymous'}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i> ${formatDate(complaint.createdAt)}
                        </span>
                    </div>
                    <span class="text-xs ${dueInfo.color} font-medium flex-shrink-0 ml-2">${dueInfo.text}</span>
                </div>
                
                <div class="flex justify-between items-center border-t pt-3">
                    <div class="flex items-center space-x-3">
                        <span class="text-xs text-gray-600 flex items-center">
                            <i class="fas fa-map-marker-alt mr-1"></i> ${complaint.location || 'Not specified'}
                        </span>
                        <span class="text-xs ${hasUnread ? 'text-red-600 font-semibold animate-pulse' : 'text-gray-400'} flex items-center">
                            <i class="fas fa-comment-dots mr-1"></i> 
                            ${hasUnread ? 'New Messages' : 'No new messages'}
                        </span>
                    </div>
                    ${quickActionButton}
                </div>
            </div>
        `;
        issuesContainer.innerHTML += complaintCard;
    });
}

function getAdminNotes(complaint) {
    if (!complaint.comments) return '';
    
    const adminNotes = complaint.comments.filter(comment => 
        comment.message && comment.message.includes('[ADMIN NOTE]')
    );
    
    if (adminNotes.length === 0) return '';
    
    return `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-3">
            <div class="flex items-start">
                <i class="fas fa-exclamation-circle text-yellow-500 mt-0.5 mr-2"></i>
                <div>
                    <p class="text-xs font-medium text-yellow-800">Admin Note</p>
                    <p class="text-xs text-yellow-700">${escapeHtml(adminNotes[0].message.replace('[ADMIN NOTE]:', '').trim())}</p>
                </div>
            </div>
        </div>
    `;
}

// Utility functions
function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return 'text-red-500 bg-red-100';
        case 'medium': return 'text-yellow-600 bg-yellow-100';
        case 'low': return 'text-green-600 bg-green-100';
        default: return 'text-gray-500 bg-gray-100';
    }
}

function getPriorityBorderClass(priority) {
    switch (priority) {
        case 'high': return 'border-l-red-500';
        case 'medium': return 'border-l-yellow-500';
        case 'low': return 'border-l-green-500';
        default: return 'border-l-gray-500';
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'pending': return 'bg-blue-100 text-blue-800';
        case 'in-progress': return 'bg-purple-100 text-purple-800';
        case 'on-hold': return 'bg-orange-100 text-orange-800';
        case 'resolved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusDisplay(status) {
    switch (status) {
        case 'pending': return 'Assigned';
        case 'in-progress': return 'In Progress';
        case 'on-hold': return 'On Hold';
        case 'resolved': return 'Resolved';
        case 'rejected': return 'Rejected';
        default: return status;
    }
}

function getDueDateInfo(complaint) {
    const dueDate = complaint.dueDate ? new Date(complaint.dueDate) : new Date(complaint.createdAt);
    if (!complaint.dueDate) dueDate.setDate(dueDate.getDate() + 7);
    
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
        return { text: 'Overdue', color: 'text-red-500' };
    } else if (daysDiff === 0) {
        return { text: 'Due today', color: 'text-red-500' };
    } else if (daysDiff === 1) {
        return { text: 'Due tomorrow', color: 'text-orange-500' };
    } else if (daysDiff <= 3) {
        return { text: `Due in ${daysDiff} days`, color: 'text-orange-500' };
    } else {
        return { text: `Due ${formatDate(dueDate)}`, color: 'text-gray-500' };
    }
}

function getQuickActionButton(complaint) {
    if (complaint.status === 'pending') {
        return `<button onclick="event.stopPropagation(); updateComplaintStatus('${complaint._id}', 'in-progress')" 
                class="bg-blue-500 text-white px-3 py-1 text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center">
                <i class="fas fa-play-circle mr-1"></i> Start Work
            </button>`;
    } else if (complaint.status === 'in-progress') {
        return `<button onclick="event.stopPropagation(); updateComplaintStatus('${complaint._id}', 'resolved')" 
                class="bg-green-500 text-white px-3 py-1 text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center">
                <i class="fas fa-check-circle mr-1"></i> Resolve
            </button>`;
    } else if (complaint.status === 'on-hold') {
        return `<button onclick="event.stopPropagation(); updateComplaintStatus('${complaint._id}', 'in-progress')" 
                class="bg-blue-500 text-white px-3 py-1 text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center">
                <i class="fas fa-play-circle mr-1"></i> Resume
            </button>`;
    }
    return '';
}

// Chat functions
async function loadChatMessages(complaintId) {
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/staff/issues/${complaintId}/chat`);
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading chat messages:', error);
        return [];
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    tabs.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', () => moveHighlight(tab));
        }
    });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        });
    }

    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            const notificationPanel = document.getElementById('notificationPanel');
            if (notificationPanel) {
                notificationPanel.classList.toggle('hidden');
            }
        });
    }

    const closeNotifications = document.getElementById('closeNotifications');
    if (closeNotifications) {
        closeNotifications.addEventListener('click', function() {
            const notificationPanel = document.getElementById('notificationPanel');
            if (notificationPanel) {
                notificationPanel.classList.add('hidden');
            }
        });
    }

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            const modal = document.getElementById('taskDetailModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    }

    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', function() {
            isGridView = false;
            this.classList.add('bg-blue-100', 'text-blue-600');
            if (gridViewBtn) {
                gridViewBtn.classList.remove('bg-blue-100', 'text-blue-600');
            }
            if (issuesContainer) {
                issuesContainer.classList.remove('md:grid', 'md:grid-cols-2', 'md:gap-4');
            }
            loadIssues(currentActiveTab);
        });
    }

    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            isGridView = true;
            this.classList.add('bg-blue-100', 'text-blue-600');
            if (listViewBtn) {
                listViewBtn.classList.remove('bg-blue-100', 'text-blue-600');
            }
            if (issuesContainer) {
                issuesContainer.classList.add('md:grid', 'md:grid-cols-2', 'md:gap-4');
            }
            loadIssues(currentActiveTab);
        });
    }

    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    document.addEventListener('click', function(event) {
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBtn = document.getElementById('notificationBtn');
        
        if (notificationPanel && notificationBtn && 
            !notificationPanel.contains(event.target) && !notificationBtn.contains(event.target)) {
            notificationPanel.classList.add('hidden');
        }
        
        const taskDetailModal = document.getElementById('taskDetailModal');
        if (taskDetailModal && event.target === taskDetailModal) {
            taskDetailModal.classList.add('hidden');
        }
    });
}

// Auto-refresh data every 30 seconds
function startAutoRefresh() {
    setInterval(async () => {
        try {
            await fetchStaffComplaints();
            updateStatistics();
            loadIssues(currentActiveTab);
        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }, 30000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize DOM elements
    initializeDOMElements();
    
    const staffToken = localStorage.getItem("staffToken");
    if (staffToken && !isTokenExpired(staffToken)) {
        initializeStaffDashboard();
    } else {
        handleTokenExpiration();
    }
});

// Add CSS for line-clamp utility if not present
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .border-l-red-500 { border-left-color: #EF4444; }
    .border-l-yellow-500 { border-left-color: #EAB308; }
    .border-l-green-500 { border-left-color: #22C55E; }
    .border-l-gray-500 { border-left-color: #6B7280; }
`;
document.head.appendChild(style);
// Add this debug function
function debugComplaints() {
    staffComplaints.forEach((complaint, index) => {
        console.log(`Complaint ${index}:`, {
            id: complaint._id,
            title: complaint.title,
            status: complaint.status,
            assignedTo: complaint.assignedTo,
            isAssignedToCurrentStaff: isAssignedToCurrentStaff(complaint)
        });
    });
    
    const assignedComplaints = staffComplaints.filter(c => 
        c.status === 'pending' && isAssignedToCurrentStaff(c)
    );
    console.log("Assigned complaints:", assignedComplaints);
}

// Call this in your browser console after page loads
window.debugComplaints = debugComplaints;