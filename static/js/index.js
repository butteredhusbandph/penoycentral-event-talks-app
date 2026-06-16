document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn');
  const notesContainer = document.getElementById('notes-container');

  async function fetchNotes() {
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;

    try {
      const response = await fetch('/api/notes');
      const data = await response.json();

      if (data.success && data.entries && data.entries.length > 0) {
        renderNotes(data.entries);
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
        <button class="btn btn-tweet" data-id="${escapeHtml(entry.id)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Tweet Update
        </button>
      `;

      // Attach tweet action
      const tweetBtn = card.querySelector('.btn-tweet');
      tweetBtn.addEventListener('click', () => {
        shareOnTwitter(entry);
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
  fetchNotes();
});
