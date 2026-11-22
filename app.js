// ===== FIXED & HARDENED app.js FOR LABDESK =====
const ADMIN_USER = "swagato";
const ADMIN_PASS = "swagato@1234";
const STORAGE_KEY = "labdesk_site_data_v1";

const DEFAULT_DATA = {
  siteTitle: "LabDesk",
  siteSubtitle: "Clinical Ops & QC Suite",
  welcomeHeading: "Welcome to LabDesk Diagnostic Portal",
  welcomeBody:
    "Standardized clinical calculators, Westgard IQC evaluation, and Bio-Medical Waste compliance for bench accuracy.",
  customPages: [],
  photos: [
    {
      id: "p1",
      title: "Biochemistry & Hematology Bench Workflow",
      url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "p2",
      title: "Microscopy & Peripheral Smear Verification",
      url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80",
    },
  ],
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadSiteData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw);
    return {
      ...cloneDefaults(),
      ...parsed,
      customPages: Array.isArray(parsed.customPages) ? parsed.customPages : [],
      photos: Array.isArray(parsed.photos) ? parsed.photos : cloneDefaults().photos,
    };
  } catch (err) {
    console.warn("Resetting corrupted LabDesk storage:", err);
    localStorage.removeItem(STORAGE_KEY);
    return cloneDefaults();
  }
}

let siteData = loadSiteData();
let isAdminLoggedIn = sessionStorage.getItem("labdesk_admin_auth") === "true";

function saveSiteData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
  } catch (err) {
    alert("Storage quota exceeded (try using smaller images or image URLs).");
  }
  renderSiteState();
}

const tabMeta = {
  dashboard: [
    "Dashboard & Critical Alert Ranges",
    "Quick bench reference, NABL panic thresholds & daily diagnostic utilities",
  ],
  calculators: [
    "Clinical Laboratory Calculators",
    "Coagulation, renal, lipid, electrolyte & hematology equations",
  ],
  qc: [
    "Internal Quality Control & Westgard Rules",
    "Statistical CV% calculation and multi-rule run evaluation",
  ],
  bmw: [
    "Bio-Medical Waste (BMW) Segregation",
    "Color-coded disposal guidelines for diagnostic laboratories",
  ],
  gallery: [
    "Lab SOPs & Equipment Media",
    "Visual bench guides, analyzer references & uploaded charts",
  ],
};

function switchTab(tabName) {
  const targetPanel = document.getElementById(`tab-${tabName}`);
  if (!targetPanel) return;

  document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
  const activeBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  targetPanel.classList.add("active");

  if (tabMeta[tabName]) {
    const titleEl = document.getElementById("pageHeaderTitle");
    const descEl = document.getElementById("pageHeaderDesc");
    if (titleEl) titleEl.textContent = tabMeta[tabName][0];
    if (descEl) descEl.textContent = tabMeta[tabName][1];
  }

  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("open");
}

function openCustomPage(pageId, btnEl) {
  const page = siteData.customPages.find((p) => p.id === pageId);
  if (!page) return;

  document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  const customPanel = document.getElementById("tab-custom-page");
  if (customPanel) customPanel.classList.add("active");

  document.getElementById("pageHeaderTitle").textContent = page.title;
  document.getElementById("pageHeaderDesc").textContent = "Custom Laboratory SOP / Reference Page";
  document.getElementById("customPageTitle").textContent = page.title;
  document.getElementById("customPageBody").innerHTML = page.content;

  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("open");
}

