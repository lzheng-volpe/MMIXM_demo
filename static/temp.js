// --- Left Navigation Sidebar Elements & Actions ---
const openBtn = document.getElementById('open-btn');
const closeBtn = document.getElementById('close-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function openNavSidebar() { sidebar.classList.add('active'); overlay.classList.add('active'); }
function closeNavSidebar() { sidebar.classList.remove('active'); overlay.classList.remove('active'); }

openBtn.addEventListener('click', openNavSidebar);
closeBtn.addEventListener('click', closeNavSidebar);
overlay.addEventListener('click', closeNavSidebar);

// --- Secure Right XML Sidebar Engine ---
function handleOpenXml(iataCode) {
    const xmlUrl = `${window.location.origin}/static/xml/${iataCode}.xml`;

    fetch(xmlUrl)
        .then(response => {
            if (!response.ok) throw new Error(`XML file for ${iataCode} not found.`);
            return response.text();
        })
        .then(xmlText => {
            document.getElementById("xml-content").textContent = xmlText;
            document.getElementById("xml-sidebar").classList.add("show-sidebar");
        })
        .catch(error => {
            console.error('Error loading XML:', error);
            document.getElementById("xml-content").textContent = `Error: ${error.message}`;
            document.getElementById("xml-sidebar").classList.add("show-sidebar");
        });
}

window.closeSidebar = function() {
    document.getElementById("xml-sidebar").classList.remove("show-sidebar");
};

window.addEventListener('load', () => {
    const mapIframe = document.querySelector('.map-frame');
    
    if (mapIframe) {
        mapIframe.addEventListener('load', () => {
            try {
                const iframeDocument = mapIframe.contentDocument || mapIframe.contentWindow.document;
                
                iframeDocument.addEventListener('click', function(event) {
                    const trigger = event.target.closest('.airport-popup-trigger');
                    if (trigger) {
                        const iataCode = trigger.getAttribute('data-iata');
                        if (iataCode) {
                            handleOpenXml(iataCode);
                        }
                    }
                });
            } catch (e) {
                console.warn("Cross-origin access restricted by Chrome policies. Falling back to global message fallback handler.", e);
            }
        });
    }
});

window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'OPEN_XML_SIDEBAR') {
        handleOpenXml(event.data.iata);
    }
});