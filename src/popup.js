document.addEventListener("DOMContentLoaded", function () {
  const noteForm = document.getElementById("note-form");
  const noteTitle = document.getElementById("note-title");
  const noteContent = document.getElementById("note-content");
  const noteUrl = document.getElementById("note-url");
  const searchInput = document.getElementById("search-input");
  const noteDropdown = document.getElementById("note-dropdown");
  let isNoteOpen = false;

  noteForm.addEventListener("submit", function (event) {
    event.preventDefault();
    saveNote();
  });

  searchInput.addEventListener("input", function () {
    searchNotes(this.value);
  });

  noteDropdown.addEventListener("change", function () {
    searchInput.value = this.value;
    searchNotes(this.value);
    if (!isNoteOpen) {
      isNoteOpen = true;
      showNote();
    } else {
      alert(
        "If you want to display another brief note, close the active note."
      );
    }
  });

  noteDropdown.addEventListener("click", function () {
    searchInput.value = "";
    Init();
  });

  loadNotes();

  function saveNote() {
    const title = noteTitle.value;
    const content = noteContent.value;
    const url = noteUrl.value;
    const date = new Date();
    const timestamp = date.toLocaleString();

    const note = {
      title: title,
      content: content,
      url: url,
      timestamp: timestamp,
    };

    chrome.storage.sync.get(["notes"], function (result) {
      const notes = result.notes || [];
      notes.push(note);
      chrome.storage.sync.set({ notes: notes }, function () {
        clearForm();
        loadNotes();
        isNoteOpen = false;
      });
    });
  }

  function Init() {
    chrome.storage.sync.get(["notes"], function (result) {
      const notes = result.notes || [];
      noteDropdown.innerHTML = "";
      for (const note of notes) {
        const option = document.createElement("option");
        option.value = note.title;
        option.textContent = note.title;
        noteDropdown.appendChild(option);
      }
    });
  }

  function loadNotes() {
    Init();
    isNoteOpen = false;
    searchNotes(searchInput.value);
  }

  function searchNotes(query) {
    chrome.storage.sync.get(["notes"], function (result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter(function (note) {
        return note.title.toLowerCase().includes(query.toLowerCase());
      });
      noteDropdown.innerHTML = "";
      for (const note of filteredNotes) {
        const option = document.createElement("option");
        option.value = note.title;
        option.textContent = note.title;
        noteDropdown.appendChild(option);
      }
    });
  }

  function showNote() {
    const selectedTitle = noteDropdown.value;
    chrome.storage.sync.get(["notes"], function (result) {
      const notes = result.notes || [];
      const selectedNote = notes.find(function (note) {
        return note.title === selectedTitle;
      });
      if (selectedNote) {
        const popupHtml = `
            <div class="note-popup">
              <h2>${selectedNote.title}</h2>
              <textarea readonly rows="10">${selectedNote.content}</textarea>
              <input type="text" value="${selectedNote.url}" readonly>
              <input type="text" value="${selectedNote.timestamp}" readonly>
              <button id="copy-button">Copy to clipboard</button>
              <button id="open-button">Open in new tab</button>
              <button id="delete-button">Delete note</button>
              <button id="close-button">Close note</button>
            </div>
          `;
        const popupElement = document.createElement("div");
        popupElement.innerHTML = popupHtml;
        document.body.appendChild(popupElement);

        const copyButton = document.getElementById("copy-button");
        copyButton.addEventListener("click", function () {
          navigator.clipboard.writeText(selectedNote.content);
          alert("Note copied to clipboard");
        });

        const openButton = document.getElementById("open-button");
        openButton.addEventListener("click", function () {
          chrome.tabs.create({ url: selectedNote.url });
        });

        const deleteButton = document.getElementById("delete-button");
        deleteButton.addEventListener("click", function () {
          const filteredNotes = notes.filter(function (note) {
            return note.title !== selectedNote.title;
          });

          chrome.storage.sync.set({ notes: filteredNotes }, function () {
            popupElement.remove();
            loadNotes();
          });
        });

        const closeButton = document.getElementById("close-button");
        closeButton.addEventListener("click", function () {
          popupElement.remove();
          isNoteOpen = false;
        });
      }
    });
  }

  function clearForm() {
    noteTitle.value = "";
    noteContent.value = "";
    noteUrl.value = "";
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    noteUrl.value = activeTab.url;
  });
});
