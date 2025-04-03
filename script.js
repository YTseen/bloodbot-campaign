// ========== 🔐 GITHUB SAVE SYSTEM ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter your GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

const repo = "YTseen/bloodbot-campaign";
const paths = {
  main: "data/quest_data.json",
  side: "data/side_quest_template.json"
};

let questData = { main: {}, side: {} };
let selectedType = "main";
let selectedKey = null;

// ========== LOAD & INIT ==========
async function loadQuestFile(type) {
  try {
    const res = await fetch(`./${paths[type]}`);
    if (!res.ok) throw new Error("Failed to fetch");
    questData[type] = await res.json();
    renderQuestList(type);
  } catch (e) {
    alert(`❌ Failed to load ${type} quests.`);
  }
}

loadQuestFile("main");
loadQuestFile("side");

function renderQuestList(type) {
  const list = document.getElementById(type === "main" ? "mainQuestList" : "sideQuestList");
  list.innerHTML = "";
  Object.keys(questData[type]).forEach((key) => {
    const li = document.createElement("li");
    li.textContent = key;
    li.className = "cursor-pointer hover:text-red-400 px-2 py-1 bg-gray-800 rounded";
    li.onclick = () => openQuestEditor(type, key);
    list.appendChild(li);
  });
}

function createQuest(type) {
  const key = prompt("Enter new quest name");
  if (!key) return;
  questData[type][key] = { intro: "", wrapup: { text: "" }, paths: {} };
  renderQuestList(type);
  openQuestEditor(type, key);
}

// ========== QUEST EDITOR ==========
function openQuestEditor(type, key) {
  selectedType = type;
  selectedKey = key;
  const quest = questData[type][key];

  document.getElementById("questKey").value = key;
  document.getElementById("questIntro").value = quest.intro || "";
  document.getElementById("questWrap").value = quest.wrapup?.text || "";

  const pathsContainer = document.getElementById("pathsContainer");
  pathsContainer.innerHTML = "";
  document.getElementById("editorSection").classList.remove("hidden");

  populateOutcomeTargetDropdown(type, key);

  for (const [pathKey, pathData] of Object.entries(quest.paths || {})) {
    const div = document.createElement("div");
    div.className = "bg-gray-800 p-4 rounded mb-6";

    div.innerHTML = `
      <h3 class="text-lg font-bold text-yellow-400 mb-2">${pathKey}</h3>
      <input placeholder="📝 Title" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="title" value="${pathData.title || ''}" />
      <textarea placeholder="📜 Description" class="w-full bg-gray-900 p-2 rounded mb-4"
        data-path="${pathKey}" data-field="description">${pathData.description || ''}</textarea>

      <h4 class="text-yellow-300 font-semibold mt-4 mb-2">⏳ Midweek Outcomes</h4>
      <label class="text-green-400 text-sm font-semibold block mb-1">🔵 High Outcome</label>
      <textarea placeholder="🔥 Midweek High" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midHigh">${pathData.midweek?.High?.text || ''}</textarea>
      <label class="text-red-400 text-sm font-semibold block mb-1">🔴 Low Outcome</label>
      <textarea placeholder="💀 Midweek Low" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midLow">${pathData.midweek?.Low?.text || ''}</textarea>

      <h4 class="text-yellow-300 font-semibold mt-4 mb-2">🏁 Final Outcomes</h4>
      <label class="text-green-400 text-sm font-semibold block mb-1">🟢 Success</label>
      <textarea placeholder="🏆 Final Success" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalSuccess">${pathData.final?.Success?.text || ''}</textarea>
      <label class="text-red-400 text-sm font-semibold block mb-1">🔻 Failure</label>
      <textarea placeholder="☠️ Final Failure" class="w-full bg-gray-900 p-2 rounded"
        data-path="${pathKey}" data-field="finalFail">${pathData.final?.Failure?.text || ''}</textarea>
    `;
    pathsContainer.appendChild(div);
  }
}

