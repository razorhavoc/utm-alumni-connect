let alumniData = [];
let currentFilteredList = [];
const ITEMS_PER_PAGE = 6;
let visibleCount = ITEMS_PER_PAGE;

// DOM Elements
const alumniGrid = document.getElementById("alumniGrid");
const emptyState = document.getElementById("emptyState");
const resultsCount = document.getElementById("resultsCount");
const viewMoreContainer = document.getElementById("viewMoreContainer");
const viewMoreBtn = document.getElementById("viewMoreBtn");

const searchInput = document.getElementById("searchInput");
const facultyFilter = document.getElementById("facultyFilter");
const industryFilter = document.getElementById("industryFilter");
const locationFilter = document.getElementById("locationFilter");
const yearFilter = document.getElementById("yearFilter");
const mentorOnly = document.getElementById("mentorOnly");
const resetBtn = document.getElementById("resetBtn");
const emptyResetBtn = document.getElementById("emptyResetBtn");

// Modal Elements
const profileModal = document.getElementById("profileModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const connectForm = document.getElementById("connectForm");
const formFeedback = document.getElementById("formFeedback");

// 1. Fetch JSON Data on Load
async function initAlumniTracker() {
  try {
    const response = await fetch("data/alumni.json");
    if (!response.ok) throw new Error("Failed to load alumni.json");
    alumniData = await response.json();

    populateStats(alumniData);
    populateFilterDropdowns(alumniData);

    currentFilteredList = [...alumniData];
    visibleCount = ITEMS_PER_PAGE;
    renderAlumniCards();
  } catch (error) {
    resultsCount.textContent =
      "Unable to load alumni.json. Please open this project using a local server (e.g., VS Code Live Server).";
    console.error(error);
  }
}

// 2. Populate Hero Stats
function populateStats(data) {
  document.getElementById("statTotal").textContent = data.length;
  const uniqueFaculties = new Set(data.map((item) => item.faculty));
  document.getElementById("statFaculties").textContent = uniqueFaculties.size;
  const mentorCount = data.filter((item) => item.openToMentor).length;
  document.getElementById("statMentors").textContent = mentorCount;
}

// 3. Dynamically Populate Filter Options from JSON
function populateFilterDropdowns(data) {
  const addOptions = (selectEl, values) => {
    [...new Set(values)].sort().forEach((val) => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      selectEl.appendChild(option);
    });
  };

  addOptions(facultyFilter, data.map((a) => a.faculty));
  addOptions(industryFilter, data.map((a) => a.industry));
  addOptions(locationFilter, data.map((a) => a.location));
  addOptions(
    yearFilter,
    data.map((a) => a.gradYear.toString()).sort((a, b) => b - a)
  );
}

// 4. Render Alumni Cards (Paginated by visibleCount)
function renderAlumniCards() {
  alumniGrid.innerHTML = "";
  const totalMatches = currentFilteredList.length;

  if (totalMatches === 0) {
    resultsCount.textContent = `Showing 0 of ${alumniData.length} UTM alumni`;
    emptyState.classList.remove("hidden");
    viewMoreContainer.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  const visibleItems = currentFilteredList.slice(0, visibleCount);
  resultsCount.textContent = `Showing ${visibleItems.length} of ${totalMatches} matching UTM alumni`;

  visibleItems.forEach((alumnus) => {
    const card = document.createElement("article");
    card.className = "alumni-card";

    card.innerHTML = `
      <div>
        <div class="card-top">
          <img src="${alumnus.avatar}" alt="${alumnus.name}" class="avatar" />
          <div>
            <h3 class="card-title">${alumnus.name}</h3>
            <p class="card-role">${alumnus.role} @ ${alumnus.company}</p>
          </div>
        </div>

        <div class="card-tags">
          <span class="tag">${alumnus.faculty}</span>
          <span class="tag">Class of ${alumnus.gradYear}</span>
          <span class="tag">${alumnus.location}</span>
          ${
            alumnus.openToMentor
              ? '<span class="tag tag-mentor">Open to Mentor</span>'
              : ""
          }
        </div>

        <p class="card-impact">${alumnus.impactSummary}</p>
      </div>

      <button type="button" class="btn-primary view-profile-btn" data-id="${alumnus.id}">
        View Career &amp; Impact
      </button>
    `;

    alumniGrid.appendChild(card);
  });

  // Toggle & update "View More" button
  const remaining = totalMatches - visibleItems.length;
  if (remaining > 0) {
    const nextBatch = Math.min(ITEMS_PER_PAGE, remaining);
    viewMoreBtn.textContent = `View More (${nextBatch} of ${remaining} remaining)`;
    viewMoreContainer.classList.remove("hidden");
  } else {
    viewMoreContainer.classList.add("hidden");
  }

  // Attach Modal Triggers
  document.querySelectorAll(".view-profile-btn").forEach((btn) => {
    btn.addEventListener("click", () => openProfileModal(btn.dataset.id));
  });
}

// 5. Interaction 1: Multi-Criteria Search & Filtering
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const faculty = facultyFilter.value;
  const industry = industryFilter.value;
  const location = locationFilter.value;
  const year = yearFilter.value;
  const onlyMentors = mentorOnly.checked;

  currentFilteredList = alumniData.filter((a) => {
    const matchesQuery =
      !query ||
      a.name.toLowerCase().includes(query) ||
      a.role.toLowerCase().includes(query) ||
      a.company.toLowerCase().includes(query) ||
      a.impactSummary.toLowerCase().includes(query);

    const matchesFaculty = !faculty || a.faculty === faculty;
    const matchesIndustry = !industry || a.industry === industry;
    const matchesLocation = !location || a.location === location;
    const matchesYear = !year || a.gradYear.toString() === year;
    const matchesMentor = !onlyMentors || a.openToMentor;

    return (
      matchesQuery &&
      matchesFaculty &&
      matchesIndustry &&
      matchesLocation &&
      matchesYear &&
      matchesMentor
    );
  });

  // Reset pagination back to 6 whenever filters change
  visibleCount = ITEMS_PER_PAGE;
  renderAlumniCards();
}

