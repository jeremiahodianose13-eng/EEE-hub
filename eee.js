
const storageKey = "eeeHubUser";
const sessionKey = "eeeHubSession";
const toastContainer = document.getElementById("toastContainer");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const studentNameInput = document.getElementById("studentName");
const studentMatNumberInput = document.getElementById("studentMatNumber");
const studentDepartmentInput = document.getElementById("studentDepartment");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const profileBox = document.getElementById("profileBox");
const loginNav = document.getElementById("loginNav");
const closeLoginBtn = document.querySelector(".close-login");
const appMain = document.getElementById("appMain");
const sidebar = document.querySelector(".sidebar");
const splashScreen = document.getElementById("splashScreen");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const signOutBtn = document.getElementById("signOutBtn");
const mobileSignOutBtn = document.getElementById("mobileSignOutBtn");
const notificationButton = document.getElementById("notificationButton");
const notificationBadge = document.getElementById("notificationBadge");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const clearNotificationsButton = document.getElementById("clearNotifications");
const notificationStorageKey = "eeeHubNotifications";

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .map(word => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function updateProfile(user) {
    if (!user || !user.name) {
        userName.textContent = "Guest";
        userAvatar.textContent = "G";
        return;
    }

    userName.textContent = user.name;
    userAvatar.textContent = getInitials(user.name);
}

function saveUser(user) {
    localStorage.setItem(storageKey, JSON.stringify(user));
}

function saveSessionStatus(isActive) {
    localStorage.setItem(sessionKey, String(isActive));
}

function getSavedUser() {
    const savedData = localStorage.getItem(storageKey);

    if (!savedData) {
        return null;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        return null;
    }
}

function populateLoginFields(user) {
    if (!user) return;

    studentNameInput.value = user.name || "";
    studentMatNumberInput.value = user.matricNumber || "";
    studentDepartmentInput.value = user.department || "";
}

function openLoginModal() {
    const savedUser = getSavedUser();
    if (savedUser) {
        populateLoginFields(savedUser);
    }

    loginModal.classList.remove("hidden");
    loginModal.setAttribute("aria-hidden", "false");
    studentNameInput.focus();
}

function closeLoginModal() {
    loginModal.classList.add("hidden");
    loginModal.setAttribute("aria-hidden", "true");
}

function clearUserSession() {
    saveSessionStatus(false);
    updateProfile(null);
    const savedUser = getSavedUser();
    if (savedUser) {
        populateLoginFields(savedUser);
    } else {
        studentNameInput.value = "";
        studentMatNumberInput.value = "";
        studentDepartmentInput.value = "";
    }
    appMain.style.display = "none";
    if (sidebar) sidebar.style.display = "none";
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "false");
    if (sidebar) sidebar.classList.remove("open");
    openLoginModal();
    showToast("You have been signed out. Please login again.");
}

function hideSplashScreen() {
    if (!splashScreen) return;
    setTimeout(() => {
        splashScreen.classList.add("hidden");
    }, 1200);
}

function lockSiteUntilLogin() {
    const savedUser = getSavedUser();
    const sessionActive = localStorage.getItem(sessionKey) === "true";

    if (!savedUser || !sessionActive) {
        appMain.style.display = "none";
        if (sidebar) sidebar.style.display = "none";
        if (savedUser) populateLoginFields(savedUser);
        openLoginModal();
        return true;
    }

    appMain.style.display = "block";
    if (sidebar) sidebar.style.display = "flex";
    closeLoginModal();
    return false;
}

loginNav?.addEventListener("click", function (event) {
    event.preventDefault();
    openLoginModal();
});

if (signOutBtn) {
    signOutBtn?.addEventListener("click", clearUserSession);
}

if (mobileSignOutBtn) {
    mobileSignOutBtn?.addEventListener("click", function (event) {
        event.preventDefault();
        clearUserSession();
    });
}

closeLoginBtn?.addEventListener("click", closeLoginModal);

loginModal?.addEventListener("click", function (event) {
    if (event.target === loginModal) {
        closeLoginModal();
    }
});

profileBox?.addEventListener("click", function () {
    openLoginModal();
});

profileBox?.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLoginModal();
    }
});

