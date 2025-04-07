let analysisTexts = [
  "Detecting comments data...",
  "Analysing Platform...",
  "Analysing Primary Theme...",
  "Analysing Evolved Narrative...",
  "Analysing Trending Theme...",
  "Analysing Sentiment...",
  "Analysing Emotion...",
  "Analysing Toxicity Category...",
  "Analysing Fan Cluster...",
  "Analysing Topics of Interest...",
  "Analysing Peak Activity Time...",
  "Analysing Trigger Words & Hashtags...",
  "Analysing Fan Inquiry Category...",
  "Analysing Purchase Intent Score...",
  "Analysing In Stadium Signal...",
  "Analysing Sponsor Brand Mentions...",
  "Analysing Brand Sentiment...",
  "Analysing Monetization Opportunity...",
  "Analysing AI Action Tag..."
];

let isUrlBasedUpload = false;

const card1 = document.getElementById('card1');
const card2 = document.getElementById('card2');
const card3 = document.getElementById('card3');

const urlInput = document.getElementById('urlInput');

const cardData = {
  card1: {
    fileName: 'data1.csv',
    url: 'https://www.reddit.com/r/NYYankees/comments/1g8gfnx/yankees_vs_dodgers_in_the_2024_world_series/'
  },
  card2: {
    fileName: 'data2.csv',
    url: 'https://www.reddit.com/r/NYYankees/comments/1g8gfnx/yankees_vs_dodgers_in_the_2024_world_series/'
  },
  card3: {
    fileName: 'data3.csv',
    url: 'https://www.reddit.com/r/NYYankees/comments/1g8gfnx/yankees_vs_dodgers_in_the_2024_world_series/'
  }
};

[card1, card2, card3].forEach(card => {
  card.addEventListener('click', () => {
    Object.values(cardData).forEach(data => {
      document.getElementById(Object.keys(cardData).find(key => cardData[key] === data)).classList.remove('selected')
    })
    card.classList.add('selected');

    const cardId = card.id;
    const fileName = cardData[cardId].fileName;
    const url = cardData[cardId].url;

    uploadCSV(fileName);
    urlInput.value = url;
    const progressText = document.getElementById('progressText');
    progressText.textContent = 'Analysis Complete!. Proceed to the 360° Tab';
  });
});

function uploadCSV(fileName) {
  const fileInput = document.getElementById('file');
  if (fileInput) {
    fetch(`/files/${fileName}`)
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('File not found');
      })
      .then(blob => {
        const csvFile = new File([blob], 'reddit_comments.csv', { type: 'text/csv' });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(csvFile);
        fileInput.files = dataTransfer.files;

        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);

        console.log(fileName + " uploaded successfully!");
      })
      .catch(error => {
        console.error(error);
        alert('Failed to upload the file');
      });
  } else {
    console.error("File input element with ID 'file' not found.");
  }
}




document.getElementById('fetchDataButton').addEventListener('click', function () {
  fetchPostTable();
});

async function fetchPostTable() {
  const tableContainer = document.getElementById('tableContainer');
  tableContainer.innerHTML = "<p>Loading data...</p>";
  const urlInput = document.getElementById('urlInput');
  const urls = urlInput.value.split('\n').map(url => url.trim()).filter(url => url !== "");

  const formData = new FormData();
  urls.forEach(url => {
    formData.append("url_list", url);
  });

  try {
    const response = await fetch('/post_table', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      tableContainer.innerHTML = `<p>Error: ${response.status} - ${response.statusText}</p>`;
      console.error('HTTP error!', response);
      return;
    }

    const csvData = await response.text();

    if (csvData) {
      const tablesHTML = csvToMultipleTables(csvData); // Modified function call
      tableContainer.innerHTML = tablesHTML;
    } else {
      tableContainer.innerHTML = "<p>No data received from the server.</p>";
    }

  } catch (error) {
    tableContainer.innerHTML = `<p>Fetch error: ${error.message}</p>`;
    console.error('Fetch error:', error);
  }
}


function csvToMultipleTables(csvText) {
  const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (parsedData.errors.length > 0) {
    console.error("CSV Parsing Errors:", parsedData.errors);
    return "<p>Error parsing CSV data. Check console for details.</p>";
  }

  const data = parsedData.data;

  if (data.length === 0) {
    return "<p>No data to display in table.</p>";
  }

  const headers = Object.keys(data[0]);

  const tableConfigs = [
    {
      heading: "Post Context",
      columns: ["post", "summarized_comment", "url", "Platform", "Post Timestamp"],
    },
    {
      heading: "Content Themes & Topics",
      columns: ["post", "Primary Topic (Post)", "Evolved Narrative (Conversation)", "Trending Themes (Crowd Momentum)"],
    },
    {
      heading: "Fan Engagement",
      columns: ["post", "post_comment_count", "post_score", "Engagement_Velocity", "Fan Retention Rate"],
    },
    {
      heading: "Sentiment Emotion",
      columns: ["post", "Sentiment Score", "Emotionn Type"],
    },
    {
      heading: "Community Signals",
      columns: ["post", "Top Fan Voice", "Fan Clusters", "Topics of Interest"],
    },
    {
      heading: "Behaviour Insights",
      columns: ["post", "Peak_Activity_Time", "Location Inference"],
    },
    {
      heading: "Engagement Drivers",
      columns: ["post", "Trigger Words / Hashtags", "Fan Inquiry Rate"],
    },
    {
      heading: "Commerce Signals",
      columns: ["post", "Purchase Intent Score", "In-Stadium Signals", "Sponsor/Brand Mentions", "Brand Sentiment"],
    },
    {
      heading: "Summary & Action",
      columns: ["post", "Fan Engagement Score", "Monetization Opportunity", "AI Action Tag"],
    },
  ];

  let allTablesHTML = '';

  tableConfigs.forEach(config => {
    const validColumns = config.columns.filter(col => headers.includes(col));

    if (validColumns.length === 0) return;

    let tableHTML = `
      <h5 style="margin-top:20px">${config.heading}</h5>
      <table style="margin-top:10px; width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
    `;
    validColumns.forEach(header => {
      const formattedHeader = header.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      tableHTML += `<th style="padding: 10px; border: 1px solid #ddd;">${formattedHeader}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    data.forEach(row => {
      tableHTML += '<tr style="border-bottom: 1px solid #ddd;">';
      validColumns.forEach(header => {
        let cellContent = row[header] || '';
        if (header === 'summarized_comment') {
          const maxLength = 80;
          const truncatedSummary = cellContent.length > maxLength ? cellContent.substring(0, maxLength) + '...' : cellContent;
          tableHTML += `<td style="padding: 10px; border: 1px solid #ddd;" title="${cellContent}"><span style="display:block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${truncatedSummary}</span></td>`;
        } else if (header === 'url') {
          const maxLength = 40;
          const truncatedSummary = cellContent.length > maxLength ? cellContent.substring(0, maxLength) + '...' : cellContent;
          tableHTML += `<td style="padding: 10px; border: 1px solid #ddd;" title="${cellContent}"><span style="display:block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${truncatedSummary}</span></td>`;
        } else {
          tableHTML += `<td style="padding: 10px; border: 1px solid #ddd;">${cellContent}</td>`;
        }
      });
      tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    allTablesHTML += tableHTML;
  });

  return allTablesHTML;
}




document.addEventListener("DOMContentLoaded", function () {
  const homeTabButton = document.getElementById("home-tab-button");
  loadContent('home-tab', homeTabButton);
});

let activeTabButton = null;
const sidebarButtons = document.querySelectorAll('.sidebar .btn');
const tabContent = document.getElementById('tabContent');

