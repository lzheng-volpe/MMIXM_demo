// DOM Elements
const iataInput = document.getElementById('iata-input');
const iataList = document.getElementById('iata-list');
const nameInput = document.getElementById('name-input');
const nameList = document.getElementById('name-list');
const latInput = document.getElementById('lat-input');
const lonInput = document.getElementById('lon-input');
const tempInput = document.getElementById('temp-input');
const availInput = document.getElementById('avail-input');
const moniInput = document.getElementById('moni-input');
const createButton = document.getElementById('create-button');
const popupOverlay = document.getElementById('popup-overlay');
const closeButton = document.getElementById('close-button');

// Helper function to safely convert strings to numbers with exactly 8 decimal places
function formatToEightDecimals(coordinateString) {
    const num = parseFloat(coordinateString);
    return isNaN(num) ? '' : num.toFixed(8);
}

function selectAirport(airport) {
    iataInput.value = airport.code;
    nameInput.value = airport.name;
    latInput.value = formatToEightDecimals(airport.lat);
    lonInput.value = formatToEightDecimals(airport.lon);
    iataList.innerHTML = '';
    nameList.innerHTML = '';
}

// Helper function to clear autofill values if user blanks out an input
function clearAllFields() {
    iataList.innerHTML = '';
    nameList.innerHTML = '';
    latInput.value = '';
    lonInput.value = '';
}

async function fetchAirportSuggestions(query, targetList) {
    targetList.innerHTML = '';
    if (!query) {
        targetList.style.display = 'none';
        clearAllFields();
        return;
    }
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const airports = await response.json();
        if (airports.length === 0) {
            targetList.style.display = 'none';
            return;
        }
        targetList.style.display = 'block';
        airports.forEach(airport => {
            const li = document.createElement('li');
            if (targetList === iataList) {
                li.textContent = `${airport.code} (${airport.name})`;
            } else {
                li.textContent = airport.name;
            }
            li.addEventListener('click', () => {
                selectAirport(airport);
                targetList.style.display = 'none';
            });
            targetList.appendChild(li);
        });
    } catch (err) {
        console.error("Error communicating with FastAPI server:", err);
        targetList.style.display = 'none';
    }
}

iataInput.addEventListener('input', () => {
    if (!iataInput.value) nameInput.value = '';
    fetchAirportSuggestions(iataInput.value, iataList);
});

nameInput.addEventListener('input', () => {
    if (!nameInput.value) iataInput.value = '';
    fetchAirportSuggestions(nameInput.value, nameList);
});

// Close suggestions dropdown when clicking outside of inputs
document.addEventListener('click', (e) => {
    if (e.target !== iataInput) iataList.innerHTML = '';
    if (e.target !== nameInput) nameList.innerHTML = '';
});

// Sends form data to FastAPI, parses returned XML text format, and inserts into display container
async function create_xml() {
    const payload = {
        IATA: iataInput?.value?.trim() || "XYZ",
        Name: nameInput?.value?.trim() || "Default Asset",
        Lat: parseFloat(latInput?.value) || 0.0,
        Long: parseFloat(lonInput?.value) || 0.0,
        Temp: tempInput?.value?.trim() || "72",
        Avail: availInput?.value || "Available",
        Moni: moniInput?.value || "Monitored"
    };

    try {
        const response = await fetch('/write_xml', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server returned error status code: ${response.status}`);
        }

        const xmlTemplate = await response.text();
        
        // Formats plaintext lines into customized HTML structures matching your design layout
        const htmlParagraphs = xmlTemplate
            .split(/\r?\n/)
            .map(para => {
                if (para.trim() === '') {
                    return '<p>&nbsp;</p>';
                }
                const escaped = para
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
                    .replace(/ /g, "&nbsp;");
                return `<p>${escaped}</p>`;
            })
            .join('');

        const displayElement = document.getElementById('xml-display');
        if (displayElement) {
            displayElement.innerHTML = htmlParagraphs;
        }
        
        console.log("XML Generation process completed successfully.");
        return true; // Indicate success to trigger modal view state safely
    } catch (error) {
        console.error("Failed to compile or transmit XML payload:", error);
        alert(`Error communicating with backend server: ${error.message}`);
        return false; // Stop opening blank modal window upon engine failure
    }
}

// Lifecycle Init Context Management Block
document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.getElementById('create-button');
    const closeButton = document.getElementById('close-button');
    const popupOverlay = document.getElementById('popup-overlay');

    createButton?.addEventListener('click', async (event) => {
        event.preventDefault();
        const success = await create_xml();
        if (success) {
            popupOverlay?.classList.add('active');
        }
    });

    closeButton?.addEventListener('click', () => {
        popupOverlay?.classList.remove('active');
    });

    popupOverlay?.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            popupOverlay?.classList.remove('active');
        }
    });
});