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

// === Refactored createPathBlock ===
function createPathBlock(pathKey = "", pathData = {}) {
  const div = document.createElement("div");
  div.className = "path-block border p-2 bg-gray-800 rounded mb-2";
  div.draggable = true;
  div.innerHTML = `
    <div class="flex justify-between items-center mb-1">
      <span class="text-xs text-gray-400">↕ Drag to reorder</span>
      <button class="remove-path bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-xs">🗑 Remove</button>
    </div>
        <label class="text-xs text-pink-300">Grant Titles:</label>
    <input class="grant-titles-input w-full p-1 rounded text-black" list="title-list" />

    <label class="text-xs text-pink-300">Grant Items:</label>
    <input class="grant-items-input w-full p-1 rounded text-black" list="item-list" />

    <label class="text-xs text-pink-300">Grant Status:</label>
    <input class="grant-status-input w-full p-1 rounded text-black" list="status-list" />

    <label class="text-xs text-pink-300">Remove Titles:</label>
    <input class="remove-titles-input w-full p-1 rounded text-black" list="title-list" />

    <label class="text-xs text-pink-300">Remove Status:</label>
    <input class="remove-status-input w-full p-1 rounded text-black" list="status-list" />

    <label class="text-xs text-gray-400">Required Status:</label>
    <input class="requires-status-input w-full p-1 rounded text-black" list="status-list" />

    <label class="text-xs text-gray-400">Required Items:</label>
    <input class="requires-items-input w-full p-1 rounded text-black" list="item-list" />
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
    outcomeBlock.className = "bg-gray-700 p-2 rounded mt-3";
    outcomeBlock.innerHTML = `
      <h4 class="text-sm text-green-300">${label}</h4>
      <textarea class="${key}-text w-full p-1 rounded text-black">${step.text || ""}</textarea>

      <label class="text-xs text-gray-400">Required Items:</label>
      <input class="${key}-requires-items w-full p-1 rounded text-black" value="${(step.requires?.items || []).join(", ")}" />
      <label class="text-xs text-gray-400">Required Status (Alive, Dead, Any):</label>
      <input class="${key}-requires-status w-full p-1 rounded text-black" value="${step.requires?.status || "Any"}" />

      <label class="text-xs text-pink-300">Grant Items:</label>
      <input class="${key}-grant-items w-full p-1 rounded text-black" value="${(step.effects?.grant_items || []).join(", ")}" />
      <label class="text-xs text-pink-300">Grant Status:</label>
      <input class="${key}-grant-status w-full p-1 rounded text-black" value="${(step.effects?.grant_status || []).join(", ")}" />
      <label class="text-xs text-pink-300">Grant Titles:</label>
      <input class="${key}-grant-titles w-full p-1 rounded text-black" value="${(step.effects?.grant_titles || []).join(", ")}" />

      <label class="text-xs text-pink-300">Remove Status:</label>
      <input class="${key}-remove-status w-full p-1 rounded text-black" value="${(step.effects?.remove_status || []).join(", ")}" />
      <label class="text-xs text-pink-300">Remove Titles:</label>
      <input class="${key}-remove-titles w-full p-1 rounded text-black" value="${(step.effects?.remove_titles || []).join(", ")}" />
    `;
    div.appendChild(outcomeBlock);
  });

    // 🌐 Wire input values to pathData for saveQuestToGitHub
  const grantTitles = document.createElement("input");
  grantTitles.className = "grant-titles-input w-full p-1 rounded text-black";
  grantTitles.setAttribute("list", "title-list");
  grantTitles.value = (pathData.effects?.grant_titles || []).join(", ");
  div.appendChild(grantTitles);

  const grantItems = document.createElement("input");
  grantItems.className = "grant-items-input w-full p-1 rounded text-black";
  grantItems.setAttribute("list", "item-list");
  grantItems.value = (pathData.effects?.grant_items || []).join(", ");
  div.appendChild(grantItems);

  const grantStatus = document.createElement("input");
  grantStatus.className = "grant-status-input w-full p-1 rounded text-black";
  grantStatus.setAttribute("list", "status-list");
  grantStatus.value = (pathData.effects?.grant_status || []).join(", ");
  div.appendChild(grantStatus);

  const removeTitles = document.createElement("input");
  removeTitles.className = "remove-titles-input w-full p-1 rounded text-black";
  removeTitles.setAttribute("list", "title-list");
  removeTitles.value = (pathData.effects?.remove_titles || []).join(", ");
  div.appendChild(removeTitles);

  const removeStatus = document.createElement("input");
  removeStatus.className = "remove-status-input w-full p-1 rounded text-black";
  removeStatus.setAttribute("list", "status-list");
  removeStatus.value = (pathData.effects?.remove_status || []).join(", ");
  div.appendChild(removeStatus);

  const requiresStatus = document.createElement("input");
  requiresStatus.className = "requires-status-input w-full p-1 rounded text-black";
  requiresStatus.setAttribute("list", "status-list");
  requiresStatus.value = pathData.requires?.status || "Any";
  div.appendChild(requiresStatus);

  const requiresItems = document.createElement("input");
  requiresItems.className = "requires-items-input w-full p-1 rounded text-black";
  requiresItems.setAttribute("list", "item-list");
  requiresItems.value = (pathData.requires?.items || []).join(", ");
  div.appendChild(requiresItems);

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

async function saveQuestToGitHub() {
  const key = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrapup = document.getElementById("questWrap").value;
  const betweenRaw = document.getElementById("sideQuestBetween").value;
  const between = betweenRaw.trim() ? betweenRaw.split("|").map(x => x.trim()) : undefined;

  const paths = {};
  const blocks = document.querySelectorAll("#pathsContainer > .path-block");

  blocks.forEach(block => {
    let pathKey = block.querySelector(".path-key").value.trim();
    const pathTitle = block.querySelector(".path-title").value.trim();
    if (!pathKey && pathTitle) pathKey = autoGenerateKey(pathTitle);
    if (!pathKey) return;

    const pathData = {
      title: pathTitle,
      description: block.querySelector(".path-desc").value.trim(),
      midweek: {},
      final: {}
    };

    // ⬇️ Extract path-level effects and requirements
    pathData.effects = {
      grant_titles: block.querySelector(".grant-titles-input")?.value.split(",").map(s => s.trim()).filter(Boolean) || [],
      grant_items: block.querySelector(".grant-items-input")?.value.split(",").map(s => s.trim()).filter(Boolean) || [],
      grant_status: block.querySelector(".grant-status-input")?.value.split(",").map(s => s.trim()).filter(Boolean) || [],
      remove_titles: block.querySelector(".remove-titles-input")?.value.split(",").map(s => s.trim()).filter(Boolean) || [],
      remove_status: block.querySelector(".remove-status-input")?.value.split(",").map(s => s.trim()).filter(Boolean) || []
    };

    pathData.requires = {
      items: block.querySelector(".requires-items-input")?.value.split(",").map(s => s.trim()).filter(Boolean) || [],
      status: block.querySelector(".requires-status-input")?.value.trim() || "Any"
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

      const stepData = {
        text,
        requires: {
          items: requiresItems.split(",").map(x => x.trim()).filter(Boolean),
          status: requiresStatus.trim() || "Any"
        },
        effects: {
          grant_items: grantItems.split(",").map(x => x.trim()).filter(Boolean),
          grant_status: grantStatus.split(",").map(x => x.trim()).filter(Boolean),
          grant_titles: grantTitles.split(",").map(x => x.trim()).filter(Boolean),
          remove_status: removeStatus.split(",").map(x => x.trim()).filter(Boolean),
          remove_titles: removeTitles.split(",").map(x => x.trim()).filter(Boolean)
        }
      };

      if (blockKey.startsWith("midweek")) {
        pathData.midweek[step] = stepData;
      } else {
        pathData.final[step] = stepData;
      }
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
  }  // ←✅ ADD THIS CLOSING BRACE!

// === Export functions to global for inline HTML access ===
window.manualLoadQuests = manualLoadQuests;
window.saveQuestToGitHub = saveQuestToGitHub;
window.createNewQuest = createNewQuest;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;

// Adds requirements & effects when saving path data
function extractPathBlockData(block) {
  let pathKey = block.querySelector(".path-key").value.trim();
  let title = block.querySelector(".path-title").value.trim();
  let description = block.querySelector(".path-desc").value.trim();
  let midHighText = block.querySelector(".mid-high-text").value.trim();
  let midLowText = block.querySelector(".mid-low-text").value.trim();
  let finalSuccessText = block.querySelector(".final-success-text").value.trim();
  let finalFailureText = block.querySelector(".final-failure-text").value.trim();

  let requiredItems = block.querySelector(".required-items")?.value.split(",").map(x => x.trim()).filter(Boolean) || [];
  let requiredStatus = block.querySelector(".required-status")?.value.trim() || "Any";
  let grantsEffects = block.querySelector(".grants-effects")?.value.split(",").map(x => x.trim()).filter(Boolean) || [];
  let removesEffects = block.querySelector(".removes-effects")?.value.split(",").map(x => x.trim()).filter(Boolean) || [];

  return {
    title,
    description,
    requirements: {
      items: requiredItems,
      status: requiredStatus
    },
    effects: {
      grants: grantsEffects,
      removes: removesEffects
    },
    midweek: {
      High: { text: midHighText },
      Low: { text: midLowText }
    },
    final: {
      Success: { text: finalSuccessText },
      Failure: { text: finalFailureText }
    }
  };
}

// Optional: when loading quests, you can restore these fields from JSON here too.

// Inserts quest between two other quests (between[0] and between[1])
function insertQuestBetween(existingData, newQuestKey, newQuestData, betweenArray) {
  if (!betweenArray || betweenArray.length !== 2) return { ...existingData, [newQuestKey]: newQuestData };
  const newData = {};
  let inserted = false;

  for (const [key, value] of Object.entries(existingData)) {
    newData[key] = value;
    if (key === betweenArray[0] && !inserted) {
      newData[newQuestKey] = newQuestData;
      inserted = true;
    }
  }

  if (!inserted) newData[newQuestKey] = newQuestData;
  return newData;
}