function loadContent(tabId, button) {
  if (activeTabButton) {
    activeTabButton.classList.remove('active');
  }
  button.classList.add('active');
  activeTabButton = button;

  const allContents = tabContent.querySelectorAll('.tab');
  allContents.forEach(content => content.classList.remove('active'));

  const contentDiv = document.getElementById(tabId);
  if (contentDiv) {
    contentDiv.classList.add('active');
  }
}
document.addEventListener("DOMContentLoaded", function () {
  // Get the disabled buttons
  const viewButton = document.getElementById('view-tab-button');
  const dashboardButton = document.getElementById('Dashboard-tab-button');
  const datachatButton = document.getElementById('datachat-tab-button');

  // Get the tooltip element
  const tooltip = document.getElementById('tooltip');

  // Function to show the tooltip
  function showTooltip(event) {
    // Only show the tooltip if the button is disabled
    if (event.target.style.pointerEvents === 'none') {
      const rect = event.target.getBoundingClientRect();
      tooltip.style.top = `${rect.top + window.scrollY - 40}px`; // Position above the button
      tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`; // Center the tooltip

      tooltip.style.display = 'block';

      // Hide the tooltip after 2 seconds
      setTimeout(function () {
        tooltip.style.display = 'none';
      }, 2000);
    }
  }

  // Add event listeners to the buttons to show the tooltip on click
  viewButton.addEventListener('click', showTooltip);
  dashboardButton.addEventListener('click', showTooltip);
  datachatButton.addEventListener('click', showTooltip);
});
sidebarButtons.forEach(button => {
  button.addEventListener('click', function (event) {
    event.preventDefault();
    const tabId = this.getAttribute('data-tab');

    if (tabId) {
      // if(tabId == "Dashboard-tab"){
      //   document.getElementById("render-pre-defined-charts").click();
      // }
      // if(tabId == "view-tab"){
      //   document.getElementById("fetchDataButton").click();
      // }
      loadContent(tabId, this);
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const submitUrlsButton = document.getElementById('submitUrlsButton');
  const urlInput = document.getElementById('urlInput');
  const urlResponseDiv = document.getElementById('progressText');

  submitUrlsButton.addEventListener('click', function () {
    const urls = urlInput.value;
    document.getElementById('myProgressBarDiv').style.display = "block";
    if (!urls.trim()) {
      urlResponseDiv.textContent = "Please enter URLs.";
      return;
    }

    urlResponseDiv.textContent = "Processing URLs, please wait..."; // Feedback to user

    fetch('/process_urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Important for Form data
      },
      body: new URLSearchParams({  // Format data as form data
        'urls': urls
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Get CSV data as text
      })
      .then(csvData => {
        // urlResponseDiv.textContent = ""; // Clear "Processing..." message

        if (csvData.startsWith("No data could be scraped")) { // Check for backend error message
          urlResponseDiv.textContent = csvData; // Display error message from backend
          return;
        }
        isUrlBasedUpload = true;
        const fileInput = document.getElementById('file'); // Get the file input element
        if (fileInput) {
          const csvBlob = new Blob([csvData], { type: 'text/csv' });
          const csvFile = new File([csvBlob], 'reddit_comments.csv', { type: 'text/csv' });

          // Create a new DataTransfer object to handle FileList
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(csvFile);
          fileInput.files = dataTransfer.files; // Set the files property of the input
          const changeEvent = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(changeEvent);
          // urlResponseDiv.textContent = "CSV data loaded into the upload form below.";
        } else {
          urlResponseDiv.textContent = "Error: LLM Foundry Not Working";
          console.error("File input element with ID 'file' not found.");
        }
        // Create a download link for the CSV
        // const blob = new Blob([csvData], { type: 'text/csv' });
        // const url = URL.createObjectURL(blob);
        // const downloadLink = document.createElement('a');
        // downloadLink.href = url;
        // downloadLink.download = 'reddit_comments.csv'; 
        // downloadLink.textContent = 'Download CSV File';

        // urlResponseDiv.appendChild(downloadLink);

      })
      .catch(error => {
        console.error('Error processing URLs:', error);
        urlResponseDiv.textContent = "Error processing URLs. Please check console for details.";
      });
  });
});










// ------------------ Global Loading Overlay Functions ------------------
function showGlobalLoading() {
  let overlay = document.getElementById("global-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "global-loading-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.3)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";
    overlay.innerHTML = `<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>`;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = "flex";
  }
}

function hideGlobalLoading() {
  const overlay = document.getElementById("global-loading-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

// ------------------ Custom CSS ------------------
const customStyles = `
  <style>
    /* Plain grey buttons: no background/border, simple grey text */
    .btn-plain {
      background: none !important;
      border: none !important;
      color: #555 !important;
      padding: 0.25rem 0.5rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-plain:hover {
      color: #333 !important;
    }
    /* Force table to full width and smaller font */
    table {
      font-size: 0.8rem;
      width: 100% !important;
    }
    /* Remove max-width constraint on narrative sections */
    .narrative {
      max-width: 100% !important;
    }
    /* Styling for visualization suggestion table */
    #visualization-suggestions table {
      margin-top: 10px;
      font-size: 0.8rem;
    }
    #visualization-suggestions input, #visualization-suggestions select {
      font-size: 0.8rem;
    }
    #visualization-output div {
      margin-top: 15px;
      border: 1px solid #ccc;
      padding: 10px;
    }
  </style>
  `;
document.head.insertAdjacentHTML("beforeend", customStyles);

// ------------------ Module Imports ------------------
import sqlite3InitModule from "https://esm.sh/@sqlite.org/sqlite-wasm@3.46.1-build3";
import { render, html } from "https://cdn.jsdelivr.net/npm/lit-html@3/+esm";
import { unsafeHTML } from "https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js";
import { dsvFormat, autoType } from "https://cdn.jsdelivr.net/npm/d3-dsv@3/+esm";
import { Marked } from "https://cdn.jsdelivr.net/npm/marked@13/+esm";
import { markedHighlight } from "https://cdn.jsdelivr.net/npm/marked-highlight@2/+esm";
import hljs from "https://cdn.jsdelivr.net/npm/highlight.js@11/+esm";
import { Chart, registerables } from "https://cdn.jsdelivr.net/npm/chart.js@4/+esm";
import * as Plotly from "https://cdn.plot.ly/plotly-2.16.1.min.js";



// ------------------ Initialization ------------------
// Use a named file ("mydb.sqlite") so that changes are persistent and can be downloaded.
const defaultDB = "mydb.sqlite";
const sqlite3 = await sqlite3InitModule({ printErr: console.error });
Chart.register(...registerables);

// ------------------ DOM Elements ------------------
const $demos = document.querySelector("#demos");
const $upload = document.getElementById("upload");
const $tablesContainer = document.getElementById("tables-container");
const $sql = document.getElementById("sql");
const $toast = document.getElementById("toast");
const $result = document.getElementById("result");
const $chartCode = document.getElementById("chart-code");
const toast = new bootstrap.Toast($toast);
const loading = html`<div class="text-center my-3">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>`;

// Global variables: latest query result, chart instance, query history, and visualization suggestions.
let latestQueryResult = [];
let latestChart;
let queryHistory = [];
let visualizationSuggestions = []; // Array of suggestion objects

// ------------------ Markdown Setup ------------------
const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);
marked.use({
  renderer: {
    table(header, body) {
      return `<table class="table table-sm">${header}${body}</table>`;
    },
  },
});

// ------------------ Fetch LLM Token (Optional) ------------------
let token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVsYXR1cmkuYmhhbnVAZ3JhbWVuZXIuY29tIn0.NIZbpbZvAPBGjoEDIM7PoDPdJm9Q6lMygCQgaWz5GdY";
// try {
//   token = (
//     await fetch("https://llmfoundry.straive.com/token", {
//       credentials: "include",
//     }).then((r) => r.json())
//   ).token;
// } catch {
//   token = null;
// }

// ------------------ Render Upload Area ------------------
render(
  token
    ? html`
          <div class="mb-3">
            <label for="file" class="form-label d-none">
              Upload CSV (<code>.csv</code>) or SQLite DB (<code>.sqlite3</code>, <code>.db</code>)
            </label>
            <input
              class="form-control d-none"
              type="file"
              id="file"
              name="file"
              accept=".csv,.sqlite3,.db,.sqlite,.s3db,.sl3"
              multiple
            />
          </div>
        `
    : html`<a class="btn btn-primary" href="https://llmfoundry.straive.com/">
          Sign in to upload files
        </a>`,
  $upload
);

const db = new sqlite3.oo1.DB(defaultDB, "c");
const DB = {
  context: "",
  schema: function () {
    let tables = [];
    db.exec("SELECT name, sql FROM sqlite_master WHERE type='table'", {
      rowMode: "object",
    }).forEach((table) => {
      table.columns = db.exec(`PRAGMA table_info(${table.name})`, {
        rowMode: "object",
      });
      tables.push(table);
    });
    return tables;
  },

  clearTable: async function (tableName) {
    // Drop the table if it exists
    db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    console.log(`Table ${tableName} cleared.`);
  },

  // upload: async function (file) {
  //   if (file.name.match(/\.(sqlite3|sqlite|db|s3db|sl3)$/i)) {
  //     await DB.uploadSQLite(file);
  //   } else if (file.name.match(/\.csv$/i)) {
  //     await DB.clearTable('reddit_comments');
  //     await DB.uploadDSV(file, ",");
  //   } else if (file.name.match(/\.tsv$/i)) {
  //     await DB.uploadDSV(file, "\t");
  //   } else {
  //     notify("danger", "Unknown file type", file.name);
  //   }
  // },
  upload: async function (file) {
    const newFileName = `reddit_comments${file.name.match(/\..+$/)[0]}`;

    const newFile = new File([file], newFileName, { type: file.type });

    if (newFile.name.match(/\.(sqlite3|sqlite|db|s3db|sl3)$/i)) {
      await DB.uploadSQLite(newFile);
    } else if (newFile.name.match(/\.csv$/i)) {
      await DB.uploadDSV(newFile, ",");
    } else if (newFile.name.match(/\.tsv$/i)) {
      await DB.uploadDSV(newFile, "\t");
    } else {
      notify("danger", "Unknown file type", newFile.name);
    }
  },

  uploadSQLite: async function (file) {
    const fileReader = new FileReader();
    await new Promise((resolve) => {
      fileReader.onload = async (e) => {
        await sqlite3.capi.sqlite3_js_posix_create_file(
          file.name,
          e.target.result
        );
        // Copy tables into main DB
        const uploadDB = new sqlite3.oo1.DB(file.name, "r");
        const tables = uploadDB.exec(
          "SELECT name, sql FROM sqlite_master WHERE type='table'",
          { rowMode: "object" }
        );
        for (const { name, sql } of tables) {
          db.exec(`DROP TABLE IF EXISTS "${name}"`);
          db.exec(sql);
          const data = uploadDB.exec(`SELECT * FROM "${name}"`, {
            rowMode: "object",
          });
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            const insertSQL = `INSERT INTO "${name}" (${columns
              .map((c) => `"${c}"`)
              .join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
            const stmt = db.prepare(insertSQL);
            db.exec("BEGIN TRANSACTION");
            for (const row of data) {
              stmt.bind(columns.map((c) => row[c])).stepReset();
            }
            db.exec("COMMIT");
            stmt.finalize();
          }
        }
        uploadDB.close();
        resolve();
      };
      fileReader.readAsArrayBuffer(file);
    });
    notify("success", "Imported", `Imported SQLite DB: ${file.name}`);
  },

  uploadDSV: async function (file, separator) {
    const fileReader = new FileReader();
    const result = await new Promise((resolve) => {
      fileReader.onload = (e) => {
        const rows = dsvFormat(separator).parse(e.target.result, autoType);
        resolve(rows);
      };
      fileReader.readAsText(file);
    });
    const tableName = file.name
      .slice(0, -4)
      .replace(/[^a-zA-Z0-9_]/g, "_");

    await DB.insertRows(tableName, result);
    setupDatePickers();
    if (isUrlBasedUpload) {
      console.log("Processing URL-based CSV upload...");
      const commentCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("comment") ||
        col.toLowerCase().includes("feedback") ||
        col.toLowerCase().includes("review") ||
        col.toLowerCase().includes("message")
      );
      const AuthorCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("author") ||
        col.toLowerCase().includes("user") ||
        col.toLowerCase().includes("username") ||
        col.toLowerCase().includes("handle")
      );
      // Detect time column
      const TimeCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("time") ||
        col.toLowerCase().includes("timestamp") ||
        col.toLowerCase().includes("created_time")
      );

      // Detect date column
      const DateCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("date") ||
        col.toLowerCase().includes("created_date")
      );
      const engagementCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("engagement") ||
        col.toLowerCase().includes("interaction") ||
        col.toLowerCase().includes("activity")
      );

      // Detect toxicity column
      const toxicityCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("toxicity") ||
        col.toLowerCase().includes("abuse") ||
        col.toLowerCase().includes("profanity") ||
        col.toLowerCase().includes("flagged")
      );

      const sentimentCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("sentiment") ||
        col.toLowerCase().includes("emotion") ||
        col.toLowerCase().includes("mood")
      );

      const likesCol = Object.keys(result[0] || {}).find(col =>
        col.toLowerCase().includes("likes") ||
        col.toLowerCase().includes("upvotes") ||
        col.toLowerCase().includes("reactions")
      );

      if (commentCol) {
        // console.log(`Detected comments column: ${commentCol}`);

        // Define all columns to add in one batch
        const columnDefinitions = [
          {
            name: "platform",
            type: "TEXT",
            prompt: `Identify the social platform where this comment was posted from the url (e.g., Twitter, Reddit, Facebook, Instagram, TikTok, YouTube, LinkedIn, etc.): {${commentCol}}`
          },
          {
            name: "primary_theme",
            type: "TEXT",
            prompt: `categorize the comment as [Pre-Game Engagement,Live Game Engagement,Post-Game Engagement,Player & Team Analysis,Fan Experience & Personal Narratives,Commercial & Brand-Related Interests,Digital Creative Content & Social Trends,Fantasy, Betting & Gaming Insights,Off-Field Social Commentary & Activism,Unregulated/Toxic & Viral Outbursts]: {${commentCol}}`
          },
          {
            name: "Evolved_narrative",
            type: "TEXT",
            prompt: `Categorize the primary_theme into one of the following sub-themes:
                  - **Pre-Game Engagement** → ["Predictions", "Line-up Speculations", "Tactical Previews"]
                  - **Live Game Engagement** → ["Real-Time Commentary", "Tactical & Emotional Reactions"]
                  - **Post-Game Engagement** → ["Celebrations", "Critiques", "Match Reviews", "Recaps"]
                  - **Player & Team Analysis** → ["Performance Evaluations", "Injury Updates", "Transfer Rumors"]
                  - **Fan Experience & Personal Narratives** → ["Personal Game-Day Stories", "Emotional Journeys", "Venue/Travel Experiences"]
                  - **Commercial & Brand-Related Interests** → ["Merchandise Reviews", "Sponsorship Discussions", "Brand Loyalty Expressions"]
                  - **Digital Creative Content & Social Trends** → ["Memes", "Fan Art", "Video Highlights", "Creative UGC"]
                  - **Fantasy, Betting & Gaming Insights** → ["Fantasy League Strategies", "Betting Tips", "Predictive Discussions"]
                  - **Off-Field Social Commentary & Activism** → ["Socio-Political Commentary", "Cultural Debates", "League Policy Critiques"]
                  - **Unregulated/Toxic & Viral Outbursts** → ["Controversial Opinions", "Trolling", "Abuse", "Out-of-Control Rants"]
                  Comment: {${commentCol}}`
          },
          {
            name: "trending_theme",
            type: "TEXT",
            prompt: `Identify the most relevant emerging theme based on the comment content: "{${commentCol}}"`
          },
          {
            name: "sentiment",
            type: "TEXT",
            prompt: `Analyze the sentiment of this comment as [Positive,Negative,Neutral]: {${commentCol}}`
          },
          {
            name: "emotion",
            type: "TEXT",
            prompt: `Classify the emotion expressed in this comment into one of the following categories:
                  [Happy, Sad, Excited, Angry, Frustrated, Surprised, Confused, Fearful, Disgusted]: {${commentCol}}`
          },
          {
            name: "toxicity_category",
            type: "TEXT",
            prompt: `Analyze the comment for toxicity, including abuse, profanity, or harmful language. Categorize the comment into one of the following levels:
                  - **Safe** (No toxicity)
                  - **Mild** (Slightly offensive but not harmful)
                  - **Moderate** (Potentially harmful or disrespectful)
                  - **Severe** (Highly abusive, threatening, or toxic)
                  Comment: {${commentCol}}`
          },
          {
            name: "fan_cluster",
            type: "TEXT",
            prompt: `Analyze the comment's tone, sentiment, and subject matter. Categorize the author into one of the following fan clusters:
                  - **Passionate Supporters** (Highly enthusiastic, positive engagement)
                  - **Critical Analysts** (Constructive feedback, deep discussions)
                  - **Casual Observers** (Occasional engagement, neutral tone)
                  - **Meme & Humor Fans** (Lighthearted, joke-based interaction)
                  - **Debaters & Contrarians** (Frequent disagreements, strong opinions)
                  - **Toxic/Disruptive Users** (Negative engagement, trolling behavior)
                  Comment: {${commentCol}}`
          },
          {
            name: "topics_of_interest",
            type: "TEXT",
            prompt: `Extract key topics of interest from the comment: {${commentCol}}`
          },
          {
            name: "trigger_words_hashtags",
            type: "TEXT",
            prompt: `Identify key words, phrases, or hashtags in the comment that evoke strong reactions (positive or negative). Focus on emotionally charged, viral, or frequently used terms.  
                  Comment: {${commentCol}}`
          },
          {
            name: "fan_inquiry_category",
            type: "TEXT",
            prompt: `Analyze the comment to determine if it contains a fan inquiry related to:  
                  - **Ticketing & Attendance** (Buying tickets, event details, seating info)  
                  - **Broadcast & Streaming** (Where to watch, streaming options, TV channels)  
                  - **Merchandise & Shopping** (Jersey availability, promo codes, brand stores)  
                  - **Game Rules & Info** (Clarifications about the match, team updates)  
                  - **No Inquiry** (Comment does not contain a fan inquiry)  
                  Comment: {${commentCol}}`
          },
          {
            name: "purchase_intent_score",
            type: "FLOAT",
            prompt: `Analyze the comment for signals of purchase intent regarding tickets, merchandise, or related products. Assign a score from 0 to 1, where:  
                  - **0.0 - 0.3** → Low intent (General discussion, no buying signals)  
                  - **0.4 - 0.6** → Medium intent (Interest shown but no clear action)  
                  - **0.7 - 1.0** → High intent (Direct intent to purchase, strong buying signals)  
                  Comment: {${commentCol}}`
          },
          {
            name: "in_stadium_signal",
            type: "TEXT",
            prompt: `Analyze the comment for indications that the fan is attending or has attended the event in person. Categorize it as:  
                  - **Confirmed Attendee** (Explicit mention of being at the stadium)  
                  - **Likely Attendee** (Hints at attending, e.g., travel plans, ticket purchase)  
                  - **Watching Remotely** (Mentions of TV, streaming, or online viewing)  
                  - **No Mention** (No indication of attendance)  
                  Comment: {${commentCol}}`
          },
          {
            name: "sponsor_brand_mentions",
            type: "TEXT",
            prompt: `Identify any mentions of MLB sponsors, partners, or brands in the comment. Extract the brand name(s) if mentioned. If no sponsor is referenced, return "None".  
                  Comment: {${commentCol}}`
          },
          {
            name: "brand_sentiment",
            type: "TEXT",
            prompt: `Analyze the sentiment of the comment regarding any mentioned MLB sponsor or brand. Categorize it as:  
                  - **Positive** (Supportive, favorable, enthusiastic)  
                  - **Neutral** (Mentioned without strong opinion)  
                  - **Negative** (Critical, unfavorable, or complaining)  
                  If no brand is mentioned, return "No Mention".  
                  Comment: {${commentCol}}`
          }
        ];

        // First add all columns to the table
        for (const colDef of columnDefinitions) {
          const alterSQL = `ALTER TABLE [${tableName}] ADD COLUMN [${colDef.name}] ${colDef.type}`;
          db.exec(alterSQL);
          queryHistory.push(alterSQL);
        }
        // Then update all columns in one batch
        await updateMultipleColumns(tableName, columnDefinitions);

        // All columns are processed through updateMultipleColumns

        drawTables();  // Refresh UI after updates

      } else {
        console.warn("No comments column found. Skipping sentiment analysis.");
      }
    }
  },

  insertRows: async function (tableName, rows) {
    if (!rows.length) return;

    let cols = Object.keys(rows[0]);
    const typeMap = {};
    // console.log(cols);

    for (let col of cols) {
      const sampleValue = rows[0][col];
      // console.log(typeof (sampleValue), sampleValue);
      if (typeof sampleValue === "string") {
        // Check for valid date-time formats
        if (sampleValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          typeMap[col] = "TEXT";
        } else if (sampleValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
          typeMap[col] = "TEXT";
        } else if (sampleValue.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/)) {
          const dateCol = `${col}_date`;
          const timeCol = `${col}_time`;

          typeMap[dateCol] = "TEXT";
          typeMap[timeCol] = "TEXT";
        } else if (sampleValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          const dateCol = `${col}_date`;
          const timeCol = `${col}_time`;

          typeMap[dateCol] = "TEXT";
          typeMap[timeCol] = "TEXT";
        } else {
          typeMap[col] = "TEXT";
        }
      } else if (typeof sampleValue === "number") {
        typeMap[col] = Number.isInteger(sampleValue) ? "INTEGER" : "REAL";
      } else if (typeof sampleValue === "boolean") {
        typeMap[col] = "INTEGER";
      } else if (sampleValue instanceof Date) {
        typeMap[col] = "TEXT";
      }
    }

    // Create SQL table with modified columns
    const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (
            ${Object.keys(typeMap).map((col) => `"${col}" ${typeMap[col]}`).join(", ")}
        )`;
    db.exec(createSQL);

    // Prepare insert statement
    let newCols = Object.keys(typeMap);
    const insertSQL = `INSERT INTO ${tableName} (${newCols.map((c) => `"${c}"`).join(", ")}) VALUES (${newCols.map(() => "?").join(", ")})`;

    const stmt = db.prepare(insertSQL);
    db.exec("BEGIN TRANSACTION");

    for (const row of rows) {
      let values = [];
      for (let col of newCols) {
        if (col.endsWith("_date") || col.endsWith("_time")) {
          let originalCol = col.replace(/_(date|time)$/, "");
          if (row[originalCol]) {
            // Adjusted to support both formats
            let regexDateTime = /^(?:(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})) (\d{2}:\d{2})(?::\d{2})?$/;
            let matches = row[originalCol].match(regexDateTime);
            if (matches) {
              let datePart = matches[1] || matches[2]; // YYYY-MM-DD or DD-MM-YYYY
              let timePart = matches[3];
              // For Date Formatting need to swap if from DD-MM-YYYY to YYYY-MM-DD
              if (matches[2]) {
                const [day, month, year] = datePart.split('-');
                datePart = `${year}-${month}-${day}`; // convert to YYYY-MM-DD
              }

              if (col.endsWith("_date")) {
                values.push(datePart);
              } else if (col.endsWith("_time")) {
                values.push(timePart);
              }
            } else {
              console.warn(`Invalid date format for column: ${originalCol}, Value: ${row[originalCol]}`);
              values.push(null); // Handle as necessary
            }
          } else {
            values.push(null);
          }
        } else {
          values.push(row[col] instanceof Date ? row[col].toISOString() : row[col]);
        }
      }
      stmt.bind(values).stepReset();
    }

    db.exec("COMMIT");
    stmt.finalize();

    notify("success", "Imported", `Imported table: ${tableName}`);
  }
}



// ------------------ Handle File Selection ------------------
$upload.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  for (let file of files) {
    await DB.upload(file);
  }
  drawTables();
});

// ------------------ Draw Tables & Column UI ------------------
async function drawTables() {
  const schema = DB.schema();
  if (!schema.length) {
    render(html`<p>No tables available.</p>`, $tablesContainer);
    return;
  }
  const content = html`
      <div class="accordion narrative mx-auto d-none" id="table-accordion">
        ${schema.map(({ name, sql, columns }) => {
    return html`
            <div class="accordion-item my-2">
              <h2 class="accordion-header">
                <button
                  class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-${name}"
                  aria-expanded="false"
                  aria-controls="collapse-${name}"
                >
                  ${name}
                </button>
              </h2>
              <div
                id="collapse-${name}"
                class="accordion-collapse collapse"
                data-bs-parent="#table-accordion"
              >
                <div class="accordion-body">
                  <pre style="white-space: pre-wrap">${sql}</pre>
                  <!-- Table of columns -->
                  <form class="row g-3" data-table="${name}">
                    <table class="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Column Name</th>
                          <th>Type</th>
                          <th>Not Null</th>
                          <th>Default</th>
                          <th>Primary Key</th>
                          <th>Method (LLM or SQL)</th>
                          <th>Prompt</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${columns.map((col) => {
      return html`
                           <tr>
                             <td><input type="checkbox" class="form-check-input batch-select" name="batch-${col.name}"></td>
                             <td>${col.name}</td>
                             <td>${col.type}</td>
                             <td>${col.notnull ? "Yes" : "No"}</td>
                             <td>${col.dflt_value ?? "NULL"}</td>
                             <td>${col.pk ? "Yes" : "No"}</td>
                             <td>
                               <select class="form-select" name="method-${col.name}">
                                 <option value="">(none)</option>
                                  <option value="SQL">SQL</option>
                                  <option value="LLM">LLM</option>
                                </select>
                              </td>
                              <td>
                                <input type="hidden" name="prompt-${col.name}" value="" />
                                <button
                                  type="button"
                                  class="btn-plain edit-prompt"
                                  data-table="${name}"
                                  data-col="${col.name}"
                                  title="Edit Prompt"
                                >
                                  <i class="bi bi-pencil"></i>
                                </button>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  class="btn-plain update-column"
                                  data-col="${col.name}"
                                  title="Update"
                                >
                                  <i class="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  type="button"
                                  class="btn-plain remove-column"
                                  data-col="${col.name}"
                                  title="Remove"
                                >
                                  <i class="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          `;
    })}
                        <!-- Row to add a new column -->
                        <tr>
                          <td>
                            <input
                              type="text"
                              class="form-control"
                              placeholder="New Col Name"
                              name="new-col-name"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              class="form-control"
                              placeholder="TEXT"
                              name="new-col-type"
                            />
                          </td>
                          <td colspan="1"></td>
                          <td colspan="1"></td>
                          <td colspan="1"></td>
                          <td>
                            <select class="form-select" name="new-col-method">
                              <option value="">(none)</option>
                              <option value="SQL">SQL</option>
                              <option value="LLM">LLM</option>
                            </select>
                          </td>
                          <td>
                            <input type="hidden" name="new-col-prompt" value="" />
                            <button
                              type="button"
                              class="btn-plain edit-prompt"
                              data-table="${name}"
                              data-col="new-col"
                              data-new="true"
                              title="Edit Prompt"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              class="btn-plain add-column"
                              title="Add"
                            >
                              <i class="bi bi-plus-circle"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </form>
                </div>
              </div>
            </div>
          `;
  })}
      </div>
      <!-- Query form -->
      <form class="mt-4 narrative mx-auto" id="question-form">
        <div class="mb-3 d-none">
          <label for="context" class="form-label fw-bold">
            Provide context about your dataset:
          </label>
          <textarea class="form-control" name="context" id="context" rows="3">
  ${DB.context}</textarea>
        </div>
        <div class="mb-3">
          <label for="query" class="form-label fw-bold">
            Ask a question about your data:
          </label>
          <textarea class="form-control" name="query" id="query" rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
        <div class="text-center my-3">
        <button id="create-dashboard-button" type="button" class="btn btn-success">Create Dashboard</button>
      </div>
      </form>
    `;
  render(content, $tablesContainer);
  // Attach events for column update/remove/add and prompt editing.
  const $forms = $tablesContainer.querySelectorAll("form");
  $forms.forEach(($form) => {
    if ($form.id === "question-form") {
      $form.addEventListener("submit", onQuerySubmit);
    } else {
      $form.addEventListener("click", async (e) => {
        const tableName = $form.dataset.table;
        const $btn = e.target.closest("button");
        if (!$btn) return;
        if ($btn.classList.contains("update-column")) {
          const colName = $btn.dataset.col;
          const methodSelect = $form.querySelector(`[name="method-${colName}"]`);
          const promptInput = $form.querySelector(`[name="prompt-${colName}"]`);
          await updateColumn(tableName, colName, methodSelect.value, promptInput.value);
          drawTables();
        } else if ($btn.classList.contains("remove-column")) {
          const colName = $btn.dataset.col;
          await removeColumn(tableName, colName);
          drawTables();
        } else if ($btn.classList.contains("add-column")) {
          const colName = $form.querySelector("[name='new-col-name']").value.trim();
          const colType = $form.querySelector("[name='new-col-type']").value.trim() || "TEXT";
          const method = $form.querySelector("[name='new-col-method']").value;
          const promptInput = $form.querySelector("[name='new-col-prompt']");
          const prompt = promptInput ? promptInput.value : "";
          if (colName) {
            await addColumn(tableName, colName, colType, method, prompt);
            drawTables();
          }
        }
      });
    }
  });
}

