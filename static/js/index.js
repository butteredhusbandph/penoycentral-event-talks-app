document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn');
  const exportBtn = document.getElementById('export-btn');
  const notesContainer = document.getElementById('notes-container');
  const toastContainer = document.getElementById('toast-container');
  const themeToggle = document.getElementById('theme-toggle');
  let currentEntries = [];

  // Theme selector configuration
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  if (currentTheme === 'light') {
    themeToggle.checked = true;
  }

  themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });

  async function fetchNotes() {
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    exportBtn.style.display = 'none';

    try {
      const response = await fetch('/api/notes');
      const data = await response.json();

      if (data.success && data.entries && data.entries.length > 0) {
        currentEntries = data.entries;
        renderNotes(data.entries);
        exportBtn.style.display = 'inline-flex';
      } else {
        renderError(data.error || 'No release notes found in the feed.');
      }
    } catch (err) {
      renderError('Failed to fetch from local server. Make sure Flask is running.');
    } finally {
      refreshBtn.classList.remove('loading');
      refreshBtn.disabled = false;
    }
  }

  function renderNotes(entries) {
    notesContainer.innerHTML = '';
    entries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.id = `note-${encodeURIComponent(entry.id)}`;

      // Parse date to readable format
      let formattedDate = entry.updated;
      try {
        if (entry.updated) {
          const date = new Date(entry.updated);
          formattedDate = date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (e) {
        // Fallback to raw value
      }

      card.innerHTML = `
        <div class="note-header">
          <div class="note-title">${escapeHtml(entry.title)}</div>
          <span class="note-date">${escapeHtml(formattedDate)}</span>
        </div>
        <div class="note-content">${entry.content}</div>
        <div class="card-actions">
          <button class="btn btn-tweet" data-action="tweet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Tweet Update
          </button>
          <button class="btn btn-secondary" data-action="copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Info
          </button>
        </div>
      `;

      // Attach button actions
      card.querySelector('[data-action="tweet"]').addEventListener('click', () => {
        shareOnTwitter(entry);
      });

      card.querySelector('[data-action="copy"]').addEventListener('click', () => {
        copyToClipboard(entry);
      });

      notesContainer.appendChild(card);
    });
  }

  function renderError(message) {
    notesContainer.innerHTML = `
      <div class="error-state">
        <h3>Oops! Something went wrong</h3>
        <p>${escapeHtml(message)}</p>
        <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="location.reload()">Retry App Load</button>
      </div>
    `;
  }

  function copyToClipboard(entry) {
    const formattedText = `BigQuery Update: ${entry.title}\nDate: ${entry.updated}\nLink: ${entry.link}\n\n${entry.plain_text}`;
    navigator.clipboard.writeText(formattedText)
      .then(() => showToast('Copied to clipboard!'))
      .catch(() => showToast('Failed to copy.'));
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Remove element after animation completes
    setTimeout(() => {
      toast.remove();
    }, 2500);
  }

  function exportToCSV() {
    if (currentEntries.length === 0) return;

    // CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Updated Date,Link,Content Summary\r\n";

    currentEntries.forEach(entry => {
      // Clean content summary for CSV compatibility
      const cleanSummary = (entry.plain_text || '')
        .replace(/"/g, '""')
        .replace(/\r?\n|\r/g, ' ');

      const row = [
        `"${entry.id.replace(/"/g, '""')}"`,
        `"${entry.title.replace(/"/g, '""')}"`,
        `"${entry.updated.replace(/"/g, '""')}"`,
        `"${entry.link.replace(/"/g, '""')}"`,
        `"${cleanSummary}"`
      ].join(",");

      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  function shareOnTwitter(entry) {
    // Construct clean tweet text
    // Max tweet limit is 280. We need to fit title, a summary/snippet, link, and hashtags
    const title = `BigQuery Update: ${entry.title}`;
    
    // Clean up summary
    let plainContent = entry.plain_text || '';
    // Strip redundant whitespace
    plainContent = plainContent.replace(/\s+/g, ' ').trim();
    
    // Create preview
    let tweetText = `${title}\n\n`;
    const hashtags = "\n\n#GoogleCloud #BigQuery";
    const link = entry.link || 'https://cloud.google.com/bigquery';
    
    const availableLength = 280 - tweetText.length - link.length - hashtags.length - 6; // buffer
    
    if (plainContent.length > availableLength) {
      tweetText += plainContent.substring(0, availableLength - 3) + '...';
    } else {
      tweetText += plainContent;
    }
    
    tweetText += `\n${link}${hashtags}`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load
  refreshBtn.addEventListener('click', fetchNotes);
  exportBtn.addEventListener('click', exportToCSV);
  fetchNotes();
});
