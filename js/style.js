document.getElementById("year").textContent = new Date().getFullYear();

// ─── Initial DOM snapshot (must run before loadSavedData) ────────────────────
const INITIAL_SNAPSHOT = {};
document.querySelectorAll("[data-editable]").forEach(el => {
  INITIAL_SNAPSHOT[el.dataset.editable] = el.innerHTML;
});
INITIAL_SNAPSHOT._skills = Array.from(document.querySelectorAll(".tags li"))
  .map(li => li.textContent.trim());

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveAll() {
  const data = {};
  document.querySelectorAll("[data-editable]").forEach(el => {
    data[el.dataset.editable] = el.innerHTML;
  });
  data._skills = Array.from(document.querySelectorAll(".tags li"))
    .map(li => li.textContent.trim());
  localStorage.setItem("cv_data", JSON.stringify(data));
}

function applyData(data) {
  document.querySelectorAll("[data-editable]").forEach(el => {
    if (data[el.dataset.editable] != null) el.innerHTML = data[el.dataset.editable];
  });
  if (Array.isArray(data._skills)) {
    const tagsList = document.querySelector(".tags");
    tagsList.innerHTML = "";
    data._skills.forEach(skill => {
      const li = document.createElement("li");
      li.textContent = skill;
      tagsList.appendChild(li);
    });
  }
}

function loadSavedData() {
  let data;
  try { data = JSON.parse(localStorage.getItem("cv_data")); } catch { return; }
  if (!data) return;
  applyData(data);
}

loadSavedData();

// ─── Edit mode ────────────────────────────────────────────────────────────────
let editMode = false;
const editBtn = document.getElementById("edit-btn");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");

function syncResetBtn() {
  resetBtn.hidden = !localStorage.getItem("cv_data") && !editMode;
}

syncResetBtn();

editBtn.addEventListener("click", () => {
  if (editMode) exitEditMode(false);
  else enterEditMode();
});
saveBtn.addEventListener("click", () => exitEditMode(true));
resetBtn.addEventListener("click", resetAll);

function enterEditMode() {
  editMode = true;
  document.body.classList.add("edit-mode");
  editBtn.classList.add("ctrl-btn--active");
  document.querySelectorAll("[data-editable]").forEach(el => {
    el.contentEditable = "true";
  });
  document.querySelectorAll(".tags li").forEach(li => {
    li.contentEditable = "true";
    addSkillRemoveBtn(li);
  });
  document.getElementById("add-skill-btn").hidden = false;
  saveBtn.hidden = false;
  resetBtn.hidden = false;
}

function exitEditMode(save) {
  editMode = false;
  document.body.classList.remove("edit-mode");
  editBtn.classList.remove("ctrl-btn--active");
  document.querySelectorAll("[data-editable]").forEach(el => {
    el.contentEditable = "false";
  });
  document.querySelectorAll(".tags li").forEach(li => {
    li.contentEditable = "false";
  });
  document.querySelectorAll(".tag-remove-btn").forEach(btn => btn.remove());
  document.getElementById("add-skill-btn").hidden = true;
  saveBtn.hidden = true;
  closeLinkEditor();
  if (save) saveAll();
  syncResetBtn();
}

function resetAll() {
  if (!confirm("Alle gespeicherten \u00c4nderungen l\u00f6schen und Originalzustand wiederherstellen?")) return;
  localStorage.removeItem("cv_data");
  applyData(INITIAL_SNAPSHOT);
  if (editMode) exitEditMode(false);
  syncResetBtn();
}

// ─── Skills ───────────────────────────────────────────────────────────────────
function addSkillRemoveBtn(li) {
  if (li.querySelector(".tag-remove-btn")) return;
  const btn = document.createElement("button");
  btn.textContent = "\u00d7";
  btn.className = "tag-remove-btn";
  btn.setAttribute("aria-label", "Skill entfernen");
  btn.addEventListener("click", e => { e.stopPropagation(); li.remove(); });
  li.appendChild(btn);
}

document.getElementById("add-skill-btn").addEventListener("click", () => {
  const li = document.createElement("li");
  li.textContent = "Neu";
  li.contentEditable = "true";
  addSkillRemoveBtn(li);
  document.querySelector(".tags").appendChild(li);
  const textNode = li.firstChild;
  const range = document.createRange();
  range.selectNodeContents(textNode || li);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});

// ─── Link editor ──────────────────────────────────────────────────────────────
const linkEditor = document.getElementById("link-editor");
const linkTextInput = document.getElementById("link-text-input");
const linkHrefInput = document.getElementById("link-href-input");
let currentLink = null;

document.addEventListener("click", e => {
  if (!editMode) return;
  const link = e.target.closest("a");
  if (link) {
    e.preventDefault();
    e.stopImmediatePropagation();
    openLinkEditor(link);
    return;
  }
  if (!linkEditor.contains(e.target)) closeLinkEditor();
}, true);

function openLinkEditor(link) {
  currentLink = link;
  const href = link.getAttribute("href") || "";
  linkTextInput.value = link.textContent.trim();
  linkHrefInput.value = href.startsWith("mailto:") ? href.slice(7) : href;

  const rect = link.getBoundingClientRect();
  const EDITOR_W = 290;
  let left = rect.left + window.scrollX;
  const top = rect.bottom + window.scrollY + 8;
  if (left + EDITOR_W > document.documentElement.clientWidth - 8) {
    left = Math.max(8, document.documentElement.clientWidth - EDITOR_W - 8);
  }
  linkEditor.style.left = left + "px";
  linkEditor.style.top = top + "px";
  linkEditor.hidden = false;
  linkTextInput.focus();
  linkTextInput.select();
}

function closeLinkEditor() {
  linkEditor.hidden = true;
  currentLink = null;
}

document.getElementById("link-apply-btn").addEventListener("click", () => {
  if (!currentLink) return;
  const text = linkTextInput.value.trim();
  const raw = linkHrefInput.value.trim();
  if (text) currentLink.textContent = text;
  if (raw) {
    currentLink.href = (raw.includes("@") && !raw.startsWith("http"))
      ? "mailto:" + raw
      : raw;
  }
  closeLinkEditor();
});

document.getElementById("link-cancel-btn").addEventListener("click", closeLinkEditor);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !linkEditor.hidden) closeLinkEditor();
});
