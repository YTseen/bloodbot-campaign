// ========== Phase 1: Initialization and Player State ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter your GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

const repo = "YTseen/bloodbot-campaign";
const questFilePath = "data/quest_data.json";

let questData = {};
let selectedKey = null;
let playerState = {
  items: [],
  titles: [],
  status: [],
  completedPaths: {},
  logs: [],
  rewards: {},
};

function simulatePlayerState() {
  playerState = {
    items: ["dagger"],
    titles: ["hero"],
    status: ["wounded"],
    completedPaths: {},
    logs: [],
    rewards: {},
  };
}

function applyEffects(effects = {}) {
  effects.grant_items?.forEach(i => !playerState.items.includes(i) && playerState.items.push(i));
  effects.grant_titles?.forEach(t => !playerState.titles.includes(t) && playerState.titles.push(t));
  effects.grant_status?.forEach(s => !playerState.status.includes(s) && playerState.status.push(s));
  effects.remove_items?.forEach(i => playerState.items = playerState.items.filter(x => x !== i));
  effects.remove_titles?.forEach(t => playerState.titles = playerState.titles.filter(x => x !== t));
  effects.remove_status?.forEach(s => playerState.status = playerState.status.filter(x => x !== s));
}

function checkExclusions(path) {
  const ex = path.excludes || {};
  const hasExcluded = (list, check) => check?.some(x => list.includes(x));
  return !(
    hasExcluded(playerState.titles, ex.titles) ||
    hasExcluded(playerState.items, ex.items) ||
    hasExcluded(playerState.status, ex.status)
  );
}

function logPathAction(pathKey, outcomeLabel, resultText, effects) {
  playerState.logs.push({ pathKey, outcomeLabel, resultText });
  if (!playerState.rewards[pathKey]) playerState.rewards[pathKey] = [];
  if (effects) {
    const grant = [...(effects.grant_items || []), ...(effects.grant_titles || []), ...(effects.grant_status || [])];
    playerState.rewards[pathKey].push(...grant);
  }
}

function resetPlayerState() {
  simulatePlayerState();
  document.getElementById("scoreBoard").textContent = "";
  renderPreview();
}

// === DOM Bindings ===
document.addEventListener("DOMContentLoaded", () => {
  simulatePlayerState();
  updateDatalists();
});

// === Editor UI Setup ===


