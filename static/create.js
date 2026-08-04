// DOM Elements 
const iataInput = document.getElementById('iata-input'); 
const iataList = document.getElementById('iata-list'); 
const nameInput = document.getElementById('name-input'); 
const nameList = document.getElementById('name-list'); 
const latInput = document.getElementById('lat-input'); 
const lonInput = document.getElementById('lon-input'); 
const tempInput = document.getElementById('temp-input')
const availInput = document.getElementById('avail-input');
const moniInput = document.getElementById('moni-input');
const createButton = document.getElementById('create-button');

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
  // Clear lists 
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

// Core fetch function connecting directly to your FastAPI backend endpoint
async function fetchAirportSuggestions(query, targetList) {
  targetList.innerHTML = '';
  
  // Hide the element completely if there is no query text
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

// 1. Logic for Airport Code (IATA) Autocomplete 
iataInput.addEventListener('input', () => { 
  if (!iataInput.value) nameInput.value = '';
  fetchAirportSuggestions(iataInput.value, iataList);
}); 

nameInput.addEventListener('input', () => { 
  if (!nameInput.value) iataInput.value = '';
  fetchAirportSuggestions(nameInput.value, nameList);
}); 

document.addEventListener('click', (e) => { 
  if (e.target !== iataInput) iataList.innerHTML = ''; 
  if (e.target !== nameInput) nameList.innerHTML = ''; 
});
console.log("create.js successfully loaded via FastAPI Jinja router.");

async function create_xml() {
    console.log("Create button pressed. Compiling form data...");

    const iataInput = document.getElementById('iata-input');
    const nameInput = document.getElementById('name-input');
    const latInput  = document.getElementById('lat-input');
    const lonInput  = document.getElementById('lon-input');
    const tempInput = document.getElementById('temp-input');
    const availSel  = document.getElementById('avail-input');
    const moniSel   = document.getElementById('moni-input');

    const payload = {
        IATA: iataInput?.value?.trim() || "XYZ",
        Name: nameInput?.value?.trim() || "Default Asset",
        Lat: parseFloat(latInput?.value) || 0.0,
        Long: parseFloat(lonInput?.value) || 0.0,
        Temp: tempInput?.value?.trim() || "72",
        Avail: availSel?.value || "Available",
        Moni: moniSel?.value || "Monitored"
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

        const displayElement = document.getElementById('xml-display');
        if (displayElement) {
            displayElement.textContent = xmlTemplate;
        }

        console.log("XML Generation process completed successfully.");

    } catch (error) {
        console.error("Failed to compile or transmit XML payload:", error);
        alert(`Error communicating with backend server: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('create-button');
    if (btn) {
        btn.addEventListener('click', create_xml);
        console.log("Click tracking event handler successfully bound to #create-button.");
    } else {
        console.error("Initialization Error: Element target '#create-button' not found in document layout.");
    }
});