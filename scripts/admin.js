console.log("ADMIN.JS LOADED - Starting initialization");

const BASE_URL = "http://localhost:3000";

// Function to check if token is expired
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
}

// Function to handle token expiration
function handleTokenExpiration() {
  console.log("Token expired, redirecting to login...");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
  alert("Your session has expired. Please login again.");
  window.location.href = "index.html";
}

// Check token on load
const adminToken = localStorage.getItem("adminToken");

if (!adminToken || isTokenExpired(adminToken)) {
  handleTokenExpiration();
} else {
  console.log("Admin Token: Valid");
  // Continue with initialization
}

// Global variables
let staffList = [];
let allComplaints = [];
let currentStats = {
  total: 0,
  pending: 0,
  inProgress: 0,
  resolved: 0,
  rejected: 0,
};
let currentActiveTab = "New (Triage)";
let currentDepartmentFilter = "all";
let isCompactView = false;
let currentSelectedComplaint = null;
let chatMessages = {};

// Initialize dashboard
async function initializeAdminDashboard() {
  console.log("Initializing admin dashboard...");

  try {
    updateAdminUI();
    await fetchStaffList();
    await fetchAllComplaints();
    updateStatistics();
    setupEventListeners();

    const initialTab = document.getElementById("newTab");
    if (initialTab) {
      moveHighlight(initialTab);
    }

    console.log("Admin dashboard initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize admin dashboard:", error);
    if (error.message.includes("401") || error.message.includes("expired")) {
      handleTokenExpiration();
    } else {
      showError("Failed to initialize dashboard: " + error.message);
    }
  }
}

// Update fetch functions to handle token expiration
async function fetchWithAuth(url, options = {}) {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken || isTokenExpired(adminToken)) {
    handleTokenExpiration();
    throw new Error("Token expired");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    handleTokenExpiration();
    throw new Error("Token expired");
  }

  return response;
}

// Update Admin UI
function updateAdminUI() {
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  if (adminData.name) {
    const adminNameElement = document.getElementById("adminName");
    if (adminNameElement) {
      adminNameElement.textContent = adminData.name;
    }
  }
}

// Fetch Staff List
async function fetchStaffList() {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/admin/issues/staff`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.success) {
      staffList = data.data || [];
      console.log(`Staff list fetched: ${staffList.length} staff members`);
    } else {
      throw new Error(data.message || "Failed to fetch staff list");
    }
  } catch (error) {
    console.error("Error fetching staff list:", error);
    if (!error.message.includes("Token expired")) {
      showError("Failed to load staff list");
    }
    throw error;
  }
}

// Fetch All Complaints
async function fetchAllComplaints() {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/admin/issues`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.success) {
      allComplaints = data.data || [];
      console.log(`Complaints fetched: ${allComplaints.length} complaints`);
    } else {
      throw new Error(data.message || "Failed to fetch complaints");
    }
  } catch (error) {
    console.error("Error fetching complaints:", error);
    if (!error.message.includes("Token expired")) {
      showError("Failed to load complaints: " + error.message);
    }
    throw error;
  }
}

// Update Statistics
function updateStatistics() {
  try {
    const complaints = allComplaints;

    currentStats.total = complaints.length;
    currentStats.pending = complaints.filter(
      (c) => c.status === "pending"
    ).length;
    currentStats.inProgress = complaints.filter(
      (c) => c.status === "in-progress"
    ).length;
    currentStats.resolved = complaints.filter(
      (c) => c.status === "resolved"
    ).length;
    currentStats.rejected = complaints.filter(
      (c) => c.status === "rejected"
    ).length;

    document.getElementById("newCount").textContent = currentStats.pending;
    document.getElementById("activeCount").textContent =
      currentStats.inProgress;

    const totalProcessed = currentStats.resolved + currentStats.rejected;
    const complianceRate =
      currentStats.total > 0
        ? Math.round((totalProcessed / currentStats.total) * 100)
        : 0;
    document.getElementById(
      "complianceRate"
    ).textContent = `${complianceRate}%`;

    const urgentCount = complaints.filter(
      (c) => c.priority === "high" && c.status === "pending"
    ).length;
    document.getElementById("urgentCount").textContent = urgentCount;
  } catch (error) {
    console.error("Error updating statistics:", error);
  }
}

