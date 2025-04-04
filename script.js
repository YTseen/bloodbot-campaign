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
    populatePreviewDropdown();
  } catch (e) {
    alert("❌ Failed to load quest data.");
    console.error(e);
  }
}

function renderQuestList() {
  const mainList = document.getElementById("mainQuestList");
  const sideList = document.getElementById("sideQuestList");
  mainList.innerHTML = "";
  sideList.innerHTML = "";

  Object.keys(questData).forEach(key => {
    const quest = questData[key];
    const li = document.createElement("li");
    li.className = "flex items-center space-x-2";

    const label = document.createElement("span");
    label.textContent = key;
    label.className = "text-white font-semibold";

    const tag = document.createElement("span");
    if (quest.between) {
      tag.textContent = "🌲 Side";
      tag.className = "bg-yellow-600 text-xs text-black px-1 py-0.5 rounded";
    }

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "text-sm text-blue-400 hover:text-blue-200";
    editBtn.onclick = () => openQuestEditor(key);

    li.appendChild(label);
    if (quest.between) li.appendChild(tag);
    li.appendChild(editBtn);

    (quest.between ? sideList : mainList).appendChild(li);
  });
}

function populatePreviewDropdown() {
  const select = document.getElementById("questSelect");
  if (!select) return;
  select.innerHTML = "";
  Object.keys(questData).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    select.appendChild(opt);
  });
  select.onchange = () => runPreview(select.value);
}

function runPreview(key) {
  const quest = questData[key];
  const flow = document.getElementById("questFlow");
  const intro = document.getElementById("introSection");
  const pathBtns = document.getElementById("pathButtons");
  const outcomeFlow = document.getElementById("outcomeFlow");
  const midweekResult = document.getElementById("midweekResult");
  const finalResult = document.getElementById("finalResult");
  const wrap = document.getElementById("wrapupSection");
  const finalChoices = document.getElementById("finalChoices");
  const midweekChoice = document.getElementById("midweekChoice");
  const scoreBoard = document.getElementById("scoreBoard");

  let inventory = { items: [], roles: [], reputation: [], status: [] };

  function updateScore(field, values) {
    if (!values) return;
    const arr = Array.isArray(values) ? values : [values];
    if (!inventory[field]) inventory[field] = [];
    arr.forEach(val => {
      if (val && !inventory[field].includes(val)) inventory[field].push(val);
    });
    scoreBoard.textContent =
      "🎒 Items: " + inventory.items.join(", ") +
      " | 🎭 Roles: " + inventory.roles.join(", ") +
      " | 🌟 Reputation: " + inventory.reputation.join(", ") +
      " | 🧠 Status: " + inventory.status.join(", ");
  }

  // Clear and reveal
  intro.textContent = quest.intro || "";
  pathBtns.innerHTML = "";
  outcomeFlow.classList.add("hidden");
  midweekResult.textContent = "";
  finalResult.textContent = "";
  wrap.textContent = "";
  finalChoices.innerHTML = "";
  midweekChoice.innerHTML = "";
  scoreBoard.textContent = "";

  flow.classList.remove("hidden");

  if (quest.paths) {
    Object.entries(quest.paths).forEach(([k, p]) => {
      const btn = document.createElement("button");
      btn.textContent = `${p.title} - ${p.description}`;
      btn.className = "block bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded w-full text-left";
      btn.onclick = () => {
        pathBtns.innerHTML = `🧭 You chose: ${p.title}`;
        outcomeFlow.classList.remove("hidden");
        midweekResult.textContent = "";
        finalChoices.innerHTML = "";
        finalResult.textContent = "";

        const highBtn = document.createElement("button");
        highBtn.textContent = "🔼 Midweek: High";
        highBtn.className = "bg-green-600 hover:bg-green-500 px-2 py-1 rounded";
        highBtn.onclick = () => {
          midweekResult.textContent = p.midweek?.High?.text || "No high outcome";
          updateScore("items", p.midweek?.High?.rewards?.items);
          updateScore("reputation", p.midweek?.High?.rewards?.reputation);
        };

        const lowBtn = document.createElement("button");
        lowBtn.textContent = "🔽 Midweek: Low";
        lowBtn.className = "bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded";
        lowBtn.onclick = () => {
          midweekResult.textContent = p.midweek?.Low?.text || "No low outcome";
          updateScore("roles", p.midweek?.Low?.penalties?.roles);
        };

        midweekChoice.innerHTML = "";
        midweekChoice.appendChild(highBtn);
        midweekChoice.appendChild(lowBtn);

        const successBtn = document.createElement("button");
        successBtn.textContent = "✅ Final Success";
        successBtn.className = "bg-green-700 hover:bg-green-600 px-2 py-1 rounded";
        successBtn.onclick = () => {
          finalResult.textContent = p.final?.Success?.text || "Success result";
          wrap.textContent = quest.wrapup?.text || "";
          updateScore("items", p.final?.Success?.rewards?.items);
          updateScore("roles", p.final?.Success?.rewards?.roles);
          updateScore("reputation", p.final?.Success?.rewards?.reputation);
        };

        const failBtn = document.createElement("button");
        failBtn.textContent = "❌ Final Failure";
        failBtn.className = "bg-red-600 hover:bg-red-500 px-2 py-1 rounded";
        failBtn.onclick = () => {
          finalResult.textContent = p.final?.Failure?.text || "Failure result";
          wrap.textContent = quest.wrapup?.text || "";
          updateScore("roles", p.final?.Failure?.penalties?.roles);
          updateScore("reputation", p.final?.Failure?.penalties?.reputation);
        };

        finalChoices.appendChild(successBtn);
        finalChoices.appendChild(failBtn);
      };
      pathBtns.appendChild(btn);
    });
  }
}