function createPathBlock(pathKey = "", pathData = {}) {
  const div = document.createElement("div");
  div.className = "path-block border p-2 bg-gray-800 rounded mb-2";
  div.draggable = true;

  const pathTitle = pathData.title || "";
  div.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <input class="path-title w-full p-1 mb-1 rounded bg-white text-black" placeholder="Path Title" value="${pathTitle}" />
      <button class="remove-path bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 ml-2 rounded text-xs">🗑 Remove</button>
    </div>
    <textarea class="path-description w-full p-2 mb-2 rounded bg-white text-black" placeholder="Path Description">${pathData.description || ""}</textarea>
    <details class="mb-2">
      <summary class="text-xs text-yellow-300 cursor-pointer">Requirements (Click to Expand)</summary>
      <label class="text-xs text-gray-400">Required Titles:</label>
      <input class="requires-titles-input w-full p-1 rounded bg-white text-black" list="title-list" value="${(pathData.requires?.titles || []).join(", ")}" />
      <label class="text-xs text-gray-400">Required Items:</label>
      <input class="requires-items-input w-full p-1 rounded bg-white text-black" list="item-list" value="${(pathData.requires?.items || []).join(", ")}" />
      <label class="text-xs text-gray-400">Required Status:</label>
      <input class="requires-status-input w-full p-1 rounded bg-white text-black" list="status-list" value="${pathData.requires?.status || ""}" />
      <label class="text-xs text-red-400 mt-2">❌ Excluded Titles:</label>
      <input class="excludes-titles-input w-full p-1 rounded bg-white text-black" value="${(pathData.excludes?.titles || []).join(", ")}" />
      <label class="text-xs text-red-400">❌ Excluded Items:</label>
      <input class="excludes-items-input w-full p-1 rounded bg-white text-black" value="${(pathData.excludes?.items || []).join(", ")}" />
      <label class="text-xs text-red-400">❌ Excluded Status:</label>
      <input class="excludes-status-input w-full p-1 rounded bg-white text-black" value="${pathData.excludes?.status || ""}" />
    </details>
  `;

  const resolutionLabel = document.createElement("label");
  resolutionLabel.className = "block text-green-300 text-sm";
  resolutionLabel.textContent = "Resolution Type:";
  div.appendChild(resolutionLabel);

  const resolutionSelect = document.createElement("select");
  resolutionSelect.className = "path-resolution bg-white text-black rounded p-2 mt-1";
  ["bo1", "dice", "vote"].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    resolutionSelect.appendChild(o);
  });
  resolutionSelect.value = pathData.resolution || "bo1";
  div.appendChild(resolutionSelect);

  const fixedOutcomeLabel = document.createElement("label");
  fixedOutcomeLabel.className = "block text-yellow-200 text-sm mt-2";
  fixedOutcomeLabel.textContent = "Force Outcome (optional):";
  div.appendChild(fixedOutcomeLabel);

  const fixedOutcomeSelect = document.createElement("select");
  fixedOutcomeSelect.className = "path-fixed-outcome bg-white text-black rounded p-2 mt-1";
  ["", "midweekHigh", "midweekLow", "finalSuccess", "finalFailure"].forEach(val => {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = val || "-- Let system decide --";
    fixedOutcomeSelect.appendChild(o);
  });
  fixedOutcomeSelect.value = pathData.fixedOutcome || "";
  div.appendChild(fixedOutcomeSelect);

  // Outcomes: Midweek High / Low, Final Success / Failure
  const outcomes = [
    { key: "midweekHigh", label: "Midweek Outcome - High" },
    { key: "midweekLow", label: "Midweek Outcome - Low" },
    { key: "finalSuccess", label: "Final Outcome - Success" },
    { key: "finalFailure", label: "Final Outcome - Failure" }
  ];

outcomes.forEach(({ key, label }) => {
  const type = key.startsWith("midweek") ? "midweek" : "final";
  const result = key.endsWith("High") || key.endsWith("Success") ? "high" : "low";
  const step = pathData?.[type]?.[result] || {};

  const block = document.createElement("details");
  block.className = "bg-gray-700 p-3 rounded mt-3";
  block.innerHTML = `
    <summary class="text-sm text-green-300 cursor-pointer">${label}</summary>

    <label class="text-xs text-white block mt-2">Narrative Text:</label>
    <textarea class="${key}-text w-full p-1 rounded bg-white text-black" placeholder="Narrative">${step.text || ""}</textarea>

    <label class="text-xs text-yellow-400 block mt-2">✅ Requirements (comma separated)</label>
    <input class="${key}-requires-titles w-full p-1 rounded text-black bg-white" placeholder="Titles" value="${(step.requires?.titles || []).join(", ")}" />
    <input class="${key}-requires-items w-full p-1 rounded text-black bg-white" placeholder="Items" value="${(step.requires?.items || []).join(", ")}" />
    <input class="${key}-requires-status w-full p-1 rounded text-black bg-white" placeholder="Status" value="${step.requires?.status || ""}" />

    <label class="text-xs text-red-400 block mt-2">❌ Exclusions</label>
    <input class="${key}-excludes-titles w-full p-1 rounded text-black bg-white" placeholder="Exclude Titles" value="${(step.excludes?.titles || []).join(", ")}" />
    <input class="${key}-excludes-items w-full p-1 rounded text-black bg-white" placeholder="Exclude Items" value="${(step.excludes?.items || []).join(", ")}" />
    <input class="${key}-excludes-status w-full p-1 rounded text-black bg-white" placeholder="Exclude Status" value="${step.excludes?.status || ""}" />
  `;
  div.appendChild(block);
});

  return div;
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

function updateDatalists() {
  const titleList = JSON.parse(localStorage.getItem("legendTitles") || "[]");
  const itemList = JSON.parse(localStorage.getItem("legendItems") || "[]");
  const statusList = JSON.parse(localStorage.getItem("legendStatuses") || "[]");

  document.getElementById("title-list").innerHTML = titleList.map(t => `<option value="${t}">`).join("");
  document.getElementById("item-list").innerHTML = itemList.map(t => `<option value="${t}">`).join("");
  document.getElementById("status-list").innerHTML = statusList.map(t => `<option value="${t}">`).join("");
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

function updateDatalists() {
  const titleList = JSON.parse(localStorage.getItem("legendTitles") || "[]");
  const itemList = JSON.parse(localStorage.getItem("legendItems") || "[]");
  const statusList = JSON.parse(localStorage.getItem("legendStatuses") || "[]");

  document.getElementById("title-list").innerHTML = titleList.map(t => `<option value="${t}">`).join("");
  document.getElementById("item-list").innerHTML = itemList.map(t => `<option value="${t}">`).join("");
  document.getElementById("status-list").innerHTML = statusList.map(t => `<option value="${t}">`).join("");
}

window.createNewQuest = createNewQuest;
window.createPathBlock = createPathBlock;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;
window.updateDatalists = updateDatalists;

// === Phase 3: Preview Engine and Resolution Logic ===

function renderPreview() {
  const select = document.getElementById("previewQuestSelect");
  const quest = questData[select.value];
  if (!quest) return;

  const flow = document.getElementById("questFlow");
  const intro = document.getElementById("introSection");
  const pathButtons = document.getElementById("pathButtons");
  const midweekResult = document.getElementById("midweekResult");
  const finalChoices = document.getElementById("finalChoices");
  const finalResult = document.getElementById("finalResult");
  const wrapup = document.getElementById("wrapupSection");

  flow.classList.remove("hidden");
  intro.textContent = quest.intro || "";
  pathButtons.innerHTML = "";
  midweekResult.innerHTML = "";
  finalChoices.innerHTML = "";
  finalResult.innerHTML = "";
  wrapup.innerHTML = "";

  if (!quest.paths) return;

  Object.entries(quest.paths).forEach(([pathKey, path]) => {
    const alreadyDone = playerState.completedPaths[pathKey];
    const eligible = checkExclusions(path);

    const btn = document.createElement("button");
    btn.className = `px-3 py-1 rounded text-white mr-2 mb-2 ${alreadyDone ? "bg-gray-500" : eligible ? "bg-green-600" : "bg-red-600"}`;
    btn.disabled = alreadyDone || !eligible;
    btn.textContent = `${path.title || pathKey} ${alreadyDone ? "✅" : eligible ? "" : "🔒"}`;

    btn.onclick = () => {
      let outcomeKey = path.fixedOutcome || resolveOutcome(path.resolution);
      if (!outcomeKey) return alert("❌ No resolution decided.");

      const [type, result] = outcomeKey.replace("midweek", "midweek.").replace("final", "final.").split(".");
      const outcome = path[type]?.[result];
      const text = outcome?.text || "No result text.";

      midweekResult.innerHTML = `📘 ${outcomeKey}: ${text}`;
      finalChoices.innerHTML = "";
      finalResult.innerHTML = "";
      wrapup.innerHTML = quest.wrapup?.text || "";

      applyEffects(outcome.effects);
      logPathAction(pathKey, outcomeKey, text, outcome.effects);
      playerState.completedPaths[pathKey] = true;
      renderScoreBoard();
      renderPreview();
    };
    pathButtons.appendChild(btn);
  });
}

document.getElementById("previewQuestSelect").addEventListener("change", renderPreview);

function resolveOutcome(resType) {
  const roll = Math.random();
  if (resType === "dice") return roll > 0.5 ? "midweekHigh" : "midweekLow";
  if (resType === "vote") return roll > 0.5 ? "finalSuccess" : "finalFailure";
  if (resType === "bo1") return confirm("Choose outcome? OK = High/Success, Cancel = Low/Fail") ? "midweekHigh" : "midweekLow";
  return "midweekHigh";
}

function renderScoreBoard() {
  const score = document.getElementById("scoreBoard");
  const logText = playerState.logs.map(log => `➡️ ${log.pathKey}: ${log.outcomeLabel}`).join("\n");
  score.textContent = logText;
}

function resetMockState() {
  simulatePlayerState();
  renderScoreBoard();
  renderPreview();
}

// === Phase 4: Admin Tools and Player Reward Summary ===

function showRewardSummary() {
  const score = document.getElementById("scoreBoard");
  const lines = [];
  for (const [pathKey, rewards] of Object.entries(playerState.rewards)) {
    lines.push(`🎁 ${pathKey}: ${rewards.join(", ")}`);
  }
  score.textContent = lines.join("\n");
}

function showTimelineLog() {
  const flow = document.getElementById("questFlow");
  const timeline = document.createElement("div");
  timeline.className = "bg-black border-t mt-4 pt-2 text-xs text-gray-400";
  timeline.innerHTML = "<strong>🕒 Timeline:</strong><br>" +
    playerState.logs.map(l => `➡️ ${l.pathKey}: ${l.outcomeLabel}`).join("<br>");
  flow.appendChild(timeline);
}

function editPlayerStateManually() {
  const fields = ["items", "titles", "status"];
  fields.forEach(field => {
    const val = prompt(`Edit ${field} (comma separated):`, playerState[field].join(", "));
    if (val !== null) {
      playerState[field] = val.split(",").map(x => x.trim()).filter(Boolean);
    }
  });
  renderPreview();
  renderScoreBoard();
}

function exportMockState() {
  const data = JSON.stringify(playerState, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mock_player_state.json";
  a.click();
}

function importMockState(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      playerState = JSON.parse(e.target.result);
      renderScoreBoard();
      renderPreview();
    } catch (err) {
      alert("❌ Invalid state file");
    }
  };
  reader.readAsText(file);
}

function saveLegends() {
  const titles = document.getElementById("legendTitles").value.split(",").map(x => x.trim()).filter(Boolean);
  const items = document.getElementById("legendItems").value.split(",").map(x => x.trim()).filter(Boolean);
  const statuses = document.getElementById("legendStatuses").value.split(",").map(x => x.trim()).filter(Boolean);
  localStorage.setItem("legendTitles", JSON.stringify(titles));
  localStorage.setItem("legendItems", JSON.stringify(items));
  localStorage.setItem("legendStatuses", JSON.stringify(statuses));
  updateDatalists();
  alert("✅ Legends saved!");
}

function loadLegends() {
  document.getElementById("legendTitles").value = JSON.parse(localStorage.getItem("legendTitles") || "[]").join(", ");
  document.getElementById("legendItems").value = JSON.parse(localStorage.getItem("legendItems") || "[]").join(", ");
  document.getElementById("legendStatuses").value = JSON.parse(localStorage.getItem("legendStatuses") || "[]").join(", ");
  updateDatalists();
}

function manualLoadQuests() {
  fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
    headers: { Authorization: `token ${githubToken}` }
  })
    .then(res => res.json())
    .then(data => {
      const decoded = atob(data.content);
      questData = JSON.parse(decoded);
      renderQuestList();
      populatePreviewDropdown();
    })
    .catch(err => {
      alert("❌ Failed to load quests");
      console.error(err);
    });
}

function renderQuestList() {
  const questList = document.getElementById("questList");
  if (!questList) return;
  questList.innerHTML = "";
  Object.keys(questData).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1 mr-2 mb-2";
    btn.textContent = key;
    btn.onclick = () => openQuestEditor(key);
    questList.appendChild(btn);
  });
}

function populatePreviewDropdown() {
  const dropdown = document.getElementById("previewQuestSelect");
  if (!dropdown) return;
  dropdown.innerHTML = "";
  Object.keys(questData).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    dropdown.appendChild(option);
  });
}

function saveQuestToGitHub() {
  const key = document.getElementById("questKey").value.trim();
  if (!key) return alert("❌ Missing quest key");

  const quest = {
    intro: document.getElementById("questIntro").value.trim(),
    wrapup: { text: document.getElementById("questWrap").value.trim() },
    between: document.getElementById("sideQuestBetween").value.split("|").map(s => s.trim()).filter(Boolean),
    paths: {}
  };

  const pathBlocks = document.querySelectorAll(".path-block");
  pathBlocks.forEach((block, i) => {
    const title = block.querySelector(".path-title").value.trim();
    const description = block.querySelector(".path-description").value.trim();

    const requires = {
      titles: block.querySelector(".requires-titles-input").value.split(",").map(s => s.trim()).filter(Boolean),
      items: block.querySelector(".requires-items-input").value.split(",").map(s => s.trim()).filter(Boolean),
      status: block.querySelector(".requires-status-input").value.split(",").map(s => s.trim()).filter(Boolean)
    };

    const excludes = {
      titles: block.querySelector(".excludes-titles-input").value.split(",").map(s => s.trim()).filter(Boolean),
      items: block.querySelector(".excludes-items-input").value.split(",").map(s => s.trim()).filter(Boolean),
      status: block.querySelector(".excludes-status-input").value.split(",").map(s => s.trim()).filter(Boolean)
    };

    const resolution = block.querySelector(".path-resolution").value;
    const fixedOutcome = block.querySelector(".path-fixed-outcome").value;

    const outcomeKeys = ["midweekHigh", "midweekLow", "finalSuccess", "finalFailure"];
    const path = { title, description, requires, excludes, resolution, fixedOutcome };

    outcomeKeys.forEach(key => {
      const text = block.querySelector(`.${key}-text`)?.value.trim();
      if (!text) return;

      const getCSV = sel => block.querySelector(sel)?.value.split(",").map(s => s.trim()).filter(Boolean) || [];

      const stepData = {
        text,
        requires: {
          titles: getCSV(`.${key}-requires-titles`),
          items: getCSV(`.${key}-requires-items`),
          status: block.querySelector(`.${key}-requires-status`)?.value.trim() || ""
        },
        excludes: {
          titles: getCSV(`.${key}-excludes-titles`),
          items: getCSV(`.${key}-excludes-items`),
          status: block.querySelector(`.${key}-excludes-status`)?.value.trim() || ""
        },
        effects: {
          grant_items: getCSV(`.${key}-grant-items`),
          grant_titles: getCSV(`.${key}-grant-titles`),
          grant_status: getCSV(`.${key}-grant-status`),
          remove_items: getCSV(`.${key}-remove-items`),
          remove_titles: getCSV(`.${key}-remove-titles`),
          remove_status: getCSV(`.${key}-remove-status`)
        }
      };

      const [type, result] = key.replace("midweek", "midweek.").replace("final", "final.").split(".");
      path[type] ??= {};
      path[type][result] = stepData;
    });

    quest.paths[`path_${i}`] = path;
  });

  questData[key] = quest;

  const jsonString = JSON.stringify(questData, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(jsonString))); // emoji-safe

  // ✅ Fetch latest file to get the required `sha`
  fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
    headers: {
      Authorization: `token ${githubToken}`
    }
  })
    .then(res => res.json())
    .then(file => {
      const payload = {
        message: `Update quest: ${key}`,
        content: encoded,
        sha: file.sha
      };

      return fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    })
    .then(res => {
      if (!res.ok) throw new Error("GitHub save failed");
      return res.json();
    })
    .then(() => {
      alert("✅ Quest saved to GitHub");
    })
    .catch(err => {
      console.error(err);
      alert("❌ Failed to save quest");
    });
}

function exportQuestToFile() {
  const key = document.getElementById("questKey").value.trim();
  if (!key) return alert("❌ Missing quest key");
  const data = JSON.stringify(questData[key], null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${key.replace(/\s+/g, "_").toLowerCase()}.json`;
  a.click();
}

// === Expose Global Functions ===
window.manualLoadQuests = manualLoadQuests;
window.saveLegends = saveLegends;
window.showRewardSummary = showRewardSummary;
window.showTimelineLog = showTimelineLog;
window.editPlayerStateManually = editPlayerStateManually;
window.exportMockState = exportMockState;
window.importMockState = importMockState;
window.resetMockState = resetMockState;
window.createNewQuest = createNewQuest;
window.createPathBlock = createPathBlock;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;
window.updateDatalists = updateDatalists;
window.renderPreview = renderPreview;
