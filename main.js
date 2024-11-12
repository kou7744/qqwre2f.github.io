// File storage and management
class FileStorage {
  constructor() {
    this.files = this.loadFiles();
  }

  loadFiles() {
    const savedFiles = localStorage.getItem('storedFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  }

  saveFiles() {
    localStorage.setItem('storedFiles', JSON.stringify(this.files));
  }

  addFile(file) {
    const fileData = {
      id: Date.now(),
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      uploadDate: new Date().toISOString()
    };
    this.files.push(fileData);
    this.saveFiles();
    return fileData;
  }

  deleteFile(id) {
    this.files = this.files.filter(file => file.id !== id);
    this.saveFiles();
  }

  renameFile(id, newName) {
    const file = this.files.find(file => file.id === id);
    if (file) {
      file.name = newName;
      this.saveFiles();
    }
  }
}

// Initialize storage
const storage = new FileStorage();

// File upload handling
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadProgress = document.getElementById('upload-progress');

// Load existing files
function loadExistingFiles() {
  dropZone.querySelectorAll('.file-card:not(.folder-card)').forEach(card => card.remove());
  storage.files.forEach(file => {
    addFileToGrid(file, true);
  });
}

// Initialize files on page load
loadExistingFiles();

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop zone when dragging over it
['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropZone.classList.add('drag-over');
}

function unhighlight(e) {
  dropZone.classList.remove('drag-over');
}

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', handleFileSelect, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFileSelect(e) {
  const files = e.target.files;
  handleFiles(files);
}

function handleFiles(files) {
  uploadProgress.classList.add('active');
  
  ([...files]).forEach(file => {
    uploadFile(file);
  });
}

function uploadFile(file) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 30;
    if (progress > 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        const fileData = storage.addFile(file);
        addFileToGrid(fileData);
        uploadProgress.classList.remove('active');
      }, 500);
    }
    document.querySelector('.progress').style.width = `${progress}%`;
    if (progress === 100) {
      document.querySelector('.filename').textContent = 'Upload complete!';
    }
  }, 500);

  document.querySelector('.filename').textContent = file.name;
}

function addFileToGrid(fileData, skipAnimation = false) {
  const fileCard = document.createElement('div');
  fileCard.className = 'file-card' + (skipAnimation ? '' : ' new-file');
  fileCard.dataset.fileId = fileData.id;
  
  const icon = getFileIcon(fileData.type);
  
  fileCard.innerHTML = `
    <div class="file-icon">
      <span class="material-icons">${icon}</span>
    </div>
    <div class="file-name" contenteditable="false">${fileData.name}</div>
    <div class="file-actions">
      <span class="material-icons action-icon rename-file">edit</span>
      <span class="material-icons action-icon delete-file">delete</span>
    </div>
  `;
  
  // Add event listeners for file actions
  const nameElement = fileCard.querySelector('.file-name');
  const renameButton = fileCard.querySelector('.rename-file');
  const deleteButton = fileCard.querySelector('.delete-file');

  renameButton.addEventListener('click', () => {
    nameElement.contentEditable = true;
    nameElement.focus();
  });

  nameElement.addEventListener('blur', () => {
    nameElement.contentEditable = false;
    storage.renameFile(fileData.id, nameElement.textContent);
  });

  nameElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameElement.blur();
    }
  });

  deleteButton.addEventListener('click', () => {
    fileCard.classList.add('deleting');
    setTimeout(() => {
      storage.deleteFile(fileData.id);
      fileCard.remove();
    }, 300);
  });

  dropZone.insertBefore(fileCard, dropZone.firstChild);
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'movie';
  if (mimeType.startsWith('audio/')) return 'audiotrack';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  return 'description';
}