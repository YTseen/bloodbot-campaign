// ========== 🔐 GITHUB SAVE SYSTEM ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter your GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

const repo = "YTseen/bloodbot-campaign";
const paths = {
  main: "data/quest_data.json",
  side: "data/side_quest_template.json"
};

let questData = { main: {}, side: {} };
let selectedType = "main";
let selectedKey = null;

// ========== LOAD & INIT ==========
async function loadQuestFile(type) {
  try {
    const res = await fetch(`./${paths[type]}`);
    if (!res.ok) throw new Error("Failed to fetch");
    questData[type] = await res.json();
    renderQuestList(type);
  } catch (e) {
    alert(`❌ Failed to load ${type} quests.`);
  }
}

loadQuestFile("main");
loadQuestFile("side");

function renderQuestList(type) {
  const list = document.getElementById(type === "main" ? "mainQuestList" : "sideQuestList");
  list.innerHTML = "";
  Object.keys(questData[type]).forEach((key) => {
    const li = document.createElement("li");
    li.textContent = key;
    li.className = "cursor-pointer hover:text-red-400 px-2 py-1 bg-gray-800 rounded";
    li.onclick = () => openQuestEditor(type, key);
    list.appendChild(li);
  });
}

function createQuest(type) {
  const key = prompt("Enter new quest name");
  if (!key) return;
  questData[type][key] = { intro: "", wrapup: { text: "" }, paths: {} };
  renderQuestList(type);
  openQuestEditor(type, key);
}

// ========== RENDER LABELED PATH ==========
function renderPathEditor(pathKey, pathData) {
  const pathDiv = document.createElement("div");
  pathDiv.className = "bg-gray-900 p-4 rounded mb-4";

  const title = document.createElement("h3");
  title.textContent = pathKey;
  title.className = "text-xl text-yellow-300 font-bold mb-2";
  pathDiv.appendChild(title);

  // Midweek Outcomes
  const midweekHeading = document.createElement("h4");
  midweekHeading.textContent = "⏳ Midweek Outcomes";
  midweekHeading.className = "text-yellow-400 font-semibold mt-3";
  pathDiv.appendChild(midweekHeading);

  const highLabel = document.createElement("p");
  highLabel.textContent = "🔵 High:";
  highLabel.className = "text-green-400 font-semibold mt-2";
  pathDiv.appendChild(highLabel);

  const highText = document.createElement("p");
  highText.textContent = pathData.midweek?.High?.text || "None";
  highText.className = "mb-2";
  pathDiv.appendChild(highText);

  const lowLabel = document.createElement("p");
  lowLabel.textContent = "🔴 Low:";
  lowLabel.className = "text-red-400 font-semibold mt-2";
  pathDiv.appendChild(lowLabel);

  const lowText = document.createElement("p");
  lowText.textContent = pathData.midweek?.Low?.text || "None";
  lowText.className = "mb-2";
  pathDiv.appendChild(lowText);

  // Final Outcomes
  const finalHeading = document.createElement("h4");
  finalHeading.textContent = "🏁 Final Outcomes";
  finalHeading.className = "text-yellow-400 font-semibold mt-4";
  pathDiv.appendChild(finalHeading);

  const successLabel = document.createElement("p");
  successLabel.textContent = "🟢 Success:";
  successLabel.className = "text-green-400 font-semibold mt-2";
  pathDiv.appendChild(successLabel);

  const successText = document.createElement("p");
  successText.textContent = pathData.final?.Success?.text || "None";
  successText.className = "mb-2";
  pathDiv.appendChild(successText);

  const failureLabel = document.createElement("p");
  failureLabel.textContent = "🔻 Failure:";
  failureLabel.className = "text-red-400 font-semibold mt-2";
  pathDiv.appendChild(failureLabel);

  const failureText = document.createElement("p");
  failureText.textContent = pathData.final?.Failure?.text || "None";
  failureText.className = "mb-2";
  pathDiv.appendChild(failureText);

  return pathDiv;
}

