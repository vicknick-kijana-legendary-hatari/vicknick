const siteView = document.getElementById('siteView');
const downloadsPanel = document.getElementById('downloadsPanel');
const downloadsList = document.getElementById('downloadsList');
const downloadsCount = document.getElementById('downloadsCount');
const reloadBtn = document.getElementById('reloadBtn');
const downloadsBtn = document.getElementById('downloadsBtn');

const downloads = new Map();

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(value > 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return '0 B/s';
  return `${formatBytes(bytesPerSecond)}/s`;
}

function renderDownloads() {
  const entries = [...downloads.values()];
  downloadsCount.textContent = `${entries.filter(item => item.status === 'downloading').length} active`;

  downloadsList.innerHTML = entries
    .sort((a, b) => b.startedAt - a.startedAt)
    .map(item => {
      const percent = item.totalBytes > 0 ? Math.round((item.receivedBytes / item.totalBytes) * 100) : 0;
      return `
        <article class="download-item">
          <div class="download-title">${item.filename}</div>
          <div class="progress-bar">
            <div class="progress-value" style="width: ${percent}%"></div>
          </div>
          <div class="meta">
            <span>${percent}%</span>
            <span>${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes)}</span>
          </div>
          <div class="meta">
            <span>${formatSpeed(item.speedBytesPerSecond)}</span>
            <span>${item.status}</span>
          </div>
          <div class="download-actions">
            <button data-action="pause" data-id="${item.id}">Pause</button>
            <button data-action="resume" data-id="${item.id}">Resume</button>
            <button data-action="cancel" data-id="${item.id}">Cancel</button>
          </div>
        </article>
      `;
    })
    .join('');
}

async function initialize() {
  const config = await window.desktopAPI.getConfig();
  siteView.src = config.appUrl;

  const initialDownloads = await window.desktopAPI.downloads.getAll();
  initialDownloads.forEach(item => downloads.set(item.id, item));
  renderDownloads();
}

window.desktopAPI.downloads.onUpdate(item => {
  downloads.set(item.id, item);
  renderDownloads();
});

window.desktopAPI.onReloadWebview(() => {
  siteView.reload();
});

window.desktopAPI.onToggleDownloads(() => {
  downloadsPanel.classList.toggle('hidden');
});

reloadBtn.addEventListener('click', () => {
  siteView.reload();
});

downloadsBtn.addEventListener('click', () => {
  downloadsPanel.classList.toggle('hidden');
});

downloadsList.addEventListener('click', async event => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  if (action === 'pause') await window.desktopAPI.downloads.pause(id);
  if (action === 'resume') await window.desktopAPI.downloads.resume(id);
  if (action === 'cancel') await window.desktopAPI.downloads.cancel(id);
});

siteView.addEventListener('new-window', async event => {
  event.preventDefault();
  await window.desktopAPI.openExternal(event.url);
});

initialize();
