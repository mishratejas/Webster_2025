class HeatmapManager {
    constructor() {
        this.map = null;
        this.markerLayer = null;
        this.currentData = [];
        this.init();
        this.attachEventListeners();
    }

    async init() {
        console.log("✅ HeatmapManager initialized");
        await this.fetchAndRenderComplaints();
    }

    attachEventListeners() {
        // Department filter
        document.getElementById("heatmapDepartment").addEventListener("change", (e) => {
            this.filterByDepartment(e.target.value);
        });

        // Refresh button
        document.getElementById("refreshHeatmapBtn").addEventListener("click", () => {
            this.fetchAndRenderComplaints(
                document.getElementById("heatmapDepartment").value
            );
        });

        // Test Data button
        document.getElementById("testHeatmapBtn").addEventListener("click", () => {
            this.loadTestData();
        });

        // Clear button
        document.getElementById("clearHeatmapBtn").addEventListener("click", () => {
            this.clearHeatmap();
        });
    }

    async fetchAndRenderComplaints(department = "all") {
        try {
            const res = await fetch("https://resolvex-ieis.onrender.com/api/user_issues/locations");
            const data = await res.json();

            if (!data.success || !Array.isArray(data.data)) {
                console.error("Invalid response format", data);
                return;
            }

            this.currentData = data.data;

            // Filter by department
            const filtered =
                department === "all"
                    ? this.currentData
                    : this.currentData.filter(
                          (d) =>
                              d.category &&
                              d.category.toLowerCase() === department.toLowerCase()
                      );

            this.renderPointsOnMap(filtered);
            this.updateStats(filtered);
        } catch (err) {
            console.error("Error fetching complaints:", err);
        }
    }

    renderPointsOnMap(points) {
        if (!this.map) {
            this.map = L.map("heatmapContainer").setView([25.44, 81.85], 6);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 18,
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(this.map);
        }

        if (this.markerLayer) {
            this.map.removeLayer(this.markerLayer);
        }

        this.markerLayer = L.layerGroup().addTo(this.map);

        if (!points || points.length === 0) {
            console.log("⚠️ No complaint points to display");
            return;
        }

        const bounds = [];

        points.forEach((point) => {
            if (point.latitude && point.longitude) {
                let color = "blue";
                if (point.priority === "high") color = "red";
                else if (point.priority === "medium") color = "orange";

                L.circleMarker([point.latitude, point.longitude], {
                    radius: 8,
                    color,
                    fillColor: color,
                    fillOpacity: 0.7,
                })
                    .bindPopup(
                        `
                        <b>${point.title}</b><br>
                        <small>${point.address || "No address available"}</small><br>
                        <strong>Priority:</strong> 
                        <span style="color:${color};text-transform:capitalize;">
                            ${point.priority}
                        </span><br>
                        <strong>Status:</strong> ${point.status}
                    `
                    )
                    .addTo(this.markerLayer);

                bounds.push([point.latitude, point.longitude]);
            }
        });

        if (bounds.length > 0) {
            this.map.fitBounds(bounds, { padding: [30, 30] });
        }
    }

    updateStats(points) {
        const totalComplaints = points.length;
        const highPriorityCount = points.filter((p) => p.priority === "high").length;
        const clusters = Math.max(1, Math.ceil(points.length / 5)); // simple cluster est.

        document.getElementById("pointsCount").textContent = clusters;
        document.getElementById("complaintsCount").textContent = totalComplaints;
        document.getElementById("highPriorityCount").textContent = highPriorityCount;
    }

    filterByDepartment(department) {
        const filtered =
            department === "all"
                ? this.currentData
                : this.currentData.filter(
                      (d) =>
                          d.category &&
                          d.category.toLowerCase() === department.toLowerCase()
                  );
        this.renderPointsOnMap(filtered);
        this.updateStats(filtered);
    }

    clearHeatmap() {
        if (this.markerLayer) {
            this.map.removeLayer(this.markerLayer);
            this.markerLayer = null;
        }
        this.updateStats([]);
        console.log("🧹 Heatmap cleared");
    }

    loadTestData() {
        console.log("⚡ Loading test data...");
        const testData = [
            {
                title: "Pothole on Main Road",
                latitude: 25.45,
                longitude: 81.85,
                category: "road",
                priority: "high",
                status: "open",
                address: "Main Road, Sector 4",
            },
            {
                title: "Water Leakage",
                latitude: 25.50,
                longitude: 81.90,
                category: "water",
                priority: "medium",
                status: "in-progress",
                address: "Ganga Nagar",
            },
            {
                title: "Streetlight Broken",
                latitude: 25.42,
                longitude: 81.82,
                category: "electricity",
                priority: "low",
                status: "resolved",
                address: "Civil Lines",
            },
        ];

        this.currentData = testData;
        this.renderPointsOnMap(testData);
        this.updateStats(testData);
    }
}

// Make class available globally
window.HeatmapManager = HeatmapManager;

// Initialize heatmap
const heatmap = new HeatmapManager();
