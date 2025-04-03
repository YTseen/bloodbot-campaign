// ========== 🔐 GITHUB SAVE SYSTEM ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

async function saveQuestData(updatedJson) {
  const repo = "YTseen/bloodbot-campaign";
  const path = "data/quest_data.json";

  try {
    const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });

    if (!metaRes.ok) {
      alert("❌ Failed to fetch quest_data.json metadata.");
      return;
    }

    const meta = await metaRes.json();
    const sha = meta.sha;

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(updatedJson, null, 2))));

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "🩸 BloodBot Dashboard update: quest_data.json",
        content,
        sha,
      }),
    });

    if (res.ok) {
      alert("✅ Saved to GitHub successfully!");
    } else {
      alert("❌ Save failed. Check your token and permissions.");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("❌ Unexpected error while saving to GitHub.");
  }
}

document.getElementById("saveBtn")?.addEventListener("click", () => {
  if (!window.currentQuestData) {
    alert("No quest data loaded!");
    return;
  }
  saveQuestData(window.currentQuestData);
});

// ========== 🧠 QUEST LOADER & EDITOR ==========
let questData = {};
const questList = document.getElementById("questList");
const editorSection = document.getElementById("editorSection");
const questKeyInput = document.getElementById("questKey");
const questIntroInput = document.getElementById("questIntro");
const questWrapInput = document.getElementById("questWrap");
const questPathsInput = document.getElementById("questPaths");

window.currentQuestData = questData;

async function loadQuestData() {
  try {
    const res = await fetch("./data/quest_data.json");
    if (!res.ok) throw new Error("File fetch failed");
    questData = await res.json();
    window.currentQuestData = questData;
    renderQuestList();
  } catch (err) {
    alert("❌ Failed to load quest_data.json");
    console.error(err);
  }
}

function renderQuestList() {
  questList.innerHTML = "";
  Object.keys(questData).forEach((key) => {
    const li = document.createElement("li");
    li.textContent = key;
    li.className = "cursor-pointer hover:text-red-400 px-2 py-1 bg-gray-800 rounded";
    li.onclick = () => editQuest(key);
    questList.appendChild(li);
  });
}

function editQuest(key) {
  const quest = questData[key];
  questKeyInput.value = key;
  questIntroInput.value = quest.intro || "";
  questWrapInput.value = quest.wrapup?.text || "";
  questPathsInput.value = JSON.stringify(quest.paths || {}, null, 2);
  editorSection.classList.remove("hidden");
}

function saveQuest() {
  const oldKey = questKeyInput.getAttribute("data-original-key") || questKeyInput.value;
  const newKey = questKeyInput.value;
  const intro = questIntroInput.value;
  const wrapup = questWrapInput.value;
  let parsedPaths;

  try {
    parsedPaths = JSON.parse(questPathsInput.value);
  } catch (e) {
    alert("❌ Invalid JSON in Paths section.");
    return;
  }

  // Handle title/key change
  if (oldKey !== newKey) {
    delete questData[oldKey];
  }

  questData[newKey] = {
    intro,
    paths: parsedPaths,
    wrapup: { text: wrapup },
  };

  window.currentQuestData = questData;
  renderQuestList();
  alert("✅ Quest saved locally. Click 💾 Save to GitHub to commit.");
}

// Load quests on page load
loadQuestData();
