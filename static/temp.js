// --- Left Navigation Sidebar Elements & Actions ---
const openBtn = document.getElementById('open-btn');
const closeBtn = document.getElementById('close-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function openNavSidebar() {
    if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
}

function closeNavSidebar() {
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

if (openBtn) openBtn.addEventListener('click', openNavSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeNavSidebar);
if (overlay) overlay.addEventListener('click', closeNavSidebar);


// --- Secure Right XML Sidebar Engine ---
function handleOpenXml(iataCode) {
    const xmlUrl = `${window.location.origin}/static/xml/${iataCode}.xml`;
    fetch(xmlUrl)
        .then(response => {
            if (!response.ok) throw new Error(`XML file for ${iataCode} not found.`);
            return response.text();
        })
        .then(xmlText => {
            // SAFE CHECK: Only update if the element actually exists on this page
            const xmlContentEl = document.getElementById("xml-content");
            const xmlSidebarEl = document.getElementById("xml-sidebar");
            
            if (xmlContentEl) xmlContentEl.textContent = xmlText;
            if (xmlSidebarEl) xmlSidebarEl.classList.add("show-sidebar");
        })
        .catch(error => {
            console.error('Error loading XML:', error);
            const xmlContentEl = document.getElementById("xml-content");
            const xmlSidebarEl = document.getElementById("xml-sidebar");
            
            if (xmlContentEl) xmlContentEl.textContent = `Error: ${error.message}`;
            if (xmlSidebarEl) xmlSidebarEl.classList.add("show-sidebar");
        });
}

window.closeSidebar = function() {
    const xmlSidebarEl = document.getElementById("xml-sidebar");
    if (xmlSidebarEl) {
        xmlSidebarEl.classList.remove("show-sidebar");
    }
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