function renderSiteState() {
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText("siteTitle", siteData.siteTitle);
  setText("siteSubtitle", siteData.siteSubtitle);
  setText("welcomeHeading", siteData.welcomeHeading);
  setText("welcomeBody", siteData.welcomeBody);

  // Render Custom Sidebar Pages
  const customNav = document.getElementById("customNavLinks");
  if (customNav) {
    customNav.innerHTML = "";
    siteData.customPages.forEach((page) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-item";
      btn.innerHTML = `<span class="nav-icon">📄</span> ${page.title}`;
      btn.addEventListener("click", () => openCustomPage(page.id, btn));
      customNav.appendChild(btn);
    });
  }

  // Render Photo Gallery
  const gallery = document.getElementById("photoGalleryGrid");
  if (gallery) {
    gallery.innerHTML = siteData.photos.length
      ? siteData.photos
          .map(
            (p) => `
        <div class="photo-card">
          <img src="${p.url}" alt="${p.title}" loading="lazy" />
          <div class="photo-card-body">${p.title}</div>
        </div>
      `
          )
          .join("")
      : `<p class="muted-text">No photos uploaded yet. Login to Admin Panel to add images.</p>`;
  }

  // Admin UI Status
  const badge = document.getElementById("adminStatusBadge");
  const logoutBtn = document.getElementById("logoutBtn");
  if (badge && logoutBtn) {
    if (isAdminLoggedIn) {
      badge.textContent = "Admin: Swagato";
      badge.classList.add("admin-active");
      logoutBtn.classList.remove("hidden");
    } else {
      badge.textContent = "Guest View";
      badge.classList.remove("admin-active");
      logoutBtn.classList.add("hidden");
    }
  }

  renderAdminLists();
}

function renderAdminLists() {
  const pagesList = document.getElementById("adminPagesList");
  if (pagesList) {
    pagesList.innerHTML = siteData.customPages.length
      ? siteData.customPages
          .map(
            (p) => `
        <div class="admin-list-item">
          <span>📄 ${p.title}</span>
          <button type="button" class="btn-danger" onclick="deleteCustomPage('${p.id}')">Delete</button>
        </div>
      `
          )
          .join("")
      : `<p class="muted-text">No custom pages created yet.</p>`;
  }

  const photosList = document.getElementById("adminPhotosList");
  if (photosList) {
    photosList.innerHTML = siteData.photos
      .map(
        (p) => `
    <div class="admin-list-item">
      <span>🖼️ ${p.title}</span>
      <button type="button" class="btn-danger" onclick="deletePhoto('${p.id}')">Remove</button>
    </div>
  `
      )
      .join("");
  }
}

function openAdminPanel() {
  document.getElementById("editSiteTitle").value = siteData.siteTitle;
  document.getElementById("editSiteSubtitle").value = siteData.siteSubtitle;
  document.getElementById("editWelcomeHeading").value = siteData.welcomeHeading;
  document.getElementById("editWelcomeBody").value = siteData.welcomeBody;
  renderAdminLists();
  document.getElementById("adminPanelModal").classList.remove("hidden");
}

