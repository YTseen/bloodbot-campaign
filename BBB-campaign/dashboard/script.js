// ========== 🔐 GITHUB SAVE SYSTEM ==========
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("Enter GitHub Token:");
  localStorage.setItem("githubToken", githubToken);
}

async function saveQuestData(updatedJson) {
  const repo = "YTseen/bloodbot-campaign";
  const path = "BBB-campaign/dashboard/data/quest_data.json";

  try {
    const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${githubToken}` },
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

window.currentQuestData = questData;

async function loadQuestData() {
  const fetchUrl = location.hostname.includes("github.io")
    ? "https://ytseen.github.io/bloodbot-campaign/BBB-campaign/dashboard/data/quest_data.json"
    : "./data/quest_data.json";

  try {
    const res = await fetch(fetchUrl);
    const raw = await res.text();
    console.log("🧪 Raw fetched data:", raw);

    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    questData = JSON.parse(raw);

    window.currentQuestData = questData;
    renderQuestList();
  } catch (err) {
    alert("❌ Failed to load quest_data.json");
    console.error("Load error:", err);
  }
}

function renderQuestList() {
  questList.innerHTML = "";
  Object.keys(questData).forEach((key) => {
    const li = document.createElement("li");
    li.textContent = key;
    li.className = "cursor-pointer hover:text-red-400";
    li.onclick = () => editQuest(key);
    questList.appendChild(li);
  });
}

function editQuest(key) {
  const quest = questData[key];
  questKeyInput.value = key;
  questIntroInput.value = quest.intro || "";
  questWrapInput.value = quest.wrapup?.text || "";
  editorSection.classList.remove("hidden");
}

function saveQuest() {
  const key = questKeyInput.value;
  if (!key) return;

  const editedIntro = questIntroInput.value;
  const editedWrap = questWrapInput.value;

  questData[key].intro = editedIntro;
  questData[key].wrapup = { text: editedWrap };

  window.currentQuestData = questData;
  alert("✅ Quest saved locally. Now click 💾 Save to GitHub!");
}

// Auto-load on page load
loadQuestData();