if (hamburgerBtn && sidebar) {
    function setSidebarOpen(isOpen) {
        sidebar.classList.toggle("open", isOpen);
        hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
        hamburgerBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    }

    hamburgerBtn?.addEventListener("click", function () {
        setSidebarOpen(!sidebar.classList.contains("open"));
    });

    sidebar.querySelectorAll("a").forEach(link => {
        link?.addEventListener("click", function () {
            setSidebarOpen(false);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && sidebar.classList.contains("open")) {
            setSidebarOpen(false);
            hamburgerBtn.focus();
        }
    });
}

loginForm?.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = studentNameInput.value.trim();
    const matNumber = studentMatNumberInput.value.trim();
    const department = studentDepartmentInput.value.trim();

    if (!fullName || !matNumber || !department) {
        showToast("Please fill in your name, matric number, and department.");
        return;
    }

    const validName = /^[A-Za-z][A-Za-z\s'.-]{2,}$/;
    const validMat = /^ENG\d{7,10}$/i;

    if (!validName.test(fullName)) {
        showToast("Name is not valid. Use your full name correctly.");
        return;
    }

    if (!validMat.test(matNumber)) {
        showToast("Matric number is not valid. It must start with ENG and contain numbers, e.g. ENG2410192");
        return;
    }

    const user = {
        name: fullName,
        matricNumber: matNumber,
        department: department
    };

    saveUser(user);
    saveSessionStatus(true);
    updateProfile(user);
    appMain.style.display = "block";
    if (sidebar) sidebar.style.display = "flex";
    closeLoginModal();
    showToast(`Welcome, ${user.name}! Your profile is now active.`);
});

const savedUser = getSavedUser();
if (savedUser && localStorage.getItem(sessionKey) === "true") {
    updateProfile(savedUser);
    appMain.style.display = "block";
    if (sidebar) sidebar.style.display = "flex";
    hideSplashScreen();
} else {
    updateProfile(null);
    if (savedUser) populateLoginFields(savedUser);
    lockSiteUntilLogin();
    hideSplashScreen();
}

showToast("EEE Hub update: new past questions and lecture materials have been added.");

setInterval(() => {
    showToast("New departmental updates are available. Check the latest materials and exam questions.");
}, 20000);

// ================================
// MATERIAL FILTER
// ================================

const defaultMaterialCatalog = [
    {
        title: "EEE 102 Lecture Note",
        description: "PDF • 2.4 MB • First Semester",
        level: "200",
        semester: "first",
        course: "EEE102",
        file: "materials/eee102-note.pdf"
    },
    {
        title: "EEE 102 Circuit Analysis Notes",
        description: "PDF • 1.8 MB • First Semester",
        level: "200",
        semester: "first",
        course: "EEE102",
        file: "materials/circuit-analysis.pdf"
    },
    {
        title: "EEE 201 Lecture Material",
        description: "PDF • 3.1 MB • First Semester",
        level: "200",
        semester: "first",
        course: "EEE201",
        file: "materials/eee201.pdf"
    },
    {
        title: "EEE 101 Basic Electrical Engineering",
        description: "PDF • First Semester",
        level: "200",
        semester: "first",
        course: "EEE101",
        file: "materials/eee101.pdf"
    },
    {
        title: "EEE 102 Circuit Theory Practice",
        description: "PDF • First Semester",
        level: "200",
        semester: "first",
        course: "EEE102",
        file: "materials/eee102-practice.pdf"
    },
    {
        title: "EEE 201 Electromagnetic Fields",
        description: "PDF • First Semester",
        level: "200",
        semester: "first",
        course: "EEE201",
        file: "materials/eee201-fields.pdf"
    },
    {
        title: "EEE 202 Electrical Machines",
        description: "PDF • First Semester",
        level: "200",
        semester: "first",
        course: "EEE202",
        file: "materials/eee202.pdf"
    },
    {
        title: "EEE 202 Machines and Transformers",
        description: "PDF • First Semester",
        level: "200",
        semester: "first",
        course: "EEE202",
        file: "materials/eee202-transformers.pdf"
    },
    {
        title: "EEE Department First Semester Revision",
        description: "PDF • First Semester",
        level: "200",
        semester: "first",
        course: "EEE101",
        file: "materials/eee-first-semester-revision.pdf"
    }
];

const materialStorageKey = "eeeHubMaterials";

function loadMaterialCatalog() {
    const saved = localStorage.getItem(materialStorageKey);
    if (!saved) {
        localStorage.setItem(materialStorageKey, JSON.stringify(defaultMaterialCatalog));
        return [...defaultMaterialCatalog];
    }

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length ? parsed : [...defaultMaterialCatalog];
    } catch (error) {
        return [...defaultMaterialCatalog];
    }
}

let materialCatalog = [];

