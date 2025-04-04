
// DOM READY PATCH FOR DELETE
document.getElementById("pathsContainer").addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-path")) {
    e.target.closest("div.border").remove();
  }
});