// Display Complaints
function displayComplaints(complaints) {
  const issuesContainer = document.getElementById("issuesContainer");
  if (!issuesContainer) return;

  issuesContainer.innerHTML = "";

  if (complaints.length === 0) {
    issuesContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-8 text-center">
                <div class="text-4xl text-gray-400 mb-4">📭</div>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No Issues Found</h3>
                <p class="text-gray-500">There are no issues in this category at the moment.</p>
            </div>
        `;
    return;
  }

  complaints.forEach((complaint) => {
    const priorityColor = getPriorityColor(complaint.priority);
    const priorityBorderClass = getPriorityBorderClass(complaint.priority);
    const assignedStaffName = complaint.assignedTo?.name || "Unassigned";
    const userName = complaint.user?.name || "Anonymous";
    const department = complaint.category || "other";

    const complaintCard = `
            <div class="bg-white rounded-xl shadow-md p-4 mb-3 border-l-4 ${priorityBorderClass}">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-lg text-gray-800 cursor-pointer hover:text-blue-600" 
                        onclick="openIssueDetail('${complaint._id}')">
                        ${complaint.title}
                    </h3>
                    <span class="px-3 py-1 rounded-full font-semibold text-xs ${priorityColor}">
                        ${
                          complaint.priority.charAt(0).toUpperCase() +
                          complaint.priority.slice(1)
                        }
                    </span>
                </div>
                
                <p class="text-gray-600 text-sm mb-3">${
                  complaint.description
                }</p>
                
                <!-- Images Preview -->
                ${
                  complaint.images && complaint.images.length > 0
                    ? `
                    <div class="mb-3">
                        <div class="flex flex-wrap gap-2">
                            ${complaint.images
                              .slice(0, 3)
                              .map(
                                (img, index) => `
                                <img src="${BASE_URL}${img}" 
                                     alt="Issue image ${index + 1}" 
                                     class="w-16 h-16 object-cover rounded cursor-pointer border"
                                     onclick="openImageModal('${BASE_URL}${img}')">
                            `
                              )
                              .join("")}
                            ${
                              complaint.images.length > 3
                                ? `
                                <div class="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-600 text-xs rounded border">
                                    +${complaint.images.length - 3}
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                `
                    : ""
                }
                
                <div class="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                    <div><span class="font-semibold">User:</span> ${userName}</div>
                    <div><span class="font-semibold">Date:</span> ${formatDate(
                      complaint.createdAt
                    )}</div>
                    <div><span class="font-semibold">Votes:</span> ${
                      complaint.voteCount || 0
                    }</div>
                    <div class="px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">${department}</div>
                </div>
                
                <!-- Admin Controls -->
                <div class="flex flex-wrap gap-2 items-center justify-between border-t pt-3">
                    <div class="flex gap-2">
                        <select onchange="updateComplaintField('${
                          complaint._id
                        }', 'status', this.value)" 
                                class="text-xs p-1 border rounded bg-gray-50">
                            <option value="pending" ${
                              complaint.status === "pending" ? "selected" : ""
                            }>Pending</option>
                            <option value="in-progress" ${
                              complaint.status === "in-progress"
                                ? "selected"
                                : ""
                            }>In Progress</option>
                            <option value="resolved" ${
                              complaint.status === "resolved" ? "selected" : ""
                            }>Resolved</option>
                            <option value="rejected" ${
                              complaint.status === "rejected" ? "selected" : ""
                            }>Rejected</option>
                        </select>
                        
                        <select onchange="assignToStaff('${
                          complaint._id
                        }', this.value)" 
                                class="text-xs p-1 border rounded bg-gray-50">
                            <option value="">Unassigned</option>
                            ${staffList
                              .map(
                                (staff) =>
                                  `<option value="${staff._id}" ${
                                    complaint.assignedTo?._id === staff._id
                                      ? "selected"
                                      : ""
                                  }>
                                    ${staff.name} (${
                                    staff.department || "General"
                                  })
                                </option>`
                              )
                              .join("")}
                        </select>

                        <select onchange="updateComplaintField('${
                          complaint._id
                        }', 'priority', this.value)" 
                                class="text-xs p-1 border rounded bg-gray-50">
                            <option value="low" ${
                              complaint.priority === "low" ? "selected" : ""
                            }>Low</option>
                            <option value="medium" ${
                              complaint.priority === "medium" ? "selected" : ""
                            }>Medium</option>
                            <option value="high" ${
                              complaint.priority === "high" ? "selected" : ""
                            }>High</option>
                        </select>

                        <select onchange="updateComplaintField('${
                          complaint._id
                        }', 'category', this.value)" 
                                class="text-xs p-1 border rounded bg-gray-50">
                            <option value="road" ${
                              complaint.category === "road" ? "selected" : ""
                            }>Road</option>
                            <option value="water" ${
                              complaint.category === "water" ? "selected" : ""
                            }>Water</option>
                            <option value="electricity" ${
                              complaint.category === "electricity"
                                ? "selected"
                                : ""
                            }>Electricity</option>
                            <option value="sanitation" ${
                              complaint.category === "sanitation"
                                ? "selected"
                                : ""
                            }>Sanitation</option>
                            <option value="other" ${
                              complaint.category === "other" ? "selected" : ""
                            }>Other</option>
                        </select>
                    </div>
                    
                    <div class="flex gap-2">
                        <button onclick="openIssueDetail('${complaint._id}')" 
                                class="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                            Open Chat
                        </button>
                        <button onclick="addAdminNotePrompt('${
                          complaint._id
                        }')" 
                                class="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                            Add Note
                        </button>
                    </div>
                </div>

                <!-- Admin Notes Preview -->
                ${
                  complaint.adminNotes
                    ? `
                    <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <strong>Admin Note:</strong> ${complaint.adminNotes}
                        ${
                          complaint.lastUpdated
                            ? `<br><em>Updated: ${formatDate(
                                complaint.lastUpdated
                              )}</em>`
                            : ""
                        }
                    </div>
                `
                    : ""
                }
            </div>
        `;
    issuesContainer.innerHTML += complaintCard;
  });
}

