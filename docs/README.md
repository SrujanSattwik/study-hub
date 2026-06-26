# StudyClub - Your Learning Sanctuary

A comprehensive web-based learning platform designed to provide students with a focused, distraction-free environment for studying and collaboration.

## Project Structure

```
study hub/
├── frontend/                 # All frontend files
│   ├── index.html           # Main landing page
│   ├── pages/               # Application pages
│   │   ├── materials/       # Materials subpages
│   │   └── [other pages]
│   └── assets/              # Static resources
│       ├── css/             # Stylesheets
│       ├── js/              # JavaScript files
│       └── img/             # Images and icons
│
├── backend/                  # All backend files
│   └── know_nook_backend/   # KnowNook AI Chat server
│       ├── server.js
│       ├── package.json
│       └── node_modules/
│
└── README.md                # This file
```

## Features

### Core Features
- **Focused Learning Environment**: Distraction-free interface designed for concentration
- **Study Materials**: Access to textbooks, videos, notes, audio content, and more
- **Community**: Connect with other students, join study groups
- **Progress Tracking**: Monitor your learning journey with analytics

### Special Features
- **KnowNook**: AI-powered Q&A with Gemini API integration
- **StudyBite**: 5-minute daily challenges for quick learning
- **StudySync**: Real-time group study planner
- **MindMesh**: Visual brainstorming and concept mapping tool
- **Cheat Note Creation**: Quick note-taking tool
- **Timetable Creation**: Drag-and-drop schedule builder
- **Syllabus Scheduler**: Break down syllabi into manageable tasks

## Getting Started

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Open `index.html` in your web browser

3. All pages are accessible through the navigation menu

### Backend (for AI features)

1. Navigate to the backend directory:
   ```bash
   cd backend/know_nook_backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. The server will run on `http://localhost:3000`

## Technology Stack

### Frontend
- HTML5
- CSS3 (with custom properties and modern layouts)
- Vanilla JavaScript
- Font Awesome icons
- Google Fonts (Poppins & Inter)

### Backend
- Node.js
- Express.js
- Gemini API (Google AI)
- CORS enabled for local development

## Navigation Structure

- **Root**: `frontend/index.html`
- **Pages**: `frontend/pages/*.html`
- **Materials**: `frontend/pages/materials/*.html`
- **Assets**: `frontend/assets/{css,js,img}/`

All paths are relative and work correctly regardless of where the project is located.

## Development

### Adding New Pages

1. Create HTML file in `frontend/pages/`
2. Use `../` to reference root-level resources
3. Use `../assets/` for CSS and JS files
4. Add navigation links to other pages

### Adding New Styles

1. Add CSS to `frontend/assets/css/`
2. Import in HTML with `<link rel="stylesheet" href="../assets/css/your-file.css">`

### Adding New Scripts

1. Add JS to `frontend/assets/js/`
2. Import in HTML with `<script src="../assets/js/your-file.js"></script>`

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Modern mobile browsers

## License

All rights reserved © 2025 StudyClub

## Support

For issues or questions, please refer to the documentation in each directory's README file.