// ------------------ Query Form Submission ------------------
async function onQuerySubmit(e) {
  e.preventDefault();
  // showGlobalLoading();
  try {
    const formData = new FormData(e.target);
    const query = formData.get("query");
    DB.context = formData.get("context") || "";
    render(loading, $sql);
    render("", $result);

    // Use LLM to generate SQL for the main query.
    const result = await llm({
      system: `You are an expert SQLite query writer. The user has a SQLite dataset.
  
  ${DB.context}
  
  The schema is:
  
  ${DB.schema().map(({ sql }) => sql).join("\n\n")}
  
  Answer the user's question by describing steps, then output final SQL code (SQLite).`,
      user: query,
    });
    render(html`${unsafeHTML(marked.parse(result))}`, $sql);

    const sqlCode = result.match(/```.*?\n([\s\S]*?)```/);
    const extractedSQL = sqlCode ? sqlCode[1] : result;
    queryHistory.push("Main Query:\n" + extractedSQL);
    try {
      const rows = db.exec(extractedSQL, { rowMode: "object" });
      if (rows.length > 0) {
        latestQueryResult = rows;
        // Render results table, Summary and Visualizations sections
        render(html`
            <details>
              <summary style="cursor: pointer; font-weight: bold;">View Query Results</summary>
              <div style="padding: 10px;">
                ${renderTable(rows.slice(0, 100))}
              </div>
             </details>
            <div class="accordion mt-3" id="resultAccordion">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#summaryCollapse">
                    Summary
                  </button>
                </h2>
                <div id="summaryCollapse" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <button id="download-csv" class="btn-plain">
                      <i class="bi bi-filetype-csv"></i> Download CSV
                    </button>
                    <button id="download-db" class="btn-plain">
                      <i class="bi bi-download"></i> Download DB
                    </button>
                    <div class="mt-2">
                      <details>
                        <summary>Query Details</summary>
                        <pre style="white-space: pre-wrap;">${queryHistory.join("\n\n")}</pre>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item d-none">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#visualizationCollapse">
                    Visualizations
                  </button>
                </h2>
                <div id="visualizationCollapse" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <button id="suggest-visualizations" class="btn-plain">
                      Suggest Visualizations
                    </button>
                    <div id="visualization-suggestions"></div>
                    <div id="visualization-output"></div>
                  </div>
                </div>
              </div>
            </div>
          `, $result);
        document.getElementById("download-csv").addEventListener("click", () => {
          download(dsvFormat(",").format(latestQueryResult), "datachat.csv", "text/csv");
        });
        document.getElementById("download-db").addEventListener("click", downloadDB);
        document.getElementById("suggest-visualizations").addEventListener("click", suggestVisualizations);
      } else {
        render(html`<p>No results found.</p>`, $result);
      }
    } catch (err) {
      render(html`<div class="alert alert-danger">${err.message}</div>`, $result);
    }
  } finally {
    hideGlobalLoading();
  }
}