// ===== GLOBAL CLICK DELEGATION (GUARANTEES CLICKS NEVER STALL) =====
document.addEventListener("click", (e) => {
  // 1. Sidebar Built-in Tab Clicks
  const navBtn = e.target.closest(".nav-item[data-tab]");
  if (navBtn) {
    switchTab(navBtn.dataset.tab);
    return;
  }

  // 2. Mobile Menu Toggle
  if (e.target.closest("#mobileMenuBtn")) {
    const sb = document.getElementById("sidebar");
    if (sb) sb.classList.toggle("open");
    return;
  }

  // 3. Open Admin Modal
  if (e.target.closest("#openAdminModalBtn")) {
    if (isAdminLoggedIn) {
      openAdminPanel();
    } else {
      const err = document.getElementById("loginErrorMsg");
      if (err) err.classList.add("hidden");
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
    return;
  }

  // 4. Close Modals
  if (e.target.closest("#closeLoginModalBtn")) {
    document.getElementById("adminLoginModal").classList.add("hidden");
    return;
  }
  if (e.target.closest("#closeAdminPanelBtn")) {
    document.getElementById("adminPanelModal").classList.add("hidden");
    return;
  }

  // 5. Submit Admin Login
  if (e.target.closest("#submitLoginBtn")) {
    const u = document.getElementById("adminUserInput").value.trim();
    const p = document.getElementById("adminPassInput").value;
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      isAdminLoggedIn = true;
      sessionStorage.setItem("labdesk_admin_auth", "true");
      document.getElementById("adminLoginModal").classList.add("hidden");
      renderSiteState();
      openAdminPanel();
    } else {
      document.getElementById("loginErrorMsg").classList.remove("hidden");
    }
    return;
  }

  // 6. Logout
  if (e.target.closest("#logoutBtn")) {
    isAdminLoggedIn = false;
    sessionStorage.removeItem("labdesk_admin_auth");
    document.getElementById("adminPanelModal").classList.add("hidden");
    renderSiteState();
    return;
  }

  // 7. Admin Panel Sub-Tabs
  const adminTab = e.target.closest(".admin-tab-btn");
  if (adminTab) {
    document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
    adminTab.classList.add("active");
    document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
    const sec = document.getElementById(`admin-${adminTab.dataset.admintab}`);
    if (sec) sec.classList.add("active");
    return;
  }

  // 8. Save Site Edits
  if (e.target.closest("#saveSiteSettingsBtn")) {
    siteData.siteTitle = document.getElementById("editSiteTitle").value.trim() || "LabDesk";
    siteData.siteSubtitle = document.getElementById("editSiteSubtitle").value.trim();
    siteData.welcomeHeading = document.getElementById("editWelcomeHeading").value.trim();
    siteData.welcomeBody = document.getElementById("editWelcomeBody").value.trim();
    saveSiteData();
    alert("Website details updated!");
    return;
  }

  // 9. Create Custom Page
  if (e.target.closest("#createPageBtn")) {
    const title = document.getElementById("newPageTitle").value.trim();
    const content = document.getElementById("newPageContent").value.trim();
    if (!title || !content) return alert("Enter both a Page Title and Page Content.");

    siteData.customPages.push({
      id: "page_" + Date.now(),
      title,
      content,
    });
    document.getElementById("newPageTitle").value = "";
    document.getElementById("newPageContent").value = "";
    saveSiteData();
    alert(`Page "${title}" added to sidebar!`);
    return;
  }

  // 10. Add Photo
  if (e.target.closest("#addPhotoBtn")) {
    const title = document.getElementById("photoTitleInput").value.trim() || "Lab Reference Photo";
    const urlInput = document.getElementById("photoUrlInput").value.trim();
    const fileInput = document.getElementById("photoFileInput");

    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        siteData.photos.unshift({ id: "img_" + Date.now(), title, url: ev.target.result });
        fileInput.value = "";
        document.getElementById("photoTitleInput").value = "";
        saveSiteData();
        alert("Photo uploaded to gallery!");
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else if (urlInput) {
      siteData.photos.unshift({ id: "img_" + Date.now(), title, url: urlInput });
      document.getElementById("photoUrlInput").value = "";
      document.getElementById("photoTitleInput").value = "";
      saveSiteData();
      alert("Photo added to gallery!");
    } else {
      alert("Select an image file or enter an image URL.");
    }
    return;
  }

  // 11. Export JSON
  if (e.target.closest("#exportJsonBtn")) {
    const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "labdesk-backup.json";
    a.click();
    return;
  }

  // 12. Reset Defaults
  if (e.target.closest("#resetDefaultBtn")) {
    if (confirm("Reset all custom pages, photos, and text edits to default?")) {
      siteData = cloneDefaults();
      saveSiteData();
    }
  }
});