// ========== QUEST EDITOR ==========
function openQuestEditor(type, key) {
  selectedType = type;
  selectedKey = key;
  const quest = questData[type][key];

  document.getElementById("questKey").value = key;
  document.getElementById("questIntro").value = quest.intro || "";
  document.getElementById("questWrap").value = quest.wrapup?.text || "";

  const pathsContainer = document.getElementById("pathsContainer");
  pathsContainer.innerHTML = "";
  document.getElementById("editorSection").classList.remove("hidden");

  populateOutcomeTargetDropdown(type, key);

  for (const [pathKey, pathData] of Object.entries(quest.paths || {})) {
    pathsContainer.appendChild(renderPathEditor(pathKey, pathData));
  }
}

// ========== SAVE QUEST ==========
function saveQuest() {
  const newKey = document.getElementById("questKey").value;
  const intro = document.getElementById("questIntro").value;
  const wrap = document.getElementById("questWrap").value;

  if (newKey !== selectedKey) delete questData[selectedType][selectedKey];

  const updatedPaths = {};
  const inputs = document.querySelectorAll("[data-path]");
  inputs.forEach((el) => {
    const pathKey = el.dataset.path;
    const field = el.dataset.field;
    if (!updatedPaths[pathKey]) updatedPaths[pathKey] = { title: "", description: "", midweek: {}, final: {} };
    const val = el.value;
    switch (field) {
      case "title": updatedPaths[pathKey].title = val; break;
      case "description": updatedPaths[pathKey].description = val; break;
      case "midHigh": updatedPaths[pathKey].midweek.High = { text: val }; break;
      case "midLow": updatedPaths[pathKey].midweek.Low = { text: val }; break;
      case "finalSuccess": updatedPaths[pathKey].final.Success = { text: val }; break;
      case "finalFail": updatedPaths[pathKey].final.Failure = { text: val }; break;
    }
  });

  questData[selectedType][newKey] = { intro, wrapup: { text: wrap }, paths: updatedPaths };
  alert("✅ Quest saved locally. Push to GitHub to commit.");
  renderQuestList(selectedType);
}

// ========== GITHUB PUSH ==========
document.getElementById("saveBtn").addEventListener("click", async () => {
  for (const type of ["main", "side"]) {
    const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${paths[type]}`, {
      headers: { Authorization: `token ${githubToken}` }
    });

    if (!metaRes.ok) return alert(`❌ Failed to fetch ${type} metadata.`);
    const meta = await metaRes.json();
    const sha = meta.sha;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(questData[type], null, 2))));

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${paths[type]}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: `Update ${type} quests`, content, sha })
    });

    if (!res.ok) alert(`❌ Failed to push ${type}`);
  }
  alert("✅ Both quest files pushed to GitHub.");
});

// ========== OUTCOME INJECTOR ==========
function populateOutcomeTargetDropdown(type, key) {
  const quest = questData[type][key];
  const select = document.getElementById("ob_target");
  select.innerHTML = '<option disabled selected>Choose a Path & Outcome Type…</option>';
  for (const pathKey of Object.keys(quest.paths || {})) {
    select.innerHTML += `
      <option value="${pathKey}::midHigh">${pathKey} – Midweek High</option>
      <option value="${pathKey}::midLow">${pathKey} – Midweek Low</option>
      <option value="${pathKey}::finalSuccess">${pathKey} – Final Success</option>
      <option value="${pathKey}::finalFail">${pathKey} – Final Failure</option>
    `;
  }
}

function injectOutcome() {
  const target = document.getElementById("ob_target").value;
  if (!target || !target.includes("::")) return alert("❌ Invalid outcome target.");
  const [pathKey, field] = target.split("::");
  const quest = questData[selectedType][selectedKey];
  const path = quest.paths[pathKey];
  const block = field.includes("mid") ? (path.midweek = path.midweek || {}) : (path.final = path.final || {});
  const slot = field.includes("High") ? "High" : field.includes("Low") ? "Low" : field.includes("Success") ? "Success" : "Failure";

  const out = {
    text: document.getElementById("ob_text").value.trim()
  };
  if (document.getElementById("ob_death").checked) out.death = true;
  const title = document.getElementById("ob_title").value.trim();
  if (title) out.title = title;
  const status = document.getElementById("ob_status").value.trim();
  if (status) out.status = status.includes(",") ? status.split(",").map(x => x.trim()) : status;
  const items = document.getElementById("ob_items").value.trim();
  if (items) out.items = items.split(",").map(x => x.trim());

  block[slot] = out;
  alert(`✅ Outcome injected into ${pathKey} – ${slot}`);
}