$tablesContainer.addEventListener("click", async (e) => {
  // Handle "Create Dashboard" button click
  const $createDashboardButton = e.target.closest("#create-dashboard-button");

  if ($createDashboardButton) {
    $createDashboardButton.disabled = true;
    await createDashboard();
  }
  $createDashboardButton.disabled = false;
});

async function llm({ system, user, schema }) {
  const response = await fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}:datachat` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      ...(schema ? { response_format: { type: "json_schema", json_schema: { name: "response", strict: true, schema } } } : {}),
    }),
  }).then((r) => r.json());
  if (response.error) return response;
  const content = response.choices?.[0]?.message?.content;
  try {
    return schema ? JSON.parse(content) : content;
  } catch (e) {
    return { error: e };
  }
}

async function createDashboard() {
  console.log("Creating dashboard...");
  const schema = DB.schema();
  if (!schema || schema.length === 0) {
    notify("warning", "No Data", "Please upload a CSV or SQLite database first.");
    return;
  }

  render(html`<div class="text-center my-3">${loading}</div>`, $sql); // Use $sql to display loading
  render(html``, $result); // Clear the result area

  const systemPrompt = `You are a helpful assistant that generates a dashboard configuration for a SQLite database.  Given the database schema, you will generate a JSON object describing a dashboard with multiple charts.
  
    The JSON object should have the following structure:
  
    \`\`\`json
    {
      "dashboardTitle": "Dashboard Title",
      "description": "Overall description of the dashboard",
      "charts": [
        {
          "title": "Chart Title",
          "description": "Description of the chart and what it visualizes",
          "chartType": "bar" or "line" or "pie" or "bubble" or "doughnut" or "polarArea",
          "sqlQuery": "SELECT ... FROM ...",
          "xLabel": "Label for the X-axis",
          "yLabel": "Label for the Y-axis"
        },
        // ... more charts
      ]
    }
    \`\`\`
  
    *   \`dashboardTitle\`: A concise title for the entire dashboard.
    *   \`description\`: A brief overview of the dashboard's purpose and the data it presents.
    *   \`charts\`: An array of chart objects.
        *   \`title\`: A descriptive title for the chart.
        *   \`description\`: A short explanation of what the chart shows.
        *   \`chartType\`: The type of chart to use (e.g., "bar", "line", "pie"). Choose the most appropriate chart type for the data.
        *   \`sqlQuery\`: The SQL query to fetch the data for the chart.  Use SQLite syntax.  The query should select the necessary data for the chart.
        *   \`xAxisLabel\`: Label for the X-axis.
        *   \`yAxisLabel\`: Label for the Y-axis.
  
    Consider the relationships between tables when generating queries.  Generate 6-7 diverse and useful charts.
    `;

  const userPrompt = `Here is the SQLite database schema:
    ${DB.schema()
      .map(({ sql }) => sql)
      .join("\n\n")}
  
    Context: ${DB.context}
    `;

  const dashboardResponse = await llm({
    system: systemPrompt,
    user: userPrompt,

    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        dashboardTitle: { type: "string", description: "Title of the dashboard", additionalProperties: false },
        description: { type: "string", description: "Description of the dashboard", additionalProperties: false },
        charts: {
          type: "array",
          additionalProperties: false,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string", description: "Title of the chart", additionalProperties: false },
              description: { type: "string", description: "Description of the chart", additionalProperties: false },
              chartType: {
                type: "string",
                enum: ["bar", "line", "pie", "scatter", "doughnut", "radar", "polarArea"],
                description: "Type of chart",
                additionalProperties: false,
              },
              sqlQuery: { type: "string", description: "SQL query to get the chart data", additionalProperties: false },
              xAxisLabel: { type: "string", description: "Label for the X-axis", additionalProperties: false },
              yAxisLabel: { type: "string", description: "Label for the Y-axis", additionalProperties: false },
            },
            required: ["title", "description", "chartType", "sqlQuery", "xAxisLabel", "yAxisLabel"],
          },
          description: "Array of charts to display",
        },
      },
      required: ["dashboardTitle", "description", "charts"],
    },
  });

  if (dashboardResponse.error) {
    console.error("Dashboard generation error:", dashboardResponse.error);
    notify("danger", "Dashboard Generation Error", JSON.stringify(dashboardResponse.error));
    render(html``, $sql);
    return;
  }


  const dashboardConfig = dashboardResponse;
  // console.log("Dashboard Configuration:", dashboardResponse);
  // --------------------------------------------------------------------
  // Second LLM call to generate chart code
  await generateAndRenderCharts(dashboardConfig);
    render(html``, $sql); // Clear loading
}

async function generateAndRenderCharts(dashboardConfig) {
  const chartCodePromises = dashboardConfig.charts.map(async (chart, index) => {

    const systemPrompt = `You are an expert Chart.js code generator.  Given a SQL query and chart details, generate the JavaScript code to create a Chart.js chart.
  
      The data from the SQL query will be available as a JavaScript array of objects named \`data\`.  You do NOT need to execute the SQL query.  Assume the data is already available in the \`data\` variable.
  
      Generate the chart code inside a \`\`\`js code fence.  The code should create a Chart.js chart and render it inside a <canvas> element with the ID "chart-${index}".
  
      Here's the basic structure:
  
      \`\`\`js
      new Chart(document.getElementById("chart-${index}"), {
        type: 'bar', // or 'line', 'pie', etc.
        data: {
          labels: [], // X-axis labels
          datasets: [{
            label: '', // Dataset label
            data: [], // Y-axis data
            backgroundColor: [], // Colors
            borderColor: [], // Border colors
            borderWidth: 1
          }]
        },
        options: {
          // Chart options 
        }
      });
      \`\`\`
  
      Use the chart type, labels, datasets, and options to create a visually appealing and informative chart. Make sure to use the xLabel and yLabel in the options. 
      *Special Note - Do not declare data response since it causes SyntaxError: Identifier 'data' has already been declared.
      `;

    const userPrompt = `Here are the chart details:
      Chart Title: ${chart.title}
      Description: ${chart.description}
      Chart Type: ${chart.chartType}
      SQL Query: ${chart.sqlQuery}
      X-Axis Label: ${chart.xAxisLabel}
      Y-Axis Label: ${chart.yAxisLabel}
      `;

    const chartCodeResponse = await llm({
      system: systemPrompt,
      user: userPrompt,
    });
    // console.log(chartCodeResponse);
    if (chartCodeResponse.error) {
      console.error(`Chart code generation error for chart "${chart.title}":`, chartCodeResponse.error);
      notify("danger", `Chart Generation Error for "${chart.title}"`, JSON.stringify(chartCodeResponse.error));
      return null;
    }

    const code = chartCodeResponse.match(/```js\n(.*?)\n```/s)?.[1];
    if (!code) {
      console.error(`Could not extract chart code for chart "${chart.title}"`);
      notify("danger", `Chart Generation Error for "${chart.title}"`, "Could not generate chart code");
      return null;
    }

    return { index, code, chart };
  });

  const chartCodeResults = await Promise.all(chartCodePromises);

  renderDashboard(dashboardConfig, chartCodeResults);
}

