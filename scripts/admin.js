console.log("ADMIN.JS LOADED - Starting initialization");

// Check for admin token
const adminToken = localStorage.getItem("adminToken"); // Changed variable name

console.log("Token check:", {
    token: adminToken ? "EXISTS" : "NULL",
    tokenLength: adminToken ? adminToken.length : 0,
    localStorageKeys: Object.keys(localStorage)
});

if (!adminToken) {
    console.log("NO ADMIN TOKEN - Redirecting to index.html");
    alert("Please login as admin first");
    window.location.href = "index.html";
} else {
    console.log("ADMIN TOKEN VERIFIED - Loading dashboard");
}

const BASE_URL = "http://localhost:3000";

// DOM Elements with null checks - using different variable names
const adminTabs = [ // Changed from 'tabs'
    document.getElementById('newTab'),
    document.getElementById('assignedTab'),
    document.getElementById('inProgressTab'),
    document.getElementById('onHoldTab'),
    document.getElementById('closedTab')
].filter(tab => tab !== null);

const issuesContainer = document.getElementById('issuesContainer');
const issueModal = document.getElementById('issueModal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const floatingAdminActionBtn = document.getElementById('floatingAdminActionBtn');
const listViewBtn = document.getElementById('listViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const notificationBtn = document.getElementById('notificationBtn');

console.log("DOM Elements loaded:", {
    tabs: adminTabs.length,
    issuesContainer: !!issuesContainer,
    issueModal: !!issueModal,
    modalContent: !!modalContent
});

let currentActiveTab = 'New (Triage)';
let currentView = 'list';
let staffList = [];

// ----------- UTILITY FUNCTIONS ------------
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
        case 'high': return 'issue-priority-high';
        case 'medium': return 'issue-priority-medium';
        case 'low': return 'issue-priority-low';
        default: return '';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
    
    setTimeout(() => notification.remove(), 3000);
}

// ------------ API FUNCTIONS ------------
async function fetchStaffList() {
    try {
        console.log("Fetching staff list...");
        const res = await fetch(`${BASE_URL}/api/admin/issues/staff`, {
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log("Staff list response:", data);
        
        if (data.success) {
            staffList = data.data || [];
            console.log(`Loaded ${staffList.length} staff members`);
            return staffList;
        } else {
            throw new Error(data.message || 'Failed to fetch staff list');
        }
    } catch (error) {
        console.error("Error fetching staff list:", error);
        showError('Failed to load staff list');
        return [];
    }
}

async function fetchIssues(status) {
    try {
        console.log(`Fetching issues for status: ${status}`);
        
        let url = `${BASE_URL}/api/admin/issues`;
        if (status) {
            url += `?status=${encodeURIComponent(status)}`;
        }
        
        const res = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log(`Issues response for ${status}:`, data);
        
        if (data.success) {
            console.log(`Loaded ${data.data?.length || 0} issues`);
            return data.data || [];
        } else {
            throw new Error(data.message || 'Failed to fetch issues');
        }
    } catch (error) {
        console.error("Error fetching issues:", error);
        showError('Failed to load issues');
        return [];
    }
}

async function updateIssue(issueId, updateData) {
    try {
        console.log(`Updating issue ${issueId}:`, updateData);
        
        const res = await fetch(`${BASE_URL}/api/admin/issues/${issueId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log("Update response:", data);
        
        return data;
    } catch (error) {
        console.error("Error updating issue:", error);
        throw error;
    }
}

// ------------ DISPLAY FUNCTIONS ------------
function displayIssues(issues) {
    if (!issuesContainer) {
        console.error("issuesContainer not found!");
        return;
    }

    issuesContainer.innerHTML = '';

    if (issues.length === 0) {
        issuesContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-8 text-center">
                <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No Issues Found</h3>
                <p class="text-gray-500">There are no issues in this category at the moment.</p>
            </div>
        `;
        return;
    }

    issues.forEach(issue => {
        const priorityColor = getPriorityColor(issue.priority);
        const priorityBorderClass = getPriorityBorderClass(issue.priority);
        const assignedStaffName = issue.assignedTo?.name || 'Unassigned';
        const userName = issue.user?.name || 'Anonymous';
        const userEmail = issue.user?.email || 'No email';

        const issueCard = `
            <div class="bg-white rounded-xl shadow-md p-4 issue-card-admin flex flex-col md:flex-row gap-4 cursor-pointer border-l-4 ${priorityBorderClass}">
                <div class="flex-grow" onclick="openIssueDetail('${issue._id}')">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-gray-800">${issue.title}</h3>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-full font-semibold text-xs ${priorityColor}">
                                ${issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1) || 'Medium'}
                            </span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2">${issue.description}</p>
                    <div class="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
                        <div><i class="fas fa-user mr-1"></i> ${userName}</div>
                        <div><i class="fas fa-envelope mr-1"></i> ${userEmail}</div>
                        <div><i class="fas fa-calendar mr-1"></i> ${formatDate(issue.createdAt)}</div>
                        <div><i class="fas fa-thumbs-up mr-1"></i> ${issue.voteCount || 0} votes</div>
                    </div>
                </div>
                
                <div class="w-full md:w-64 flex-shrink-0 md:border-l md:pl-4 space-y-2">
                    <div class="flex items-center text-xs text-gray-500 justify-between">
                        <span>ID: ${issue._id?.substring(0, 8) || 'N/A'}...</span>
                        <span class="flex items-center">
                            <i class="fas fa-paperclip mr-1"></i> ${issue.images?.length || 0}
                            <i class="fas fa-comment ml-2 mr-1"></i> ${issue.comments?.length || 0}
                        </span>
                    </div>
                    
                    <div class="mb-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Assign/Reassign:</label>
                        <select onchange="handleAdminAssignment('${issue._id}', this.value)" 
                                class="w-full p-2 border rounded-md text-sm bg-gray-50">
                            <option value="">Unassigned</option>
                            ${staffList.map(staff => 
                                `<option value="${staff._id}" ${issue.assignedTo?._id === staff._id ? 'selected' : ''}>
                                    ${staff.name} (${staff.staffId})
                                </option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="flex justify-between items-center border-t pt-2">
                        <div class="flex gap-2">
                            <button onclick="handleQuickAction('${issue._id}', 'in-progress')" 
                                    class="text-xs text-blue-500 hover:text-blue-700">
                                <i class="fas fa-play-circle mr-1"></i> Start
                            </button>
                            <button onclick="handleQuickAction('${issue._id}', 'resolved')" 
                                    class="text-xs text-green-500 hover:text-green-700">
                                <i class="fas fa-check-circle mr-1"></i> Resolve
                            </button>
                        </div>
                        <span class="text-xs text-gray-400">
                            ${assignedStaffName}
                        </span>
                    </div>
                </div>
            </div>
        `;
        issuesContainer.innerHTML += issueCard;
    });
}

// ------------ EVENT HANDLERS ------------
async function handleAdminAssignment(issueId, staffId) {
    try {
        console.log(`Assigning issue ${issueId} to staff ${staffId}`);
        
        const updateData = { assignedTo: staffId };
        if (staffId) {
            updateData.status = 'in-progress';
        }
        
        const result = await updateIssue(issueId, updateData);
        
        if (result.success) {
            showSuccess(`Issue assigned successfully`);
            loadIssues(currentActiveTab);
        }
    } catch (error) {
        showError('Failed to assign issue');
    }
}

async function handleQuickAction(issueId, action) {
    try {
        console.log(`Quick action ${action} on issue ${issueId}`);
        
        const updateData = { status: action };
        const result = await updateIssue(issueId, updateData);
        
        if (result.success) {
            showSuccess(`Issue status updated to ${action}`);
            loadIssues(currentActiveTab);
        }
    } catch (error) {
        showError('Failed to update issue status');
    }
}

function openIssueDetail(issueId) {
    console.log(`Opening details for issue ${issueId}`);
    alert(`Issue details for ${issueId} - Implement modal functionality`);
    // Implement detailed modal view here
}

// ------------ TAB MANAGEMENT ------------
function moveHighlight(tab) {
    if (!tab) return;
    
    adminTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentActiveTab = tab.textContent.trim();
    console.log(`Switching to tab: ${currentActiveTab}`);
    loadIssues(currentActiveTab);
}

async function loadIssues(status) {
    console.log(`Loading issues for: ${status}`);
    const issues = await fetchIssues(status);
    displayIssues(issues);
}

// ------------ INITIALIZATION ------------
async function initializeAdminDashboard() {
    console.log("Initializing admin dashboard...");
    
    try {
        // Initialize staff list first
        await fetchStaffList();
        
        // Set up event listeners
        adminTabs.forEach(tab => {
            if (tab) {
                tab.addEventListener('click', () => moveHighlight(tab));
            }
        });
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                if (issueModal) issueModal.style.display = 'none';
            });
        }
        
        if (issueModal) {
            issueModal.addEventListener('click', (e) => {
                if (e.target === issueModal) {
                    issueModal.style.display = 'none';
                }
            });
        }
        
        if (floatingAdminActionBtn) {
            floatingAdminActionBtn.addEventListener('click', () => {
                alert('Admin bulk actions panel - To be implemented');
            });
        }
        
        // Load initial data
        const initialTab = document.getElementById('newTab');
        if (initialTab) {
            moveHighlight(initialTab);
        } else {
            console.error("Initial tab not found!");
        }
        
        console.log("Admin dashboard initialized successfully!");
        
    } catch (error) {
        console.error("Failed to initialize admin dashboard:", error);
        showError('Failed to initialize dashboard');
    }
}

// Start the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - Starting admin dashboard");
    initializeAdminDashboard();
});

// Make functions globally available for HTML onclick events
window.handleAdminAssignment = handleAdminAssignment;
window.handleQuickAction = handleQuickAction;
window.openIssueDetail = openIssueDetail;