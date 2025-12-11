console.log("VEHICLE-DETAILS.JS LOADED!");

// NOTE: API_BASE_URL is already defined in auth.js. 
// We do NOT need to define it here again.

// GET VEHICLE ID
const params = new URLSearchParams(window.location.search);
const vehicleId = params.get("id");

console.log("Vehicle ID =", vehicleId);

// ------------------------------------------------------
// 1. Fetch Vehicle Details
// ------------------------------------------------------
async function fetch_vehicle_details() {
  try {
    // Use API_BASE_URL from auth.js
    const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch vehicle details");

    const data = await res.json();

    document.getElementById("vehicle-title").textContent =
      `${data.manufacturer} ${data.model}`;
    document.getElementById("vehicle-plate").textContent = data.license_plate;

    document.getElementById("vehicle-details").innerHTML = `
      Make: ${data.manufacturer}<br>
      Model: ${data.model}<br>
      Year: ${data.year}<br>
      Color: ${data.color || "-"}<br>
      VIN: ${data.vin || "-"}<br>
      Initial Mileage: ${data.initial_mileage} km<br>
      Current Mileage: ${data.current_mileage} km
    `;

    // Image Logic
    const img = document.getElementById("vehicle-img");
    if (data.image_filename) {
        // Add timestamp to force refresh image
        img.src = `/static/uploads/${data.image_filename}?t=${new Date().getTime()}`;
    } else {
        img.src = "../static/img/car-interior.jpg";
    }

    fetch_predictions();
    fetch_service_history();

  } catch (err) {
    console.error("Error loading details:", err);
    document.getElementById("vehicle-details").innerHTML = "<p style='color:red'>Error loading vehicle details.</p>";
  }
}

// ------------------------------------------------------
// 2. Fetch Service History
// ------------------------------------------------------
async function fetch_service_history() {
  const container = document.getElementById("service-history");

  try {
    const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/services`,
      { credentials: "include" });

    const history = await res.json();
    container.innerHTML = "";

    if (!history.length) {
      container.innerHTML = "<p>No service records yet.</p>";
      return;
    }

    history.forEach(rec => {
      container.innerHTML += `
        <div class="service-item">
          <div>${new Date(rec.service_date).toLocaleDateString()}</div>
          <div>${rec.service_type} @ ${rec.mileage_at_service} km</div>
          <div>Notes: ${rec.notes || '-'}</div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading history.</p>";
  }
}

// ------------------------------------------------------
// 3. Fetch Predictions
// ------------------------------------------------------
async function fetch_predictions() {
  const box = document.getElementById("predictions-box");
  box.innerHTML = "<p>Loading predictions...</p>";

  try {
    const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/predictions`, {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json();

    if (!data.length) {
      box.innerHTML = "<p>No predictions available.</p>";
      return;
    }

    box.innerHTML = "";

    data.forEach(p => {
      box.innerHTML += `
        <div class="prediction-card">
          <div class="prediction-title">${p.maintenance_type.replace("_", " ")}</div>
          <div class="prediction-info">
            Predicted Date: ${new Date(p.predicted_date).toLocaleDateString()}<br>
            Predicted Mileage: ${p.predicted_mileage} km
          </div>
          <div class="prediction-confidence">
            Confidence: ${(p.confidence_level * 100).toFixed(0)}%
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Prediction Error:", err);
    box.innerHTML = "<p>Error loading predictions.</p>";
  }
}

// ------------------------------------------------------
// 4. Handle Service Form & Inputs
// ------------------------------------------------------
document.addEventListener("change", e => {
  if (e.target.id === "service-type") {
    const notesGroup = document.getElementById("other-notes-group");
    if(notesGroup) {
        notesGroup.style.display = e.target.value === "other" ? "block" : "none";
    }
  }

  if (e.target.id === "mileage-options") {
    const input = document.getElementById("service-mileage");
    if(input) input.style.display = e.target.value === "manual" ? "block" : "none";
  }
});

async function handle_add_service_record(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  if(submitBtn) submitBtn.disabled = true;

  try {
    const date = document.getElementById("service-date").value;
    const type = document.getElementById("service-type").value;
    const notesInput = document.getElementById("service-notes");
    
    // Logic: If type is 'other', use the text input. Otherwise use the type name.
    const notes = (type === "other" && notesInput) ? notesInput.value : "";

    let mileageOption = document.getElementById("mileage-options").value;
    let mileage = 0;
    
    // Simple logic: We expect the user to enter the mileage if 'manual' is selected
    // Since your HTML currently only has 'manual' as a functional option, we grab the input.
    if (mileageOption === "manual") {
        mileage = Number(document.getElementById("service-mileage").value);
    } else {
        mileage = Number(mileageOption); 
    }
    
    if(!mileage) {
        alert("Please enter a valid mileage.");
        if(submitBtn) submitBtn.disabled = false;
        return;
    }

    // 1. Add service record
    const resService = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/services`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        service_type: type,
        service_date: date,
        mileage_at_service: mileage,
        notes: notes
        })
    });

    if(!resService.ok) {
        const err = await resService.json();
        throw new Error(err.error || "Failed to add service");
    }

    // 2. Update vehicle mileage
    await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/mileage`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_mileage: mileage })
    });

    alert("Service added successfully!");
    document.getElementById("service-form").reset();
    fetch_vehicle_details(); // Refresh page data

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    if(submitBtn) submitBtn.disabled = false;
  }
}

// ------------------------------------------------------
// 5. Delete Vehicle
// ------------------------------------------------------
async function deleteVehicle() {
  if (!confirm("Delete this vehicle?")) return;

  const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (res.ok) {
    alert("Vehicle deleted.");
    window.location.href = "/dashboard";
  } else {
    alert("Failed to delete.");
  }
}

// ------------------------------------------------------
// 6. Image Upload
// ------------------------------------------------------
function setupImageUpload() {
  const uploadInput = document.getElementById("upload-img-input");
  if (!uploadInput) return;

  uploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const imgElement = document.getElementById("vehicle-img");
    
    // Visual feedback
    imgElement.style.opacity = "0.5";

    try {
      const res = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
        method: "PUT",
        credentials: "include",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image_filename) {
          // Add timestamp to bust cache
          imgElement.src = `/static/uploads/${data.image_filename}?t=${new Date().getTime()}`;
        }
        alert("Image updated!");
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    } finally {
      imgElement.style.opacity = "1";
      uploadInput.value = "";
    }
  });
}

// ------------------------------------------------------
// Initialization
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  fetch_vehicle_details();
  setupImageUpload();

  const serviceForm = document.getElementById("service-form");
  if(serviceForm) {
      serviceForm.addEventListener("submit", handle_add_service_record);
  } else {
      console.error("Service form not found in DOM!");
  }

  const deleteBtn = document.getElementById("delete-vehicle-btn");
  if(deleteBtn) deleteBtn.addEventListener("click", deleteVehicle);
});