function renderDashboard(dashboardConfig, chartCodeResults) {
  // console.log(dashboardConfig, chartCodeResults);
  const dashboardHtml = html`
      <div class="container-fluid">
        <h1 class="mt-4 mb-3">${dashboardConfig.dashboardTitle}</h1>
        <p class="lead">${dashboardConfig.description}</p>
        <div class="grid-stack">
                ${chartCodeResults.map((result, i) => {
    if (!result) return html`<div class="grid-stack-item">Error generating chart</div>`;
    const { index, chart } = result;

    return html`
                        <div class="grid-stack-item" gs-w="4" gs-h="3" gs-min-w="3" gs-min-h="2">
                            <div class="card w-100 shadow">
                                <div class="card-body">
                                    <h5 class="card-title">${chart.title}</h5>
                                    <p class="card-text">${chart.description}</p>
                                    <canvas id="chart-${index}" class="chart-expandable"></canvas>
                                </div>
                            </div>
                        </div>
              ${i % 3 === 2 ? '</div><div class="row">' : ''}
            `;
  })}
        </div>
      </div>
    `;

  render(dashboardHtml, $result);

  // Initialize Gridstack.js
  const grid = GridStack.init({
    cellHeight: 150,   // Default height per grid row
    float: true,       // Allow free movement
    animate: true      // Smooth transitions
  });



  chartCodeResults.forEach(async (result) => {
    if (!result) return;
    const { index, code, chart } = result;

    try {
      // console.log(chart.sqlQuery);
      const data = db.exec(chart.sqlQuery, { rowMode: "object" });

      // Generate Chart
      const drawChart = new Function("Chart", "data", code);
      drawChart(Chart, data);
    } catch (error) {
      console.error(`Failed to draw chart "${chart.title}":`, error);
      notify("danger", `Chart Rendering Error for "${chart.title}"`, `Failed to draw chart: ${error.message}`);
    }
  });
  // Enable full-screen charts on click
  document.querySelectorAll(".chart-expandable").forEach(canvas => {
    canvas.addEventListener("click", () => expandChart(canvas));
  });
}

function expandChart(canvas) {
  // Create modal container
  const card = canvas.closest('.card');
  const title = card.querySelector('.card-title').textContent;
  const description = card.querySelector('.card-text').textContent;

  const headerContent = document.createElement('div');
  headerContent.style.cssText = `
    margin-bottom: 20px;
    padding-right: 40px;
  `;
  
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin: 0 0 10px 0;
    color: #333;
  `;

  const descriptionElement = document.createElement('p');
  descriptionElement.textContent = description;
  descriptionElement.style.cssText = `
    margin: 0;
    color: #666;
    font-size: 14px;
  `;

  headerContent.appendChild(titleElement);
  headerContent.appendChild(descriptionElement);

  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-overlay';
  modalContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  `;

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    position: relative;
    width: 90%;
    height: 90%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    margin-top:3rem
  `;

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.className = 'modal-close';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
    padding: 5px 10px;
    color: #333;
    z-index: 1;
  `;

  // Create chart container
  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    flex: 1;
    position: relative;
    overflow: hidden;
    width: 100%;
  `;

  // Create new canvas for the modal
  const modalCanvas = document.createElement('canvas');
  modalCanvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  `;

  // Copy the chart to the new canvas
  const originalChart = Chart.getChart(canvas);
  if (originalChart) {
    new Chart(modalCanvas, {
      type: originalChart.config.type,
      data: originalChart.config.data,
      options: {
        ...originalChart.config.options,
        maintainAspectRatio: false,
        responsive: true
      }
    });
  }

  chartContainer.appendChild(modalCanvas);
  modalContent.appendChild(closeButton);
  modalContent.appendChild(headerContent);
  modalContent.appendChild(chartContainer);
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);

  // Handle closing
  const closeModal = () => {
    document.body.removeChild(modalContainer);
  };

  closeButton.addEventListener('click', closeModal);
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
      closeModal();
    }
  });

  // Handle ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// ------------------ Column Operations ------------------
async function addColumn(table, colName, colType, method, prompt, refCols) {
  try {
    const alterSQL = `ALTER TABLE [${table}] ADD COLUMN [${colName}] ${colType}`;
    db.exec(alterSQL);
    queryHistory.push(alterSQL);
  } catch (err) {
    notify("danger", "Add Column Error", err.message);
    return;
  }
  if (!method) return;
  await updateColumn(table, colName, method, prompt, refCols);

}

async function removeColumn(table, colName) {
  try {
    const dropSQL = `ALTER TABLE [${table}] DROP COLUMN [${colName}]`;
    db.exec(dropSQL);
    queryHistory.push(dropSQL);
    notify("success", "Removed Column", `Column [${colName}] removed.`);
  } catch (err) {
    notify("danger", "Remove Column Error", "SQLite version may not support DROP COLUMN.\n" + err.message);
  }
}

async function updateColumn(table, colNames, method, prompt, refCols) {
  if (!method || !prompt) {
    notify("warning", "No Method/Prompt", "Method or prompt is empty");
    return;
  }

  if (method === "SQL") {
    const msg = await llm({
      system: `You are an expert at writing SQLite queries.
The user has asked to update column [${colName}] in table [${table}].
They have provided a 'prompt' describing how to fill that column:
"${prompt}"
The current schema is:
${DB.schema().map(({ sql }) => sql).join("\n\n")}
Write a single SQLite UPDATE statement to fill or transform [${colName}] for all rows. Use valid SQLite syntax. No extra commentary—only code.`,
      user: "",
    });
    const sqlCode = msg.match(/```.*?\n([\s\S]*?)```/);
    const extractedSQL = sqlCode ? sqlCode[1] : msg;
    try {
      db.exec(extractedSQL);
      queryHistory.push(extractedSQL);
      notify("success", "SQL Update", `Updated column [${colName}] in [${table}].`);
    } catch (err) {
      notify("danger", "SQL Update Error", err.message);
    }
  } else {


    try {
      const data = db.exec(`SELECT rowid, * FROM [${table}]`, { rowMode: "object" });
      if (!data.length) {
        notify("warning", "No data", "Table is empty.");
        return;
      }
      const columns = Object.keys(data[0]).filter((c) => c !== colName && c !== "rowid");
      const batchSize = 100;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        try {
          const commentField = columns.find(c =>
            c.toLowerCase().includes('comment') ||
            c.toLowerCase().includes('text') ||
            c.toLowerCase().includes('content') ||
            c.toLowerCase().includes('message')
          );

          const batchData = batch.map(row => {
            let rowData;
            if (commentField) {
              const commentData = { [commentField]: row[commentField] };
              const otherData = Object.fromEntries(
                columns
                  .filter(c => c !== commentField)
                  .map(c => [c, row[c]])
              );
              rowData = { rowid: row.rowid, ...commentData, ...otherData };
            } else {
              rowData = {
                rowid: row.rowid,
                ...Object.fromEntries(columns.map(c => [c, row[c]]))
              };
            }
            return rowData;
          });

          const batchResponse = await llm({
            system: `You are given the user prompt: "${prompt}"
I'm sending you a batch of ${batch.length} rows to process at once.
For EACH row, analyze the data and return the value for column [${colName}].

The data for each row is provided below. Each row has a rowid field that you must include in your response.
${JSON.stringify(batchData, null, 2)}

Return your results in this exact JSON format:
[
{"rowid": 1, "value": "your analysis result for row 1"},
{"rowid": 2, "value": "your analysis result for row 2"},
...
]
IMPORTANT: Return ONLY valid JSON. No other text or explanation.`,
            user: "",
          })
            .then(resp => {
              const jsonMatch = resp.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, resp];
              const jsonText = jsonMatch[1].trim();
              try {
                return JSON.parse(jsonText);
              } catch (e) {
                console.error("Failed to parse LLM response as JSON:", jsonText);
                throw new Error("Invalid JSON response from LLM");
              }
            })
            .catch(err => {
              console.error(`LLM batch error:`, err);
              throw err;
            });

          if (!Array.isArray(batchResponse)) {
            throw new Error("LLM did not return an array");
          }
          db.exec("BEGIN TRANSACTION");

          const responseMap = new Map(
            batchResponse.map(item => [item.rowid, item.value])
          );

          for (const row of batch) {
            const newValue = responseMap.get(row.rowid);

            if (newValue === undefined) continue;

            const stmt = db.prepare(`UPDATE [${table}] SET [${colName}]=? WHERE rowid=?`);
            stmt.bind([newValue, row.rowid]).step();
            stmt.finalize();
          }

          db.exec("COMMIT");

        } catch (err) {
          notify("danger", "Processing Error", `Error in batch ${i}-${i + batchSize}: ${err.message}`);

          try { db.exec("COMMIT"); } catch (e) { }
        }
      }
      queryHistory.push(`LLM update applied to column [${colName}] in table [${table}].`);
    } catch (err) {
      try {
        db.exec("ROLLBACK");
      } catch (_) { }
      notify("danger", "LLM Update Error", err.message);
    }
  }
}

// ------------------ Batch Column Update ------------------
// async function updateMultipleColumns(table, columnDefinitions) {
//   try {
//     // Get all data at once to avoid multiple queries
//     const data = db.exec(`SELECT rowid, * FROM [${table}]`, { rowMode: "object" });
//     if (!data.length) {
//       notify("warning", "No data", "Table is empty.");
//       return;
//     }
//     // Optimized batch processing
//     const batchSize = Math.min(100, Math.max(5, 5 * Math.ceil(data.length / 250)));
//     const columns = Object.keys(data[0]).filter(c => c !== "rowid");
//     const commentField = columns.find(c =>
//       c.toLowerCase().includes('comment') ||
//       c.toLowerCase().includes('text') ||
//       c.toLowerCase().includes('content') ||
//       c.toLowerCase().includes('message')
//     );

//     // Prepare all column updates in a single statement
//     const updateStmt = db.prepare(
//       `UPDATE [${table}] SET ${columnDefinitions.map(c => `[${c.name}]=?`).join(', ')} WHERE rowid=?`
//     );
//     // Process batches concurrently
//     const batchPromises = [];
//     for (let i = 0; i < data.length; i += batchSize) {
//       const batch = data.slice(i, i + batchSize);
      
//       batchPromises.push((async () => {
//         // Prepare batch data more efficiently
//         const batchData = batch.map(row => {
//           const rowData = { rowid: row.rowid };
//           if (commentField) rowData[commentField] = row[commentField];
//           columns.forEach(c => { if (c !== commentField) rowData[c] = row[c]; });
//           return rowData;
//         });
//         // Get LLM response with error handling
//         const batchResponse = await getLLMResponse(columnDefinitions, batchData);
//         if (!batchResponse) return;

//         try {
//           // Prepare bulk values
//           const bulkValues = batchResponse.map(row => {
//               const rowValues = columnDefinitions.map(c => {
//                   let value = row.values[c.name];
//                   return value !== undefined ? (typeof value === "object" ? JSON.stringify(value) : value) : null;
//               });
//               rowValues.push(row.rowid);
//               return rowValues;
//           });
      
//           console.log("Bulk Values before transaction:", bulkValues);
      
//           // Execute in transaction
//           db.exec("BEGIN TRANSACTION");
//           try {
//               bulkValues.forEach(values => {
//                   console.log("Binding values:", values);
//                   updateStmt.bind(values).stepReset();
//               });

//               db.exec("COMMIT");
//           } catch (err) {
//               db.exec("ROLLBACK");
//               console.error(`Error during batch update:`, err);
//               notify("warning", "Batch Failed", "Rolling back transaction");
//           }

      
//           // Update progress
//         } catch (err) {
//           console.error(` Batch ${i}-${i + batchSize} failed:`, err);
//           notify("warning", "Batch Failed", `Batch ${i + batchSize} failed, continuing with next batch`);
//         }
      
//       })());
//     }

