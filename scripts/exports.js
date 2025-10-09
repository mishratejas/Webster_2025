class ExportManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.BASE_URL = window.location.origin;
    }

    async exportToPDF(dateRange) {
        try {
            this.showNotification("Generating PDF report...", "info");
            console.log('PDF Export started for period:', dateRange);
            
            const response = await this.authManager.fetchWithAuth(
                `${this.BASE_URL}/api/admin/analytics/export?format=pdf&period=${dateRange}`
            );
            
            console.log('PDF Export response status:', response.status);
            
            if (response.ok) {
                const blob = await response.blob();
                console.log('PDF blob size:', blob.size);
                
                if (blob.size === 0) {
                    throw new Error('PDF file is empty');
                }
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `resolvex-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showNotification("PDF report downloaded successfully!", "success");
            } else {
                const errorText = await response.text();
                console.error('PDF export failed with status:', response.status, 'Error:', errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error("PDF export error:", error);
            this.showNotification(`Failed to generate PDF: ${error.message}`, "error");
            
            // Fallback: Generate client-side PDF if server fails
            if (error.message.includes('404') || error.message.includes('500')) {
                this.generateClientSidePDF(dateRange);
            }
        }
    }

    async exportToCSV(dateRange) {
        try {
            this.showNotification("Generating CSV report...", "info");
            console.log('CSV Export started for period:', dateRange);
            
            const response = await this.authManager.fetchWithAuth(
                `${this.BASE_URL}/api/admin/analytics/export?format=csv&period=${dateRange}`
            );
            
            console.log('CSV Export response status:', response.status);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `resolvex-complaints-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showNotification("CSV report downloaded successfully!", "success");
            } else {
                const errorText = await response.text();
                console.error('CSV export failed with status:', response.status, 'Error:', errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error("CSV export error:", error);
            this.showNotification(`Failed to generate CSV: ${error.message}`, "error");
            
            // Fallback: Generate client-side CSV if server fails
            if (error.message.includes('404') || error.message.includes('500')) {
                this.generateClientSideCSV(dateRange);
            }
        }
    }

    // Client-side PDF generation fallback
    generateClientSidePDF(dateRange) {
        try {
            this.showNotification("Generating client-side PDF report...", "info");
            
            // Create a simple PDF using jsPDF (you'll need to include jsPDF library)
            if (typeof jspdf !== 'undefined') {
                this.generatePDFWithJSPDF(dateRange);
            } else {
                // Create a simple HTML report instead
                this.generateHTMLReport(dateRange);
            }
        } catch (error) {
            console.error("Client-side PDF generation failed:", error);
            this.showNotification("Please install jsPDF library for client-side PDF generation", "error");
        }
    }

    // Client-side CSV generation fallback
    generateClientSideCSV(dateRange) {
        try {
            // Get current analytics data from the global analyticsApp instance
            const analyticsData = window.analyticsApp?.analyticsData?.complaints;
            
            if (!analyticsData) {
                throw new Error('No analytics data available');
            }

            let csvContent = "Complaint Analytics Report\n";
            csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
            csvContent += `Period: ${dateRange} days\n\n`;
            
            // Summary section
            if (analyticsData.summary) {
                csvContent += "SUMMARY\n";
                csvContent += `Total Complaints,${analyticsData.summary.totalComplaints || 0}\n`;
                csvContent += `Resolution Rate,${analyticsData.summary.resolutionRate || 0}%\n`;
                csvContent += `Avg Resolution Time,${analyticsData.summary.avgResolutionTime || 0} days\n`;
                csvContent += `Satisfaction Score,${analyticsData.summary.satisfactionScore || 0}%\n\n`;
            }

            // Department distribution
            if (analyticsData.distributions?.departments) {
                csvContent += "DEPARTMENT DISTRIBUTION\n";
                csvContent += "Department,Count\n";
                Object.entries(analyticsData.distributions.departments).forEach(([dept, count]) => {
                    csvContent += `${dept},${count}\n`;
                });
                csvContent += "\n";
            }

            // Status distribution
            if (analyticsData.distributions?.status) {
                csvContent += "STATUS DISTRIBUTION\n";
                csvContent += "Status,Count\n";
                Object.entries(analyticsData.distributions.status).forEach(([status, count]) => {
                    csvContent += `${status},${count}\n`;
                });
                csvContent += "\n";
            }

            // Priority distribution
            if (analyticsData.distributions?.priorities) {
                csvContent += "PRIORITY DISTRIBUTION\n";
                csvContent += "Priority,Count\n";
                Object.entries(analyticsData.distributions.priorities).forEach(([priority, count]) => {
                    csvContent += `${priority},${count}\n`;
                });
            }

            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resolvex-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification("CSV report generated successfully!", "success");
            
        } catch (error) {
            console.error("Client-side CSV generation failed:", error);
            this.showNotification("Failed to generate CSV report", "error");
        }
    }

    // Generate HTML report as fallback
    generateHTMLReport(dateRange) {
        try {
            const analyticsData = window.analyticsApp?.analyticsData?.complaints;
            const now = new Date();
            
            let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>ResolveX Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ResolveX Analytics Report</h1>
        <p>Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</p>
        <p>Period: Last ${dateRange} days</p>
    </div>
`;

            // Add summary section
            if (analyticsData?.summary) {
                htmlContent += `
    <div class="section">
        <h2>Summary</h2>
        <div class="metric">Total Complaints: ${analyticsData.summary.totalComplaints || 0}</div>
        <div class="metric">Resolution Rate: ${analyticsData.summary.resolutionRate || 0}%</div>
        <div class="metric">Avg Resolution Time: ${analyticsData.summary.avgResolutionTime || 0} days</div>
        <div class="metric">Satisfaction Score: ${analyticsData.summary.satisfactionScore || 0}%</div>
    </div>
`;
            }

            // Add distributions
            if (analyticsData?.distributions) {
                // Department distribution
                if (analyticsData.distributions.departments) {
                    htmlContent += `
    <div class="section">
        <h2>Department Distribution</h2>
        <table>
            <tr><th>Department</th><th>Count</th></tr>
`;
                    Object.entries(analyticsData.distributions.departments).forEach(([dept, count]) => {
                        htmlContent += `            <tr><td>${dept}</td><td>${count}</td></tr>\n`;
                    });
                    htmlContent += `        </table>\n    </div>`;
                }

                // Status distribution
                if (analyticsData.distributions.status) {
                    htmlContent += `
    <div class="section">
        <h2>Status Distribution</h2>
        <table>
            <tr><th>Status</th><th>Count</th></tr>
`;
                    Object.entries(analyticsData.distributions.status).forEach(([status, count]) => {
                        htmlContent += `            <tr><td>${status}</td><td>${count}</td></tr>\n`;
                    });
                    htmlContent += `        </table>\n    </div>`;
                }
            }

            htmlContent += `
</body>
</html>`;

            // Create and download HTML file
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resolvex-analytics-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification("HTML report generated successfully!", "success");
            
        } catch (error) {
            console.error("HTML report generation failed:", error);
            this.showNotification("Failed to generate report", "error");
        }
    }

    // Test API endpoints
    async testExportEndpoints() {
        try {
            this.showNotification("Testing export endpoints...", "info");
            
            const endpoints = [
                '/api/admin/analytics/export?format=pdf&period=30',
                '/api/admin/analytics/export?format=csv&period=30'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await this.authManager.fetchWithAuth(`${this.BASE_URL}${endpoint}`);
                    console.log(`Endpoint ${endpoint}: ${response.status}`);
                    
                    if (response.ok) {
                        this.showNotification(`${endpoint.split('=')[1].toUpperCase()} endpoint is working`, "success");
                    } else {
                        this.showNotification(`${endpoint.split('=')[1].toUpperCase()} endpoint returned ${response.status}`, "warning");
                    }
                } catch (error) {
                    console.error(`Endpoint ${endpoint} failed:`, error);
                    this.showNotification(`${endpoint.split('=')[1].toUpperCase()} endpoint failed: ${error.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Endpoint testing failed:", error);
        }
    }

    showNotification(message, type = "info") {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.export-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement("div");
        const bgColor = type === "success" ? "bg-green-500" : 
                       type === "error" ? "bg-red-500" : 
                       type === "warning" ? "bg-yellow-500" : "bg-blue-500";
        
        notification.className = `export-notification fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`;
        notification.innerHTML = `
            <i class="fas ${
                type === "success" ? "fa-check-circle" : 
                type === "error" ? "fa-exclamation-triangle" : 
                type === "warning" ? "fa-exclamation-circle" : "fa-info-circle"
            } mr-3"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Make available globally
window.ExportManager = ExportManager;