// ========== 🔐 GITHUB SAVE SYSTEM ==========

// Prompt once and store token
let githubToken = localStorage.getItem("githubToken") || "";
if (!githubToken) {
  githubToken = prompt("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");
  localStorage.setItem("githubToken", githubToken);
}

// Save to GitHub
async function saveQuestData(updatedJson) {
  const repo = "YTseen/bloodbot-campaign"; // your repo
  const path = "BBB-campaign/dashboard/data/quest_data.json"; // path in repo

  try {
    // Step 1: Fetch file metadata (to get SHA)
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

    // Step 2: Encode updated JSON
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(updatedJson, null, 2))));

    // Step 3: Push update to GitHub
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

// OPTIONAL: Call this from a "Save" button
document.getElementById("saveBtn")?.addEventListener("click", () => {
  if (!window.currentQuestData) {
    alert("No quest data loaded!");
    return;
  }
  saveQuestData(window.currentQuestData);
});