//     // Wait for all batches to complete
//     await Promise.all(batchPromises);
//     updateStmt.finalize();
//     notify("success", "Update Complete", `Updated ${columnDefinitions.length} columns in ${data.length} rows`);
//   } catch (err) {
//     console.error("Update Error:", err);
//     notify("danger", "Update Error", err.message);
//   }
// }

function updateProgressBar(percentage) {
  const progressBar = document.getElementById('myProgressBar');
  progressBar.style.width = `${percentage}%`;
  
  progressBar.setAttribute('aria-valuenow', percentage);
  
  progressBar.textContent = `${percentage}%`;
}

async function updateMultipleColumns(table, columnDefinitions) {
  const progressBar = document.getElementById('myProgressBar');
  const progressBarDiv = document.getElementById('myProgressBarDiv');
  const progressText = document.getElementById('progressText');
  
  try {
    progressBarDiv.style.display = 'block'; // Make progress bar visible
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0); // Add aria-valuenow for accessibility
    progressText.textContent = 'Analyzing the contents...';

    // Get all data at once to avoid multiple queries
    const data = db.exec(`SELECT rowid, * FROM [${table}]`, { rowMode: "object" });
    if (!data.length) {
      notify("warning", "No data", "Table is empty.");
      progressBarDiv.style.display = 'none'; 
      return;
    }

    const batchSize = Math.min(100, Math.max(5, 5 * Math.ceil(data.length / 250)));
    const columns = Object.keys(data[0]).filter(c => c !== "rowid");
    const commentField = columns.find(c =>
      c.toLowerCase().includes('comment') ||
      c.toLowerCase().includes('text') ||
      c.toLowerCase().includes('content') ||
      c.toLowerCase().includes('message')
    );

    const updateStmt = db.prepare(
      `UPDATE [${table}] SET ${columnDefinitions.map(c => `[${c.name}]=?`).join(', ')} WHERE rowid=?`
    );

    const batchPromises = [];
    const totalBatches = Math.ceil(data.length / batchSize);
    let batchesCompleted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      batchPromises.push((async () => {
        const batchData = batch.map(row => {
          const rowData = { rowid: row.rowid };
          if (commentField) rowData[commentField] = row[commentField];
          columns.forEach(c => { if (c !== commentField) rowData[c] = row[c]; });
          return rowData;
        });

        const batchResponse = await getLLMResponse(columnDefinitions, batchData);
        if (!batchResponse) return;

        try {
          const bulkValues = batchResponse.map(row => {
              const rowValues = columnDefinitions.map(c => {
                  let value = row.values[c.name];
                  return value !== undefined ? (typeof value === "object" ? JSON.stringify(value) : value) : null;
              });
              rowValues.push(row.rowid);
              return rowValues;
          });

          // console.log("Bulk Values before transaction:", bulkValues);

          // Execute in transaction
          db.exec("BEGIN TRANSACTION");
          try {
              bulkValues.forEach(values => {
                  // console.log("Binding values:", values);
                  updateStmt.bind(values).stepReset();
              });

              db.exec("COMMIT");
          } catch (err) {
              db.exec("ROLLBACK");
              console.error(`Error during batch update:`, err);
              notify("warning", "Batch Failed", "Rolling back transaction");
          }

        } catch (err) {
          console.error(` Batch ${i}-${i + batchSize} failed:`, err);
          notify("warning", "Batch Failed", `Batch ${i + batchSize} failed, continuing with next batch`);
        } finally {
          batchesCompleted++;
          const progressPercentage = Math.floor((batchesCompleted / totalBatches) * 100);

          updateProgressBar(progressPercentage);
        }

      })());
    }

    await Promise.all(batchPromises);
    updateStmt.finalize();
    notify("success", "Update Complete", `Updated ${columnDefinitions.length} columns in ${data.length} rows`);

    updateProgressBar(100); 
    progressText.textContent = 'Analysis Complete!!';
    setTimeout(() => { progressBarDiv.style.display = 'none'; }, 500); 

  } catch (err) {
    console.error("Update Error:", err);
    notify("danger", "Update Error", err.message);
    progressBarDiv.style.display = 'none'; 
  }
}


async function getLLMResponse(columnDefinitions, batchData) {
  try {
    const columnPrompts = columnDefinitions.map(col => ({
      name: col.name,
      prompt: col.prompt
    }));

    const response = await llm({
      system: `You are processing social media comments to extract multiple insights at once.
For EACH row, analyze the comment and return values for all requested columns.

Column definitions:
${JSON.stringify(columnPrompts, null, 2)}

Return your results in this exact JSON format:
[
  {
    "rowid": 1,
    "values": {
      "column1": "value1",
      "column2": "value2",
      ...
    }
  },
  ...
]

IMPORTANT: Return ONLY valid JSON. No other text or explanation.`,
      user: JSON.stringify(batchData, null, 2)
    });

    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
    const jsonText = jsonMatch[1].trim();
    const parsed = JSON.parse(jsonText);
    
    if (!Array.isArray(parsed)) {
      throw new Error("LLM did not return an array");
    }
    return parsed;
  } catch (err) {
    console.error("LLM Error:", err);
    notify("warning", "LLM Error", `Failed to process batch: ${err.message}`);
    return null;
  }
}



// ------------------ Visualization Functions ------------------
async function suggestVisualizations() {
  showGlobalLoading();
  try {
    if (!latestQueryResult.length) {
      notify("warning", "No Data", "No query result available to base suggestions on.");
      return;
    }
    // Create metadata from latestQueryResult
    const metadata = {
      columns: Object.keys(latestQueryResult[0] || {}),
      rowCount: latestQueryResult.length,
      sampleData: latestQueryResult.slice(0, 3)
    };
    const prompt = `You are an expert data visualization advisor. Given the following data metadata:
  Columns: ${JSON.stringify(metadata.columns)}
  Row Count: ${metadata.rowCount}
  Sample Data: ${JSON.stringify(metadata.sampleData)}
  Please suggest several visualization ideas. Return a JSON array (no extra text) where each element is an object with the following keys:
  - chartName: a suggested chart name,
  - chartPrompt: a prompt for creating the chart using D3.js,
  - fields: the fields that should be used,
  - chartType: the type of chart (e.g. scatter, bar, line, etc).`;

    const response = await llm({ system: prompt, user: "" });

    try {
      visualizationSuggestions = JSON.parse(response);
    } catch (e) {
      const match = response.match(/```(?:json)?\n([\s\S]*?)```/);
      if (match) {
        visualizationSuggestions = JSON.parse(match[1]);
      } else {
        notify("danger", "Visualization Suggestion Error", "Could not parse visualization suggestions.");
        return;
      }
    }
    renderVisualizationSuggestions();
  } finally {
    hideGlobalLoading();
  }
}

function renderVisualizationSuggestions() {
  if (!visualizationSuggestions.length) return;
  const suggestionTable = html`
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Chart Name</th>
            <th>Chart Prompt</th>
            <th>Fields</th>
            <th>Chart Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${visualizationSuggestions.map((suggestion, index) => html`
            <tr>
              <td><input type="text" class="form-control" value="${suggestion.chartName}" data-index="${index}" data-key="chartName" /></td>
              <td><input type="text" class="form-control" value="${suggestion.chartPrompt}" data-index="${index}" data-key="chartPrompt" /></td>
              <td><input type="text" class="form-control" value="${suggestion.fields}" data-index="${index}" data-key="fields" /></td>
              <td><input type="text" class="form-control" value="${suggestion.chartType}" data-index="${index}" data-key="chartType" /></td>
              <td>
                <button class="btn-plain" onclick="generateGraph(${index})">
                  Generate Graph
                </button>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  render(suggestionTable, document.getElementById("visualization-suggestions"));
  document.querySelectorAll("#visualization-suggestions input").forEach(input => {
    input.addEventListener("change", (e) => {
      const idx = e.target.getAttribute("data-index");
      const key = e.target.getAttribute("data-key");
      visualizationSuggestions[idx][key] = e.target.value;
    });
  });
}

async function generateGraph(index) {
  showGlobalLoading();
  try {
    const suggestion = visualizationSuggestions[index];
    if (!suggestion) return;
    const containerId = `d3-chart-${index}`;  // Changed to d3-chart
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.style.width = "1000px"; // Set width
      container.style.height = "480px"; // Set height
      document.getElementById("visualization-output").appendChild(container);
    }
    // Show loading spinner
    container.innerHTML = `<div class="text-center my-3">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
      </div>`;

    const system = `You are an expert D3.js code generator. Given a SQL query and chart details, generate the JavaScript code to create a D3.js chart.
      The data from the SQL query will be available as a JavaScript array of objects named \`data\`. You do NOT need to execute the SQL query. Assume the data is already available in the \`data\` variable.
      
      Using the following suggestion JSON: ${JSON.stringify(suggestion, null, 2)}

      Generate JavaScript code that creates a D3.js chart for the provided data. Render the chart in a div with id "${containerId}".  Include interactive features like tooltips, zooming, or brushing where appropriate for the chart type.

      Generate the chart code inside a \`\`\`js code fence.  The generated D3 chart should fit within a 1000x480 pixel container.  Make sure to handle potential errors gracefully.

      Example (Bar Chart - adapt as needed):
      \`\`\`js
      // Clear any previous content
      d3.select("#${containerId}").selectAll("*").remove();

      const margin = {top: 20, right: 30, bottom: 40, left: 90},
          width = 1000 - margin.left - margin.right,
          height = 480 - margin.top - margin.bottom;

      const svg = d3.select("#${containerId}")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // ... (rest of the D3 code, scales, axes, drawing, tooltips, etc.) ...
      \`\`\`
      `;

    const response = await llm({ system, user: "" });
    const codeMatch = response.match(/```js\n([\s\S]*?)\n```/);

    if (!codeMatch) {
      notify("danger", "Graph Generation Error", "Could not extract code from LLM response.");
      container.innerHTML = "";
      return;
    }
    const code = codeMatch[1];

    try {
      const drawGraph = new Function("data", code);
      container.innerHTML = ""; 
      drawGraph(latestQueryResult);
      notify("success", "Graph Generated", `Graph for "${suggestion.chartName}" generated.`);
    } catch (err) {
      container.innerHTML = "";
      notify("danger", "Graph Execution Error", err.message);
    }
  } finally {
    hideGlobalLoading();
  }
}



