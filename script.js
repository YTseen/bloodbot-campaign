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
    populatePreviewDropdown();
  } catch (e) {
    alert("❌ Failed to load quest data.");
    console.error(e);
  }
}

// ========== RENDER QUEST LIST ==========
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

// ========== PREVIEW FLOW SUPPORT ==========
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
  const scoreBoard = document.getElementById("scoreBoard");
  const midweekChoice = document.getElementById("midweekChoice");

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

  flow.classList.remove("hidden");
  intro.textContent = quest.intro || "";
  pathBtns.innerHTML = "";
  outcomeFlow.classList.add("hidden");
  midweekResult.textContent = "";
  finalResult.textContent = "";
  wrap.textContent = "";
  finalChoices.innerHTML = "";
  midweekChoice.innerHTML = "";
  scoreBoard.textContent = "";

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
