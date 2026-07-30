// DOM Elements 
const iataInput = document.getElementById('iata-input'); 
const iataList = document.getElementById('iata-list'); 
const nameInput = document.getElementById('name-input'); 
const nameList = document.getElementById('name-list'); 
const latInput = document.getElementById('lat-input'); 
const lonInput = document.getElementById('lon-input'); 

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
  if (!query) { clearAllFields(); return; }

  try {
    // This calls the FastAPI server endpoint you built, NOT the raw CSV file
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const airports = await response.json();

    airports.forEach(airport => { 
      const li = document.createElement('li'); 
      
      // Customize dropdown UI layout based on which text box is targeted
      if (targetList === iataList) {
        li.textContent = `${airport.code} (${airport.name})`; 
      } else {
        li.textContent = airport.name; 
      }

      li.addEventListener('click', () => selectAirport(airport)); 
      targetList.appendChild(li); 
    });
  } catch (err) {
    console.error("Error communicating with FastAPI server:", err);
  }
}

// 1. Logic for Airport Code (IATA) Autocomplete 
iataInput.addEventListener('input', () => { 
  if (!iataInput.value) nameInput.value = '';
  fetchAirportSuggestions(iataInput.value, iataList);
}); 

// 2. Logic for Airport Name Autocomplete 
nameInput.addEventListener('input', () => { 
  if (!nameInput.value) iataInput.value = '';
  fetchAirportSuggestions(nameInput.value, nameList);
}); 

// Close dropdown lists if user clicks anywhere outside the containers 
document.addEventListener('click', (e) => { 
  if (e.target !== iataInput) iataList.innerHTML = ''; 
  if (e.target !== nameInput) nameList.innerHTML = ''; 
});