// ========== SAVE QUEST ==========
function saveQuest() {
  const newKey = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrap = document.getElementById("questWrap").value;

  if (newKey !== selectedKey) delete questData[selectedType][selectedKey];

  const updatedPaths = {};
  const inputs = document.querySelectorAll("[data-path]");
  inputs.forEach((el) => {
    const pathKey = el.dataset.path;
    const field = el.dataset.field;
    if (!updatedPaths[pathKey]) updatedPaths[pathKey] = { title: "", description: "", midweek: {}, final: {} };
    const val = el.value;
    switch (field) {
      case "title": updatedPaths[pathKey].title = val; break;
      case "description": updatedPaths[pathKey].description = val; break;
      case "midHigh": updatedPaths[pathKey].midweek.High = { text: val }; break;
      case "midLow": updatedPaths[pathKey].midweek.Low = { text: val }; break;
      case "finalSuccess": updatedPaths[pathKey].final.Success = { text: val }; break;
      case "finalFail": updatedPaths[pathKey].final.Failure = { text: val }; break;
    }
  });

  questData[selectedType][newKey] = { intro, wrapup: { text: wrap }, paths: updatedPaths };
  alert("✅ Quest saved locally. Push to GitHub to commit.");
  renderQuestList(selectedType);
}

// ========== GITHUB PUSH ==========
document.getElementById("saveBtn").addEventListener("click", async () => {
  for (const type of ["main", "side"]) {
    const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${paths[type]}`, {
      headers: { Authorization: `token ${githubToken}` }
    });

    if (!metaRes.ok) return alert(`❌ Failed to fetch ${type} metadata.`);
    const meta = await metaRes.json();
    const sha = meta.sha;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(questData[type], null, 2))));

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${paths[type]}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: `Update ${type} quests`, content, sha })
    });

    if (!res.ok) alert(`❌ Failed to push ${type}`);
  }
  alert("✅ Both quest files pushed to GitHub.");
});

// ========== OUTCOME INJECTOR ==========
function populateOutcomeTargetDropdown(type, key) {
  const quest = questData[type][key];
  const select = document.getElementById("ob_target");
  select.innerHTML = '<option disabled selected>Choose a Path & Outcome Type…</option>';
  for (const pathKey of Object.keys(quest.paths || {})) {
    select.innerHTML += `
      <option value="${pathKey}::midHigh">${pathKey} – Midweek High</option>
      <option value="${pathKey}::midLow">${pathKey} – Midweek Low</option>
      <option value="${pathKey}::finalSuccess">${pathKey} – Final Success</option>
      <option value="${pathKey}::finalFail">${pathKey} – Final Failure</option>
    `;
  }
}

function injectOutcome() {
  const target = document.getElementById("ob_target").value;
  if (!target || !target.includes("::")) return alert("❌ Invalid outcome target.");
  const [pathKey, field] = target.split("::");
  const quest = questData[selectedType][selectedKey];
  const path = quest.paths[pathKey];
  const block = field.includes("mid") ? (path.midweek = path.midweek || {}) : (path.final = path.final || {});
  const slot = field.includes("High") ? "High" : field.includes("Low") ? "Low" : field.includes("Success") ? "Success" : "Failure";

  const out = {
    text: document.getElementById("ob_text").value.trim()
  };
  if (document.getElementById("ob_death").checked) out.death = true;
  const title = document.getElementById("ob_title").value.trim();
  if (title) out.title = title;
  const status = document.getElementById("ob_status").value.trim();
  if (status) out.status = status.includes(",") ? status.split(",").map(x => x.trim()) : status;
  const items = document.getElementById("ob_items").value.trim();
  if (items) out.items = items.split(",").map(x => x.trim());

  block[slot] = out;
  alert(`✅ Outcome injected into ${pathKey} – ${slot}`);
}
