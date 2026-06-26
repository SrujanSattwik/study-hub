# StudyClub Frontend

This directory contains all frontend files for the StudyClub application.

## Structure

```
frontend/
├── index.html                 # Main landing page
├── pages/                     # All application pages
│   ├── about.html
│   ├── community.html
│   ├── get-started.html
│   ├── KnowNook.html         # AI Chat feature
│   ├── login.html
│   ├── materials.html
│   ├── resources.html
│   ├── study-bite.html
│   ├── cheat-note-creation.html
│   ├── syllabus-scheduler.html
│   ├── index-dashboard.html
│   ├── components-catalog.html
│   └── materials/            # Materials subpages
│       ├── textbooks.html
│       ├── video-lectures.html
│       ├── study-notes.html
│       ├── audio-content.html
│       ├── infographics.html
│       └── practice-tests.html
└── assets/
    ├── css/                  # All stylesheets
    │   ├── style.css        # Main stylesheet
    │   ├── components.css
    │   ├── dashboard.css
    │   ├── layout.css
    │   └── variables.css
    ├── js/                   # All JavaScript files
    │   ├── script.js        # Main script
    │   ├── knownook-chat.js # AI chat functionality
    │   └── layout.js
    └── img/                  # Images and icons (empty for now)
```

## Running the Application

1. Open `index.html` in a web browser to start
2. For AI chat features (KnowNook), ensure the backend server is running
3. All navigation links are relative and will work from any location

## Path Structure

- **Root (index.html)**: Uses `pages/` prefix for navigation, `assets/` for resources
- **Pages**: Use `../` to go back to root, direct names for sibling pages
- **Materials subpages**: Use `../../` for root, `../` for parent pages directory

## Features

- Responsive design
- AI-powered chat (KnowNook)
- Study materials management
- Community features
- Progress tracking
- And more...
