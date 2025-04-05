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

  // Enhanced Fields
  const extraFields = document.createElement("div");
  extraFields.className = "extra-path-fields";
  extraFields.innerHTML = `
    <label><strong>🧱 Requirements</strong></label><br>
    <label>Required Items (comma-separated):</label>
    <input type="text" class="requires-items" value="${(pathData.requires?.items || []).join(", ")}"><br>
    <label>Required Status (Alive, Dead, Any):</label>
    <input type="text" class="requires-status" value="${pathData.requires?.status || ""}"><br><br>

    <label><strong>🎁 Effects</strong></label><br>
    <label>Grants Effects (comma-separated):</label>
    <input type="text" class="grants-effects" value="${(pathData.rewards?.effects || []).join(", ")}"><br>
    <label>Removes Effects (comma-separated):</label>
    <input type="text" class="removes-effects" value="${(pathData.penalties?.effects || []).join(", ")}"><br>
  `;
  div.appendChild(extraFields);

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

    paths[pathKey] = {
      title: pathTitle,
      description: block.querySelector(".path-desc").value.trim(),
      midweek: {
        High: {
          text: block.querySelector(".mid-high-text").value,
          rewards: { items: block.querySelector(".mid-high-rewards").value.split(",").map(x => x.trim()) }
        },
        Low: {
          text: block.querySelector(".mid-low-text").value,
          penalties: { roles: block.querySelector(".mid-low-penalties").value.split(",").map(x => x.trim()) }
        }
      },
      final: {
        Success: {
          text: block.querySelector(".final-success-text").value,
          rewards: { items: block.querySelector(".final-success-rewards").value.split(",").map(x => x.trim()) }
        },
        Failure: {
          text: block.querySelector(".final-failure-text").value,
          penalties: { roles: block.querySelector(".final-failure-penalties").value.split(",").map(x => x.trim()) }
        }
      }
    };

    // Inject enhanced field data
    const requiresItems = block.querySelector(".requires-items")?.value || "";
    const requiresStatus = block.querySelector(".requires-status")?.value || "";
    const grantsEffects = block.querySelector(".grants-effects")?.value || "";
    const removesEffects = block.querySelector(".removes-effects")?.value || "";

    if (!paths[pathKey].requires) paths[pathKey].requires = {};
    if (!paths[pathKey].rewards) paths[pathKey].rewards = {};
    if (!paths[pathKey].penalties) paths[pathKey].penalties = {};

    paths[pathKey].requires.items = requiresItems.split(",").map(x => x.trim()).filter(Boolean);
    paths[pathKey].requires.status = requiresStatus.trim();
    paths[pathKey].rewards.effects = grantsEffects.split(",").map(x => x.trim()).filter(Boolean);
    paths[pathKey].penalties.effects = removesEffects.split(",").map(x => x.trim()).filter(Boolean);
  });

  const newQuest = {
    intro,
    wrapup: { text: wrapup },
    ...(between ? { between } : {}),
    ...(Object.keys(paths).length ? { paths } : {})
  };

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
}

// === Export functions to global for inline HTML access ===
window.manualLoadQuests = manualLoadQuests;
window.saveQuestToGitHub = saveQuestToGitHub;
window.createNewQuest = createNewQuest;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;
