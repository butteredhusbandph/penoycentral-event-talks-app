import os
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html(html_content):
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    # Simplify structure/sanitize if needed, or return text/clean HTML
    # We want to preserve basic structure (links, code, bold, list items)
    # let's just make sure links target="_blank"
    for a in soup.find_all('a'):
        a['target'] = '_blank'
        a['rel'] = 'noopener noreferrer'
    return str(soup)

def parse_feed():
    try:
        response = requests.get(FEED_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        response.raise_for_status()
        
        feed = feedparser.parse(response.content)
        
        entries = []
        for entry in feed.entries:
            # Get content
            content_value = ""
            if "content" in entry and entry.content:
                content_value = entry.content[0].value
            elif "summary" in entry:
                content_value = entry.summary
            
            # Clean content HTML
            clean_content = clean_html(content_value)
            
            # Extract basic text for tweet sharing
            text_soup = BeautifulSoup(content_value, "html.parser")
            plain_text = text_soup.get_text()
            
            # Form clean entry metadata
            entries.append({
                "id": entry.get("id", entry.get("link", "")),
                "title": entry.get("title", "BigQuery Update"),
                "updated": entry.get("updated", entry.get("published", "")),
                "link": entry.get("link", ""),
                "content": clean_content,
                "plain_text": plain_text
            })
            
        return {"success": True, "entries": entries}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/notes")
def get_notes():
    result = parse_feed()
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5001)