function renderTable(data) {
  if (!data.length) return html`<p>No data.</p>`;
  const cols = Object.keys(data[0]);
  return html`
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            ${cols.map((c) => html`<th>${c}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${data.map((row) => html`
            <tr>
              ${cols.map((c) => html`<td>${row[c]}</td>`)}
            </tr>
          `)}
        </tbody>
      </table>
    `;
}

// ------------------ Download DB Function ------------------
function downloadDB() {
  try {
    const data = sqlite3.capi.FS.readFile(defaultDB);
    const blob = new Blob([data.buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = defaultDB;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    notify("danger", "Download DB Error", e.message);
  }
}

// ------------------ Simple Toast ------------------
function notify(cls, title, message) {
  $toast.querySelector(".toast-title").textContent = title;
  console.log(title);
  $toast.querySelector(".toast-body").textContent = message;
  const $toastHeader = $toast.querySelector(".toast-header");
  $toastHeader.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
  $toastHeader.classList.add(`text-bg-${cls}`);
  // toast.show();
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ------------------ Modal for Editing Prompt ------------------
const promptModalHTML = `
  <div class="modal fade" id="promptModal" tabindex="-1" aria-labelledby="promptModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="promptModalLabel">Edit Prompt</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <textarea class="form-control" id="promptModalTextarea" rows="5" placeholder="Enter your prompt here"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-plain" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn-plain" id="promptModalSave">Save</button>
        </div>
      </div>
    </div>
  </div>
  `;
document.body.insertAdjacentHTML("beforeend", promptModalHTML);

document.addEventListener("click", (e) => {
  const target = e.target.closest(".edit-prompt");
  if (target) {
    const table = target.getAttribute("data-table");
    const col = target.getAttribute("data-col");
    const form = target.closest("form");
    let promptInput;
    if (target.getAttribute("data-new") === "true") {
      promptInput = form.querySelector("[name='new-col-prompt']");
    } else {
      promptInput = form.querySelector(`[name="prompt-${col}"]`);
    }
    document.getElementById("promptModalTextarea").value = promptInput.value;
    window.currentPromptInput = promptInput;
    const promptModalElement = document.getElementById("promptModal");
    const promptModalInstance = new bootstrap.Modal(promptModalElement);
    promptModalInstance.show();
  }
});

document.getElementById("promptModalSave").addEventListener("click", () => {
  const newValue = document.getElementById("promptModalTextarea").value;
  if (window.currentPromptInput) {
    window.currentPromptInput.value = newValue;
  }
  const promptModalElement = document.getElementById("promptModal");
  const promptModalInstance = bootstrap.Modal.getInstance(promptModalElement);
  promptModalInstance.hide();
});

window.generateGraph = generateGraph;

// document.getElementById("render-pre-defined-charts").addEventListener("click", renderMultipleD3Charts);
document.getElementById("render-pre-defined-charts").addEventListener("click", function () {
  const startDatePicker = document.getElementById('startDatePicker');
  const endDatePicker = document.getElementById('endDatePicker');
  const startDate = startDatePicker.value;
  const endDate = endDatePicker.value;

  if (startDate && endDate) {
    renderMultipleD3Charts(startDate, endDate);
  } else {
    alert("Please select both start and end dates.");
  }
});


const graphConfigs = [

  {
    sqlQuery: `
          SELECT COUNT(DISTINCT "Post ID") AS total_posts
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate;
      `,
    containerId: 'metric-posts',
    renderFunction: renderMetricCard
  },
  {
    sqlQuery: `
          SELECT COUNT(DISTINCT Author) AS total_users
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate;
      `,
    containerId: 'metric-users',
    renderFunction: renderMetricCard
  },
  {
    sqlQuery: `
          SELECT COUNT(*) AS total_comments
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate;
      `,
    containerId: 'metric-comments',
    renderFunction: renderMetricCard
  },
  {
    sqlQuery: `
          SELECT COUNT(DISTINCT sentiment) AS total_sentiments
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate;
      `,
    containerId: 'metric-sentiments',
    renderFunction: renderMetricCard
  },
  {
    sqlQuery: `
        SELECT
            "platform", "primary_theme", "Time", "comment_id"
        FROM reddit_comments
        WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate;
    `,
    containerId: 'd3-table',
    renderFunction: renderDashboardTable
  },
  {
    sqlQuery: `WITH Timeframes AS (
          SELECT
              DATE("Date") AS comment_date,
              CASE
                  WHEN strftime('%H', "Time") BETWEEN '00' AND '02' THEN '12:00 AM - 3:00 AM'
                  WHEN strftime('%H', "Time") BETWEEN '03' AND '05' THEN '3:00 AM - 6:00 AM'
                  WHEN strftime('%H', "Time") BETWEEN '06' AND '08' THEN '6:00 AM - 9:00 AM'
                  WHEN strftime('%H', "Time") BETWEEN '09' AND '11' THEN '9:00 AM - 12:00 PM'
                  WHEN strftime('%H', "Time") BETWEEN '12' AND '14' THEN '12:00 PM - 3:00 PM'
                  WHEN strftime('%H', "Time") BETWEEN '15' AND '17' THEN '3:00 PM - 6:00 PM'
                  WHEN strftime('%H', "Time") BETWEEN '18' AND '20' THEN '6:00 PM - 9:00 PM'
                  WHEN strftime('%H', "Time") BETWEEN '21' AND '23' THEN '9:00 PM - 12:00 AM'
              END AS timeframe,
              COUNT(*) AS comment_count
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate
          GROUP BY comment_date, timeframe
      ),
      Totals AS (
          SELECT
              comment_date,
              SUM(comment_count) AS total_comments
          FROM Timeframes
          GROUP BY comment_date
      )
      SELECT
          tf.comment_date,
          tf.timeframe,
          tf.comment_count,
          COALESCE(t.total_comments, 0) AS total_comments
      FROM Timeframes tf
      LEFT JOIN Totals t ON tf.comment_date = t.comment_date
      ORDER BY tf.comment_date, tf.timeframe;
      `,
    containerId: 'd3-engagement-chart',
    renderFunction: renderEngagementHeatmap
  },
  {
    sqlQuery: `
          SELECT
              sentiment,
              COUNT(*) AS sentiment_count
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate
          GROUP BY sentiment;
      `,
    containerId: 'd3-sentiment-chart',
    renderFunction: renderSentimentChart
  },
  {
    sqlQuery: `
          SELECT
              "emotion",
              COUNT("Post ID") AS post_count
          FROM reddit_comments
          WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate
          GROUP BY "emotion"
          ORDER BY post_count DESC;
      `,
    containerId: 'd3-emotion-chart',
    renderFunction: renderEmotionChart
  },
  {
    sqlQuery: `
        SELECT
            primary_theme,
            Evolved_narrative,
            COUNT(*) AS count
        FROM reddit_comments
        WHERE DATE("Date") >= $startDate AND DATE("Date") <= $endDate
        GROUP BY primary_theme, Evolved_narrative
        ORDER BY primary_theme, Evolved_narrative;
    `,
    containerId: 'd3-theme-distribution-chart',
    renderFunction: renderThemeDistributionChart
  }
  // Add more graph configurations as needed
];

async function setupDatePickers() {
  const dateRangeQuery = `SELECT MIN(DATE("Date")) as min_date, MAX(DATE("Date")) as max_date FROM reddit_comments;`;
  const dateRangeData = db.exec(dateRangeQuery, { rowMode: "object" });

  let minDate = dateRangeData[0].min_date;
  let maxDate = dateRangeData[0].max_date;

  // Initialize the date pickers
  document.getElementById('startDatePicker').value = minDate;
  document.getElementById('endDatePicker').value = maxDate;


}


async function renderMultipleD3Charts(startDate, endDate) { // Pass startDate and endDate
  const dashboardTab = document.getElementById("Dashboard-tab");
  const elementsToDisplay = dashboardTab.querySelectorAll(".d-none");

  elementsToDisplay.forEach(element => {
    element.classList.remove("d-none");
  });
  showGlobalLoading();
  try {
    for (const config of graphConfigs) {
      await renderChart(config, startDate, endDate); // Pass startDate and endDate to renderChart
    }
  } catch (error) {
    console.error("Error rendering D3.js Charts:", error);
    notify("danger", "D3.js Charts Error", "Error rendering one or more charts.");
  } finally {
    hideGlobalLoading();
  }
}

async function renderChart(config, startDate, endDate) { // Accept startDate and endDate
  const { sqlQuery: baseSqlQuery, containerId, renderFunction } = config;
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.getElementById("reports-output").appendChild(container);
  }

  // Show loading spinner while the data is being fetched
  container.innerHTML = `
    <div class="text-center my-3">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  // Construct the SQL query with date parameters
  const sqlQuery = baseSqlQuery
    .replace('$startDate', `'${startDate}'`)
    .replace('$endDate', `'${endDate}'`);


  const data = await db.exec(sqlQuery, { rowMode: "object" });

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No data available for this chart.</p>";
    return;
  }

  // Call the specific render function for the chart
  await renderFunction(container, data);

  // Make an LLM call to get a summary of the data
  if (renderFunction != renderMetricCard) {
    const summary = await getSummaryFromLLM(data);

    const uniqueId = `summaryAccordion-${Math.random().toString(36).substr(2, 9)}`;

    // Append the collapsible summary below the graph
    container.innerHTML += `
    <div class="accordion mt-3" id="${uniqueId}">
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#summaryContent-${uniqueId}">
            Summary
          </button>
        </h2>
        <div id="summaryContent-${uniqueId}" class="accordion-collapse collapse">
          <div class="accordion-body">
            <p>${marked.parse(summary)}</p>
          </div>
        </div>
      </div>
    </div>
    `;
  }
}

async function getSummaryFromLLM(data) {
  const response = await fetch("https://llmfoundry.straive.com/gemini/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}:my-test-project`
    },
    credentials: "include",
    body: JSON.stringify({
      model: "gemini-2.0-flash-thinking-exp",
      messages: [
        {
          role: "system",
          content: "You are an insightful data analysis assistant. Your task is to provide insights for graphs based on the data provided."
        },
        {
          role: "user",
          content: `Please provide a concise insightful summary of the following data: ${JSON.stringify(data)}`
        }
      ]
    })
  });

  const result = await response.json();

  return result.choices && result.choices[0].message.content || "No summary available.";
}


