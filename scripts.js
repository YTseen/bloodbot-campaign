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

    <details class="mb-2">
      <summary class="text-xs text-yellow-300 cursor-pointer">Requirements (Click to Expand)</summary>
      <label class="text-xs text-gray-400">Required Titles:</label>
      <input class="requires-titles-input w-full p-1 rounded text-black" list="title-list" value="${(pathData.requires?.titles || ["Any"]).join(", ")}" />
      <label class="text-xs text-gray-400">Required Items:</label>
      <input class="requires-items-input w-full p-1 rounded text-black" list="item-list" value="${(pathData.requires?.items || ["Any"]).join(", ")}" />
      <label class="text-xs text-gray-400">Required Status:</label>
      <input class="requires-status-input w-full p-1 rounded text-black" list="status-list" value="${pathData.requires?.status || "Any"}" />
    </details>
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

    const block = document.createElement("details");
    block.className = "bg-gray-700 p-3 rounded mt-3 space-y-2";
    block.innerHTML = `
      <summary class="text-sm text-green-300 cursor-pointer">${label}</summary>
      <label class="text-xs text-gray-300">📝 Text</label>
      <textarea class="${key}-text w-full p-1 rounded text-black">${step.text || ""}</textarea>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div>
          <p class="text-xs text-yellow-400 mb-1">✅ Requirements</p>
          <label class="text-xs text-gray-400">Required Titles:</label>
          <input class="${key}-requires-titles w-full p-1 rounded text-black" value="${(step.requires?.titles || ["Any"]).join(", ")}" />
          <label class="text-xs text-gray-400">Required Items:</label>
          <input class="${key}-requires-items w-full p-1 rounded text-black" value="${(step.requires?.items || ["Any"]).join(", ")}" />
          <label class="text-xs text-gray-400">Required Status:</label>
          <input class="${key}-requires-status w-full p-1 rounded text-black" value="${step.requires?.status || "Any"}" />
        </div>
        <div>
          <p class="text-xs text-green-400 mb-1">🎁 Grants</p>
          <label class="text-xs text-pink-300">Grant Items:</label>
          <input class="${key}-grant-items w-full p-1 rounded text-black" value="${(step.effects?.grant_items || []).join(", ")}" />
          <label class="text-xs text-pink-300">Grant Status:</label>
          <input class="${key}-grant-status w-full p-1 rounded text-black" value="${(step.effects?.grant_status || []).join(", ")}" />
          <label class="text-xs text-pink-300">Grant Titles:</label>
          <input class="${key}-grant-titles w-full p-1 rounded text-black" value="${(step.effects?.grant_titles || []).join(", ")}" />
        </div>
        <div>
          <p class="text-xs text-red-400 mb-1">❌ Removals</p>
          <label class="text-xs text-pink-300">Remove Items:</label>
          <input class="${key}-remove-items w-full p-1 rounded text-black" value="${(step.effects?.remove_items || []).join(", ")}" />
          <label class="text-xs text-pink-300">Remove Status:</label>
          <input class="${key}-remove-status w-full p-1 rounded text-black" value="${(step.effects?.remove_status || []).join(", ")}" />
          <label class="text-xs text-pink-300">Remove Titles:</label>
          <input class="${key}-remove-titles w-full p-1 rounded text-black" value="${(step.effects?.remove_titles || []).join(", ")}" />
        </div>
      </div>
    `;
    div.appendChild(block);
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

  Object.entries(quest.paths).forEach(([key, path]) => {
    const btn = document.createElement("button");
    btn.className = "bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded";
    btn.textContent = path.title || key;
    btn.onclick = () => {
      midweekResult.innerHTML = "";
      finalChoices.innerHTML = "";

      const highBtn = document.createElement("button");
      highBtn.className = "bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded";
      highBtn.textContent = "Midweek: High";
      highBtn.onclick = () => {
        midweekResult.innerHTML = path.midweek?.High?.text || "⚠️ No result";
        renderFinal(path);
      };

      const lowBtn = document.createElement("button");
      lowBtn.className = "bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded";
      lowBtn.textContent = "Midweek: Low";
      lowBtn.onclick = () => {
        midweekResult.innerHTML = path.midweek?.Low?.text || "⚠️ No result";
        renderFinal(path);
      };

      finalChoices.appendChild(highBtn);
      finalChoices.appendChild(lowBtn);
    };
    pathButtons.appendChild(btn);
  });

  function renderFinal(path) {
    finalChoices.innerHTML = "";

    const successBtn = document.createElement("button");
    successBtn.className = "bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded";
    successBtn.textContent = "Final: Success";
    successBtn.onclick = () => {
      finalResult.innerHTML = path.final?.Success?.text || "✅ No final success text.";
      wrapup.innerHTML = quest.wrapup?.text || "";
    };

    const failBtn = document.createElement("button");
    failBtn.className = "bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded";
    failBtn.textContent = "Final: Failure";
    failBtn.onclick = () => {
      finalResult.innerHTML = path.final?.Failure?.text || "❌ No failure text.";
      wrapup.innerHTML = quest.wrapup?.text || "";
    };

    finalChoices.appendChild(successBtn);
    finalChoices.appendChild(failBtn);
  }
}

document.getElementById("previewQuestSelect").addEventListener("change", renderPreview);

// === Drag & Drop + Path removal ===
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("pathsContainer");
  let dragged = null;

  container.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("path-block")) {
      dragged = e.target;
      e.dataTransfer.effectAllowed = "move";
    }
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const over = e.target.closest(".path-block");
    if (over && over !== dragged) {
      const blocks = [...container.querySelectorAll(".path-block")];
      const draggedIndex = blocks.indexOf(dragged);
      const overIndex = blocks.indexOf(over);
      if (draggedIndex < overIndex) {
        container.insertBefore(dragged, over.nextSibling);
      } else {
        container.insertBefore(dragged, over);
      }
    }
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    dragged = null;
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-path")) {
      const block = e.target.closest(".path-block");
      if (block) block.remove();
    }
  });

  // ✅ Ensure functions exist before calling
  if (typeof manualLoadQuests === "function") {
    manualLoadQuests();
  } else {
    console.warn("⚠️ manualLoadQuests not ready at DOMContentLoaded.");
  }
});

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

function updateDatalists() {
  const titleList = JSON.parse(localStorage.getItem("legendTitles") || "[]");
  const itemList = JSON.parse(localStorage.getItem("legendItems") || "[]");
  const statusList = JSON.parse(localStorage.getItem("legendStatuses") || "[]");

  document.getElementById("title-list").innerHTML = titleList.map(t => `<option value="${t}">`).join("");
  document.getElementById("item-list").innerHTML = itemList.map(t => `<option value="${t}">`).join("");
  document.getElementById("status-list").innerHTML = statusList.map(t => `<option value="${t}">`).join("");
}

// === Expose Global Functions ===
window.manualLoadQuests = manualLoadQuests;
window.saveQuestToGitHub = saveQuestToGitHub;
window.createNewQuest = createNewQuest;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;
window.saveLegends = saveLegends;
window.loadLegends = loadLegends;

window.addEventListener("DOMContentLoaded", () => {
  manualLoadQuests();
  loadLegends();
});
