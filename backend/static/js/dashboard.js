console.log("DASHBOARD.JS LOADED!");

// --- Part 1: Vehicle Logic ---

async function fetch_and_display_vehicles() {
  const container = document.getElementById("vehicles-list");
  if (!container) return;

  container.innerHTML = "<p>Loading vehicles...</p>";

  try {
    const response = await fetch(`/api/vehicles`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      console.error("Failed to load vehicles");
      container.innerHTML = "<p class='no-vehicles'>No vehicles found.</p>";
      return;
    }

    const vehicles = await response.json();
    container.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {
      container.innerHTML = "<p class='no-vehicles'>No vehicles found. Add one!</p>";
      return;
    }

    vehicles.forEach(v => {
      const card = document.createElement("div");
      card.className = "vehicle-card";

      // --- CHANGED: Dynamic Image Logic ---
      const imageSrc = v.image_filename 
          ? `/static/uploads/${v.image_filename}` 
          : "/static/img/car-interior.jpg";
      // ------------------------------------

      card.innerHTML = `
        <img src="${imageSrc}" alt="Vehicle" class="vehicle-img">
        <div class="vehicle-info">
          <h3>${v.manufacturer} ${v.model}</h3>
          <p>Plate: ${v.license_plate || ""}</p>
          <p>Color: ${v.color || "-"}</p>
          <p>Mileage: ${v.current_mileage ?? v.initial_mileage ?? 0}</p>
        </div>
        <button class="view-btn" data-id="${v._id}">View Details</button>
      `;

      container.appendChild(card);
    });

    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        window.location.href = `/vehicle-details?id=${id}`;
      });
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p class='error'>Failed to load vehicles.</p>";
  }
}

// --- Part 2: Admin Workshop Logic ---

function setupAdminPanel() {
  const workshopForm = document.getElementById('addWorkshopForm');
  const locationBtn = document.getElementById('btn-get-location');

  // If the admin form doesn't exist (because user is not admin), stop here.
  if (!workshopForm) return; 

  console.log("Admin Panel Detected: Initializing...");

  // Handle Form Submit
  workshopForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = workshopForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Saving...";
    submitBtn.disabled = true;

    const workshopData = {
      name: document.getElementById('w_name').value,
      address: document.getElementById('w_address').value,
      lat: document.getElementById('w_lat').value,
      lng: document.getElementById('w_lng').value,
      services: ['general_repair'] 
    };

    try {
      const response = await fetch('/workshops/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workshopData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('✅ Workshop Added Successfully!');
        workshopForm.reset();
      } else {
        alert('❌ Error: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Failed to connect to server');
    } finally {
      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
    }
  });

  // Handle "Detect Location" Button
  if (locationBtn) {
    locationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }

      locationBtn.innerText = "Locating...";
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          document.getElementById('w_lat').value = position.coords.latitude;
          document.getElementById('w_lng').value = position.coords.longitude;
          locationBtn.innerText = "📍 Location Set!";
          setTimeout(() => locationBtn.innerText = "📍 Detect My Location", 2000);
        },
        (error) => {
          alert("Unable to retrieve location. Please enter coordinates manually.");
          locationBtn.innerText = "📍 Detect My Location";
        }
      );
    });
  }
}

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  fetch_and_display_vehicles();
  setupAdminPanel();
});