async function renderEngagementHeatmap(container, data) {
  container.innerHTML = ''; // Clear any previous content

  // Format the data into an array for processing
  const formattedData = [];
  const timeframes = new Set(); // Use Set for efficient unique collection
  const dates = new Set();

  data.forEach(d => {
    timeframes.add(d.timeframe);
    dates.add(d.comment_date);

    formattedData.push({
      group: d.comment_date,  // Date (column)
      variable: d.timeframe,  // Timeframe (row)
      value: d.comment_count  // Comment count (cell value)
    });
  });

  // Convert Sets to sorted arrays
  const sortedTimeframes = Array.from(timeframes).sort();
  const sortedDates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b)); // Sort dates chronologically

  // --- Adjusted Margins ---
  // Increase right margin to accommodate the vertical legend
  const margin = { top: 100, right: 150, bottom: 80, left: 150 };
  const width = Math.max(600, sortedDates.length * 40);
  const height = Math.max(300, sortedTimeframes.length * 30);

  // Append the svg object to the container
  const svg = d3.select(container)
    .append("svg")
    // --- Total SVG dimensions include margins ---
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // --- X Axis (Dates) ---
  const x = d3.scaleBand()
    .range([0, width]) // X scale maps to the inner width
    .domain(sortedDates)
    .padding(0.05);

  svg.append("g")
    .style("font-size", "12px")
    .attr("transform", `translate(0,${height})`) // Position at bottom of heatmap area
    .call(d3.axisBottom(x).tickSize(0))
    .call(g => g.select(".domain").remove())
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

  // --- Y Axis (Timeframes) ---
  const y = d3.scaleBand()
    .range([height, 0]) // Y scale maps to the inner height
    .domain(sortedTimeframes)
    .padding(0.05);

  svg.append("g")
    .style("font-size", "12px")
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove());

  // --- Color Scale ---
  const maxVal = d3.max(formattedData, d => d.value);
  const myColor = d3.scaleSequential()
    .interpolator(d3.interpolateInferno)
    .domain([0, maxVal || 1]); // Use max value, ensure domain is valid

  // --- Text Color Helper ---
  function getTextColorForBackground(bgColor) {
    const color = d3.color(bgColor);
    if (!color) return '#000';
    const { r, g, b } = color;
    const luminance = (0.2126 * r / 255 + 0.7152 * g / 255 + 0.0722 * b / 255);
    return luminance < 0.5 ? "#fff" : "#000";
  }

  // --- Tooltip ---
  const tooltip = d3.select(container)
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 3px 9px rgba(0,0,0,.1)");

  // --- Mouse Events ---
  const mouseover = function(event, d) {
    tooltip.style("opacity", 1);
    d3.select(this)
      .style("stroke", "black")
      .style("stroke-width", 1.5)
      .style("opacity", 1);
  };
  const mousemove = function(event, d) {
    const [pointerX, pointerY] = d3.pointer(event, container);
    tooltip
      .html(`Date: ${d.group}<br>Timeframe: ${d.variable}<br>Comments: ${d.value}`)
      .style("left", (pointerX + 15) + "px")
      .style("top", (pointerY - 30) + "px");
  };
  const mouseleave = function(event, d) {
    tooltip.style("opacity", 0);
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8);
  };

  // --- Heatmap Rectangles ---
  svg.selectAll(".heatmap-rect")
    .data(formattedData)
    .enter()
    .append("rect")
      .attr("class", "heatmap-rect")
      .attr("x", d => x(d.group))
      .attr("y", d => y(d.variable))
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => myColor(d.value))
      .style("stroke", "none")
      .style("opacity", 0.8)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

  // --- Cell Text ---
  svg.selectAll(".heatmap-text")
    .data(formattedData)
    .enter()
    .append("text")
      .attr("class", "heatmap-text")
      .attr("x", d => x(d.group) + x.bandwidth() / 2)
      .attr("y", d => y(d.variable) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", d => getTextColorForBackground(myColor(d.value)))
      .style("font-size", "11px")
      .style("pointer-events", "none")
      .text(d => d.value > 0 ? d.value : "");

  // --- Titles ---
  svg.append("text")
    .attr("x", 0)
    .attr("y", -60)
    .attr("text-anchor", "left")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Engagement Heatmap");

  svg.append("text")
    .attr("x", 0)
    .attr("y", -35)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("fill", "grey")
    .style("max-width", 400)
    .text("Comment count per timeframe by date.");


  const legendWidth = 20; // Width of the legend color bar
  const legendHeight = Math.min(height, 300); // Height of the legend color bar
  const legendPadding = 40; // Space between heatmap and legend


  const legendX = width + legendPadding;
  const legendY = (height - legendHeight) / 2;

  const legendSvg = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // Define the vertical gradient
  const defs = svg.append("defs"); // Ensure defs are appended to the main svg or the translated group
  const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient-vertical")
      // --- Vertical gradient ---
      .attr("x1", "0%")
      .attr("y1", "100%") // Start color at the bottom
      .attr("x2", "0%")
      .attr("y2", "0%");  // End color at the top

  const numStops = 10;
  const domain = myColor.domain();
  linearGradient.selectAll("stop")
      .data(d3.range(numStops).map(i => i / (numStops - 1))) // Generate values from 0 to 1
      .enter().append("stop")
      .attr("offset", d => `${d * 100}%`)
      // Map the 0-1 value back to the color scale's domain to get the color
      .attr("stop-color", d => myColor(domain[0] * (1 - d) + domain[1] * d));


  // Draw the legend rectangle with the vertical gradient
  legendSvg.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#linear-gradient-vertical)"); // Use the vertical gradient ID

  // Create the legend scale (maps data values to vertical position)
  const legendScale = d3.scaleLinear()
    .domain(domain) // Use the color scale's domain [0, maxVal]
    .range([legendHeight, 0]); // Map to the height (bottom to top)

  // Add the legend axis (vertical, positioned to the right of the rect)
  const legendAxis = d3.axisRight(legendScale)
    .ticks(5) // Adjust number of ticks as needed
    .tickSize(6); // Small ticks

  legendSvg.append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(${legendWidth}, 0)`) // Position axis to the right of the rect
      .call(legendAxis)
      .select(".domain").remove(); // Remove the axis line

   // Add legend title
   legendSvg.append("text")
      .attr("x", legendWidth / 2) // Center above the rect
      .attr("y", -10) // Position above the rect
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "grey")
      .text("Comments");
 
}

async function renderSentimentChart(container, data) {
  container.innerHTML = '';

  // Specify the chart's dimensions
  const width = 928;
  const height = Math.min(width, 480);
  const margin = 40;

  // Create the SVG container
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add heading and description
  svg.append("text")
    .attr("x", -width / 2 + 20)  // Adjusted for viewBox
    .attr("y", -height / 2 + 30)
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text("Sentiment Distribution");

  svg.append("text")
    .attr("x", -width / 2 + 20)  // Adjusted for viewBox
    .attr("y", -height / 2 + 60)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("fill", "grey")
    .text("Visualizing sentiment analysis across responses");

  // Create the color scale
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.sentiment))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length));

  // Create the pie layout and arc generator
  const pie = d3.pie()
    .sort(null)
    .value(d => d.sentiment_count);

  const radius = Math.min(width, height) / 2 - margin;

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const labelRadius = radius * 0.8;

  // A separate arc generator for labels
  const arcLabel = d3.arc()
    .innerRadius(labelRadius)
    .outerRadius(labelRadius);

  const arcs = pie(data);

  // Add a sector path for each value
  svg.append("g")
    .attr("stroke", "white")
    .selectAll()
    .data(arcs)
    .join("path")
    .attr("fill", d => color(d.data.sentiment))
    .attr("d", arc)
    .append("title")
    .text(d => `${d.data.sentiment}: ${d.data.sentiment_count.toLocaleString("en-US")}`);

  // Add labels
  svg.append("g")
    .attr("text-anchor", "middle")
    .selectAll()
    .data(arcs)
    .join("text")
    .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
    .call(text => text.append("tspan")
      .attr("y", "-0.4em")
      .attr("font-weight", "bold")
      .text(d => d.data.sentiment))
    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
      .attr("x", 0)
      .attr("y", "0.7em")
      .attr("fill-opacity", 0.7)
      .text(d => d.data.sentiment_count.toLocaleString("en-US")));

  notify("success", "D3.js Chart Rendered", "Sentiment Pie Chart generated.");
}


async function renderMetricCard(container, data) {
  container.innerHTML = ''; // Clear loading spinner

  if (data && data.length > 0) {
    const metricMap = {
      total_posts: "Distinct Posts",
      total_users: "Total Users",
      total_comments: "Total Comments",
      total_sentiments: "Distinct Sentiments",
    };

    const metricKey = Object.keys(data[0]).find(key => metricMap[key] !== undefined);

    if (metricKey) {
      const metricValue = data[0][metricKey];
      const heading = metricMap[metricKey];

      container.innerHTML = `
              <h6 class="metric-heading">${heading}</h6>
              <div class="metric-value">${metricValue}</div>
          `;
    }
  } else {
    container.innerHTML = "<p>No data available for this metric.</p>";
  }
}



async function renderEmotionChart(container, data) {
  return new Promise((resolve) => {
    container.innerHTML = '';

    const margin = { top: 80, right: 30, bottom: 70, left: 60 }; // Increased top margin for heading
    const width = 960 - margin.left - margin.right;
    const height = 480 - margin.top - margin.bottom;

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.emotion))
      .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71']);

    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add heading
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Emotional Distribution in Posts");

    // Add description
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text("Analysis of emotional content across user posts");


    const x = d3.scaleBand()
      .domain(data.map(d => d.emotion))
      .range([0, width])
      .padding(0.2); // Increased padding between bars

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.post_count)])
      .range([height, 0]);

    // --- Axis and Gridlines (Optional but Recommended) ---
    // Add grid lines (optional, but often helpful)
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.1);

    // X-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)"); // Rotate labels for better readability

    // Y-axis
    svg.append("g")
      .call(d3.axisLeft(y));


    // --- Bars with Transition and Event Handling ---
    let transitionCount = 0;
    const totalTransitions = data.length;

    const bars = svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.emotion))
      .attr("width", x.bandwidth())
      .attr("y", height) // Start from bottom
      .attr("height", 0) // Initial height of 0
      .attr("fill", d => colorScale(d.emotion));

    bars.transition() // Add transition
      .duration(800)
      .attr("y", d => y(d.post_count))
      .attr("height", d => height - y(d.post_count))
      .on("end", () => {
        transitionCount++;
        if (transitionCount === totalTransitions) {
          resolve(); // Resolve when all bar transitions are complete
        }
      });

    // Add hover effects *after* the main transition
    bars.on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.7);
    })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1);
      });


    // --- Axis Labels ---

    // Add X axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10) // Adjust position
      .style("font-size", "14px")
      .text("Emotions");

    // Add Y axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -(height / 2))
      .style("font-size", "14px")
      .text("Number of Posts");

    // No need for notify here; resolve() handles completion
  });
}

async function renderThemeDistributionChart(container, data) {
  return new Promise((resolve) => { // Return a Promise
    container.innerHTML = ''; // Clear loading spinner

    const margin = { top: 70, right: 30, bottom: 180, left: 120 }; // Increased top margin for heading
    const width = 960 - margin.left - margin.right;
    const height = 480 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add heading and description
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Theme Distribution Analysis");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "grey")
      .text("Distribution of primary themes and their sub-themes across the dataset");

    // Prepare data for stacked bar chart
    const themes = Array.from(new Set(data.map(d => d.primary_theme)));
    const subThemes = Array.from(new Set(data.map(d => d.sub_theme)));
    const emergingThemes = Array.from(new Set(data.map(d => d.emerging_theme)));

    // Enhanced color palette
    const colorPalette = [
      "#2E86AB", "#A23B72", "#F18F01", "#C73E1D", "#3B1F2B",
      "#4FB286", "#8380B6", "#D62246", "#7CB518", "#2D5362",
      "#FF9B71", "#4F86C6", "#96ADC8", "#D7B377", "#64403E"
    ];

    const color = d3.scaleOrdinal()
      .domain(subThemes)
      .range(colorPalette);

    const x = d3.scaleBand()
      .domain(themes)
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([height, 0]);

    // Add grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.1);

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style("font-size", "12px");

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y))
      .style("font-size", "12px");

    const groupedData = d3.groups(data, d => d.primary_theme);

    const stack = d3.stack()
      .keys(subThemes)
      .value((d, key) => {
        const found = d[1].find(v => v.sub_theme === key);
        return found ? found.count : 0;
      });

    const series = stack(groupedData);

    // Draw the bars with transition
    let tCount = 0; // Counter for completed transitions
    const totalT = series.length * groupedData.length; // Total number of rects

    svg.selectAll(".layer")
      .data(series)
      .enter().append("g")
      .attr("class", "layer")
      .attr("fill", (d, i) => color(i))
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => x(d.data[0]))
      .attr("y", height) // Start from bottom
      .attr("height", 0) // Start with height 0
      .attr("width", x.bandwidth())
      .transition() // Add transition
      // .duration(1000)
      .attr("y", d => y(d[1]))  
      .attr("height", d => y(d[0]) - y(d[1]))
      .on("end", () => {  // Use .on("end", ...)
        tCount++;
        if (tCount === totalT) {
          resolve(); // Resolve the Promise when all transitions are complete
        }
      });


    // Add X axis label
    svg.selectAll(".x-axis text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em")
      .attr("y", 10);

    // Add Y axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -(height / 2))
      .style("font-size", "14px")
      .text("Count");
  });
}



async function renderDashboardTable(container, data) {
  container.innerHTML = ''; // Clear loading spinner

  const table = document.createElement('table');
  table.classList.add('table', 'table-bordered', 'table-striped');

  // Define the relevant columns for the table
  const columns = [
    "platform", "primary_theme", "Time", "comment_id"
  ];

  // Create table headers
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = capitalizeFirstLetter(col);  // Capitalize the first letter of column names
    headerRow.appendChild(th);
  });

  // Create table body
  const tbody = table.createTBody();
  data.forEach(row => {
    const tr = tbody.insertRow();
    columns.forEach(col => {
      const td = tr.insertCell();
      td.textContent = row[col] || ''; // Display cell data or empty string if null
    });
  });

  container.appendChild(table);

  // Initialize DataTables with pagination, filtering, and interactivity
  $(table).DataTable({
    paging: true,            // Enable pagination
    searching: true,         // Enable search/filter functionality
    ordering: true,          // Enable sorting of columns
    lengthChange: true,      // Allow the user to change page length
    info: true,              // Display info about the table (number of records)
    autoWidth: false         // Disable auto-width to improve custom width handling
  });

  notify("success", "Table Rendered", "Post metadata table generated.");
}


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const textarea = document.getElementById('urlInput');

textarea.addEventListener('input', function () {
  const lines = textarea.value.split('\n').length;

  if (lines <= 5) {
    textarea.rows = lines;
  } else {
    textarea.rows = 5;
  }
});

