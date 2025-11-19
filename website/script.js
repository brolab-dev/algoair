document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([16.0544, 108.2022], 5); // Default view (Da Nang, Vietnam)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const tableBody = document.querySelector('#data-table tbody');

    async function fetchData() {
        try {
            // This endpoint will be created in the next step
            const response = await fetch('/api/submissions'); 
            const submissions = await response.json();

            // Clear existing data
            tableBody.innerHTML = '';
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            submissions.forEach(submission => {
                // Add to table
                const row = document.createElement('tr');
                const locationString = submission.latitude && submission.longitude
                    ? `${submission.latitude.toFixed(4)}, ${submission.longitude.toFixed(4)}`
                    : 'N/A';

                row.innerHTML = `
                    <td>${new Date(submission.submitted_at).toLocaleString()}</td>
                    <td>${locationString}</td>
                    <td>${submission.data.aqi}</td>
                    <td>${submission.data.temperature}</td>
                    <td>${submission.data.humidity}</td>
                    <td>${submission.data.pm25}</td>
                `;
                tableBody.appendChild(row);

                // Add to map
                if (submission.latitude && submission.longitude) {
                    const marker = L.marker([submission.latitude, submission.longitude]).addTo(map);
                    marker.bindPopup(`
                        <b>AQI:</b> ${submission.data.aqi}<br>
                        <b>Temp:</b> ${submission.data.temperature}°C<br>
                        <b>Location:</b> ${submission.latitude.toFixed(4)}, ${submission.longitude.toFixed(4)}
                    `);
                }
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = '<tr><td colspan="6">Error loading data. Is the server running?</td></tr>';
        }
    }

    fetchData();
    // Refresh data every 30 seconds
    setInterval(fetchData, 30000);
});
