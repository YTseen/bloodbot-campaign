// ========== GITHUB CONFIG ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter your GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

const repo = "YTseen/bloodbot-campaign";
const questFilePath = "data/quest_data.json";

let questData = {};
let selectedKey = null;

function autoGenerateKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "_");
}

function createNewQuest(isSide = false) {
  selectedKey = "Quest " + Date.now();
  document.getElementById("questKey").value = selectedKey;
  document.getElementById("questIntro").value = "";
  document.getElementById("questWrap").value = "";
  document.getElementById("sideQuestBetween").value = isSide ? "Quest 1 | Quest 2" : "";
  document.getElementById("pathsContainer").innerHTML = "";
  document.getElementById("editorSection").classList.remove("hidden");
}

function createPathBlock(pathKey = "", pathData = {}) {
  const div = document.createElement("div");
  div.className = "path-block border p-2 bg-gray-800 rounded mb-2";
  div.draggable = true;
  div.innerHTML = `
    <div class="flex justify-between items-center mb-1">
      <span class="text-xs text-gray-400">↕ Drag to reorder</span>
      <button class="remove-path bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-xs">🗑 Remove</button>
    </div>
    <label class="text-xs text-gray-400">Path Key</label>
    <input class="path-key w-full my-1 p-1 rounded text-black" value="${pathKey}"/>
    <label class="text-xs text-gray-400">Title</label>
    <input class="path-title w-full my-1 p-1 rounded text-black" value="${pathData.title || ""}"/>
    <label class="text-xs text-gray-400">Description</label>
    <input class="path-desc w-full my-1 p-1 rounded text-black" value="${pathData.description || ""}"/>
    <h4 class="text-sm text-green-300 mt-2">Midweek - High</h4>
    <textarea class="mid-high-text w-full p-1 rounded text-black">${pathData.midweek?.High?.text || ""}</textarea>
    <input class="mid-high-rewards w-full p-1 rounded text-black" value="${(pathData.midweek?.High?.rewards?.items || []).join(", ")}"/>
    <h4 class="text-sm text-green-300 mt-2">Midweek - Low</h4>
    <textarea class="mid-low-text w-full p-1 rounded text-black">${pathData.midweek?.Low?.text || ""}</textarea>
    <input class="mid-low-penalties w-full p-1 rounded text-black" value="${(pathData.midweek?.Low?.penalties?.roles || []).join(", ")}"/>
    <h4 class="text-sm text-green-300 mt-2">Final - Success</h4>
    <textarea class="final-success-text w-full p-1 rounded text-black">${pathData.final?.Success?.text || ""}</textarea>
    <input class="final-success-rewards w-full p-1 rounded text-black" value="${(pathData.final?.Success?.rewards?.items || []).join(", ")}"/>
    <h4 class="text-sm text-green-300 mt-2">Final - Failure</h4>
    <textarea class="final-failure-text w-full p-1 rounded text-black">${pathData.final?.Failure?.text || ""}</textarea>
    <input class="final-failure-penalties w-full p-1 rounded text-black" value="${(pathData.final?.Failure?.penalties?.roles || []).join(", ")}"/>
  `;
  return div;
}

function addPathBlock() {
  const container = document.getElementById("pathsContainer");
  container.appendChild(createPathBlock());
}

function openQuestEditor(key) {
  selectedKey = key;
  const quest = questData[key];

  document.getElementById("editorSection").classList.remove("hidden");
  document.getElementById("questKey").value = key;
  document.getElementById("questIntro").value = quest.intro || "";
  document.getElementById("questWrap").value = quest.wrapup?.text || "";
  document.getElementById("sideQuestBetween").value = quest.between ? quest.between.join(" | ") : "";

  const container = document.getElementById("pathsContainer");
  container.innerHTML = "";

  if (quest.paths) {
    Object.entries(quest.paths).forEach(([pathKey, pathObj]) => {
      container.appendChild(createPathBlock(pathKey, pathObj));
    });
  }
}

function manualLoadQuests() {
  if (!githubToken) {
    githubToken = prompt("Enter your GitHub Token:");
    if (githubToken) {
      localStorage.setItem("githubToken", githubToken);
    } else {
      alert("GitHub Token is required.");
      return;
    }
  }
  loadQuestFile();
}

// Export handlers to window scope
window.addPathBlock = addPathBlock;
window.saveQuestToGitHub = saveQuestToGitHub;
window.manualLoadQuests = manualLoadQuests;
window.createNewQuest = createNewQuest;
window.openQuestEditor = openQuestEditor;