function resetAllFilters() {
  searchInput.value = "";
  facultyFilter.value = "";
  industryFilter.value = "";
  locationFilter.value = "";
  yearFilter.value = "";
  mentorOnly.checked = false;

  currentFilteredList = [...alumniData];
  visibleCount = ITEMS_PER_PAGE;
  renderAlumniCards();
}

// Expand 6 more cards on click
viewMoreBtn.addEventListener("click", () => {
  visibleCount += ITEMS_PER_PAGE;
  renderAlumniCards();
});

// 6. Interaction 2: Open Detail Modal
function openProfileModal(id) {
  const alumnus = alumniData.find((a) => a.id === id);
  if (!alumnus) return;

  document.getElementById("modalAvatar").src = alumnus.avatar;
  document.getElementById("modalName").textContent = alumnus.name;
  document.getElementById("modalRole").textContent = `${alumnus.role} at ${alumnus.company}`;
  document.getElementById("modalMeta").textContent = `${alumnus.faculty} (${alumnus.programme}) • Class of ${alumnus.gradYear} • ${alumnus.location}`;
  document.getElementById("modalImpact").textContent = alumnus.impactSummary;
  document.getElementById("connectTargetName").textContent = alumnus.name;

  const mentorBadge = document.getElementById("modalMentorBadge");
  mentorBadge.classList.toggle("hidden", !alumnus.openToMentor);

  const listEl = document.getElementById("modalAchievements");
  listEl.innerHTML = "";
  alumnus.achievements.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    listEl.appendChild(li);
  });

  connectForm.reset();
  formFeedback.textContent = "";
  formFeedback.className = "form-feedback";

  profileModal.classList.remove("hidden");
}

function closeProfileModal() {
  profileModal.classList.add("hidden");
}

// 7. Interaction 3: Connection Form Validation & Confirmation
connectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("senderName").value.trim();
  const email = document.getElementById("senderEmail").value.trim();
  const message = document.getElementById("senderMessage").value.trim();
  const target = document.getElementById("connectTargetName").textContent;

  if (!name || !email || !message) {
    formFeedback.textContent = "Please complete all fields before sending your request.";
    formFeedback.className = "form-feedback feedback-error";
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    formFeedback.textContent = "Please enter a valid email address.";
    formFeedback.className = "form-feedback feedback-error";
    return;
  }

  formFeedback.textContent = `Request sent! Your message to ${target} has been logged for alumni outreach.`;
  formFeedback.className = "form-feedback feedback-success";
  connectForm.reset();
});

// Event Listeners
searchInput.addEventListener("input", applyFilters);
facultyFilter.addEventListener("change", applyFilters);
industryFilter.addEventListener("change", applyFilters);
locationFilter.addEventListener("change", applyFilters);
yearFilter.addEventListener("change", applyFilters);
mentorOnly.addEventListener("change", applyFilters);
resetBtn.addEventListener("click", resetAllFilters);
emptyResetBtn.addEventListener("click", resetAllFilters);

closeModalBtn.addEventListener("click", closeProfileModal);
modalBackdrop.addEventListener("click", closeProfileModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !profileModal.classList.contains("hidden")) {
    closeProfileModal();
  }
});

initAlumniTracker();
