# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Monaco Editor web application that provides embeddable iframe components for code editing and diff viewing. The project creates two separate iframe components:

1. **Standard Code Editor** (`editor.html`) - For general code viewing and editing
2. **Diff Editor** (`diff.html`) - For comparing two text inputs side-by-side or inline

Both editors communicate with parent applications via `postMessage` API and are designed to be embedded in larger web applications.

## Development Commands

### Local Development
```bash
npm install           # Install dependencies
npm start            # Start webpack dev server on port 3000
```

Development server runs at `http://localhost:3000` with:
- Standard Editor: `http://localhost:3000/editor.html`
- Diff Editor: `http://localhost:3000/diff.html`

### Production Build
```bash
npm run build        # Build production assets to dist/ directory
```

### Docker Deployment
```bash
docker build -t monaco-editors-iframe .      # Build Docker image
docker run -p 8080:80 monaco-editors-iframe  # Run container, accessible at localhost:8080
```

## Architecture

### Build System
- **Webpack** with Monaco Editor webpack plugin for bundling
- Two entry points: `src/editor.js` and `src/diff.js`
- Outputs `editor_bundle.js` and `diff_bundle.js` to dist/
- Monaco features and languages are explicitly configured in `webpack.config.js:24-93`

### Code Structure
```
src/
├── editor.js        # Standard Monaco editor with postMessage API
└── diff.js          # Monaco diff editor with postMessage API

public/
├── editor.html      # HTML container for standard editor
├── diff.html        # HTML container for diff editor
├── parent_editor.html   # Example parent integration
└── parent_diff.html     # Example parent integration
```

### Communication Architecture
Both editors use `postMessage` for bidirectional communication:

**Standard Editor** (`src/editor.js:51-114`):
- Sends `editorReady` when initialized
- Handles messages: `getContent`, `setContent`, `updateSettings`, `setLanguage`, `triggerAction`, etc.
- Emits events: `contentChanged`, `cursorPositionChanged`

**Diff Editor** (`src/diff.js:32-87`):
- Sends `diffEditorReady` when initialized  
- Handles messages: `setDiffContent`, `updateDiffSettings`, `getDiffContent`, etc.
- Manages model disposal to prevent memory leaks

### Monaco Editor Configuration
- Default language: JSON
- Default theme: vs-dark
- Enabled languages: javascript, typescript, json, python (`webpack.config.js:24`)
- Comprehensive feature set enabled including diff editor, formatting, find/replace, etc.

## Docker Configuration

The project uses multi-stage Docker build:
1. **Builder stage**: Node.js 18 Alpine, builds assets with `npm run build`
2. **Runtime stage**: Nginx Alpine, serves built assets and HTML files
3. Custom nginx.conf handles routing and CORS headers
4. Final image exposes port 80

## Development Notes

- No test framework is currently configured
- No linting/typecheck commands available
- CORS headers configured for iframe embedding (`webpack.config.js:103-106`)
- Models in diff editor are properly disposed to prevent memory leaks (`src/diff.js:49-53`)
- Origin validation is commented out but should be enabled in production (`src/editor.js:52-53`, `src/diff.js:33-34`)