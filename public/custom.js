const backend = "http://127.0.0.1:8000/ocr";

let selectedFile = null;

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const result = document.getElementById("result");
const extractBtn = document.getElementById("extractBtn");
const copyBtn = document.getElementById("copyBtn");

// Store the original upload area HTML so we can restore it on remove
const uploadDefault = uploadArea.innerHTML;

// Upload area – click to open file picker
uploadArea.addEventListener("click", (e) => {
    // Don't open picker if clicking the remove button
    if (e.target.closest(".thumb-remove")) return;
    fileInput.click();
});

// File selected via picker
fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

// Drag & drop
uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

function handleFile(file) {
    selectedFile = file;
    const objectUrl = URL.createObjectURL(file);

    uploadArea.classList.add("has-file");
    uploadArea.innerHTML = `
        <div class="thumb-wrapper">
            <span class="thumb-remove" onclick="removeFile(event)">&times;</span>
            <img src="${objectUrl}" alt="Preview">
        </div>
        <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatSize(file.size)}</span>
            <span class="file-change">Click to change</span>
        </div>
    `;

    extractBtn.disabled = false;
}

function removeFile(e) {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = "";
    uploadArea.classList.remove("has-file");
    uploadArea.innerHTML = uploadDefault;
    extractBtn.disabled = true;
    copyBtn.disabled = true;
}

function runOCR() {
    if (!selectedFile) return;

    extractBtn.disabled = true;
    result.innerHTML = '<div class="spinner"></div>';

    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch(backend, {
        method: "POST",
        body: formData,
    })
        .then((res) => res.json())
        .then((data) => {
            result.innerText = data.text;
            copyBtn.disabled = false;
            extractBtn.disabled = false;
        })
        .catch((err) => {
            result.innerText = "Error: " + err;
            extractBtn.disabled = false;
        });
}

function copyText() {
    const text = result.innerText;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard!");
    });
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}