async function loadMaterialCatalogFromServer() {
    try {
        if (window.location.protocol === 'file:') throw new Error('Offline');
        const response = await fetch("/api/materials");
        if (!response.ok) throw new Error("Unable to load materials");
        materialCatalog = await response.json();
        saveMaterialCatalog();
    } catch (error) {
        materialCatalog = loadMaterialCatalog();
        if (window.location.protocol !== 'file:') {
            showToast("Unable to reach the backend. Showing saved materials.");
        }
    }

    renderMaterials();
    checkForNewMaterials();
}

function saveMaterialCatalog() {
    localStorage.setItem(materialStorageKey, JSON.stringify(materialCatalog));
}

let notifications = JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");

function saveNotifications() {
    localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
}

function renderNotifications() {
    notificationList.innerHTML = "";

    if (!notifications.length) {
        notificationList.innerHTML = '<p class="empty-notification">No new notifications.</p>';
    } else {
        notifications.forEach(notification => {
            const item = document.createElement("div");
            item.className = "notification-item";
            item.innerHTML = `<strong>${notification.title}</strong><span>${notification.message}</span>`;
            notificationList.appendChild(item);
        });
    }

    notificationBadge.textContent = notifications.length;
    notificationBadge.hidden = notifications.length === 0;
}

function checkForNewMaterials() {
    const knownMaterials = JSON.parse(localStorage.getItem("eeeHubKnownMaterials") || "null");
    const currentMaterials = materialCatalog.map(material => material.file);

    if (knownMaterials) {
        const newMaterials = materialCatalog.filter(material => !knownMaterials.includes(material.file));
        newMaterials.forEach(material => {
            notifications.unshift({
                title: "New material added",
                message: material.title
            });
        });
        if (newMaterials.length) {
            showToast(`${newMaterials.length} new material${newMaterials.length > 1 ? "s" : ""} added.`);
        }
        notifications = notifications.slice(0, 10);
        saveNotifications();
    }

    localStorage.setItem("eeeHubKnownMaterials", JSON.stringify(currentMaterials));
    renderNotifications();
}

notificationButton?.addEventListener("click", function () {
    const isOpen = !notificationPanel.hidden;
    notificationPanel.hidden = isOpen;
    notificationButton.setAttribute("aria-expanded", String(!isOpen));
});

clearNotificationsButton?.addEventListener("click", function () {
    notifications = [];
    saveNotifications();
    renderNotifications();
});

document?.addEventListener("click", function (event) {
    if (!event.target.closest(".notification-wrap")) {
        notificationPanel.hidden = true;
        notificationButton.setAttribute("aria-expanded", "false");
    }
});

window?.addEventListener("storage", function (event) {
    if (event.key === "eeeHubKnownMaterials") {
        checkForNewMaterials();
    }
});

checkForNewMaterials();

const materialsList = document.getElementById("materialsList");

function createFallbackTextFile(fileName, title) {
    const content = `EEE Hub Resource\n\nTitle: ${title}\n\nThis resource was generated as a fallback because the original file is not available in the project folder yet.\n\nPlease add the real file to the materials folder to replace this placeholder.`;
    return new Blob([content], { type: "text/plain;charset=utf-8" });
}

async function openMaterialFile(fileUrl, title, isDownload = false) {
    try {
        if (window.location.protocol === 'file:') throw new Error('Offline'); const response = await fetch(fileUrl, { method: "GET" });

        if (!response.ok) {
            throw new Error("File not found");
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (isDownload) {
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileUrl.split("/").pop() || `${title}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            return;
        }

        window.open(objectUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return;
    } catch (error) {
        const fallbackBlob = createFallbackTextFile(fileUrl, title);
        const fallbackUrl = URL.createObjectURL(fallbackBlob);

        if (isDownload) {
            const link = document.createElement("a");
            link.href = fallbackUrl;
            link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.txt`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(fallbackUrl), 1000);
            return;
        }

        window.open(fallbackUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(fallbackUrl), 1000);
    }
}

function attachMaterialActions() {
    document.querySelectorAll(".view-btn, .download-btn").forEach(button => {
        button?.addEventListener("click", function (event) {
            event.preventDefault();

            const fileUrl = this.getAttribute("data-file") || this.getAttribute("href");
            const title = this.getAttribute("data-title") || this.closest(".question-card")?.querySelector("h3")?.textContent || this.closest(".material")?.querySelector("h3")?.textContent || "EEE material";
            const isDownload = this.classList.contains("download-btn");

            if (!fileUrl || fileUrl === "#") {
                showToast("This material is not available yet.");
                return;
            }

            openMaterialFile(fileUrl, title, isDownload);
        });
    });
}

