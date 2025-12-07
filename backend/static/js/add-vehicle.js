console.log("ADD-VEHICLE.JS LOADED!");

async function handle_add_vehicle_submit(event) {
  event.preventDefault();

  const make = document.getElementById("vehicle-make").value.trim();
  const model = document.getElementById("vehicle-model").value.trim();
  const year = parseInt(document.getElementById("vehicle-year").value.trim());
  const plate = document.getElementById("vehicle-plate").value.trim();
  const mileage = document.getElementById("vehicle-mileage").value.trim();
  const color = document.getElementById("vehicle-color").value.trim();
  const vin = document.getElementById("vehicle-vin").value.trim();
  const purchase_date = document.getElementById("purchase-date").value;
  const errorEl = document.getElementById("vehicle-error");

  // Reset error display
  errorEl.hidden = true;
  errorEl.textContent = "";

  // VALIDATIONS
  if (year < 1900) {
    showError("Year cannot be less than 1900.");
    return;
  }

  if (plate.length < 5) {
    showError("License plate must be at least 5 characters.");
    return;
  }

  if (vin && vin.length !== 17) {
    showError("VIN must be exactly 17 characters.");
    return;
  }

  const payload = {
    manufacturer: make,
    model: model,
    year: year,
    license_plate: plate,
    initial_mileage: parseInt(mileage),
    current_mileage: parseInt(mileage),
    color: color,
    vin: vin || null,
    purchase_date: purchase_date || null
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showError(data.message || "Failed to add vehicle.");
      return;
    }

    window.location.href = "/dashboard";

  } catch (err) {
    console.error(err);
    showError("Network error. Please try again.");
  }

  function showError(msg) {
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("add-vehicle-form")
    .addEventListener("submit", handle_add_vehicle_submit);
});
