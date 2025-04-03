// ========== 🔐 GITHUB SAVE SYSTEM ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter your GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

async function saveQuestData(updatedJson) {
  const repo = "YTseen/bloodbot-campaign";
  const path = "data/quest_data.json";

  try {
    const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${githubToken}` }
    });

    if (!metaRes.ok) {
      alert("❌ Failed to fetch quest_data.json metadata.");
      return;
    }

    const meta = await metaRes.json();
    const sha = meta.sha;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(updatedJson, null, 2))));

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Updated quest data from dashboard",
        content,
        sha
      })
    });

    if (res.ok) alert("✅ Saved to GitHub!");
    else alert("❌ Save failed.");
  } catch (err) {
    console.error(err);
    alert("❌ Unexpected save error.");
  }
}

document.getElementById("saveBtn")?.addEventListener("click", () => {
  saveQuestData(window.questData);
});

// ========== QUEST UI ==========
let questData = {};
let selectedKey = null;
const questList = document.getElementById("questList");
const editorSection = document.getElementById("editorSection");
const questKeyInput = document.getElementById("questKey");
const questIntroInput = document.getElementById("questIntro");
const questWrapInput = document.getElementById("questWrap");
const pathsContainer = document.getElementById("pathsContainer");

async function loadQuestData() {
  try {
    const res = await fetch("./data/quest_data.json");
    if (!res.ok) throw new Error("Fetch failed");
    questData = await res.json();
    window.questData = questData;
    renderQuestList();
  } catch (err) {
    alert("❌ Failed to load quest_data.json");
    console.error(err);
  }
}

function renderQuestList() {
  questList.innerHTML = "";
  Object.keys(questData).forEach((key) => {
    const li = document.createElement("li");
    li.textContent = key;
    li.className = "cursor-pointer hover:text-red-400 px-2 py-1 bg-gray-800 rounded";
    li.onclick = () => openQuestEditor(key);
    questList.appendChild(li);
  });
}

function openQuestEditor(key) {
  selectedKey = key;
  const quest = questData[key];
  questKeyInput.value = key;
  questIntroInput.value = quest.intro || "";
  questWrapInput.value = quest.wrapup?.text || "";
  pathsContainer.innerHTML = "";

  const paths = quest.paths || {};
  for (const [pathKey, pathData] of Object.entries(paths)) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-gray-800 p-4 rounded";

    wrapper.innerHTML = `
      <h3 class="text-lg font-bold text-yellow-400 mb-2">${pathKey}</h3>

      <label class="text-green-300 text-sm block">📝 Title</label>
      <input class="w-full bg-gray-900 p-2 rounded mb-2 text-white" data-path="${pathKey}" data-field="title" value="${pathData.title || ''}" />

      <label class="text-green-300 text-sm block">📜 Description</label>
      <textarea class="w-full bg-gray-900 p-2 rounded mb-2 text-white" data-path="${pathKey}" data-field="description">${pathData.description || ''}</textarea>

      <label class="text-green-300 text-sm block">🔥 Midweek High</label>
      <textarea class="w-full bg-gray-900 p-2 rounded mb-1 text-white" data-path="${pathKey}" data-field="midHigh">${pathData.midweek?.High?.text || ''}</textarea>

      <label class="text-green-300 text-sm block">💀 Midweek Low</label>
      <textarea class="w-full bg-gray-900 p-2 rounded mb-1 text-white" data-path="${pathKey}" data-field="midLow">${pathData.midweek?.Low?.text || ''}</textarea>

      <label class="text-green-300 text-sm block">🏆 Final Success</label>
      <textarea class="w-full bg-gray-900 p-2 rounded mb-1 text-white" data-path="${pathKey}" data-field="finalSuccess">${pathData.final?.Success?.text || ''}</textarea>

      <label class="text-green-300 text-sm block">☠️ Final Failure</label>
      <textarea class="w-full bg-gray-900 p-2 rounded text-white" data-path="${pathKey}" data-field="finalFail">${pathData.final?.Failure?.text || ''}</textarea>
    `;

    pathsContainer.appendChild(wrapper);
  }

  editorSection.classList.remove("hidden");
}

function saveQuest() {
  const newKey = questKeyInput.value;
  const intro = questIntroInput.value;
  const wrap = questWrapInput.value;

  // Delete old key if title changed
  if (newKey !== selectedKey) {
    delete questData[selectedKey];
  }

  const updatedPaths = {};
  const inputs = pathsContainer.querySelectorAll("[data-path]");

  inputs.forEach((el) => {
    const pathKey = el.dataset.path;
    const field = el.dataset.field;

    if (!updatedPaths[pathKey]) {
      updatedPaths[pathKey] = { title: "", description: "", midweek: {}, final: {} };
    }

    switch (field) {
      case "title":
        updatedPaths[pathKey].title = el.value;
        break;
      case "description":
        updatedPaths[pathKey].description = el.value;
        break;
      case "midHigh":
        updatedPaths[pathKey].midweek.High = { text: el.value };
        break;
      case "midLow":
        updatedPaths[pathKey].midweek.Low = { text: el.value };
        break;
      case "finalSuccess":
        updatedPaths[pathKey].final.Success = { text: el.value };
        break;
      case "finalFail":
        updatedPaths[pathKey].final.Failure = { text: el.value };
        break;
    }
  });

  questData[newKey] = {
    intro,
    wrapup: { text: wrap },
    paths: updatedPaths
  };

  window.questData = questData;
  alert("✅ Quest saved locally. Click 💾 Push to GitHub to commit.");
  renderQuestList();
}

// INIT
loadQuestData();
