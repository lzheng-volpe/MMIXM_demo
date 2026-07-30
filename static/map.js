// static/map.js

// Establish a long-lived persistent streaming pipe directly to Python
const eventSource = new EventSource('/stream-airport-data');

// Fired continuously every 0.1 seconds when data streams from Python
eventSource.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);

        for (const [code, info] of Object.entries(data)) {
            const tempEl = document.getElementById(`Temp-${code}`);
            const availEl = document.getElementById(`Avail-${code}`);
            const moniEl = document.getElementById(`Moni-${code}`);

            if (tempEl) tempEl.innerText = info.temp !== undefined && info.temp !== null ? info.temp : 'N/A';
            if (availEl) availEl.innerText = info.avail !== undefined && info.avail !== null ? info.avail : 'N/A';
            if (moniEl) moniEl.innerText = info.moni !== undefined && info.moni !== null ? info.moni : 'N/A';

            let newColor = "green";
            if (info.avail === "Partially Available") {
                newColor = "orange";
            } else if (info.avail === "Unavailable") {
                newColor = "red";
            }

            const containerEl = document.getElementById(`Marker-${code}`);
            if (containerEl) {
                const circle = containerEl.querySelector('.marker-circle');
                if (circle) {
                    circle.setAttribute('fill', newColor);
                    circle.setAttribute('stroke', newColor);
                }
            }
        }
    } catch (error) {
        console.error("Error processing 0.1s real-time stream packet:", error);
    }
};

eventSource.onerror = function(err) {
    console.warn("Real-time stream connection dropped. Reconnecting automatically...", err);
};

function openSidebar(iataCode) {
    const xmlUrl = `/static/xml/${iataCode}.xml`;
    fetch(xmlUrl)
        .then(response => {
            if (!response.ok) throw new Error(`XML file for ${iataCode} not found`);
            return response.text();
        })
        .then(xmlText => {
            document.getElementById("xml-content").textContent = xmlText;
            document.getElementById("sidebar").classList.add("show-sidebar");
        })
        .catch(error => {
            console.error('Error loading XML:', error);
            document.getElementById("xml-content").textContent = `Error: ${error.message}`;
            document.getElementById("sidebar").classList.add("show-sidebar");
        });
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("show-sidebar");
}

window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'OPEN_XML_SIDEBAR') {
        openSidebar(event.data.iata);
    }
});