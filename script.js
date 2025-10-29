// script.js

const form = document.getElementById('convertForm');
const inputFile = document.getElementById('pdfFile');
const lbUrlInput = document.getElementById('lbUrl');
const statusDiv = document.getElementById('status');
const resultArea = document.getElementById('resultArea');
const resultText = document.getElementById('resultText');
const serverInfo = document.getElementById('serverInfo');
const convertBtn = document.getElementById('convertBtn');

// Default load balancer URL (change if hosted elsewhere)
lbUrlInput.value = "http://10.11.149.50:8000/convert";

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = inputFile.files[0];
  if (!file) {
    alert("⚠️ Please select a PDF file to convert.");
    return;
  }

  const lbUrl = lbUrlInput.value.trim();
  if (!lbUrl) {
    alert("⚠️ Please enter the Load Balancer URL (e.g., http://10.11.149.50:8000/convert)");
    return;
  }

  // UI updates
  convertBtn.disabled = true;
  statusDiv.textContent = "📤 Uploading file and requesting conversion...";
  resultArea.classList.add('hidden');
  serverInfo.textContent = "";

  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    // Set timeout for safety
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(lbUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeout);
    convertBtn.disabled = false;

    if (!response.ok) {
      const errorText = await response.text().catch(() => null);
      console.error("Load Balancer Error:", errorText);
      statusDiv.textContent = `❌ Error: ${response.status} ${response.statusText}`;
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    let textOutput = "";
    let serverName = "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      textOutput = data.text || "(No text extracted)";
      serverName = data.server || "";
    } else {
      textOutput = await response.text();
      serverName = response.headers.get("x-served-by") || "";
    }

    resultText.textContent = textOutput.trim() || "(No text extracted)";
    serverInfo.textContent = serverName ? `🖥 Served by: ${serverName}` : "";
    resultArea.classList.remove('hidden');
    statusDiv.textContent = "✅ Conversion completed successfully.";

  } catch (error) {
    convertBtn.disabled = false;

    if (error.name === "AbortError") {
      statusDiv.textContent = "⏱ Request timed out. Please try again.";
    } else {
      statusDiv.textContent = `⚠️ Error: ${error.message}`;
    }

    resultArea.classList.add('hidden');
    console.error("Fetch error:", error);
  }
});
