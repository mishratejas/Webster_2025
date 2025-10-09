import PDFDocument from 'pdfkit';

export const generateCSVData = (complaints) => {
    const headers = [
        'ID', 'Title', 'Category', 'Priority', 'Status', 
        'Created Date', 'Resolved Date', 'Resolution Time (days)',
        'User', 'Assigned Staff', 'Location', 'Votes', 'Description'
    ];
    
    let csv = headers.join(',') + '\n';
    
    complaints.forEach(complaint => {
        const resolvedDate = complaint.status === 'resolved' ? 
            new Date(complaint.updatedAt).toLocaleDateString() : 'N/A';
        
        const resolutionTime = complaint.status === 'resolved' && complaint.createdAt && complaint.updatedAt ?
            Math.round((new Date(complaint.updatedAt) - new Date(complaint.createdAt)) / (24 * 60 * 60 * 1000)) : 'N/A';
        
        const location = complaint.latitude && complaint.longitude ? 
            `${complaint.latitude},${complaint.longitude}` : 'N/A';
        
        const row = [
            `"${complaint._id}"`,
            `"${(complaint.title || '').replace(/"/g, '""')}"`,
            `"${complaint.category}"`,
            `"${complaint.priority}"`,
            `"${complaint.status}"`,
            `"${new Date(complaint.createdAt).toLocaleDateString()}"`,
            `"${resolvedDate}"`,
            `"${resolutionTime}"`,
            `"${(complaint.user?.name || 'Anonymous').replace(/"/g, '""')}"`,
            `"${(complaint.assignedTo?.name || 'Unassigned').replace(/"/g, '""')}"`,
            `"${location}"`,
            `"${complaint.votes || 0}"`,
            `"${(complaint.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
        
        csv += row.join(',') + '\n';
    });
    
    return csv;
};

export const generatePDFReport = async (complaints) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Add content to PDF
            doc.fontSize(20).text('ResolveX Analytics Report', 100, 100);
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 130);
            
            // Add summary statistics
            const totalComplaints = complaints.length;
            const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
            const resolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints * 100).toFixed(1) : 0;
            
            doc.fontSize(16).text('Summary Statistics', 100, 180);
            doc.fontSize(12)
                .text(`Total Complaints: ${totalComplaints}`, 100, 210)
                .text(`Resolved: ${resolvedComplaints}`, 100, 230)
                .text(`Resolution Rate: ${resolutionRate}%`, 100, 250);
            
            // Add department breakdown
            const departmentStats = complaints.reduce((acc, complaint) => {
                const dept = complaint.category || 'other';
                if (!acc[dept]) acc[dept] = 0;
                acc[dept]++;
                return acc;
            }, {});
            
            doc.fontSize(16).text('Department Breakdown', 100, 300);
            let yPos = 330;
            Object.entries(departmentStats).forEach(([dept, count]) => {
                doc.text(`${dept.charAt(0).toUpperCase() + dept.slice(1)}: ${count} complaints`, 120, yPos);
                yPos += 20;
            });
            
            doc.end();
        } catch (error) {
            reject(new Error('Failed to generate PDF report: ' + error.message));
        }
    });
};