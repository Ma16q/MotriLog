// --- Global Variables ---
let map;
let markersLayer = new L.LayerGroup();

// --- 1. Initialize Map (Runs immediately) ---
function initMap() {
    // 1. Create Map (Default Center: Riyadh)
    map = L.map('map').setView([24.7136, 46.6753], 13);

    // 2. Add Tile Layer (The Map Images)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 3. Add Marker Layer
    markersLayer.addTo(map);

    // 4. Try to get User Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Move map to user
                map.setView([lat, lng], 14);
                
                // Add "You are here" blue dot
                L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: "#3388ff",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map).bindPopup("You are here");

                // Load workshops around user
                fetchWorkshops(lat, lng);
            },
            () => {
                console.log("GPS denied. Loading default view.");
                fetchWorkshops(24.7136, 46.6753);
            }
        );
    } else {
        fetchWorkshops(24.7136, 46.6753);
    }
}

// --- 2. Fetch Data from Backend ---
async function fetchWorkshops(lat, lng) {
    markersLayer.clearLayers();
    
    const listContainer = document.getElementById('workshop-list');
    if (listContainer) listContainer.innerHTML = '<p style="padding:10px;">Loading...</p>';

    try {
        // Search radius: 50km
        const response = await fetch(`/workshops/nearby?lat=${lat}&lng=${lng}&radius=50000`);
        const data = await response.json();

        if (listContainer) listContainer.innerHTML = '';

        if (!data.workshops || data.workshops.length === 0) {
            if (listContainer) listContainer.innerHTML = '<p style="padding:10px;">No workshops found nearby.</p>';
            return;
        }

        data.workshops.forEach(workshop => {
            // Flip coordinates: MongoDB is [Lng, Lat], Leaflet needs [Lat, Lng]
            const wLat = workshop.location.coordinates[1];
            const wLng = workshop.location.coordinates[0];

            // Add Pin to Map
            const marker = L.marker([wLat, wLng])
                .bindPopup(`
                    <b>${workshop.name}</b><br>
                    ${workshop.address}<br>
                    ⭐ ${workshop.rating}
                `);
            
            markersLayer.addLayer(marker);

            // Add to Sidebar List
            if (listContainer) {
                const li = document.createElement('li');
                li.className = 'workshop-item';
                li.innerHTML = `
                    <div class="w-info">
                        <strong>${workshop.name}</strong>
                        <p>${workshop.address}</p>
                    </div>
                    <div class="w-rating">⭐ ${workshop.rating}</div>
                `;
                // Clicking the list item zooms to the pin
                li.addEventListener('click', () => {
                    map.setView([wLat, wLng], 16);
                    marker.openPopup();
                });
                listContainer.appendChild(li);
            }
        });

    } catch (err) {
        console.error("Error loading workshops:", err);
    }
}

// --- 3. Admin Logic (Safe Mode) ---
function setupAdminFeatures() {
    const adminForm = document.getElementById('addWorkshopForm');
    const pickBtn = document.getElementById('btn-pick-location');
    let isPicking = false;
    let tempMarker = null;

    // Only run this if the Admin Panel actually exists
    if (pickBtn && adminForm) {
        
        // Button Click
        pickBtn.addEventListener('click', () => {
            isPicking = true;
            pickBtn.innerText = "👇 Click map to set pin";
            pickBtn.style.background = "#fff3cd";
        });

        // Map Click (Using the global map variable)
        map.on('click', (e) => {
            if (!isPicking) return;

            const { lat, lng } = e.latlng;

            // Fill Form
            document.getElementById('w_lat').value = lat;
            document.getElementById('w_lng').value = lng;
            
            // Auto-fill Address if empty
            const addrField = document.getElementById('w_address');
            if (!addrField.value) {
                addrField.value = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }

            // Visual Marker
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker([lat, lng]).addTo(map).bindPopup("New Location").openPopup();

            // Reset UI
            isPicking = false;
            pickBtn.innerText = "✓ Location Set";
            pickBtn.style.background = "#d4edda";
        });

        // Form Submit
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const lat = document.getElementById('w_lat').value;
            const lng = document.getElementById('w_lng').value;

            if (!lat || !lng) {
                alert("Please click 'Pick on Map' first!");
                return;
            }

            const payload = {
                name: document.getElementById('w_name').value,
                address: document.getElementById('w_address').value,
                lat: lat,
                lng: lng,
                services: ['general_repair']
            };

            try {
                const res = await fetch('/workshops/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    alert('Workshop Saved!');
                    fetchWorkshops(lat, lng); // Refresh map
                    adminForm.reset();
                    pickBtn.innerText = "📍 Pick on Map";
                    pickBtn.style.background = "#eee";
                    if (tempMarker) map.removeLayer(tempMarker);
                } else {
                    const d = await res.json();
                    alert('Error: ' + d.error);
                }
            } catch (err) {
                console.error(err);
                alert('Connection Error');
            }
        });
    }
}

// --- 4. Start Everything ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Load Map first
    initMap();
    
    // 2. Load Admin features (if logged in as admin)
    setupAdminFeatures();
});
