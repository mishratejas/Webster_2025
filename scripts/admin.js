console.log("ADMIN.JS LOADED - Starting initialization"); // Import Socket.IO client
const BASE_URL = "https://webster-2025.onrender.com";

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
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
  alert("Your session has expired. Please login again.");
  window.location.href = "index.html";
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
let chatRefreshIntervals = {}; // Add this at the top with other globals
let currentChatComplaintId = null;
let chatMessages = {};

// Initialize dashboard
async function initializeAdminDashboard() {
  try {
    updateAdminUI();
    await fetchStaffList();
    await fetchAllComplaints();
    initializeChatSocket();
    updateStatistics();
    setupEventListeners();

    const initialTab = document.getElementById("newTab");
    if (initialTab) {
      moveHighlight(initialTab);
    }
  } catch (error) {
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
    } else {
      throw new Error(data.message || "Failed to fetch staff list");
    }
  } catch (error) {
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
    } else {
      throw new Error(data.message || "Failed to fetch complaints");
    }
  } catch (error) {
    if (!error.message.includes("Token expired")) {
      showError("Failed to load complaints");
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
        <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
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
            ${complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
          </span>
        </div>
        
        <p class="text-gray-600 text-sm mb-3">${complaint.description}</p>
        
        <!-- Images Preview -->
        ${
          complaint.images && complaint.images.length > 0
            ? `
            <div class="mb-3">
              <div class="flex flex-wrap gap-2">
                ${complaint.images
                  .slice(0, 3)
                  .map((img, index) => {
                    let imageUrl = img;
                    if (!img.startsWith('http')) {
                      if (!img.startsWith('/')) {
                        imageUrl = `${BASE_URL}/uploads/${img}`;
                      } else {
                        imageUrl = `${BASE_URL}${img}`;
                      }
                    }
                    return `
                      <img src="${imageUrl}" 
                           alt="Issue image ${index + 1}" 
                           class="w-16 h-16 object-cover rounded cursor-pointer border"
                           onclick="openImageModal('${imageUrl}')"
                           onerror="this.style.display='none'">
                    `;
                  })
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
          <div class="flex items-center">
            <i class="fas fa-user mr-1 text-gray-400"></i>
            <span>${userName}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-calendar mr-1 text-gray-400"></i>
            <span>${formatDate(complaint.createdAt)}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-thumbs-up mr-1 text-gray-400"></i>
            <span>${complaint.voteCount || 0} votes</span>
          </div>
          <div class="px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize flex items-center">
            <i class="fas fa-tag mr-1 text-xs"></i>
            ${department}
          </div>
        </div>
        
        <!-- Admin Controls -->
        <div class="flex flex-wrap gap-2 items-center justify-between border-t pt-3">
          <div class="flex gap-2">
            <select onchange="updateComplaintField('${complaint._id}', 'status', this.value)" 
                    class="text-xs p-1 border rounded bg-gray-50">
              <option value="pending" ${complaint.status === "pending" ? "selected" : ""}>Pending</option>
              <option value="in-progress" ${complaint.status === "in-progress" ? "selected" : ""}>In Progress</option>
              <option value="resolved" ${complaint.status === "resolved" ? "selected" : ""}>Resolved</option>
              <option value="rejected" ${complaint.status === "rejected" ? "selected" : ""}>Rejected</option>
            </select>
            
            <select onchange="assignToStaff('${complaint._id}', this.value)" 
                    class="text-xs p-1 border rounded bg-gray-50">
              <option value="">Unassigned</option>
              ${staffList
                .map(
                  (staff) =>
                    `<option value="${staff._id}" ${
                      complaint.assignedTo?._id === staff._id ? "selected" : ""
                    }>
                      ${staff.name} (${staff.department || "General"})
                    </option>`
                )
                .join("")}
            </select>

            <select onchange="updateComplaintField('${complaint._id}', 'priority', this.value)" 
                    class="text-xs p-1 border rounded bg-gray-50">
              <option value="low" ${complaint.priority === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${complaint.priority === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${complaint.priority === "high" ? "selected" : ""}>High</option>
            </select>

            <select onchange="updateComplaintField('${complaint._id}', 'category', this.value)" 
                    class="text-xs p-1 border rounded bg-gray-50">
              <option value="road" ${complaint.category === "road" ? "selected" : ""}>Road</option>
              <option value="water" ${complaint.category === "water" ? "selected" : ""}>Water</option>
              <option value="electricity" ${complaint.category === "electricity" ? "selected" : ""}>Electricity</option>
              <option value="sanitation" ${complaint.category === "sanitation" ? "selected" : ""}>Sanitation</option>
              <option value="other" ${complaint.category === "other" ? "selected" : ""}>Other</option>
            </select>
          </div>
          
          <div class="flex gap-2">
            <button onclick="openIssueDetail('${complaint._id}')" 
                    class="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center">
              <i class="fas fa-comments mr-1"></i> Chat
            </button>
            <button onclick="addAdminNotePrompt('${complaint._id}')" 
                    class="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center">
              <i class="fas fa-sticky-note mr-1"></i> Note
            </button>
          </div>
        </div>

        <!-- Admin Notes Preview -->
        ${
          complaint.adminNotes
            ? `
            <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div class="flex items-start">
                <i class="fas fa-exclamation-circle text-yellow-500 mt-0.5 mr-2"></i>
                <div>
                  <strong class="text-yellow-800">Admin Note:</strong> 
                  <p class="text-yellow-700 mt-1">${complaint.adminNotes}</p>
                  ${
                    complaint.lastUpdated
                      ? `<p class="text-yellow-600 text-xs mt-1"><i class="fas fa-clock mr-1"></i>Updated: ${formatDate(complaint.lastUpdated)}</p>`
                      : ""
                  }
                </div>
              </div>
            </div>
          `
            : ""
        }
      </div>
    `;
    issuesContainer.innerHTML += complaintCard;
  });
}

// Image modal function
window.openImageModal = function(imageUrl) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl p-6 max-w-4xl w-full">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">Image Preview</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <img src="${imageUrl}" alt="Full size" class="w-full h-auto rounded-lg max-h-96 object-contain mb-4">
      <div class="flex gap-2 justify-center">
        <a href="${imageUrl}" download 
           class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center">
          <i class="fas fa-download mr-2"></i>Download
        </a>
        <button onclick="this.closest('.fixed').remove()" 
                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center">
          <i class="fas fa-times mr-2"></i>Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

let socket = null;

function initializeChatSocket() {
    socket = io(BASE_URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        withCredentials: true,          // ✅ send cookies/headers
        transports: ['websocket'],      // ✅ prefer WebSocket, avoid polling
    });

    socket.on('connect', () => {
        console.log('✅ Connected to chat server');
        
        // ✅ Join room using user ID or admin ID (whatever your system uses)
        const adminId = localStorage.getItem('adminId');
        if (adminId) {
            socket.emit('join', adminId);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from chat server');
    });

    socket.on('new_message', (message) => {
        if (message.complaintId === currentChatComplaintId) {
            addMessageToChat(message);
        }
        updateUnreadCounts();
    });

    socket.on('message_edited', (message) => {
        if (message.complaintId === currentChatComplaintId) {
            updateMessageInChat(message);
        }
    });

    socket.on('message_deleted', (data) => {
        if (data.conversationId.includes(currentChatComplaintId)) {
            removeMessageFromChat(data.messageId);
        }
    });

    socket.on('error', (error) => {
        console.error('Chat socket error:', error);
    });
}








// OPEN ISSUE DETAIL MODAL

async function openIssueDetail(complaintId) {
    const complaint = allComplaints.find(c => c._id === complaintId);
    if (!complaint) {
        showError("Complaint not found");
        return;
    }

    currentSelectedComplaint = complaint;
    currentChatComplaintId = complaintId;

    // Load chat messages before opening
    await loadChatMessages(complaintId);

    const modal = document.getElementById("issueModal");
    const modalContent = document.getElementById("modalContent");

    modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- LEFT SIDE (Issue Info) -->
            <div class="lg:col-span-1 space-y-4">
                <!-- Issue Details -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold mb-3 text-gray-800 flex items-center">
                        <i class="fas fa-info-circle mr-2 text-blue-500"></i>Issue Details
                    </h3>

                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" value="${complaint.title}"
                                   onchange="updateComplaintField('${complaint._id}', 'title', this.value)"
                                   class="w-full p-2 border rounded text-sm">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea onchange="updateComplaintField('${complaint._id}', 'description', this.value)"
                                      class="w-full p-2 border rounded text-sm" rows="3">${complaint.description}</textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select onchange="updateComplaintField('${complaint._id}', 'status', this.value)"
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="pending" ${complaint.status === "pending" ? "selected" : ""}>Pending</option>
                                    <option value="in-progress" ${complaint.status === "in-progress" ? "selected" : ""}>In Progress</option>
                                    <option value="resolved" ${complaint.status === "resolved" ? "selected" : ""}>Resolved</option>
                                    <option value="rejected" ${complaint.status === "rejected" ? "selected" : ""}>Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select onchange="updateComplaintField('${complaint._id}', 'priority', this.value)"
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="low" ${complaint.priority === "low" ? "selected" : ""}>Low</option>
                                    <option value="medium" ${complaint.priority === "medium" ? "selected" : ""}>Medium</option>
                                    <option value="high" ${complaint.priority === "high" ? "selected" : ""}>High</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select onchange="updateComplaintField('${complaint._id}', 'category', this.value)"
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="road" ${complaint.category === "road" ? "selected" : ""}>Road</option>
                                    <option value="water" ${complaint.category === "water" ? "selected" : ""}>Water</option>
                                    <option value="electricity" ${complaint.category === "electricity" ? "selected" : ""}>Electricity</option>
                                    <option value="sanitation" ${complaint.category === "sanitation" ? "selected" : ""}>Sanitation</option>
                                    <option value="other" ${complaint.category === "other" ? "selected" : ""}>Other</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select onchange="assignToStaff('${complaint._id}', this.value)"
                                        class="w-full p-2 border rounded text-sm">
                                    <option value="">Unassigned</option>
                                    ${staffList.map(staff => `
                                        <option value="${staff._id}" ${complaint.assignedTo?._id === staff._id ? "selected" : ""}>
                                            ${staff.name} (${staff.department || "General"})
                                        </option>
                                    `).join("")}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Images -->
                ${complaint.images?.length ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold mb-3 text-gray-800 flex items-center">
                            <i class="fas fa-images mr-2 text-purple-500"></i>Attached Images
                        </h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${complaint.images.map((img, i) => {
                                let imageUrl = img.startsWith('http') ? img :
                                    img.startsWith('/') ? `${BASE_URL}${img}` : `${BASE_URL}/uploads/${img}`;
                                return `
                                    <img src="${imageUrl}" alt="Image ${i + 1}"
                                         class="w-full h-24 object-cover rounded cursor-pointer border hover:scale-105 transition-transform"
                                         onclick="openImageModal('${imageUrl}')"
                                         onerror="this.style.display='none'">
                                `;
                            }).join("")}
                        </div>
                    </div>
                ` : ""}
            </div>

            <!-- RIGHT SIDE (Chat) -->
            <div class="lg:col-span-2">
                <div class="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-semibold text-gray-800 flex items-center">
                            <i class="fas fa-comments mr-2 text-blue-500"></i>Communication Chat
                        </h3>
                        <div class="flex gap-2">
                            <button onclick="markAsRead('${complaintId}')"
                                    class="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Mark Read</button>
                            <button onclick="refreshChat('${complaintId}')"
                                    class="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>

                    <div id="chatMessagesContainer" class="flex-1 bg-white rounded-lg p-4 mb-3 overflow-y-auto" style="max-height: 400px;">
                        ${renderChatMessages(complaintId)}
                    </div>

                    <div class="flex gap-2">
                        <input type="text" id="chatMessageInput"
                               placeholder="Type your message..."
                               class="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                               onkeypress="if(event.key === 'Enter') sendChatMessage('${complaintId}')">
                        <button onclick="sendChatMessage('${complaintId}')"
                                class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center">
                            <i class="fas fa-paper-plane mr-2"></i>Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = "flex";

    // Auto-refresh chat every 5 seconds
    startAutoRefreshChat(complaintId);
}


function startAutoRefreshChat(complaintId) {
    stopAutoRefreshChat(complaintId); // avoid duplicates
    chatRefreshIntervals[complaintId] = setInterval(async () => {
        await loadChatMessages(complaintId);
        refreshChatDisplay();
    }, 5000); // every 5 seconds
}

function stopAutoRefreshChat(complaintId) {
    if (chatRefreshIntervals[complaintId]) {
        clearInterval(chatRefreshIntervals[complaintId]);
        delete chatRefreshIntervals[complaintId];
    }
}


function renderChatMessages(complaintId) {
    const messages = chatMessages[complaintId] || [];
    console.log("📨 Rendering messages for complaint:", complaintId, messages);
    
    if (!messages.length) {
        return `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-comments text-3xl mb-2 text-gray-300"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
    }

    return messages.map(m => {
        // Safely handle message data
        const isAdmin = m.senderId?.role === 'admin' || m.senderModel === 'Admin' || m.sender === 'admin';
        const senderName = isAdmin ? 'You (Admin)' : (m.senderId?.name || m.senderName || 'Staff');
        const messageText = m.message || '';
        const timestamp = m.createdAt || m.testamp || new Date().toISOString();
        
        return `
            <div class="mb-4 p-3 rounded-lg ${isAdmin ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-semibold text-sm flex items-center">
                        <i class="fas ${isAdmin ? 'fa-user-shield text-blue-500' : 'fa-user text-green-500'} mr-1"></i>
                        ${escapeHtml(senderName)}
                    </span>
                    <span class="text-xs text-gray-500">${formatTime(timestamp)}</span>
                </div>
                <div class="text-sm">
                    ${escapeHtml(messageText)}
                    ${m.fileUrl ? `<br><a href="${m.fileUrl}" target="_blank" class="text-blue-500 text-xs mt-1 inline-block"><i class="fas fa-file"></i> Attachment</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function refreshChatDisplay() {
    const container = document.getElementById("chatMessagesContainer");
    if (!container) {
        console.log("❌ Chat container not found");
        return;
    }
    
    const messages = chatMessages[currentChatComplaintId] || [];
    console.log("🔄 Refreshing chat display with messages:", messages);
    
    try {
        container.innerHTML = messages.length ? renderChatMessages(currentChatComplaintId) : `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-comments text-3xl mb-2"></i>
                <p>No messages yet</p>
            </div>`;
        
        // Scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 1000);
    } catch (error) {
        console.error("❌ Error rendering chat:", error);
        container.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>Error loading messages</p>
            </div>`;
    }
}

// Call this in browser console: debugChat('your-complaint-id')

async function sendChatMessage(complaintId) {
    const input = document.getElementById("chatMessageInput");
    const message = input.value.trim();
    
    if (!message) {
        showError("Please enter a message");
        return;
    }

    const complaint = allComplaints.find(c => c._id === complaintId);
    const staffId = complaint?.assignedTo?._id;
    
    if (!staffId) {
        showError("Please assign this complaint to a staff member first");
        return;
    }

    try {
        console.log("📤 Sending message to staff:", staffId);
        
        // Use the admin-specific endpoint
        const response = await fetchWithAuth(`${BASE_URL}/api/admin/issues/${complaintId}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                receiverId: staffId,
                message: message
            })
        });

        if (response.ok) {
            input.value = "";
            await loadChatMessages(complaintId); // Reload messages
            refreshChatDisplay();
            showSuccess("Message sent successfully");
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to send message");
        }
    } catch (error) {
        console.error("❌ Send message error:", error);
        showError("Failed to send message: " + error.message);
    }
}