// OPEN ISSUE DETAIL MODAL WITH CHAT
async function openIssueDetail(complaintId) {
  const complaint = allComplaints.find((c) => c._id === complaintId);
  if (!complaint) {
    showError("Complaint not found");
    return;
  }

  currentSelectedComplaint = complaint;

  // Load chat messages for this complaint
  await loadChatMessages(complaintId);

  const modal = document.getElementById("issueModal");
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column - Issue Details & Controls -->
            <div class="lg:col-span-1 space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold mb-3 text-gray-800">Issue Details</h3>
                    
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" 
                                   value="${complaint.title}" 
                                   onchange="updateComplaintField('${
                                     complaint._id
                                   }', 'title', this.value)"
                                   class="w-full p-2 border rounded text-sm">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea onchange="updateComplaintField('${
                              complaint._id
                            }', 'description', this.value)"
                                      class="w-full p-2 border rounded text-sm" rows="3">${
                                        complaint.description
                                      }</textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select onchange="updateComplaintField('${
                                  complaint._id
                                }', 'status', this.value)" 
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="pending" ${
                                      complaint.status === "pending"
                                        ? "selected"
                                        : ""
                                    }>Pending</option>
                                    <option value="in-progress" ${
                                      complaint.status === "in-progress"
                                        ? "selected"
                                        : ""
                                    }>In Progress</option>
                                    <option value="resolved" ${
                                      complaint.status === "resolved"
                                        ? "selected"
                                        : ""
                                    }>Resolved</option>
                                    <option value="rejected" ${
                                      complaint.status === "rejected"
                                        ? "selected"
                                        : ""
                                    }>Rejected</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select onchange="updateComplaintField('${
                                  complaint._id
                                }', 'priority', this.value)" 
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="low" ${
                                      complaint.priority === "low"
                                        ? "selected"
                                        : ""
                                    }>Low</option>
                                    <option value="medium" ${
                                      complaint.priority === "medium"
                                        ? "selected"
                                        : ""
                                    }>Medium</option>
                                    <option value="high" ${
                                      complaint.priority === "high"
                                        ? "selected"
                                        : ""
                                    }>High</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select onchange="updateComplaintField('${
                                  complaint._id
                                }', 'category', this.value)" 
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="road" ${
                                      complaint.category === "road"
                                        ? "selected"
                                        : ""
                                    }>Road</option>
                                    <option value="water" ${
                                      complaint.category === "water"
                                        ? "selected"
                                        : ""
                                    }>Water</option>
                                    <option value="electricity" ${
                                      complaint.category === "electricity"
                                        ? "selected"
                                        : ""
                                    }>Electricity</option>
                                    <option value="sanitation" ${
                                      complaint.category === "sanitation"
                                        ? "selected"
                                        : ""
                                    }>Sanitation</option>
                                    <option value="other" ${
                                      complaint.category === "other"
                                        ? "selected"
                                        : ""
                                    }>Other</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select onchange="assignToStaff('${
                                  complaint._id
                                }', this.value)" 
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="">Unassigned</option>
                                    ${staffList
                                      .map(
                                        (staff) =>
                                          `<option value="${staff._id}" ${
                                            complaint.assignedTo?._id ===
                                            staff._id
                                              ? "selected"
                                              : ""
                                          }>
                                            ${staff.name} (${
                                            staff.department || "General"
                                          })
                                        </option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Admin Notes Section -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold mb-3 text-gray-800">Admin Notes</h3>
                    <textarea id="adminNoteInput" 
                              placeholder="Add internal notes here..." 
                              class="w-full p-2 border rounded text-sm mb-2" 
                              rows="4">${complaint.adminNotes || ""}</textarea>
                    <button onclick="addAdminNote('${complaint._id}')" 
                            class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm">
                        Save Notes
                    </button>
                </div>

                <!-- Images Section -->
                ${
                  complaint.images && complaint.images.length > 0
                    ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold mb-3 text-gray-800">Attached Images</h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${complaint.images
                              .map(
                                (img, index) => `
                                <img src="${BASE_URL}${img}" 
                                     alt="Issue image ${index + 1}" 
                                     class="w-full h-24 object-cover rounded cursor-pointer border"
                                     onclick="openImageModal('${BASE_URL}${img}')">
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
            
            <!-- Right Column - Chat -->
            <div class="lg:col-span-2">
                <div class="bg-gray-50 p-4 rounded-lg h-full">
                    <h3 class="font-semibold mb-3 text-gray-800">Communication Chat</h3>
                    
                    <div class="chat-container bg-white rounded-lg p-4 mb-3" style="height: 400px; overflow-y: auto;">
                        ${
                          chatMessages[complaintId] &&
                          chatMessages[complaintId].length > 0
                            ? chatMessages[complaintId]
                                .map(
                                  (msg) => `
                                <div class="chat-message ${
                                  msg.sender === "admin" ? "admin" : "staff"
                                } mb-3">
                                    <div class="flex justify-between items-start mb-1">
                                        <span class="font-semibold text-sm">
                                            ${
                                              msg.sender === "admin"
                                                ? "Admin"
                                                : msg.staffName || "Staff"
                                            }
                                        </span>
                                        <span class="text-xs text-gray-500">${formatTime(
                                          msg.timestamp
                                        )}</span>
                                    </div>
                                    <div class="text-sm">${msg.message}</div>
                                </div>
                            `
                                )
                                .join("")
                            : `
                            <div class="text-center text-gray-500 py-8">
                                <div class="text-3xl mb-2">💬</div>
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        `
                        }
                    </div>
                    
                    <div class="flex gap-2">
                        <input type="text" 
                               id="chatMessageInput" 
                               placeholder="Type your message..." 
                               class="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                               onkeypress="if(event.key === 'Enter') sendChatMessage('${
                                 complaint._id
                               }')">
                        <button onclick="sendChatMessage('${complaint._id}')" 
                                class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  modal.style.display = "flex";

  // Scroll chat to bottom
  setTimeout(() => {
    const chatContainer = modalContent.querySelector(".chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, 100);
}

// CHAT FUNCTIONS
async function loadChatMessages(complaintId) {
  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/admin/issues/${complaintId}/chat`
    );

    if (response.ok) {
      const data = await response.json();
      chatMessages[complaintId] = data.data || [];
    } else {
      chatMessages[complaintId] = [];
    }
  } catch (error) {
    console.error("Error loading chat messages:", error);
    chatMessages[complaintId] = [];
  }
}

async function sendChatMessage(complaintId) {
  const messageInput = document.getElementById("chatMessageInput");
  const message = messageInput.value.trim();

  if (!message) return;

  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/admin/issues/${complaintId}/chat`,
      {
        method: "POST",
        body: JSON.stringify({
          message: message,
          sender: "admin",
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (response.ok) {
      messageInput.value = "";
      await loadChatMessages(complaintId);
      openIssueDetail(complaintId);
    } else {
      throw new Error("Failed to send message");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    showError("Failed to send message");
  }
}

// DATABASE UPDATE FUNCTIONS - FIXED FOR BACKEND INTEGRATION
async function updateComplaintField(complaintId, field, value) {
  try {
    console.log(`Updating ${field} to ${value} for complaint ${complaintId}`);

    const updateData = {
      [field]: value,
      updatedAt: new Date().toISOString(),
    };

    // Special handling for different field types
    if (field === "comments" || field === "adminNotes") {
      updateData.comments = value; // This matches your backend expectation
    }

    if (field === "status" && value === "rejected") {
      const reason = prompt("Please enter rejection reason:");
      if (reason) {
        updateData.rejectionReason = reason;
      }
    }

    const response = await fetchWithAuth(
      `${BASE_URL}/api/admin/issues/${complaintId}`,
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      }
    );

    console.log("Update response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update failed:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Update response data:", data);

    if (data.success) {
      showSuccess(`${field} updated successfully!`);
      // Refresh data from server to get updated complaint
      await fetchAllComplaints();
      updateStatistics();
      loadIssues(currentActiveTab);
    } else {
      throw new Error(data.message || "Failed to update complaint");
    }
  } catch (error) {
    console.error("Error updating complaint:", error);
    if (!error.message.includes("Token expired")) {
      showError(`Failed to update ${field}: ${error.message}`);
    }
  }
}

async function assignToStaff(complaintId, staffId) {
  try {
    console.log(`Assigning complaint ${complaintId} to staff ${staffId}`);

    const updateData = {
      assignedTo: staffId,
      status: staffId ? "in-progress" : "pending",
      updatedAt: new Date().toISOString(),
    };

    const response = await fetchWithAuth(
      `${BASE_URL}/api/admin/issues/${complaintId}`,
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      }
    );

    console.log("Assignment response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Assignment failed:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Assignment response data:", data);

    if (data.success) {
      const staff = staffList.find((s) => s._id === staffId);
      showSuccess(staff ? `Assigned to ${staff.name}` : "Unassigned");
      await fetchAllComplaints();
      updateStatistics();
      loadIssues(currentActiveTab);
    } else {
      throw new Error(data.message || "Failed to assign staff");
    }
  } catch (error) {
    console.error("Error assigning staff:", error);
    if (!error.message.includes("Token expired")) {
      showError("Failed to assign staff: " + error.message);
    }
  }
}

async function addAdminNote(complaintId) {
  const noteInput = document.getElementById("adminNoteInput");
  const note = noteInput ? noteInput.value.trim() : prompt("Enter admin note:");

  if (note && note.trim()) {
    try {
      const updateData = {
        comments: `[ADMIN NOTE]: ${note}`,
        updatedAt: new Date().toISOString(),
      };

      console.log("Adding admin note:", updateData);

      const response = await fetchWithAuth(
        `${BASE_URL}/api/admin/issues/${complaintId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      console.log("Note response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Note failed:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Note response data:", data);

      if (data.success) {
        showSuccess("Admin note saved!");
        await fetchAllComplaints();
        loadIssues(currentActiveTab);

        if (noteInput) {
          noteInput.value = "";
        }
      } else {
        throw new Error(data.message || "Failed to save note");
      }
    } catch (error) {
      console.error("Error saving admin note:", error);
      if (!error.message.includes("Token expired")) {
        showError("Failed to save note: " + error.message);
      }
    }
  }
}

function addAdminNotePrompt(complaintId) {
  const note = prompt("Enter admin note:");
  if (note && note.trim()) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = `<textarea id="adminNoteInput">${note}</textarea>`;
    document.body.appendChild(tempDiv);

    addAdminNote(complaintId);

    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 100);
  }
}

// Load Issues with Filtering
function loadIssues(status) {
  let filteredComplaints = [];

  if (status === "New (Triage)") {
    filteredComplaints = allComplaints.filter((c) => c.status === "pending");
  } else if (status === "Assigned") {
    filteredComplaints = allComplaints.filter(
      (c) => c.status === "in-progress" && c.assignedTo
    );
  } else if (status === "In-Progress") {
    filteredComplaints = allComplaints.filter(
      (c) => c.status === "in-progress"
    );
  } else if (status === "Resolved (Audit)") {
    filteredComplaints = allComplaints.filter((c) => c.status === "resolved");
  } else {
    filteredComplaints = allComplaints;
  }

  // Apply department filter
  if (currentDepartmentFilter !== "all") {
    filteredComplaints = filteredComplaints.filter(
      (complaint) => complaint.category === currentDepartmentFilter
    );
  }

  displayComplaints(filteredComplaints);
}

// Tab Management
function moveHighlight(tab) {
  const adminTabs = [
    document.getElementById("newTab"),
    document.getElementById("assignedTab"),
    document.getElementById("inProgressTab"),
    document.getElementById("onHoldTab"),
    document.getElementById("closedTab"),
  ].filter((t) => t !== null);

  adminTabs.forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  currentActiveTab = tab.textContent.trim();
  loadIssues(currentActiveTab);
}

// Utility Functions
function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "text-red-500 bg-red-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "low":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-500 bg-gray-100";
  }
}

function getPriorityBorderClass(priority) {
  switch (priority) {
    case "high":
      return "border-red-500";
    case "medium":
      return "border-yellow-500";
    case "low":
      return "border-green-500";
    default:
      return "border-gray-500";
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function openImageModal(imageUrl) {
  const modal = document.getElementById("issueModal");
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = `
        <div class="text-center">
            <img src="${imageUrl}" alt="Full size" class="max-w-full max-h-96 mx-auto rounded-lg mb-4">
            <div class="flex gap-2 justify-center">
                <a href="${imageUrl}" download 
                   class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Download
                </a>
                <button onclick="closeModal()" 
                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                    Close
                </button>
            </div>
        </div>
    `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("issueModal").style.display = "none";
  currentSelectedComplaint = null;
}

function toggleCompactView() {
  isCompactView = !isCompactView;
  const button = document.getElementById("compactViewBtn");
  button.textContent = isCompactView ? "Expand" : "Compact";
  loadIssues(currentActiveTab);
}

function filterByDepartment() {
  currentDepartmentFilter = document.getElementById("departmentFilter").value;
  loadIssues(currentActiveTab);
}

async function refreshData() {
  await fetchAllComplaints();
  updateStatistics();
  loadIssues(currentActiveTab);
}

function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
  window.location.href = "index.html";
}

// Setup Event Listeners
function setupEventListeners() {
  const adminTabs = [
    document.getElementById("newTab"),
    document.getElementById("assignedTab"),
    document.getElementById("inProgressTab"),
    document.getElementById("onHoldTab"),
    document.getElementById("closedTab"),
  ].filter((tab) => tab !== null);

  adminTabs.forEach((tab) => {
    tab.addEventListener("click", () => moveHighlight(tab));
  });

  // Close modal when clicking outside
  document.getElementById("issueModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("issueModal")) {
      closeModal();
    }
  });

  // Add refresh button
  // Add refresh button in a better position
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "Refresh Data";
  refreshButton.className =
    "fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-blue-600 transition-colors";
  refreshButton.onclick = refreshData;
  document.body.appendChild(refreshButton);
}

// Make functions globally available
window.updateComplaintField = updateComplaintField;
window.assignToStaff = assignToStaff;
window.addAdminNote = addAdminNote;
window.addAdminNotePrompt = addAdminNotePrompt;
window.openIssueDetail = openIssueDetail;
window.closeModal = closeModal;
window.openImageModal = openImageModal;
window.sendChatMessage = sendChatMessage;
window.toggleCompactView = toggleCompactView;
window.filterByDepartment = filterByDepartment;
window.refreshData = refreshData;
window.logout = logout;

// Start when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded - Starting admin dashboard");
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken && !isTokenExpired(adminToken)) {
    initializeAdminDashboard();
  }
});
