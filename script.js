// ========== 🔐 GITHUB TOKEN ==========
let githubToken = localStorage.getItem("githubToken");
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
    const url = `https://api.github.com/repos/${repo}/contents/${paths[type]}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`
      }
    });

    if (!res.ok) throw new Error("Failed to fetch " + type);

    const data = await res.json();
    const decoded = atob(data.content);
    questData[type] = JSON.parse(decoded);

    renderQuestList(type);
  } catch (e) {
    alert(`❌ Failed to load ${type} quests.`);
    console.error(e);
  }
}

function searchAndLoadQuests() {
  loadQuestFile("main");
  loadQuestFile("side");
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

// ========== PUSH TO GITHUB ==========
document.getElementById("saveBtn").addEventListener("click", async () => {
  for (const type of ["main", "side"]) {
    try {
      const fileUrl = `https://api.github.com/repos/${repo}/contents/${paths[type]}`;
      const metaRes = await fetch(fileUrl, {
        headers: { Authorization: `token ${githubToken}` }
      });

      if (!metaRes.ok) throw new Error(`Failed to fetch ${type} metadata.`);
      const meta = await metaRes.json();
      const sha = meta.sha;

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(questData[type], null, 2))));

      const res = await fetch(fileUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Update ${type} quests`,
          content,
          sha
        })
      });

      if (!res.ok) throw new Error(`❌ Failed to push ${type}`);
    } catch (err) {
      alert(err.message);
      return;
    }
  }

  alert("✅ Both quest files pushed to GitHub.");
});

// ========== OUTCOME INJECTOR ==========
function populateOutcomeTargetDropdown(type, key) {
  const quest = questData[type][key];
  const select = document.getElementById("ob_target");
  select.innerHTML = '<option disabled selected>Choose a Path & Outcome Type…</option>';

  if (!quest?.paths) return;

  for (const pathKey of Object.keys(quest.paths)) {
    const outcomeTypes = [
      { code: "midHigh", label: "Midweek High" },
      { code: "midLow", label: "Midweek Low" },
      { code: "finalSuccess", label: "Final Success" },
      { code: "finalFail", label: "Final Failure" }
    ];
    for (const { code, label } of outcomeTypes) {
      const option = document.createElement("option");
      option.value = `${pathKey}::${code}`;
      option.textContent = `${pathKey} – ${label}`;
      select.appendChild(option);
    }
  }
}

function injectOutcome() {
  const target = document.getElementById("ob_target").value;
  if (!target || !target.includes("::")) return alert("❌ Invalid outcome target.");

  const [pathKey, field] = target.split("::");
  const quest = questData[selectedType][selectedKey];
  const path = quest.paths[pathKey];

  const block = field.includes("mid") ? (path.midweek = path.midweek || {}) : (path.final = path.final || {});
  const slot = field.includes("High") ? "High" :
               field.includes("Low") ? "Low" :
               field.includes("Success") ? "Success" : "Failure";

  const outcome = {};
  const get = (id) => document.getElementById(id)?.value?.trim();

  outcome.text = get("ob_text") || "";
  outcome.title = get("ob_title") || "";
  outcome.death = document.getElementById("ob_death")?.checked || false;

  const items = get("ob_items");
  if (items) outcome.items = items.split(",").map(s => s.trim());

  const status = get("ob_status");
  if (status) outcome.status = status.split(",").map(s => s.trim());

  block[slot] = outcome;

  alert(`✅ Injected into "${pathKey}" – ${slot}`);
  populateOutcomeTargetDropdown(selectedType, selectedKey);
}
