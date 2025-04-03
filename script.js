
// [FULL SCRIPT INCLUDES ENHANCED FIELDS AND AUTO GITHUB TOKEN INJECTION]

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
    const div = document.createElement("div");
    div.className = "bg-gray-800 p-4 rounded mb-6";

    const mh = pathData.midweek?.High || {};
    const ml = pathData.midweek?.Low || {};
    const fs = pathData.final?.Success || {};
    const ff = pathData.final?.Failure || {};

    div.innerHTML = `
      <h3 class="text-lg font-bold text-yellow-400 mb-2">${pathKey}</h3>
      <input placeholder="📝 Title" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="title" value="${pathData.title || ''}" />
      <textarea placeholder="📜 Description" class="w-full bg-gray-900 p-2 rounded mb-4"
        data-path="${pathKey}" data-field="description">${pathData.description || ''}</textarea>

      <h4 class="text-yellow-300 font-semibold mt-4 mb-2">⏳ Midweek Outcomes</h4>

      <label class="text-green-400 text-sm font-semibold block mb-1">🔵 High Outcome</label>
      <textarea placeholder="🔥 Narrative Text" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midHigh">${mh.text || ''}</textarea>
      <input placeholder="🏷️ Title" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midHighTitle" value="${mh.title || ''}" />
      <input placeholder="📦 Items (comma-separated)" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midHighItems" value="${(mh.items || []).join(', ')}" />
      <input placeholder="🧠 Status (comma-separated)" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midHighStatus" value="${(mh.status || []).join(', ')}" />

      <label class="text-red-400 text-sm font-semibold block mt-4 mb-1">🔴 Low Outcome</label>
      <textarea placeholder="💀 Narrative Text" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midLow">${ml.text || ''}</textarea>
      <input placeholder="🏷️ Title" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midLowTitle" value="${ml.title || ''}" />
      <input placeholder="📦 Items" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midLowItems" value="${(ml.items || []).join(', ')}" />
      <input placeholder="🧠 Status" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="midLowStatus" value="${(ml.status || []).join(', ')}" />

      <h4 class="text-yellow-300 font-semibold mt-4 mb-2">🏁 Final Outcomes</h4>

      <label class="text-green-400 text-sm font-semibold block mb-1">🟢 Success</label>
      <textarea placeholder="🏆 Narrative Text" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalSuccess">${fs.text || ''}</textarea>
      <input placeholder="🏷️ Title" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalSuccessTitle" value="${fs.title || ''}" />
      <input placeholder="📦 Items" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalSuccessItems" value="${(fs.items || []).join(', ')}" />
      <input placeholder="🧠 Status" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalSuccessStatus" value="${(fs.status || []).join(', ')}" />

      <label class="text-red-400 text-sm font-semibold block mt-4 mb-1">🔻 Failure</label>
      <textarea placeholder="☠️ Narrative Text" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalFail">${ff.text || ''}</textarea>
      <input placeholder="🏷️ Title" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalFailTitle" value="${ff.title || ''}" />
      <input placeholder="📦 Items" class="w-full bg-gray-900 p-2 rounded mb-2"
        data-path="${pathKey}" data-field="finalFailItems" value="${(ff.items || []).join(', ')}" />
      <input placeholder="🧠 Status" class="w-full bg-gray-900 p-2 rounded"
        data-path="${pathKey}" data-field="finalFailStatus" value="${(ff.status || []).join(', ')}" />
    `;
    pathsContainer.appendChild(div);
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

    const val = el.value.trim();
    const set = updatedPaths[pathKey];

    switch (field) {
      case "title": set.title = val; break;
      case "description": set.description = val; break;

      case "midHigh": set.midweek.High = { ...(set.midweek.High || {}), text: val }; break;
      case "midHighTitle": set.midweek.High = { ...(set.midweek.High || {}), title: val }; break;
      case "midHighItems": set.midweek.High = { ...(set.midweek.High || {}), items: val ? val.split(",").map(s => s.trim()) : [] }; break;
      case "midHighStatus": set.midweek.High = { ...(set.midweek.High || {}), status: val ? val.split(",").map(s => s.trim()) : [] }; break;

      case "midLow": set.midweek.Low = { ...(set.midweek.Low || {}), text: val }; break;
      case "midLowTitle": set.midweek.Low = { ...(set.midweek.Low || {}), title: val }; break;
      case "midLowItems": set.midweek.Low = { ...(set.midweek.Low || {}), items: val ? val.split(",").map(s => s.trim()) : [] }; break;
      case "midLowStatus": set.midweek.Low = { ...(set.midweek.Low || {}), status: val ? val.split(",").map(s => s.trim()) : [] }; break;

      case "finalSuccess": set.final.Success = { ...(set.final.Success || {}), text: val }; break;
      case "finalSuccessTitle": set.final.Success = { ...(set.final.Success || {}), title: val }; break;
      case "finalSuccessItems": set.final.Success = { ...(set.final.Success || {}), items: val ? val.split(",").map(s => s.trim()) : [] }; break;
      case "finalSuccessStatus": set.final.Success = { ...(set.final.Success || {}), status: val ? val.split(",").map(s => s.trim()) : [] }; break;

      case "finalFail": set.final.Failure = { ...(set.final.Failure || {}), text: val }; break;
      case "finalFailTitle": set.final.Failure = { ...(set.final.Failure || {}), title: val }; break;
      case "finalFailItems": set.final.Failure = { ...(set.final.Failure || {}), items: val ? val.split(",").map(s => s.trim()) : [] }; break;
      case "finalFailStatus": set.final.Failure = { ...(set.final.Failure || {}), status: val ? val.split(",").map(s => s.trim()) : [] }; break;
    }
  });

  questData[selectedType][newKey] = { intro, wrapup: { text: wrap }, paths: updatedPaths };
  alert("✅ Quest saved locally. Push to GitHub to commit.");
  renderQuestList(selectedType);
}

