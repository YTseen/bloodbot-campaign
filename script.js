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
  const block = document.createElement("div");
  block.className = "path-block";

  const pathKeyInput = document.createElement("input");
  pathKeyInput.placeholder = "Path Key";
  pathKeyInput.value = pathKey;
  pathKeyInput.className = "path-key";

  const pathTextInput = document.createElement("textarea");
  pathTextInput.placeholder = "Path Text";
  pathTextInput.className = "path-text";
  pathTextInput.value = pathData.text || "";

  const pathNextInput = document.createElement("input");
  pathNextInput.placeholder = "Next Quest Key";
  pathNextInput.className = "path-next";
  pathNextInput.value = pathData.next || "";

  const resolutionLabel = document.createElement("label");
  resolutionLabel.textContent = "Resolution Type:";

  const resolutionSelect = document.createElement("select");
  resolutionSelect.className = "path-resolution";
  ["bo1", "dice", "vote"].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    resolutionSelect.appendChild(o);
  });
  resolutionSelect.value = pathData.resolution || "bo1";

  block.appendChild(pathKeyInput);
  block.appendChild(pathTextInput);
  block.appendChild(pathNextInput);
  block.appendChild(resolutionLabel);
  block.appendChild(resolutionSelect);

  document.getElementById("pathsContainer").appendChild(block);
}

function saveQuestToGitHub() {
  const key = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrap = document.getElementById("questWrap").value;
  const between = document.getElementById("sideQuestBetween").value;

  const pathBlocks = document.querySelectorAll(".path-block");
  const paths = Array.from(pathBlocks).map(block => {
    const pathTextInput = block.querySelector(".path-text");
    const pathNextInput = block.querySelector(".path-next");
    const pathKeyInput = block.querySelector(".path-key");
    const resolutionSelect = block.querySelector(".path-resolution");
    return {
      key: pathKeyInput.value,
      text: pathTextInput.value,
      next: pathNextInput.value,
      resolution: resolutionSelect.value,
    };
  });

  questData[key] = {
    intro,
    wrap,
    between,
    paths
  };

  const content = JSON.stringify(questData, null, 2);
  const url = `https://api.github.com/repos/${repo}/contents/${questFilePath}`;

  fetch(url, {
    method: "GET",
    headers: {
      Authorization: `token ${githubToken}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      const sha = data.sha;

      fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Update quest ${key}`,
          content: btoa(unescape(encodeURIComponent(content))),
          sha,
        }),
      })
        .then(res => res.json())
        .then(response => alert("Quest saved successfully!"))
        .catch(err => console.error("Save Error:", err));
    });
}

function openQuestEditor(key) {
  const quest = questData[key];
  if (!quest) return;

  selectedKey = key;
  document.getElementById("questKey").value = key;
  document.getElementById("questIntro").value = quest.intro || "";
  document.getElementById("questWrap").value = quest.wrap || "";
  document.getElementById("sideQuestBetween").value = quest.between || "";

  // ✅ Force conversion to array if it's a single object or something else
  let paths = quest.paths;
  if (!Array.isArray(paths)) {
    if (typeof paths === "object" && paths !== null) {
      paths = Object.values(paths); // fallback if object-like
    } else {
      paths = [];
    }
  }

  document.getElementById("pathsContainer").innerHTML = "";
  paths.forEach(path => createPathBlock(path.key, path));
  document.getElementById("editorSection").classList.remove("hidden");
}

function manualLoadQuests() {
  fetch(`https://api.github.com/repos/${repo}/contents/${questFilePath}`, {
    headers: {
      Authorization: `token ${githubToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const decoded = atob(data.content);
      questData = JSON.parse(decoded);

      const mainList = document.getElementById("mainQuestList");
      const sideList = document.getElementById("sideQuestList");
      mainList.innerHTML = "";
      sideList.innerHTML = "";

      Object.keys(questData).forEach(key => {
        const quest = questData[key];
        const li = document.createElement("li");
        li.textContent = key;
        li.className = "cursor-pointer hover:underline text-blue-400";
        li.onclick = () => openQuestEditor(key);

        if (quest.between) {
          sideList.appendChild(li);
        } else {
          mainList.appendChild(li);
        }
      });
    })
    .catch(err => {
      console.error("Load error:", err);
      alert("Failed to load quests.");
    });
}

// 👇 Expose functions to HTML
window.manualLoadQuests = manualLoadQuests;
window.createNewQuest = createNewQuest;
window.saveQuestToGitHub = saveQuestToGitHub;
window.openQuestEditor = openQuestEditor;
window.createPathBlock = createPathBlock;


