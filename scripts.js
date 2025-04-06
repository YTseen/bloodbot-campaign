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
  div.className = "path-block border border-gray-700 p-3 bg-gray-800 rounded mb-4";
  div.draggable = true;

  div.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <span class="text-xs text-gray-400">↕ Drag to reorder</span>
      <button class="remove-path bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-xs">🗑 Remove</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <details open class="bg-gray-900 p-2 rounded">
        <summary class="cursor-pointer text-sm text-pink-300 mb-2">🎁 Grants</summary>
        <label class="text-xs text-pink-300">Titles:</label>
        <input class="grant-titles-input w-full p-1 mb-1 rounded text-black" list="title-list" />
        <label class="text-xs text-pink-300">Items:</label>
        <input class="grant-items-input w-full p-1 mb-1 rounded text-black" list="item-list" />
        <label class="text-xs text-pink-300">Status:</label>
        <input class="grant-status-input w-full p-1 rounded text-black" list="status-list" />
      </details>

      <details class="bg-gray-900 p-2 rounded">
        <summary class="cursor-pointer text-sm text-pink-300 mb-2">🚫 Removes</summary>
        <label class="text-xs text-pink-300">Titles:</label>
        <input class="remove-titles-input w-full p-1 mb-1 rounded text-black" list="title-list" />
        <label class="text-xs text-pink-300">Status:</label>
        <input class="remove-status-input w-full p-1 rounded text-black" list="status-list" />
      </details>

      <details class="bg-gray-900 p-2 rounded">
        <summary class="cursor-pointer text-sm text-pink-300 mb-2">📜 Requirements</summary>
        <label class="text-xs text-gray-300">Status:</label>
        <input class="requires-status-input w-full p-1 mb-1 rounded text-black" list="status-list" />
        <label class="text-xs text-gray-300">Items:</label>
        <input class="requires-items-input w-full p-1 rounded text-black" list="item-list" />
      </details>
    </div>
  `;

  const outcomes = [
    { label: "Midweek - High", key: "midweekHigh" },
    { label: "Midweek - Low", key: "midweekLow" },
    { label: "Final - Success", key: "finalSuccess" },
    { label: "Final - Failure", key: "finalFailure" }
  ];

  outcomes.forEach(({ label, key }) => {
    const stepKey = key.replace("midweek", "midweek.").replace("final", "final.");
    const step = pathData?.[stepKey.split(".")[0]]?.[stepKey.split(".")[1]] || {};
    const outcomeBlock = document.createElement("div");
    outcomeBlock.className = "bg-gray-700 p-3 rounded mt-4";

    outcomeBlock.innerHTML = `
      <h4 class="text-sm text-green-300 mb-1">${label}</h4>
      <textarea class="${key}-text w-full p-1 rounded text-black mb-2" placeholder="Outcome text...">${step.text || ""}</textarea>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <details class="bg-gray-800 p-2 rounded">
          <summary class="cursor-pointer text-xs text-pink-300">📜 Requirements</summary>
          <label class="text-xs text-gray-300">Items:</label>
          <input class="${key}-requires-items w-full p-1 mb-1 rounded text-black" value="${(step.requires?.items || []).join(", ")}" />
          <label class="text-xs text-gray-300">Status:</label>
          <input class="${key}-requires-status w-full p-1 rounded text-black" value="${step.requires?.status || "Any"}" />
        </details>

        <details class="bg-gray-800 p-2 rounded">
          <summary class="cursor-pointer text-xs text-pink-300">🎁 Grants</summary>
          <label class="text-xs text-pink-300">Items:</label>
          <input class="${key}-grant-items w-full p-1 mb-1 rounded text-black" value="${(step.effects?.grant_items || []).join(", ")}" />
          <label class="text-xs text-pink-300">Status:</label>
          <input class="${key}-grant-status w-full p-1 mb-1 rounded text-black" value="${(step.effects?.grant_status || []).join(", ")}" />
          <label class="text-xs text-pink-300">Titles:</label>
          <input class="${key}-grant-titles w-full p-1 rounded text-black" value="${(step.effects?.grant_titles || []).join(", ")}" />
        </details>

        <details class="bg-gray-800 p-2 rounded">
          <summary class="cursor-pointer text-xs text-pink-300">🚫 Removes</summary>
          <label class="text-xs text-pink-300">Status:</label>
          <input class="${key}-remove-status w-full p-1 mb-1 rounded text-black" value="${(step.effects?.remove_status || []).join(", ")}" />
          <label class="text-xs text-pink-300">Titles:</label>
          <input class="${key}-remove-titles w-full p-1 rounded text-black" value="${(step.effects?.remove_titles || []).join(", ")}" />
        </details>
      </div>
    `;

    div.appendChild(outcomeBlock);
  });

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

async function saveQuestToGitHub() {
  const key = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrapup = document.getElementById("questWrap").value;
  const betweenRaw = document.getElementById("sideQuestBetween").value;
  const between = betweenRaw.trim() ? betweenRaw.split("|").map(x => x.trim()) : undefined;

  const paths = {};
  const blocks = document.querySelectorAll("#pathsContainer > .path-block");

  blocks.forEach(block => {
    let pathKey = block.querySelector(".path-key")?.value?.trim() || autoGenerateKey(Date.now().toString());
    const pathData = {
      title: "",
      description: "",
      effects: {},
      requires: {},
      midweek: {},
      final: {}
    };

    const outcomes = [
      { step: "High", blockKey: "midweekHigh" },
      { step: "Low", blockKey: "midweekLow" },
      { step: "Success", blockKey: "finalSuccess" },
      { step: "Failure", blockKey: "finalFailure" }
    ];

    outcomes.forEach(({ step, blockKey }) => {
      const text = block.querySelector(`.${blockKey}-text`)?.value || "";
      const requiresItems = block.querySelector(`.${blockKey}-requires-items`)?.value || "";
      const requiresStatus = block.querySelector(`.${blockKey}-requires-status`)?.value || "Any";
      const grantItems = block.querySelector(`.${blockKey}-grant-items`)?.value || "";
      const grantStatus = block.querySelector(`.${blockKey}-grant-status`)?.value || "";
      const grantTitles = block.querySelector(`.${blockKey}-grant-titles`)?.value || "";
      const removeStatus = block.querySelector(`.${blockKey}-remove-status`)?.value || "";
      const removeTitles = block.querySelector(`.${blockKey}-remove-titles`)?.value || "";

      pathData[blockKey.includes("midweek") ? "midweek" : "final"][step] = {
        text,
        requires: {
          items: requiresItems.split(",").map(x => x.trim()).filter(Boolean),
          status: requiresStatus
        },
        effects: {
          grant_items: grantItems.split(",").map(x => x.trim()).filter(Boolean),
          grant_status: grantStatus.split(",").map(x => x.trim()).filter(Boolean),
          grant_titles: grantTitles.split(",").map(x => x.trim()).filter(Boolean),
          remove_status: removeStatus.split(",").map(x => x.trim()).filter(Boolean),
          remove_titles: removeTitles.split(",").map(x => x.trim()).filter(Boolean)
        }
      };
    });

    paths[pathKey] = pathData;
  });

  const newQuest = {
    intro,
    wrapup: { text: wrapup },
    ...(between ? { between } : {}),
    ...(Object.keys(paths).length ? { paths } : {})
  };

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
      headers: { Authorization: `token ${githubToken}` }
    });
    const data = await res.json();
    const decoded = atob(data.content);
    const json = JSON.parse(decoded);

    json[key] = newQuest;

    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2))));
    const saveRes = await fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Save quest ${key}`,
        content: updatedContent,
        sha: data.sha
      })
    });

    if (saveRes.ok) {
      alert("✅ Quest saved!");
      manualLoadQuests();
    } else {
      alert("❌ Save failed");
      console.error(await saveRes.text());
    }
  } catch (err) {
    alert("❌ Error saving quest");
    console.error(err);
  }
}

// Export to HTML
window.manualLoadQuests = manualLoadQuests;
window.saveQuestToGitHub = saveQuestToGitHub;
window.createNewQuest = createNewQuest;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;
