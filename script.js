"use strict";

const WHATSAPP_NUMBER = "972586543332";

const pickupInput = document.getElementById("pickup-search");
const destinationInput = document.getElementById("destination-search");

const pickupOptions = document.getElementById("pickup-options");
const destinationOptions = document.getElementById("destination-options");

const pickupHelp = document.getElementById("pickup-help");
const destinationHelp = document.getElementById("destination-help");

const resultCard = document.getElementById("result-card");
const deliveryPrice = document.getElementById("delivery-price");
const estimatedArrival = document.getElementById("estimated-arrival");

const whatsappButton = document.getElementById("whatsapp-button");
const resetButton = document.getElementById("reset-button");

let selectedPickup = "";
let selectedDestination = "";

/*
  נתוני המחירים יגיעו מהקובץ data.js שניצור בשלב הבא.
  המבנה הצפוי:

  window.VIBO_ROUTES = {
    "קריית שמונה": {
      "בית הלל": 35,
      "כפר גלעדי": 30
    }
  };
*/

function getRoutes() {
  return window.VIBO_ROUTES || {};
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function filterNames(names, searchValue) {
  const query = normalizeText(searchValue);

  if (!query) {
    return names;
  }

  return names.filter((name) =>
    normalizeText(name).includes(query)
  );
}

function closeOptions(container) {
  container.classList.remove("open");
  container.innerHTML = "";
}

function closeAllOptions() {
  closeOptions(pickupOptions);
  closeOptions(destinationOptions);
}

function createOptionButton(name, onSelect) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "option-button";
  button.textContent = name;
  button.setAttribute("role", "option");

  button.addEventListener("click", () => {
    onSelect(name);
  });

  return button;
}

function renderOptions(container, names, onSelect) {
  container.innerHTML = "";

  if (!names.length) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "empty-options";
    emptyMessage.textContent = "לא נמצאו תוצאות";

    container.appendChild(emptyMessage);
    container.classList.add("open");
    return;
  }

  names.forEach((name) => {
    container.appendChild(
      createOptionButton(name, onSelect)
    );
  });

  container.classList.add("open");
}

function getPickupNames() {
  return Object.keys(getRoutes()).sort((a, b) =>
    a.localeCompare(b, "he")
  );
}

function getDestinationNames(pickup) {
  const pickupRoutes = getRoutes()[pickup] || {};

  return Object.keys(pickupRoutes).sort((a, b) =>
    a.localeCompare(b, "he")
  );
}

function choosePickup(name) {
  selectedPickup = name;
  selectedDestination = "";

  pickupInput.value = name;
  destinationInput.value = "";

  destinationInput.disabled = false;
  destinationInput.focus();

  pickupHelp.textContent = `נקודת האיסוף שנבחרה: ${name}`;
  destinationHelp.textContent = "התחילו להקליד את נקודת המסירה";

  closeOptions(pickupOptions);
  closeOptions(destinationOptions);

  hideResult();
}

function chooseDestination(name) {
  selectedDestination = name;
  destinationInput.value = name;

  destinationHelp.textContent = `נקודת המסירה שנבחרה: ${name}`;

  closeOptions(destinationOptions);

  calculateDelivery();
}

function calculateDelivery() {
  const routes = getRoutes();

  if (
    !selectedPickup ||
    !selectedDestination ||
    !routes[selectedPickup]
  ) {
    hideResult();
    return;
  }

  const price = routes[selectedPickup][selectedDestination];

  if (typeof price !== "number") {
    hideResult();
    return;
  }

  const arrivalTime = calculateEstimatedArrival(price);

  deliveryPrice.textContent = price;
  estimatedArrival.textContent = arrivalTime;

  resultCard.hidden = false;
  resetButton.hidden = false;

  activateWhatsApp(price, arrivalTime);

  resultCard.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function calculateEstimatedArrival(price) {
  /*
    הערכה ראשונית לפי מרחק המסלול המשתקף במחיר.
    בהמשך ניתן לחבר לזמינות שליחים בזמן אמת.
  */

  if (price <= 35) {
    return "עד 60 דקות";
  }

  if (price <= 55) {
    return "עד 75 דקות";
  }

  return "עד 90 דקות";
}

function activateWhatsApp(price, arrivalTime) {
  const message = [
    "שלום VIBO, אני מעוניין להזמין משלוח.",
    "",
    `נקודת איסוף: ${selectedPickup}`,
    `נקודת מסירה: ${selectedDestination}`,
    `מחיר שהוצג במחשבון: ₪${price}`,
    `זמן הגעה משוער: ${arrivalTime}`
  ].join("\n");

  const encodedMessage = encodeURIComponent(message);

  whatsappButton.href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  whatsappButton.classList.remove("disabled");
  whatsappButton.setAttribute("aria-disabled", "false");
}

function disableWhatsApp() {
  whatsappButton.href = "#";
  whatsappButton.classList.add("disabled");
  whatsappButton.setAttribute("aria-disabled", "true");
}

function hideResult() {
  resultCard.hidden = true;
  resetButton.hidden = true;

  deliveryPrice.textContent = "0";
  estimatedArrival.textContent = "עד 90 דקות";

  disableWhatsApp();
}

function resetCalculator() {
  selectedPickup = "";
  selectedDestination = "";

  pickupInput.value = "";
  destinationInput.value = "";

  destinationInput.disabled = true;

  pickupHelp.textContent = "התחילו להקליד את שם היישוב";
  destinationHelp.textContent = "קודם בחרו נקודת איסוף";

  closeAllOptions();
  hideResult();

  pickupInput.focus();
}

pickupInput.addEventListener("focus", () => {
  const names = filterNames(
    getPickupNames(),
    pickupInput.value
  );

  renderOptions(
    pickupOptions,
    names,
    choosePickup
  );
});

pickupInput.addEventListener("input", () => {
  selectedPickup = "";
  selectedDestination = "";

  destinationInput.value = "";
  destinationInput.disabled = true;

  destinationHelp.textContent = "קודם בחרו נקודת איסוף";

  hideResult();
  closeOptions(destinationOptions);

  const names = filterNames(
    getPickupNames(),
    pickupInput.value
  );

  renderOptions(
    pickupOptions,
    names,
    choosePickup
  );
});

destinationInput.addEventListener("focus", () => {
  if (!selectedPickup) {
    return;
  }

  const names = filterNames(
    getDestinationNames(selectedPickup),
    destinationInput.value
  );

  renderOptions(
    destinationOptions,
    names,
    chooseDestination
  );
});

destinationInput.addEventListener("input", () => {
  selectedDestination = "";
  hideResult();

  if (!selectedPickup) {
    return;
  }

  const names = filterNames(
    getDestinationNames(selectedPickup),
    destinationInput.value
  );

  renderOptions(
    destinationOptions,
    names,
    chooseDestination
  );
});

resetButton.addEventListener("click", resetCalculator);

document.addEventListener("click", (event) => {
  const clickedInsidePickup =
    pickupInput.contains(event.target) ||
    pickupOptions.contains(event.target);

  const clickedInsideDestination =
    destinationInput.contains(event.target) ||
    destinationOptions.contains(event.target);

  if (!clickedInsidePickup) {
    closeOptions(pickupOptions);
  }

  if (!clickedInsideDestination) {
    closeOptions(destinationOptions);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllOptions();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  hideResult();

  if (!Object.keys(getRoutes()).length) {
    pickupHelp.textContent =
      "נתוני המחירון יתווספו בשלב הבא";
  }
});