async function loadChatMessages(complaintId) {
    try {
        console.log("📥 Loading messages for complaint:", complaintId);
        
        // Use the admin-specific endpoint
        const response = await fetchWithAuth(`${BASE_URL}/api/admin/issues/${complaintId}/chat`);
        
        if (response.ok) {
            const data = await response.json();
            chatMessages[complaintId] = data.data || [];
            console.log("✅ Messages loaded:", chatMessages[complaintId]);
        } else {
            console.error("❌ Failed to load messages:", response.status);
            chatMessages[complaintId] = [];
        }
    } catch (error) {
        console.error("❌ Error loading chat messages:", error);
        chatMessages[complaintId] = [];
    }
}

// =============================
// 🛠️ UTILITY FUNCTIONS
// =============================

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format time for chat messages
function formatTime(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '';
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'No date';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

// =============================
// 🛠️ HELPER FUNCTIONS
// =============================
async function markAsRead(complaintId) {
    try {
        // Implementation depends on your backend
        showSuccess("Messages marked as read");
    } catch (error) {
        console.error("Error marking as read:", error);
    }
}

async function refreshChat(complaintId) {
    await loadChatMessages(complaintId);
    refreshChatDisplay();
    showSuccess("Chat refreshed");
}

// Close modal and cleanup
function closeIssueModal() {
    const modal = document.getElementById("issueModal");
    if (modal) {
        modal.style.display = "none";
    }
    
    // Stop auto-refresh
    if (currentChatComplaintId) {
        stopAutoRefreshChat(currentChatComplaintId);
    }
    
    currentSelectedComplaint = null;
    currentChatComplaintId = null;
}



// DATABASE UPDATE FUNCTIONS
async function updateComplaintField(complaintId, field, value) {
  try {
    const updateData = {
      [field]: value,
      updatedAt: new Date().toISOString(),
    };

    if (field === "comments" || field === "adminNotes") {
      updateData.comments = value;
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      showSuccess(`${field} updated successfully!`);
      await fetchAllComplaints();
      updateStatistics();
      loadIssues(currentActiveTab);
    } else {
      throw new Error(data.message || "Failed to update complaint");
    }
  } catch (error) {
    if (!error.message.includes("Token expired")) {
      showError(`Failed to update ${field}`);
    }
  }
}

async function assignToStaff(complaintId, staffId) {
  try {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
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
    if (!error.message.includes("Token expired")) {
      showError("Failed to assign staff");
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

      const response = await fetchWithAuth(
        `${BASE_URL}/api/admin/issues/${complaintId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
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
      if (!error.message.includes("Token expired")) {
        showError("Failed to save note");
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
    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center";
  notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center";
  notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
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

  document.getElementById("issueModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("issueModal")) {
      closeModal();
    }
  });

  // Add refresh button
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "Refresh Data";
  refreshButton.className =
    "fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-blue-600 transition-colors flex items-center";
  refreshButton.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Data';
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
window.openIssueDetail = openIssueDetail;
window.refreshChat = refreshChat;
window.markAsRead = markAsRead;
window.closeIssueModal = closeIssueModal;
window.toggleCompactView = toggleCompactView;
window.filterByDepartment = filterByDepartment;
window.refreshData = refreshData;
window.logout = logout;

// Start when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken && !isTokenExpired(adminToken)) {
    initializeAdminDashboard();
  }
});
// Add this function to handle navigation
function navigateToPage(page) {
    console.log('Navigating to:', page);
    window.location.href = page;
}

// Update all navigation links
function setupNavigation() {
    // Update analytics link
    const analyticsLinks = document.querySelectorAll('a');
    analyticsLinks.forEach(link => {
        if (link.innerHTML.includes('fa-chart-pie')) {
            link.onclick = () => navigateToPage('analytics.html');
        }
        if (link.innerHTML.includes('fa-chart-line') && link.parentElement.parentElement.querySelector('.fa-chart-pie')) {
            link.onclick = () => navigateToPage('admin.html');
        }
    });
}

// Call this in your initialize function
async function initializeAdminDashboard() {
    try {
        updateAdminUI();
        await fetchStaffList();
        await fetchAllComplaints();
        updateStatistics();
        setupEventListeners();
        setupNavigation(); // ADD THIS LINE

        const initialTab = document.getElementById("newTab");
        if (initialTab) {
            moveHighlight(initialTab);
        }
    } catch (error) {
        if (error.message.includes("401") || error.message.includes("expired")) {
            handleTokenExpiration();
        } else {
            showError("Failed to initialize dashboard: " + error.message);
        }
    }
}