// ===== SEARCH FILTERS =====
document.addEventListener("input", (e) => {
  if (e.target.id === "panicSearch") {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#panicTable tbody tr").forEach((row) => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  }
  if (e.target.id === "bmwSearch") {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".bmw-card").forEach((card) => {
      const text = (card.textContent + " " + (card.dataset.keywords || "")).toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  }
});

// ===== GLOBAL CALCULATOR & ADMIN DELETE FUNCTIONS =====
window.deleteCustomPage = function (id) {
  siteData.customPages = siteData.customPages.filter((p) => p.id !== id);
  saveSiteData();
};

window.deletePhoto = function (id) {
  siteData.photos = siteData.photos.filter((p) => p.id !== id);
  saveSiteData();
};

window.calcPTINR = function () {
  const pt = parseFloat(document.getElementById("ptPatient").value);
  const mnpt = parseFloat(document.getElementById("ptControl").value);
  const isi = parseFloat(document.getElementById("ptIsi").value);
  if (!pt || !mnpt || !isi) return alert("Enter valid PT, MNPT, and ISI values.");

  const inr = Math.pow(pt / mnpt, isi);
  const ratio = pt / mnpt;
  const flag = inr > 5.0 ? " ⚠️ CRITICAL (>5.0)" : inr >= 2.0 && inr <= 3.0 ? " ✅ Therapeutic Range" : "";
  document.getElementById("resPTINR").innerHTML = `INR: <strong>${inr.toFixed(2)}</strong> | PT Ratio: ${ratio.toFixed(2)}${flag}`;
};

window.calcEGFR = function () {
  const cr = parseFloat(document.getElementById("egfrCr").value);
  const age = parseFloat(document.getElementById("egfrAge").value);
  const sex = document.getElementById("egfrSex").value;
  if (!cr || !age) return alert("Enter Creatinine and Age.");

  const kappa = sex === "female" ? 0.7 : 0.9;
  const alpha = sex === "female" ? -0.241 : -0.302;
  const sexFactor = sex === "female" ? 1.012 : 1.0;

  const minPart = Math.min(cr / kappa, 1);
  const maxPart = Math.max(cr / kappa, 1);
  const egfr = 142 * Math.pow(minPart, alpha) * Math.pow(maxPart, -1.2) * Math.pow(0.9938, age) * sexFactor;

  let stage = "G1 (Normal >=90)";
  if (egfr < 15) stage = "G5 (Kidney Failure <15)";
  else if (egfr < 30) stage = "G4 (Severely Decreased)";
  else if (egfr < 45) stage = "G3b (Mod-Severe)";
  else if (egfr < 60) stage = "G3a (Mild-Moderate)";
  else if (egfr < 90) stage = "G2 (Mildly Decreased)";

  document.getElementById("resEGFR").innerHTML = `eGFR: <strong>${egfr.toFixed(1)} mL/min/1.73m²</strong><br>Stage: ${stage}`;
};

window.calcLipid = function () {
  const tc = parseFloat(document.getElementById("lipTC").value);
  const hdl = parseFloat(document.getElementById("lipHDL").value);
  const tg = parseFloat(document.getElementById("lipTG").value);
  if (!tc || !hdl || !tg) return alert("Enter Total Cholesterol, HDL, and Triglycerides.");

  if (tg > 400) {
    document.getElementById("resLipid").innerHTML = `⚠️ TG > 400 mg/dL: Friedewald formula invalid. Use Direct LDL assay.`;
    return;
  }
  const vldl = tg / 5;
  const ldl = tc - hdl - vldl;
  const nonHdl = tc - hdl;
  document.getElementById("resLipid").innerHTML = `LDL: <strong>${ldl.toFixed(1)} mg/dL</strong> | VLDL: ${vldl.toFixed(1)} | Non-HDL: ${nonHdl.toFixed(1)}`;
};

window.calcCalcium = function () {
  const ca = parseFloat(document.getElementById("caMeas").value);
  const alb = parseFloat(document.getElementById("caAlb").value);
  if (!ca || !alb) return alert("Enter Measured Calcium and Serum Albumin.");

  const corrCa = ca + 0.8 * (4.0 - alb);
  document.getElementById("resCalcium").innerHTML = `Corrected Calcium: <strong>${corrCa.toFixed(2)} mg/dL</strong> (Ref: 8.5–10.5)`;
};

window.calcOsmolality = function () {
  const na = parseFloat(document.getElementById("osmNa").value);
  const glu = parseFloat(document.getElementById("osmGlu").value);
  const bun = parseFloat(document.getElementById("osmBun").value);
  const meas = parseFloat(document.getElementById("osmMeas").value);
  if (!na || isNaN(glu) || isNaN(bun)) return alert("Enter Na+, Glucose, and BUN.");

  const calcOsm = 2 * na + glu / 18 + bun / 2.8;
  let out = `Calculated Osm: <strong>${calcOsm.toFixed(1)} mOsm/kg</strong>`;
  if (meas) {
    const gap = meas - calcOsm;
    out += `<br>Osmolal Gap: <strong>${gap.toFixed(1)}</strong> (Normal < 10)`;
  }
  document.getElementById("resOsm").innerHTML = out;
};

window.calcRBC = function () {
  const hb = parseFloat(document.getElementById("rbcHb").value);
  const hct = parseFloat(document.getElementById("rbcHct").value);
  const rbc = parseFloat(document.getElementById("rbcCount").value);
  if (!hb || !hct || !rbc) return alert("Enter Hb, HCT, and RBC Count.");

  const mcv = (hct * 10) / rbc;
  const mch = (hb * 10) / rbc;
  const mchc = (hb * 100) / hct;
  document.getElementById("resRBC").innerHTML = `MCV: <strong>${mcv.toFixed(1)} fL</strong> | MCH: <strong>${mch.toFixed(1)} pg</strong> | MCHC: <strong>${mchc.toFixed(1)} g/dL</strong>`;
};

window.calcUreaBun = function () {
  const val = parseFloat(document.getElementById("ureaVal").value);
  const dir = document.getElementById("ureaDir").value;
  if (!val) return alert("Enter a numeric value.");

  if (dir === "ureaToBun") {
    document.getElementById("resUrea").innerHTML = `BUN: <strong>${(val / 2.14).toFixed(2)} mg/dL</strong>`;
  } else {
    document.getElementById("resUrea").innerHTML = `Blood Urea: <strong>${(val * 2.14).toFixed(2)} mg/dL</strong>`;
  }
};

window.calcAnionGap = function () {
  const na = parseFloat(document.getElementById("agNa").value);
  const cl = parseFloat(document.getElementById("agCl").value);
  const hco3 = parseFloat(document.getElementById("agHco3").value);
  if (!na || !cl || !hco3) return alert("Enter Na+, Cl-, and HCO3-.");

  const ag = na - (cl + hco3);
  document.getElementById("resAG").innerHTML = `Anion Gap: <strong>${ag.toFixed(1)} mmol/L</strong> (Ref: 8–16)`;
};

window.evaluateWestgard = function () {
  const raw = document.getElementById("qcSeries").value;
  const vals = raw
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((n) => !isNaN(n));
  if (vals.length < 2) return alert("Enter at least 2 comma-separated QC numbers.");

  const tMean = parseFloat(document.getElementById("qcTargetMean").value);
  const tSd = parseFloat(document.getElementById("qcTargetSd").value);

  const mean = !isNaN(tMean) ? tMean : vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (vals.length - 1);
  const sd = !isNaN(tSd) && tSd > 0 ? tSd : Math.sqrt(variance);
  const cv = (sd / mean) * 100;

  const zScores = vals.map((v) => (v - mean) / sd);
  const lastZ = zScores[zScores.length - 1];
  const prevZ = zScores[zScores.length - 2];

  const violations = [];
  if (Math.abs(lastZ) > 3) violations.push("❌ 1-3s VIOLATION (Reject Run)");
  else if (Math.abs(lastZ) > 2) violations.push("⚠️ 1-2s WARNING (Inspect Rule)");

  if ((lastZ > 2 && prevZ > 2) || (lastZ < -2 && prevZ < -2)) {
    violations.push("❌ 2-2s VIOLATION (Systematic Error)");
  }
  if (Math.abs(lastZ - prevZ) > 4) {
    violations.push("❌ R-4s VIOLATION (Random Error)");
  }
  if (zScores.length >= 4) {
    const last4 = zScores.slice(-4);
    if (last4.every((z) => z > 1