function renderMaterials() {
    materialsList.innerHTML = materialCatalog.map(material => `
        <div class="material" data-level="${material.level}" data-semester="${material.semester}" data-course="${material.course}">
            <div class="file-icon">PDF</div>
            <div class="file-info">
                <h3>${material.title}</h3>
                <p>${material.description}</p>
            </div>
            <div class="file-actions">
                <a href="${material.file}" data-file="${material.file}" data-title="${material.title}" class="view-btn" target="_blank">View</a>
                <a href="${material.file}" data-file="${material.file}" data-title="${material.title}" class="download-btn" download>Download</a>
            </div>
        </div>
    `).join("");

    attachMaterialActions();
}

function attachQuestionDownloadButtons() {
    document.querySelectorAll(".question-card .download-btn").forEach(button => {
        const href = button.getAttribute("href");
        if (!button.dataset.file) {
            button.setAttribute("data-file", href || "");
        }
        if (!button.dataset.title) {
            const title = button.closest(".question-card")?.querySelector("h3")?.textContent || "Past Question";
            button.setAttribute("data-title", title);
        }
    });

    attachMaterialActions();
}

const questionList = document.getElementById("questionList");
const questionStorageKey = "eeeHubQuestions";
let questionCatalog = [];

function saveQuestionCatalog() {
    localStorage.setItem(questionStorageKey, JSON.stringify(questionCatalog));
}

