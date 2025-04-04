
// ========== 🔒 GITHUB SAVE SYSTEM ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter your GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

const repo = "YTseen/bloodbot-campaign";
const questFilePath = "data/quest_data.json";

let questData = {};
let selectedKey = null;

// ========== LOAD ==========
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
      headers: {
        Authorization: `token ${githubToken}`
      }
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
  const listElement = document.getElementById("mainQuestList");
  listElement.innerHTML = "";

  Object.keys(questData).forEach((key) => {
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
    listElement.appendChild(li);
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

  const pathsContainer = document.getElementById("pathsContainer");
  pathsContainer.innerHTML = "";

  if (quest.paths) {
    Object.entries(quest.paths).forEach(([pathKey, pathData]) => {
      const pathDiv = document.createElement("div");
      pathDiv.className = "border p-2 mb-2";

      const label = document.createElement("label");
      label.textContent = pathKey + ": " + pathData.description;
      label.className = "text-sm text-purple-300";

      pathDiv.appendChild(label);
      pathsContainer.appendChild(pathDiv);
    });
  }

  if (quest.between) {
    document.getElementById("sideQuestBetween").value = quest.between.join(" | ");
  } else {
    document.getElementById("sideQuestBetween").value = "";
  }
}

// ========== QUEST SAVE ==========
async function saveQuestToGitHub() {
  const key = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrapup = document.getElementById("questWrap").value;
  const betweenRaw = document.getElementById("sideQuestBetween").value;

  if (!key) {
    alert("Quest key is required");
    return;
  }

  const isSideQuest = betweenRaw.trim().length > 0;
  const between = isSideQuest ? betweenRaw.split("|").map(x => x.trim()) : undefined;

  // Compose new quest
  const newQuest = {
    intro: intro,
    wrapup: { text: wrapup },
    ...(between ? { between } : {})
  };

  // Load latest file
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
    headers: {
      Authorization: `token ${githubToken}`
    }
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
    alert("✅ Quest saved to GitHub!");
    manualLoadQuests(); // reload list
  } else {
    alert("❌ Failed to save.");
    console.error(await saveRes.text());
  }
}
