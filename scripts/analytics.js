class AnalyticsApp {
    constructor({ 
        authManager, 
        chartManager, 
        heatmapManager, 
        exportManager 
    } = {}) {
        this.authManager = authManager || new window.AuthManager();
        this.chartManager = chartManager || new window.ChartManager();
        this.heatmapManager = heatmapManager || new window.HeatmapManager();
        this.exportManager = exportManager || new window.ExportManager(this.authManager);
        
        // Create authenticated API instance
        this.api = window.createAuthApi(this.authManager);
        
        this.analyticsData = {
            complaints: [],
            dateRange: 30
        };
    }

    async initialize() {
        try {
            console.log('Analytics initializing...');
            console.log('Token in localStorage:', localStorage.getItem('adminToken'));
            console.log('User data in localStorage:', localStorage.getItem('adminData'));
            
            // Check all localStorage items for debugging
            console.log('All localStorage keys:', Object.keys(localStorage));
            
            // Initialize authentication
            const authValid = this.authManager.initialize();
            console.log('Auth valid:', authValid);
            
            if (!authValid) {
                console.error('Authentication failed - would redirect to login');
                // TEMPORARILY COMMENT OUT THE RETURN TO SEE IF PAGE LOADS
                // return;
            }

            // Set up event listeners
            this.initializeEventListeners();
            
            // Load initial data
            await this.loadAnalyticsData();
            
            console.log('Analytics dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize analytics dashboard:', error);
            // Don't show notification to avoid redirect
        }
    }

    initializeEventListeners() {
        // Date range change
        const dateRangeSelect = document.getElementById('dateRange');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                this.analyticsData.dateRange = e.target.value;
                this.updateAnalytics();
            });
        }

        // Heatmap department filter
        const heatmapDepartment = document.getElementById('heatmapDepartment');
        if (heatmapDepartment) {
            heatmapDepartment.addEventListener('change', (e) => {
                this.heatmapManager.filterByDepartment(e.target.value);
            });
        }

        // Refresh heatmap
        const refreshHeatmapBtn = document.getElementById('refreshHeatmapBtn');
        if (refreshHeatmapBtn) {
            refreshHeatmapBtn.addEventListener('click', () => {
                this.updateHeatmap();
            });
        }

        // Test heatmap data
        const testHeatmapBtn = document.getElementById('testHeatmapBtn');
        if (testHeatmapBtn) {
            testHeatmapBtn.addEventListener('click', () => {
                this.heatmapManager.renderHeatmap('heatmapContainer', this.heatmapManager.getSampleHeatmapData());
            });
        }

        // Clear heatmap
        const clearHeatmapBtn = document.getElementById('clearHeatmapBtn');
        if (clearHeatmapBtn) {
            clearHeatmapBtn.addEventListener('click', () => {
                this.heatmapManager.renderHeatmap('heatmapContainer', []);
            });
        }

        // Export buttons
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportManager.exportToPDF(this.analyticsData.dateRange);
            });
        }

        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportManager.exportToCSV(this.analyticsData.dateRange);
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authManager.logout();
            });
        }

        // Global error handler for uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.authManager.showNotification('An unexpected error occurred', 'error');
        });

        // Handle offline/online events
        window.addEventListener('online', () => {
            this.authManager.showNotification('Connection restored', 'success');
            this.updateAnalytics();
        });

        window.addEventListener('offline', () => {
            this.authManager.showNotification('You are currently offline', 'warning');
        });

        // Handle window resize for responsive charts
        window.addEventListener('resize', () => {
            this.debounce(() => {
                this.renderCharts();
            }, 250)();
        });
    }

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadAnalyticsData() {
        try {
            this.showLoadingState();
            
            const response = await this.api.get(
                `${this.authManager.BASE_URL}/api/admin/analytics?period=${this.analyticsData.dateRange}`
            );

            if (response && response.success) {
                this.analyticsData.complaints = response.data || [];
                this.updateStatistics();
                this.renderCharts();
                this.updateHeatmap();
                this.updateStaffPerformance();
                this.updateDetailedAnalytics();
                this.updateQuickStats();
                
                this.authManager.showNotification('Analytics data loaded successfully', 'success');
            } else {
                throw new Error(response?.message || "Failed to fetch analytics data");
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.authManager.showNotification('Failed to load analytics data', 'error');
        } finally {
            this.hideLoadingState();
        }
    }

    updateStatistics() {
        const analyticsData = this.analyticsData.complaints;

        if (!analyticsData || !analyticsData.summary) {
            this.resetStatistics();
            return;
        }
        
        const {
            totalComplaints = 0,
            resolutionRate = 0,
            avgResolutionTime = 0,
            satisfactionScore = 0
        } = analyticsData.summary;

        // Update DOM elements
        this.updateElementText('totalComplaints', totalComplaints.toLocaleString());
        this.updateElementText('resolutionRate', `${resolutionRate}%`);
        this.updateElementText('avgResolutionTime', `${avgResolutionTime} days`);
        this.updateElementText('satisfactionScore', `${satisfactionScore}%`);
        
        this.updateTrendIndicators();
    }

    resetStatistics() {
        this.updateElementText('totalComplaints', '0');
        this.updateElementText('resolutionRate', '0%');
        this.updateElementText('avgResolutionTime', '0 days');
        this.updateElementText('satisfactionScore', '0%');
        
        // Reset trends
        ['complaintsTrend', 'resolutionTrend', 'resolutionTimeTrend', 'satisfactionTrend']
            .forEach(id => this.updateElementHTML(id, ''));
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateElementHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    updateTrendIndicators() {
        // Mock trend data - in production, compare with previous period
        const trends = {
            complaints: Math.random() > 0.5 ? 'up' : 'down',
            resolution: Math.random() > 0.3 ? 'up' : 'down',
            resolutionTime: Math.random() > 0.5 ? 'down' : 'up',
            satisfaction: Math.random() > 0.4 ? 'up' : 'down'
        };
        
        const trendIcons = {
            up: '<i class="fas fa-arrow-up trend-up"></i>',
            down: '<i class="fas fa-arrow-down trend-down"></i>',
            neutral: '<i class="fas fa-minus trend-neutral"></i>'
        };
        
        const trendValues = {
            complaints: `${Math.floor(Math.random() * 15)}%`,
            resolution: `${Math.floor(Math.random() * 8)}%`,
            resolutionTime: `${Math.floor(Math.random() * 5)}%`,
            satisfaction: `${Math.floor(Math.random() * 6)}%`
        };
        
        this.updateElementHTML("complaintsTrend", 
            `${trendIcons[trends.complaints]} ${trendValues.complaints} from previous period`);
        this.updateElementHTML("resolutionTrend", 
            `${trendIcons[trends.resolution]} ${trendValues.resolution} from previous period`);
        this.updateElementHTML("resolutionTimeTrend", 
            `${trendIcons[trends.resolutionTime]} ${trendValues.resolutionTime} from previous period`);
        this.updateElementHTML("satisfactionTrend", 
            `${trendIcons[trends.satisfaction]} ${trendValues.satisfaction} from previous period`);
    }

    renderCharts() {
        const complaints = this.analyticsData.complaints;
        
        if (!complaints || !complaints.distributions) {
            this.showNoDataMessage();
            return;
        }
        
        const { distributions, trends } = complaints;

        // Department chart
        if (distributions.departments && Object.keys(distributions.departments).length > 0) {
            this.chartManager.renderDepartmentChart('departmentChart', distributions.departments);
        } else {
            this.showChartNoData('departmentChart');
        }
        
        // Status chart
        if (distributions.status && Object.keys(distributions.status).length > 0) {
            this.chartManager.renderStatusChart('statusChart', distributions.status);
        } else {
            this.showChartNoData('statusChart');
        }
        
        // Priority chart
        if (distributions.priorities && Object.keys(distributions.priorities).length > 0) {
            this.chartManager.renderPriorityChart('priorityChart', distributions.priorities);
        } else {
            this.showChartNoData('priorityChart');
        }
        
        // Timeline chart
        if (trends?.daily && trends.daily.length > 0) {
            this.chartManager.renderTimelineChart('timelineChart', trends.daily);
        } else {
            this.showChartNoData('timelineChart');
        }
        
        // Monthly trends
        if (trends?.monthly && Object.keys(trends.monthly).length > 0) {
            this.chartManager.renderMonthlyTrendChart('monthlyTrendChart', trends.monthly);
        } else {
            this.showChartNoData('monthlyTrendChart');
        }
    }

    showChartNoData(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    <div class="text-center">
                        <i class="fas fa-chart-bar text-4xl mb-2 text-gray-300"></i>
                        <p>No data available</p>
                    </div>
                </div>
            `;
        }
    }

    showNoDataMessage() {
        const chartContainers = [
            'departmentChart', 
            'statusChart', 
            'priorityChart', 
            'timelineChart', 
            'monthlyTrendChart'
        ];
        
        chartContainers.forEach(containerId => {
            this.showChartNoData(containerId);
        });
    }

    async updateHeatmap() {
        const departmentFilter = document.getElementById('heatmapDepartment')?.value || 'all';
        
        try {
            console.log('Fetching heatmap data for department:', departmentFilter);
            
            const response = await this.api.get(
                `${this.authManager.BASE_URL}/api/admin/analytics/heatmap?department=${departmentFilter}&period=${this.analyticsData.dateRange}`
            );
            
            if (response && response.success) {
                console.log('Heatmap API response:', response.data);
                this.heatmapManager.renderHeatmap('heatmapContainer', response.data.heatmapData);
            } else {
                console.log('No heatmap data from API, showing empty state');
                this.heatmapManager.renderHeatmap('heatmapContainer', []);
            }
        } catch (error) {
            console.error('Error loading heatmap data:', error);
            this.heatmapManager.renderHeatmap('heatmapContainer', []);
            this.authManager.showNotification('Failed to load heatmap data', 'error');
        }
    }

    async updateStaffPerformance() {
        try {
            const response = await this.api.get(
                `${this.authManager.BASE_URL}/api/admin/analytics/staff-performance`
            );
            
            if (response && response.success) {
                this.renderStaffPerformance(response.data);
            } else {
                this.renderStaffPerformance([]);
            }
        } catch (error) {
            console.error("Failed to load staff performance:", error);
            this.renderStaffPerformance([]);
        }
    }

    renderStaffPerformance(staffData) {
        const container = document.getElementById('staffPerformance');
        
        if (!container) return;
        
        if (!staffData || staffData.length === 0) {
            container.innerHTML = `
                <div class="loading-center">
                    <i class="fas fa-users text-3xl mb-2 text-gray-300"></i>
                    <p>No staff performance data available</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        staffData.forEach(staff => {
            const performanceColor = staff.performanceScore >= 90 ? 'text-green-600' : 
                                   staff.performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600';
            
            html += `
                <div class="staff-performance-item">
                    <div class="staff-performance-header">
                        <div>
                            <h4 class="staff-name">${staff.name}</h4>
                            <p class="staff-department">${staff.department}</p>
                        </div>
                        <div class="text-right">
                            <span class="font-bold text-blue-600">${staff.resolutionRate}%</span>
                            <p class="text-xs text-gray-600">Resolution Rate</p>
                        </div>
                    </div>
                    
                    <div class="staff-stats">
                        <div class="staff-stat-row">
                            <span>Assigned:</span>
                            <span>${staff.totalAssigned}</span>
                        </div>
                        <div class="staff-stat-row">
                            <span>Resolved:</span>
                            <span>${staff.resolved}</span>
                        </div>
                        <div class="staff-stat-row">
                            <span>Avg. Time:</span>
                            <span>${staff.avgResolutionTime} days</span>
                        </div>
                        <div class="staff-stat-row">
                            <span>Performance:</span>
                            <span class="${performanceColor}">${staff.performanceScore}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateDetailedAnalytics() {
        // Mock detailed analytics data - replace with actual data from backend
        const analyticsData = {
            peakHours: '2:00 PM - 4:00 PM',
            activeArea: 'Downtown District',
            avgResponseTime: '2.3 hours',
            reopenedIssues: '3.2%'
        };
        
        Object.entries(analyticsData).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateQuickStats() {
        const complaints = this.analyticsData.complaints;
        const activeComplaints = (complaints.summary?.pendingComplaints || 0) + 
                               (complaints.summary?.inProgressComplaints || 0);
        
        // Mock resolved today count - replace with actual data
        const resolvedToday = Math.floor(Math.random() * 10) + 1;
        
        this.updateElementText('quickActive', activeComplaints);
        this.updateElementText('quickResolved', resolvedToday);
    }

    updateAnalytics() {
        this.loadAnalyticsData();
    }

    showLoadingState() {
        // Add loading indicators if needed
        const loadingElements = document.querySelectorAll('.chart-loading, .heatmap-loading');
        loadingElements.forEach(element => {
            if (element) {
                element.style.display = 'flex';
            }
        });
        
        // Show loading in metrics
        ['totalComplaints', 'resolutionRate', 'avgResolutionTime', 'satisfactionScore']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = '...';
                }
            });
    }

    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.chart-loading, .heatmap-loading');
        loadingElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // Method to refresh all data
    refreshAll() {
        this.loadAnalyticsData();
    }

    // Method to export current dashboard state
    exportDashboard() {
        const date = new Date().toISOString().split('T')[0];
        const fileName = `analytics-dashboard-${date}.json`;
        
        const exportData = {
            exportedAt: new Date().toISOString(),
            dateRange: this.analyticsData.dateRange,
            data: this.analyticsData.complaints
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.authManager.showNotification('Dashboard data exported successfully', 'success');
    }

    destroy() {
        // Clean up resources
        this.chartManager.destroyAllCharts();
        this.heatmapManager.destroy();
        
        // Remove event listeners
        const elements = [
            'dateRange',
            'heatmapDepartment', 
            'refreshHeatmapBtn',
            'testHeatmapBtn',
            'clearHeatmapBtn',
            'exportPdfBtn',
            'exportCsvBtn',
            'logoutBtn'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });

        // Remove global event listeners
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const analyticsApp = new AnalyticsApp();
    await analyticsApp.initialize();
    
    // Make analyticsApp available globally for debugging and console access
    window.analyticsApp = analyticsApp;
    
    // Add global refresh method
    window.refreshAnalytics = () => analyticsApp.refreshAll();
    window.exportDashboardData = () => analyticsApp.exportDashboard();
    
    console.log('Analytics App Global Methods:');
    console.log('- refreshAnalytics(): Refresh all data');
    console.log('- exportDashboardData(): Export current dashboard state');
    console.log('- analyticsApp: Full analytics app instance');
});

// Handle page visibility changes to refresh data when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.analyticsApp) {
        // Refresh data when page becomes visible after 2 seconds
        setTimeout(() => {
            window.analyticsApp.refreshAll();
        }, 2000);
    }
});