function renderQuestions() {
    if (!questionList) return;

    questionList.innerHTML = questionCatalog.map((question, index) => `
        <div class="question-card" data-index="${index}" data-level="${question.level}" data-semester="${question.semester}">
            <div class="file-icon">PDF</div>
            <div><h3>${question.title}</h3><p>${question.description}</p></div>
            <a href="${question.file}" data-file="${question.file}" data-title="${question.title}" download class="download-btn">Download</a>
            <button type="button" class="delete-question-btn">Delete</button>
        </div>
    `).join("");

    attachQuestionDownloadButtons();
    filterQuestions();

    document.querySelectorAll(".delete-question-btn").forEach(btn => {
        btn.addEventListener("click", async function() {
            const card = this.closest(".question-card");
            const index = Number(card?.dataset.index);
            if (index === null || !questionCatalog[index]) return;
            
            if (window.location.protocol === 'file:') {
                questionCatalog.splice(index, 1);
                saveQuestionCatalog();
                renderQuestions();
                showToast('Question deleted locally.');
                return;
            }
            
            const deleted = questionCatalog[index];
            const response = await fetch(`/api/questions/${encodeURIComponent(deleted.id)}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Unable to delete question.');
            
            questionCatalog.splice(index, 1);
            renderQuestions();
            showToast('Question deleted successfully.');
        });
    });
}

async function loadQuestionsFromServer() {
    try {
        if (window.location.protocol === 'file:') throw new Error('Offline');
        const response = await fetch("/api/questions");
        if (!response.ok) throw new Error("Unable to load past questions");
        questionCatalog = await response.json();
        renderQuestions();
    } catch (error) {
        try {
            questionCatalog = JSON.parse(localStorage.getItem(questionStorageKey) || "[]");
        } catch (storageError) {
            questionCatalog = [];
        }
        renderQuestions();
        if (window.location.protocol !== 'file:') {
            showToast("Unable to reach the backend. Showing saved past questions.");
        }
    }
}

const addMaterialBtn = document.getElementById("openMaterialModalBtn");
const adminModal = document.getElementById("adminModal");
const adminForm = document.getElementById("adminForm");
const closeAdminModalBtn = document.querySelector(".close-admin-modal");
const adminModalTitle = document.getElementById("adminModalTitle");
const adminModalMessage = document.getElementById("adminModalMessage");
const materialsQuickLink = document.getElementById("materialsQuickLink");
const addMaterialModal = document.getElementById("materialModal");
const closeMaterialModalBtn = document.querySelector(".close-material-modal");
const addMaterialForm = document.getElementById("addMaterialForm");
const addQuestionBtn = document.getElementById("openQuestionModalBtn");
const questionModal = document.getElementById("questionModal");
const closeQuestionModalBtn = document.querySelector(".close-question-modal");
const addQuestionForm = document.getElementById("addQuestionForm");

const editMaterialModal = document.getElementById("editMaterialModal");
const closeEditMaterialModalBtn = document.querySelector(".close-edit-material-modal");
const editMaterialForm = document.getElementById("editMaterialForm");
let materialToEditIndex = null;
let adminPassword = sessionStorage.getItem("eeeHubAdminPassword") || "";
let adminConfigured = false;

function adminRequestHeaders() {
    return {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword
    };
}

function updateAdminControls() {
    const hostname = window.location.hostname.replace(/^\[|\]$/g, "");
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    const isAdmin = window.location.protocol === 'file:' || isLocalHost || adminPassword;
    const addMaterialBtnEl = document.getElementById("openMaterialModalBtn");
    const addQuestionBtnEl = document.getElementById("openQuestionModalBtn");
    if (addMaterialBtnEl) addMaterialBtnEl.style.display = isAdmin ? "" : "none";
    if (addQuestionBtnEl) addQuestionBtnEl.style.display = isAdmin ? "" : "none";
}

function openAdminModal() {
    if (adminConfigured) {
        adminModalTitle.textContent = "Admin Access";
        adminModalMessage.textContent = "Enter your admin password to manage materials.";
    } else {
        adminModalTitle.textContent = "Set Admin Password";
        adminModalMessage.textContent = "Create the password you will use to manage materials.";
    }
    adminModal?.classList.remove("hidden");
    adminModal?.setAttribute("aria-hidden", "false");
    document.getElementById("adminPassword")?.focus();
}

async function loadAdminStatus() {
    if (window.location.protocol === 'file:') {
        // Running locally from file — skip server check, treat as admin
        adminConfigured = true;
        updateAdminControls();
        return;
    }
    try {
        const response = await fetch("/api/admin/status");
        const status = await response.json();
        adminConfigured = status.configured;
    } catch (error) {
        // backend not reachable, keep default
    }
    updateAdminControls();
}

function closeAdminModal() {
    adminModal?.classList.add("hidden");
    adminModal?.setAttribute("aria-hidden", "true");
    adminForm?.reset();
}

function openMaterialModal() {
    if (!addMaterialModal) return;
    addMaterialModal.classList.remove("hidden");
    addMaterialModal.setAttribute("aria-hidden", "false");
}

function closeMaterialModal() {
    if (!addMaterialModal) return;
    addMaterialModal.classList.add("hidden");
    addMaterialModal.setAttribute("aria-hidden", "true");
    if (addMaterialForm) addMaterialForm.reset();
}

function openEditMaterialModal(index) {
    if (!editMaterialModal || index === null || !materialCatalog[index]) return;

    const material = materialCatalog[index];
    materialToEditIndex = index;

    document.getElementById("editMaterialTitle").value = material.title;
    document.getElementById("editMaterialDescription").value = material.description;
    document.getElementById("editMaterialFile").value = material.file;
    document.getElementById("editMaterialLevel").value = material.level;
    document.getElementById("editMaterialSemester").value = material.semester;
    document.getElementById("editMaterialCourse").value = material.course;

    editMaterialModal.classList.remove("hidden");
    editMaterialModal.setAttribute("aria-hidden", "false");
}

function closeEditMaterialModal() {
    if (!editMaterialModal) return;
    editMaterialModal.classList.add("hidden");
    editMaterialModal.setAttribute("aria-hidden", "true");
    materialToEditIndex = null;
    if (editMaterialForm) editMaterialForm.reset();
}

async function addNewMaterial(materialObject) {
    if (window.location.protocol === 'file:') {
        const savedMaterial = { ...materialObject, id: "local-" + Date.now() };
        materialCatalog.unshift(savedMaterial);
        saveMaterialCatalog();
        renderMaterials();
        showToast("Material saved locally.");
        return;
    }

    const response = await fetch("/api/materials", {
        method: "POST",
        headers: adminRequestHeaders(),
        body: JSON.stringify(materialObject)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Unable to save material.");
    }

    const savedMaterial = await response.json();
    materialCatalog.unshift(savedMaterial);
    saveMaterialCatalog();
    renderMaterials();
    showToast("Material saved. Students can now view it.");
}

async function addNewQuestion(questionObject) {
    if (window.location.protocol === 'file:') {
        const savedQuestion = { ...questionObject, id: "local-" + Date.now() };
        questionCatalog.unshift(savedQuestion);
        saveQuestionCatalog();
        renderQuestions();
        showToast("Past question saved locally.");
        return;
    }

    const response = await fetch("/api/questions", {
        method: "POST",
        headers: adminRequestHeaders(),
        body: JSON.stringify(questionObject)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Unable to save past question.");
    }

    const savedQuestion = await response.json();
    questionCatalog.unshift(savedQuestion);
    saveQuestionCatalog();
    renderQuestions();
    showToast("Past question saved. Students can now view it.");
}

async function deleteMaterial(index) {
    if (index === null || !materialCatalog[index]) return;

    if (window.location.protocol === 'file:') {
        materialCatalog.splice(index, 1);
        saveMaterialCatalog();
        renderMaterials();
        showToast("Material deleted locally.");
        return;
    }

    const deleted = materialCatalog[index];
    const response = await fetch(`/api/materials/${encodeURIComponent(deleted.id)}`, {
        method: "DELETE",
        headers: adminRequestHeaders()
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Unable to delete material.");
    }

    materialCatalog.splice(index, 1);
    saveMaterialCatalog();
    renderMaterials();
    showToast("Material deleted successfully.");
}

function readFileAsDataUrl(file) {
    if (!file) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read the selected file."));
        reader.readAsDataURL(file);
    });
}

if (addMaterialBtn) {
    addMaterialBtn?.addEventListener("click", openMaterialModal);
}

if (addQuestionBtn) {
    addQuestionBtn?.addEventListener("click", function () {
        questionModal?.classList.remove("hidden");
        questionModal?.setAttribute("aria-hidden", "false");
    });
}

function closeQuestionModal() {
    questionModal?.classList.add("hidden");
    questionModal?.setAttribute("aria-hidden", "true");
    addQuestionForm?.reset();
}

closeQuestionModalBtn?.addEventListener("click", closeQuestionModal);
questionModal?.addEventListener("click", event => {
    if (event.target === questionModal) closeQuestionModal();
});

if (closeAdminModalBtn) {
    closeAdminModalBtn?.addEventListener("click", closeAdminModal);
}

if (adminModal) {
    adminModal?.addEventListener("click", function (event) {
        if (event.target === adminModal) closeAdminModal();
    });
}

if (adminForm) {
    adminForm?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const enteredPassword = document.getElementById("adminPassword").value;

        try {
            const response = adminConfigured
                ? await fetch("/api/admin/check", {
                    method: "POST",
                    headers: { "X-Admin-Password": enteredPassword }
                })
                : await fetch("/api/admin/setup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: enteredPassword })
                });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Unable to configure admin access.");
            }
            adminPassword = enteredPassword;
            adminConfigured = true;
            sessionStorage.setItem("eeeHubAdminPassword", adminPassword);
            updateAdminControls();
            closeAdminModal();
            renderMaterials();
            showToast("Admin uploads unlocked for this browser session.");
        } catch (error) {
            showToast(error instanceof TypeError ? "Cannot reach the EEE Hub service. Check the hosted site and API deployment." : error.message);
        }
    });
}

if (closeMaterialModalBtn) {
    closeMaterialModalBtn?.addEventListener("click", closeMaterialModal);
}

if (closeEditMaterialModalBtn) {
    closeEditMaterialModalBtn?.addEventListener("click", closeEditMaterialModal);
}

if (addMaterialModal) {
    addMaterialModal?.addEventListener("click", function (event) {
        if (event.target === addMaterialModal) {
            closeMaterialModal();
        }
    });
}

if (editMaterialModal) {
    editMaterialModal?.addEventListener("click", function (event) {
        if (event.target === editMaterialModal) {
            closeEditMaterialModal();
        }
    });
}

if (addMaterialForm) {
    addMaterialForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const submitButton = this.querySelector(".submit-material-btn");

        const title = document.getElementById("materialTitle").value.trim();
        const description = document.getElementById("materialDescription").value.trim();
        const file = document.getElementById("materialFile").value.trim();
        const upload = document.getElementById("materialUpload").files[0];
        const level = document.getElementById("materialLevel").value;
        const semester = document.getElementById("materialSemester").value;
        const course = document.getElementById("materialCourse").value.trim().toUpperCase();

        if (!title || !description || (!file && !upload) || !course) {
            showToast("Add a title, description, course, and a file or URL.");
            return;
        }

        try {
            submitButton.disabled = true;
            const newMaterial = {
                title,
                description,
                level,
                semester,
                course,
                file,
                fileName: upload?.name,
                fileData: await readFileAsDataUrl(upload)
            };
            await addNewMaterial(newMaterial);
            closeMaterialModal();
        } catch (error) {
            showToast(error instanceof TypeError ? "Cannot reach the EEE Hub service. Check the hosted site and API deployment." : error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
}

if (addQuestionForm) {
    addQuestionForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const submitButton = this.querySelector(".question-submit-btn");

        const title = document.getElementById("questionTitle").value.trim();
        const description = document.getElementById("questionDescription").value.trim();
        const file = document.getElementById("questionFile").value.trim();
        const upload = document.getElementById("questionUpload").files[0];
        const level = document.getElementById("questionLevel").value;
        const semester = document.getElementById("questionSemester").value;

        if (!title || !description || (!file && !upload)) {
            showToast("Add a title, description, and a file or URL.");
            return;
        }

        try {
            submitButton.disabled = true;

            await addNewQuestion({
                title,
                description,
                level,
                semester,
                file,
                fileName: upload?.name,
                fileData: await readFileAsDataUrl(upload)
            });
            closeQuestionModal();
        } catch (error) {
            showToast(error instanceof TypeError ? "Cannot reach the EEE Hub service. Check the hosted site and API deployment." : error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
}

if (editMaterialForm) {
    editMaterialForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (materialToEditIndex === null || !materialCatalog[materialToEditIndex]) {
            showToast("Please select a valid material to edit.");
            return;
        }

        const title = document.getElementById("editMaterialTitle").value.trim();
        const description = document.getElementById("editMaterialDescription").value.trim();
        const file = document.getElementById("editMaterialFile").value.trim();
        const upload = document.getElementById("editMaterialUpload").files[0];
        const level = document.getElementById("editMaterialLevel").value;
        const semester = document.getElementById("editMaterialSemester").value;
        const course = document.getElementById("editMaterialCourse").value.trim().toUpperCase();

        if (!title || !description || (!file && !upload) || !course) {
            showToast("Add a title, description, course, and a file or URL.");
            return;
        }

        try {
            const material = materialCatalog[materialToEditIndex];

            if (window.location.protocol === 'file:') {
                materialCatalog[materialToEditIndex] = {
                    ...material,
                    title,
                    description,
                    level,
                    semester,
                    course,
                    file: upload ? await readFileAsDataUrl(upload) : (file || material.file)
                };
                saveMaterialCatalog();
                renderMaterials();
                closeEditMaterialModal();
                showToast("Material updated locally.");
                return;
            }

            const response = await fetch(`/api/materials/${encodeURIComponent(material.id)}`, {
                method: "PUT",
                headers: adminRequestHeaders(),
                body: JSON.stringify({
                    title,
                    description,
                    level,
                    semester,
                    course,
                    file,
                    fileName: upload?.name,
                    fileData: await readFileAsDataUrl(upload)
                })
            });

            if (!response.ok) throw new Error("Unable to update material.");
            materialCatalog[materialToEditIndex] = await response.json();
            saveMaterialCatalog();
            renderMaterials();
            closeEditMaterialModal();
            showToast("Material updated successfully.");
        } catch (error) {
            showToast(error.message);
        }
    });
}

function bindMaterialManagementActions() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button?.addEventListener("click", function () {
            const materialElement = this.closest(".material");
            const index = Number(materialElement?.dataset.index);
            if (index >= 0) {
                this.disabled = true;
                deleteMaterial(index).catch(error => {
                    this.disabled = false;
                    showToast(error.message);
                });
            }
        });
    });

    document.querySelectorAll(".edit-btn").forEach(button => {
        button?.addEventListener("click", function () {
            const materialElement = this.closest(".material");
            const index = Number(materialElement?.dataset.index);
            if (index >= 0) {
                openEditMaterialModal(index);
            }
        });
    });
}

function renderMaterials() {
    materialsList.innerHTML = materialCatalog.map((material, index) => `
        <div class="material" data-index="${index}" data-level="${material.level}" data-semester="${material.semester}" data-course="${material.course}">
            <div class="file-icon">PDF</div>
            <div class="file-info">
                <h3>${material.title}</h3>
                <p>${material.description}</p>
            </div>
            <div class="file-actions">
                <a href="${material.file}" data-file="${material.file}" data-title="${material.title}" class="view-btn" target="_blank">View</a>
                <a href="${material.file}" data-file="${material.file}" data-title="${material.title}" class="download-btn" download>Download</a>
                <div class="material-actions-inline">
                    <button type="button" class="delete-btn" aria-label="Delete ${material.title}">Delete</button>
                </div>
            </div>
        </div>
    `).join("");

    attachMaterialActions();
    bindMaterialManagementActions();
    updateAdminControls();
}

loadMaterialCatalogFromServer();
attachQuestionDownloadButtons();

const levelFilter = document.getElementById("levelFilter");
const semesterFilter = document.getElementById("semesterFilter");
const courseFilter = document.getElementById("courseFilter");

if (materialsQuickLink) {
    materialsQuickLink?.addEventListener("click", function () {
        levelFilter.value = "all";
        semesterFilter.value = "all";
        courseFilter.value = "all";
        filterMaterials();
    });
}

function filterMaterials() {

    const level = levelFilter.value;
    const semester = semesterFilter.value;
    const course = courseFilter.value;

    document.querySelectorAll(".material").forEach(material => {

        const materialLevel = material.dataset.level;
        const materialSemester = material.dataset.semester;
        const materialCourse = material.dataset.course;

        const levelMatch =
            level === "all" ||
            level === materialLevel;

        const semesterMatch =
            semester === "all" ||
            semester === materialSemester;

        const courseMatch =
            course === "all" ||
            course === materialCourse;


        if (
            levelMatch &&
            semesterMatch &&
            courseMatch
        ) {

            material.style.display = "flex";

        } else {

            material.style.display = "none";

        }

    });

}


levelFilter?.addEventListener("change", filterMaterials);

semesterFilter?.addEventListener("change", filterMaterials);

courseFilter?.addEventListener("change", filterMaterials);


// ================================
// MATERIAL SEARCH
// ================================

const globalSearch = document.getElementById("globalSearch");
const heroSearch = document.getElementById("heroSearch");

const courseCards = document.querySelectorAll(".course-card");
const coursesSection = document.getElementById("courses");

function searchContent(value) {

    const searchValue = value.trim().toLowerCase();
    questions = document.querySelectorAll(".question-card");

    document.querySelectorAll(".material").forEach(material => {
        const matches = material.textContent.toLowerCase().includes(searchValue);
        material.style.display = matches ? "flex" : "none";
    });

    courseCards.forEach(courseCard => {
        const matches = courseCard.textContent.toLowerCase().includes(searchValue);
        courseCard.style.display = matches ? "flex" : "none";
    });

    questions.forEach(question => {
        const matches = question.textContent.toLowerCase().includes(searchValue);
        question.style.display = matches ? "flex" : "none";
    });

    if (searchValue && Array.from(courseCards).some(courseCard =>
        courseCard.textContent.toLowerCase().includes(searchValue)
    )) {
        coursesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function syncSearchFields(value, sourceInput) {
    [globalSearch, heroSearch].forEach(searchInput => {
        if (searchInput !== sourceInput) {
            searchInput.value = value;
        }
    });
}

function handleSearchInput(event) {
    syncSearchFields(event.target.value, event.target);
    searchContent(event.target.value);
}

globalSearch?.addEventListener("input", handleSearchInput);
heroSearch?.addEventListener("input", handleSearchInput);

document.querySelectorAll(".search-button").forEach(button => {
    button?.addEventListener("click", function () {
        const searchInput = document.getElementById(this.dataset.searchInput);
        searchContent(searchInput.value);
        syncSearchFields(searchInput.value, searchInput);
        searchInput.focus();
    });
});


// ================================
// PAST QUESTION SEARCH
// ================================

const questionSearch = document.getElementById("questionSearch");
const questionSearchButton = document.getElementById("questionSearchButton");
const questionLevelFilter = document.getElementById("questionLevelFilter");
const questionSemesterFilter = document.getElementById("questionSemesterFilter");
let questions = [];

function filterQuestions() {
    const level = questionLevelFilter?.value || "all";
    const semester = questionSemesterFilter?.value || "all";
    const search = questionSearch?.value.trim().toLowerCase() || "";

    document.querySelectorAll(".question-card").forEach(question => {
        const matchesLevel = level === "all" || question.dataset.level === level;
        const matchesSemester = semester === "all" || question.dataset.semester === semester;
        const matchesSearch = question.textContent.toLowerCase().includes(search);
        question.style.display = matchesLevel && matchesSemester && matchesSearch ? "flex" : "none";
    });
}

questionSearch?.addEventListener("input", function () {
    filterQuestions();
});

questionSearchButton?.addEventListener("click", function () {
    questionSearch.dispatchEvent(new Event("input"));
    questionSearch.focus();
});

questionLevelFilter?.addEventListener("change", filterQuestions);
questionSemesterFilter?.addEventListener("change", filterQuestions);

loadAdminStatus();
loadQuestionsFromServer();
