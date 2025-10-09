class ChartManager {
    constructor() {
        this.charts = new Map();
    }

    renderDepartmentChart(containerId, departmentData) {
        const canvas = document.getElementById(containerId);
        if (!canvas) {
            console.error(`Canvas element with id '${containerId}' not found`);
            return;
        }
        
        // Make sure it's a canvas element
        if (canvas.tagName !== 'CANVAS') {
            console.error(`Element with id '${containerId}' is not a canvas element`);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error(`Could not get 2D context for '${containerId}'`);
            return;
        }
        
        this.destroyChart(containerId);
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(departmentData).map(key => 
                    key.charAt(0).toUpperCase() + key.slice(1)
                ),
                datasets: [{
                    data: Object.values(departmentData),
                    backgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set(containerId, chart);
    }

    renderStatusChart(containerId, statusData) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        this.destroyChart(containerId);
        
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusData).map(key => 
                    key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                ),
                datasets: [{
                    data: Object.values(statusData),
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        this.charts.set(containerId, chart);
    }

    renderPriorityChart(containerId, priorityData) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        this.destroyChart(containerId);
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(priorityData).map(key => 
                    key.charAt(0).toUpperCase() + key.slice(1)
                ),
                datasets: [{
                    data: Object.values(priorityData),
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                },
                plugins: { legend: { display: false } }
            }
        });

        this.charts.set(containerId, chart);
    }

    renderTimelineChart(containerId, trends) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        this.destroyChart(containerId);
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.map(t => new Date(t.date).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Created',
                        data: trends.map(t => t.complaints),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Resolved',
                        data: trends.map(t => t.resolved),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        this.charts.set(containerId, chart);
    }

    renderMonthlyTrendChart(containerId, monthlyData) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        this.destroyChart(containerId);
        
        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(label => monthlyData[label]);
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(label => {
                    const [year, month] = label.split('-');
                    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Complaints',
                    data: data,
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderColor: '#4f46e5',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        this.charts.set(containerId, chart);
    }

    destroyChart(containerId) {
        if (this.charts.has(containerId)) {
            this.charts.get(containerId).destroy();
            this.charts.delete(containerId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach((chart, containerId) => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

window.ChartManager = ChartManager;