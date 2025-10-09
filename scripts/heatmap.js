class HeatmapManager {
    constructor() {
        this.tooltip = document.getElementById('heatmapTooltip');
        this.tooltipContent = document.getElementById('tooltipContent');
        this.modal = document.getElementById('heatmapModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalTitle = document.getElementById('modalTitle');
        this.currentData = [];
        this.init();
    }

    init() {
        console.log('HeatmapManager initialized');
        this.setupEventListeners();
        this.renderLegend();
    }

    setupEventListeners() {
        // Close modal when clicking X or outside
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Test data button
        document.getElementById('testHeatmapBtn').addEventListener('click', () => {
            this.renderHeatmap('heatmapContainer', this.getSampleHeatmapData());
        });

        // Clear heatmap button
        document.getElementById('clearHeatmapBtn').addEventListener('click', () => {
            this.renderHeatmap('heatmapContainer', []);
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    renderHeatmap(containerId, heatmapData) {
        console.log('Rendering heatmap with data:', heatmapData);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Heatmap container '${containerId}' not found`);
            return;
        }
        
        container.innerHTML = '';
        this.currentData = heatmapData || [];
        
        // Use sample data if no real data provided
        if (!heatmapData || heatmapData.length === 0) {
            console.log('No heatmap data provided');
            this.showNoDataMessage(container);
            this.updateStats(0, 0, 0);
            return;
        }
        
        console.log(`Rendering ${heatmapData.length} heatmap points`);
        
        heatmapData.forEach((point, index) => {
            const pointElement = this.createHeatmapPoint(point, index);
            container.appendChild(pointElement);
        });
        
        this.calculateAndUpdateStats(heatmapData);
    }

    createHeatmapPoint(point, index) {
        const pointElement = document.createElement('div');
        pointElement.className = 'heatmap-point';
        pointElement.setAttribute('data-cluster-index', index);
        
        // Calculate position (assuming coordinates are normalized -1 to 1)
        const x = 50 + (point.center.lng * 40); // Convert to percentage
        const y = 50 + (point.center.lat * 40); // Convert to percentage
        
        pointElement.style.left = `${x}%`;
        pointElement.style.top = `${y}%`;
        
        // Size based on complaint count (logarithmic scale for better visualization)
        const baseSize = 20;
        const scaleFactor = 8;
        const size = Math.max(baseSize, Math.min(80, baseSize + (Math.log(point.count) * scaleFactor)));
        pointElement.style.width = `${size}px`;
        pointElement.style.height = `${size}px`;
        
        // Color and opacity based on intensity and priority
        pointElement.style.backgroundColor = point.color || this.getColorByIntensity(point.intensity);
        pointElement.style.opacity = point.intensity || 0.7;
        
        // Add pulse animation for high priority clusters
        if (point.count > 5 || this.hasHighPriorityComplaints(point)) {
            pointElement.classList.add('pulse');
        }
        
        // Add hover and click events
        pointElement.addEventListener('mouseenter', (e) => this.showTooltip(e, point));
        pointElement.addEventListener('mouseleave', () => this.hideTooltip());
        pointElement.addEventListener('click', () => this.showClusterDetails(point));
        
        return pointElement;
    }

    getColorByIntensity(intensity) {
        if (intensity > 0.8) return 'rgba(239, 68, 68, 0.8)'; // Red for high intensity
        if (intensity > 0.5) return 'rgba(245, 158, 11, 0.7)'; // Orange for medium
        return 'rgba(59, 130, 246, 0.6)'; // Blue for low
    }

    hasHighPriorityComplaints(point) {
        return point.complaints.some(complaint => complaint.priority === 'high');
    }

    showNoDataMessage(container) {
        container.innerHTML = `
            <div class="heatmap-loading">
                <i class="fas fa-map-marked-alt text-5xl mb-4 text-gray-300"></i>
                <h3 class="text-xl font-semibold mb-3 text-gray-600">No Geographic Data Available</h3>
                <p class="text-gray-500 mb-4 max-w-md">
                    The heatmap displays complaint clusters based on geographic location data.
                    Currently, there are no complaints with location coordinates to display.
                </p>
                <div class="text-sm text-gray-400 space-y-1">
                    <p><i class="fas fa-info-circle mr-2"></i>Heatmap requires complaints with latitude/longitude data</p>
                    <p><i class="fas fa-bolt mr-2"></i>Click "Test Data" to see a demo heatmap</p>
                </div>
            </div>
        `;
    }

    showTooltip(event, point) {
        if (!this.tooltip || !this.tooltipContent) return;
        
        const categories = this.getCategoryBreakdown(point.complaints);
        const priorities = this.getPriorityBreakdown(point.complaints);
        
        this.tooltipContent.innerHTML = `
            <div class="font-semibold text-blue-600 border-b pb-2 mb-2 text-base">CLUSTER OVERVIEW</div>
            <div class="mb-3">
                <div class="text-lg font-bold text-gray-800">${point.count} complaints</div>
                <div class="text-sm text-gray-600">in this area</div>
            </div>
            
            <div class="mb-3">
                <div class="font-semibold text-sm mb-1">Categories:</div>
                <div class="flex flex-wrap gap-1">${categories.html}</div>
            </div>
            
            <div class="mb-3">
                <div class="font-semibold text-sm mb-1">Priority:</div>
                <div>
                    ${priorities.high > 0 ? `<span class="priority-high">High: ${priorities.high}</span> ` : ''}
                    ${priorities.medium > 0 ? `<span class="priority-medium">Medium: ${priorities.medium}</span> ` : ''}
                    ${priorities.low > 0 ? `<span class="priority-low">Low: ${priorities.low}</span>` : ''}
                </div>
            </div>
            
            <div class="text-xs text-gray-500 border-t pt-2">
                <div>Intensity: <strong>${(point.intensity * 100).toFixed(0)}%</strong></div>
                <div><i class="fas fa-mouse-pointer mr-1"></i>Click for details</div>
            </div>
        `;
        
        // Position tooltip
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const x = event.pageX + 15;
        const y = event.pageY + 15;
        
        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const finalX = x + tooltipWidth > viewportWidth ? viewportWidth - tooltipWidth - 10 : x;
        const finalY = y + tooltipHeight > viewportHeight ? viewportHeight - tooltipHeight - 10 : y;
        
        this.tooltip.style.left = finalX + 'px';
        this.tooltip.style.top = finalY + 'px';
        this.tooltip.style.display = 'block';
    }

    getCategoryBreakdown(complaints) {
        const categories = complaints.reduce((acc, complaint) => {
            const category = complaint.category || 'other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        
        const html = Object.entries(categories)
            .map(([category, count]) => `<span class="category-tag">${category}: ${count}</span>`)
            .join('');
            
        return { html, categories };
    }

    getPriorityBreakdown(complaints) {
        return complaints.reduce((acc, complaint) => {
            const priority = complaint.priority || 'medium';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, { high: 0, medium: 0, low: 0 });
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    showClusterDetails(cluster) {
        const categories = this.getCategoryBreakdown(cluster.complaints);
        const priorities = this.getPriorityBreakdown(cluster.complaints);
        
        this.modalTitle.textContent = `Cluster Details - ${cluster.count} Complaints`;
        
        const modalHtml = `
            <div class="cluster-summary">
                <h4>Cluster Summary</h4>
                <p><strong>Location:</strong> Latitude ${cluster.center.lat.toFixed(4)}, Longitude ${cluster.center.lng.toFixed(4)}</p>
                <p><strong>Intensity:</strong> ${(cluster.intensity * 100).toFixed(1)}%</p>
                
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="value">${cluster.count}</span>
                        <span class="label">Total</span>
                    </div>
                    <div class="summary-stat">
                        <span class="value">${priorities.high}</span>
                        <span class="label">High Priority</span>
                    </div>
                    <div class="summary-stat">
                        <span class="value">${Object.keys(categories.categories).length}</span>
                        <span class="label">Categories</span>
                    </div>
                </div>
            </div>
            
            <h4 class="mb-3">Complaints in this Cluster</h4>
            <div class="complaints-list">
                ${cluster.complaints.map((complaint, index) => `
                    <div class="complaint-item">
                        <div class="complaint-header">
                            <h5 class="complaint-title">${complaint.title}</h5>
                            <span class="complaint-priority priority-${complaint.priority}">
                                ${complaint.priority.toUpperCase()}
                            </span>
                        </div>
                        <div class="complaint-meta">
                            <span class="complaint-category">${complaint.category}</span>
                            <span class="complaint-date">${complaint.date || 'No date'}</span>
                        </div>
                        ${complaint.description ? `<p class="complaint-description mt-2 text-sm text-gray-600">${complaint.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        this.modalBody.innerHTML = modalHtml;
        this.showModal();
    }

    showModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    calculateAndUpdateStats(heatmapData) {
        const totalPoints = heatmapData.length;
        const totalComplaints = heatmapData.reduce((sum, point) => sum + point.count, 0);
        const highPriorityCount = heatmapData.reduce((sum, point) => {
            return sum + point.complaints.filter(c => c.priority === 'high').length;
        }, 0);
        
        this.updateStats(totalPoints, totalComplaints, highPriorityCount);
    }

    updateStats(points, complaints, highPriority) {
        document.getElementById('pointsCount').textContent = points;
        document.getElementById('complaintsCount').textContent = complaints;
        document.getElementById('highPriorityCount').textContent = highPriority;
    }

    renderLegend() {
        const container = document.getElementById('heatmapContainer');
        if (!container) return;
        
        const legendHtml = `
            <div class="heatmap-legend">
                <div class="legend-item">
                    <div class="legend-color legend-high"></div>
                    <span>High Intensity</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-medium"></div>
                    <span>Medium Intensity</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-low"></div>
                    <span>Low Intensity</span>
                </div>
            </div>
        `;
        
        // Add legend to the container or nearby
        const statsElement = document.getElementById('heatmapStats');
        if (statsElement) {
            statsElement.insertAdjacentHTML('afterend', legendHtml);
        }
    }

    // Comprehensive Sample Data
    getSampleHeatmapData() {
        return [
            {
                center: { lat: 0.15, lng: 0.25 },
                count: 8,
                intensity: 0.9,
                color: 'rgba(239, 68, 68, 0.8)',
                complaints: [
                    { 
                        title: "Major power outage in downtown area", 
                        category: "technical", 
                        priority: "high",
                        description: "Complete power failure affecting 500+ residents",
                        date: "2024-01-15"
                    },
                    { 
                        title: "Traffic signal system failure", 
                        category: "infrastructure", 
                        priority: "high",
                        date: "2024-01-15"
                    },
                    { 
                        title: "Street light maintenance required", 
                        category: "infrastructure", 
                        priority: "medium",
                        date: "2024-01-14"
                    }
                ]
            },
            {
                center: { lat: -0.12, lng: -0.08 },
                count: 5,
                intensity: 0.7,
                color: 'rgba(245, 158, 11, 0.7)',
                complaints: [
                    { 
                        title: "Water pipeline leakage", 
                        category: "utilities", 
                        priority: "high",
                        description: "Major water leak causing road damage",
                        date: "2024-01-14"
                    },
                    { 
                        title: "Sewage system overflow", 
                        category: "sanitation", 
                        priority: "high",
                        date: "2024-01-13"
                    }
                ]
            },
            {
                center: { lat: 0.35, lng: -0.15 },
                count: 12,
                intensity: 0.95,
                color: 'rgba(220, 38, 38, 0.9)',
                complaints: [
                    { 
                        title: "Bridge structural damage", 
                        category: "infrastructure", 
                        priority: "high",
                        description: "Critical structural issues detected",
                        date: "2024-01-16"
                    },
                    { 
                        title: "Road collapse emergency", 
                        category: "infrastructure", 
                        priority: "high",
                        date: "2024-01-16"
                    },
                    { 
                        title: "Flooding in residential area", 
                        category: "environment", 
                        priority: "high",
                        date: "2024-01-15"
                    }
                ]
            },
            {
                center: { lat: -0.25, lng: 0.35 },
                count: 3,
                intensity: 0.5,
                color: 'rgba(59, 130, 246, 0.6)',
                complaints: [
                    { 
                        title: "Park maintenance required", 
                        category: "public spaces", 
                        priority: "low",
                        date: "2024-01-13"
                    },
                    { 
                        title: "Garbage collection delayed", 
                        category: "sanitation", 
                        priority: "medium",
                        date: "2024-01-12"
                    }
                ]
            },
            {
                center: { lat: 0.08, lng: -0.3 },
                count: 6,
                intensity: 0.75,
                color: 'rgba(245, 158, 11, 0.75)',
                complaints: [
                    { 
                        title: "Internet service disruption", 
                        category: "technical", 
                        priority: "high",
                        description: "Fiber optic cable damage",
                        date: "2024-01-14"
                    },
                    { 
                        title: "Mobile network issues", 
                        category: "technical", 
                        priority: "medium",
                        date: "2024-01-14"
                    }
                ]
            }
        ];
    }

    // Method to update heatmap with real data from API
    updateWithApiData(apiData) {
        if (apiData && apiData.heatmapData) {
            this.renderHeatmap('heatmapContainer', apiData.heatmapData);
        } else {
            this.renderHeatmap('heatmapContainer', []);
        }
    }

    // Method to filter heatmap by department
    filterByDepartment(department) {
        if (department === 'all') {
            this.renderHeatmap('heatmapContainer', this.currentData);
        } else {
            const filteredData = this.currentData.filter(point => 
                point.complaints.some(complaint => 
                    complaint.category === department
                )
            );
            this.renderHeatmap('heatmapContainer', filteredData);
        }
    }

    // Destroy method for cleanup
    destroy() {
        this.hideTooltip();
        this.hideModal();
        // Remove event listeners
        document.getElementById('closeModal').removeEventListener('click', this.hideModal);
        this.modal.removeEventListener('click', this.hideModal);
        document.removeEventListener('keydown', this.handleEscape);
    }
}

// Make available globally
window.HeatmapManager = HeatmapManager;