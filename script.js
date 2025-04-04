
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

// ========== LOAD QUESTS ==========
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

async function loadQuestFile() {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
      headers: { Authorization: `token ${githubToken}` }
    });

    if (!res.ok) throw new Error("Failed to fetch quest file");
    const data = await res.json();
    const decoded = atob(data.content);
    questData = JSON.parse(decoded);
    renderQuestList();
  } catch (e) {
    alert("❌ Failed to load quest data.");
    console.error(e);
  }
}

function renderQuestList() {
  const list = document.getElementById("mainQuestList");
  list.innerHTML = "";
  Object.keys(questData).forEach(key => {
    const li = document.createElement("li");
    li.className = "flex items-center space-x-2";

    const span = document.createElement("span");
    span.textContent = key;
    span.className = "text-white font-semibold";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "text-sm text-blue-400 hover:text-blue-200";
    editBtn.onclick = () => openQuestEditor(key);

    li.appendChild(span);
    li.appendChild(editBtn);
    list.appendChild(li);
  });
}

// ========== QUEST EDITOR ==========
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

function createPathBlock(pathKey, pathData = {}) {
  const div = document.createElement("div");
  div.className = "border p-2 bg-gray-800 rounded";
  div.innerHTML = `
    <input class="path-key w-full my-1 p-1 rounded" placeholder="Path Key" value="${pathKey || ""}"/>

    <input class="path-title w-full my-1 p-1 rounded" placeholder="Title" value="${pathData.title || ""}"/>
    <input class="path-desc w-full my-1 p-1 rounded" placeholder="Description" value="${pathData.description || ""}"/>

    <h4 class="text-sm text-green-300 mt-2">Midweek - High</h4>
    <textarea class="mid-high-text w-full p-1 rounded">${pathData.midweek?.High?.text || ""}</textarea>
    <input class="mid-high-rewards w-full p-1 rounded" placeholder="Rewards (comma-separated)" value="${(pathData.midweek?.High?.rewards?.items || []).join(', ')}"/>

    <h4 class="text-sm text-green-300 mt-2">Midweek - Low</h4>
    <textarea class="mid-low-text w-full p-1 rounded">${pathData.midweek?.Low?.text || ""}</textarea>
    <input class="mid-low-penalties w-full p-1 rounded" placeholder="Penalties (comma-separated)" value="${(pathData.midweek?.Low?.penalties?.roles || []).join(', ')}"/>

    <h4 class="text-sm text-green-300 mt-2">Final - Success</h4>
    <textarea class="final-success-text w-full p-1 rounded">${pathData.final?.Success?.text || ""}</textarea>
    <input class="final-success-rewards w-full p-1 rounded" placeholder="Rewards (comma-separated)" value="${(pathData.final?.Success?.rewards?.items || []).join(', ')}"/>

    <h4 class="text-sm text-green-300 mt-2">Final - Failure</h4>
    <textarea class="final-failure-text w-full p-1 rounded">${pathData.final?.Failure?.text || ""}</textarea>
    <input class="final-failure-penalties w-full p-1 rounded" placeholder="Penalties (comma-separated)" value="${(pathData.final?.Failure?.penalties?.roles || []).join(', ')}"/>
  `;
  return div;
}

function addPathBlock() {
  const container = document.getElementById("pathsContainer");
  container.appendChild(createPathBlock());
}

// ========== SAVE ==========
async function saveQuestToGitHub() {
  const key = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrapup = document.getElementById("questWrap").value;
  const betweenRaw = document.getElementById("sideQuestBetween").value;

  const between = betweenRaw.trim() ? betweenRaw.split("|").map(x => x.trim()) : undefined;

  const paths = {};
  const blocks = document.querySelectorAll("#pathsContainer > div");

  blocks.forEach(block => {
    const pathKey = block.querySelector(".path-key").value;
    if (!pathKey) return;

    paths[pathKey] = {
      title: block.querySelector(".path-title").value,
      description: block.querySelector(".path-desc").value,
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
