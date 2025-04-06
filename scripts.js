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
    let pathKey = autoGenerateKey(Date.now().toString());
    const requiresTitles = block.querySelector(".requires-titles-input")?.value || "";
    const requiresItems = block.querySelector(".requires-items-input")?.value || "";
    const requiresStatus = block.querySelector(".requires-status-input")?.value || "Any";

    const pathData = {
      requires: {
        titles: requiresTitles.split(",").map(x => x.trim()).filter(Boolean),
        items: requiresItems.split(",").map(x => x.trim()).filter(Boolean),
        status: requiresStatus
      },
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
      const grantItems = block.querySelector(`.${blockKey}-grant-items`)?.value || "";
      const grantStatus = block.querySelector(`.${blockKey}-grant-status`)?.value || "";
      const grantTitles = block.querySelector(`.${blockKey}-grant-titles`)?.value || "";
      const removeItems = block.querySelector(`.${blockKey}-remove-items`)?.value || "";
      const removeStatus = block.querySelector(`.${blockKey}-remove-status`)?.value || "";
      const removeTitles = block.querySelector(`.${blockKey}-remove-titles`)?.value || "";
      const requiresStepItems = block.querySelector(`.${blockKey}-requires-items`)?.value || "";
      const requiresStepStatus = block.querySelector(`.${blockKey}-requires-status`)?.value || "Any";

      pathData[blockKey.includes("midweek") ? "midweek" : "final"][step] = {
        text,
        requires: {
          items: requiresStepItems.split(",").map(x => x.trim()).filter(Boolean),
          status: requiresStepStatus
        },
        effects: {
          grant_items: grantItems.split(",").map(x => x.trim()).filter(Boolean),
          grant_status: grantStatus.split(",").map(x => x.trim()).filter(Boolean),
          grant_titles: grantTitles.split(",").map(x => x.trim()).filter(Boolean),
          remove_items: removeItems.split(",").map(x => x.trim()).filter(Boolean),
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

window.manualLoadQuests = manualLoadQuests;
window.saveQuestToGitHub = saveQuestToGitHub;
window.createNewQuest = createNewQuest;
window.addPathBlock = addPathBlock;
window.openQuestEditor = openQuestEditor;
