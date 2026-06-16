# BigQuery Release Notes Tracker & Sharing Web App

A modern, responsive, single-page web application built with **Python Flask** and **Vanilla Web technologies** (HTML5, JavaScript, and CSS3) that retrieves, parses, and formats the official Google Cloud BigQuery release notes feed and lets users share updates directly to Twitter/X.

## Features

- **Live Aggregation**: Real-time extraction of Google Cloud's official BigQuery XML release notes feed.
- **Robust HTML Sanitization**: Automatically cleans feed HTML markup and secures links with `target="_blank"` and `rel="noopener noreferrer"`.
- **Dynamic CSS UI**: A state-of-the-art slate dark mode styled with smooth animations, custom scrollbars, and responsiveness.
- **Interactive States**: Animated refresh button displaying a loader spinner during asynchronous API actions.
- **Smart Twitter/X Sharing**: Parses release content, strips tags, formats a readable summary, and cleanly truncates updates to conform to Twitter's 280-character limit (injecting necessary links and hashtags automatically).

---

## File Structure

```text
bg-releases-notes/
├── app.py                 # Flask server & XML parsing engine
├── templates/
│   └── index.html         # Main app markup
├── static/
│   ├── css/
│   │   └── index.css      # Core styles & dark theme
│   └── js/
│       └── index.js       # Client API routing & Twitter share logic
├── venv/                  # Python virtual environment (ignored)
├── .gitignore             # Git exclusion rule sheet
└── README.md              # Documentation
```

---

## Prerequisites

- **Python 3.9+**
- **pip** (Python package installer)

---

## Setup & Running Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/butteredhusbandph/penoycentral-event-talks-app.git
   cd penoycentral-event-talks-app
   ```

2. **Initialize Environment & Install Dependencies**
   ```bash
   # Create virtual environment
   python3 -m venv venv

   # Activate environment
   source venv/bin/activate

   # Install requirements
   pip install flask requests feedparser beautifulsoup4
   ```

3. **Start the Web App**
   ```bash
   python app.py
   ```

4. **Access the App**
   Open your browser and navigate to `http://127.0.0.1:5001`.

---

## Technical Details

### API Endpoint
The Flask server exposes a JSON endpoint:
- **`GET /api/notes`**: Fetches the external BigQuery XML feed, cleans elements inside the HTML markup, and returns a JSON array containing the structured updates.

### Dynamic Truncation
Twitter shares are created via client-side intents. The JavaScript automatically calculates length allocations to fit the:
1. Title
2. Truncated Update Body
3. Original Update URL
4. Hashtags `#GoogleCloud #BigQuery`

Without breaking character limits, this outputs a well-formatted tweet ready to post.
