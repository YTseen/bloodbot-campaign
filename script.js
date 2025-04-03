
let questData = {};
let selectedKey = "";

async function loadQuests() {
  try {
    const res = await fetch("./data/quest_data.json");
    questData = await res.json();
    const questList = document.getElementById("questList");
    questList.innerHTML = "";
    Object.entries(questData).forEach(([key, data]) => {
      const btn = document.createElement("button");
      btn.className = "block w-full text-left bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded";
      btn.textContent = key;
      btn.onclick = () => loadEditor(key);
      questList.appendChild(btn);
    });
  } catch (err) {
    alert("Failed to load quest_data.json");
  }
}

function loadEditor(key) {
  selectedKey = key;
  const quest = questData[key];
  document.getElementById("questKey").value = key;
  document.getElementById("questIntro").value = quest.intro || "";
  document.getElementById("questWrap").value = quest.wrapup?.text || "";
  document.getElementById("editorSection").classList.remove("hidden");
}

function saveQuest() {
  const intro = document.getElementById("questIntro").value;
  const wrap = document.getElementById("questWrap").value;
  if (!questData[selectedKey]) return;
  questData[selectedKey].intro = intro;
  questData[selectedKey].wrapup = { text: wrap };
  const blob = new Blob([JSON.stringify(questData, null, 2)], { type: 'application/json' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "quest_data.json";
  link.click();
}

window.onload = loadQuests;
