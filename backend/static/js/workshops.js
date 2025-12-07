// ===============================
// STATIC WORKSHOPS DATABASE (Khobar)
// ===============================
const WORKSHOPS_DATA = {
  oil_change: [
    {
      name: "Quick Lube – Khobar",
      lat: 26.299,
      lng: 50.196,
      rating: 4.6
    },
    {
      name: "Fast Oil Center",
      lat: 26.305,
      lng: 50.215,
      rating: 4.4
    }
  ],

  tire: [
    {
      name: "Tire Pro – Khobar",
      lat: 26.301,
      lng: 50.21,
      rating: 4.4
    },
    {
      name: "Al Saif Tires",
      lat: 26.295,
      lng: 50.205,
      rating: 4.5
    }
  ],

  general: [
    {
      name: "Khobar Auto Garage",
      lat: 26.297,
      lng: 50.203,
      rating: 4.3
    },
    {
      name: "MasterFix Garage",
      lat: 26.31,
      lng: 50.22,
      rating: 4.2
    }
  ],

  ac: [
    {
      name: "AC Specialist Garage – Khobar",
      lat: 26.300,
      lng: 50.210,
      rating: 4.7
    },
    {
      name: "ColdAir AC Repair",
      lat: 26.293,
      lng: 50.207,
      rating: 4.6
    }
  ]
};

// -------------------------------------
//  WORKSHOPS LIST (Al Khobar)
// -------------------------------------
const WORKSHOPS = [
  { name: "Quick Lane - Al Khobar", lat: 26.305983, lng: 50.196174, rating: 4.6, service: "oil_change" },
  { name: "Petromin Express – Al Aqrabiyah", lat: 26.297421, lng: 50.196973, rating: 4.3, service: "oil_change" },
  { name: "Bridgestone Tire Center – Khobar", lat: 26.299315, lng: 50.204191, rating: 4.4, service: "tire" },
  { name: "Goodyear Service Center", lat: 26.289712, lng: 50.210132, rating: 4.0, service: "tire" },
  { name: "AC Specialist Garage – Khobar", lat: 26.306412, lng: 50.197982, rating: 4.7, service: "ac" },
  { name: "Precision Auto Repair", lat: 26.295974, lng: 50.215081, rating: 4.5, service: "general" },
  { name: "Al Mamlaka Auto Workshop", lat: 26.290832, lng: 50.207462, rating: 4.2, service: "general" },
  { name: "AC ProFix Center", lat: 26.302118, lng: 50.210772, rating: 4.8, service: "ac" },
  { name: "Michelin Tires – Khobar", lat: 26.303891, lng: 50.204112, rating: 4.1, service: "tire" },
  { name: "Experts Auto Garage", lat: 26.294101, lng: 50.201912, rating: 4.6, service: "general" }
];

let map;
let userMarker;
let workshopMarkers = [];
let selectedWorkshop = null;
let selectedCategory = "oil_change";

// -------------------------------------
// INIT MAP
// -------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([26.3032, 50.1968], 13); // Khobar center

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  renderWorkshopList(WORKSHOPS);
  placeMarkers(WORKSHOPS);
});

// -------------------------------------
// PLACE WORKSHOP MARKERS
// -------------------------------------
function placeMarkers(list) {
  workshopMarkers.forEach(m => map.removeLayer(m));
  workshopMarkers = [];

  list.forEach(workshop => {
    const marker = L.marker([workshop.lat, workshop.lng]).addTo(map);

    marker.bindPopup(`
      <b>${workshop.name}</b><br>
      ⭐ ${workshop.rating}
    `);

    marker.on("click", () => {
      selectedWorkshop = workshop;
      highlightWorkshop(workshop.name);
    });

    workshopMarkers.push(marker);
  });
}

// -------------------------------------
// LIST RENDER
// -------------------------------------
function renderWorkshopList(list) {
  const container = document.getElementById("workshop-list");
  container.innerHTML = "";

  list.forEach(w => {
    const li = document.createElement("li");
    li.className = "workshop-item";
    li.innerHTML = `
      <h4>${w.name}</h4>
      <p class="muted">⭐ ${w.rating}</p>
    `;
    
    li.addEventListener("click", () => {
      selectedWorkshop = w;
      map.setView([w.lat, w.lng], 16);
      highlightWorkshop(w.name);
    });

    container.appendChild(li);
  });
}

function highlightWorkshop(name) {
  document.querySelectorAll(".workshop-item").forEach(item => {
    item.classList.remove("selected");
    if (item.querySelector("h4").textContent === name) {
      item.classList.add("selected");
    }
  });
}

// -------------------------------------
// SEARCH BAR
// -------------------------------------
document.getElementById("search-input").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = WORKSHOPS.filter(w =>
    w.name.toLowerCase().includes(q)
  );

  renderWorkshopList(filtered);
  placeMarkers(filtered);
});

// -------------------------------------
// CATEGORY FILTER
// -------------------------------------
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");

    selectedCategory = chip.dataset.service;

    const filtered = WORKSHOPS.filter(w => w.service === selectedCategory);

    renderWorkshopList(filtered);
    placeMarkers(filtered);
  });
});

// -------------------------------------
// GET DIRECTIONS BUTTON
// -------------------------------------
document.getElementById("directions-btn").addEventListener("click", () => {
  if (!selectedWorkshop) {
    alert("Select a workshop first!");
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedWorkshop.lat},${selectedWorkshop.lng}`;
  window.open(url, "_blank");
});
