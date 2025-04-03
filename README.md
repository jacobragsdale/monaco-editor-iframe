# Monaco Editor iframe Components

This project provides Monaco Editor instances running inside iframes, designed to be embedded and controlled by a parent web application. It includes two components:

1.  **Standard Code Editor:** For general code viewing and editing.
2.  **Diff Editor:** For comparing two text inputs.

## Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npm start
    ```
    The editors will be available, typically at `http://localhost:3000`.
    *   Standard Editor: `http://localhost:3000/editor.html`
    *   Diff Editor: `http://localhost:3000/diff.html`

## Docker Build & Run

1.  **Build the Docker image:**
    Make sure you have Docker installed and running. From the project root directory (where the `Dockerfile` is located), run:
    ```bash
    docker build -t monaco-editors-iframe .
    ```
    This will build the image and tag it as `monaco-editors-iframe`.

2.  **Run the Docker container:**
    ```bash
    docker run -p 8080:80 monaco-editors-iframe
    ```
    *   `-p 8080:80` maps port 8080 on your host machine to port 80 inside the container (where Nginx is listening).
    *   You can then access the editors at:
        *   Standard Editor: `http://localhost:8080/editor.html`
        *   Diff Editor: `http://localhost:8080/diff.html`

## Parent Application Integration

### Standard Editor (`editor.html`)

1.  **Embed the iframe:**
    ```html
    <iframe id="monacoEditorFrame" src="http://localhost:3000/editor.html" style="width: 100%; height: 600px; border: none;"></iframe>
    <!-- Or if using Docker: -->
    <!-- <iframe id="monacoEditorFrame" src="http://localhost:8080/editor.html" style="width: 100%; height: 600px; border: none;"></iframe> -->
    ```

2.  **Communicate via `postMessage`:**
    (See API reference below)

### Diff Editor (`diff.html`)

1.  **Embed the iframe:**
    ```html
    <iframe id="diffEditorFrame" src="http://localhost:3000/diff.html" style="width: 100%; height: 600px; border: none;"></iframe>
    <!-- Or if using Docker: -->
    <!-- <iframe id="diffEditorFrame" src="http://localhost:8080/diff.html" style="width: 100%; height: 600px; border: none;"></iframe> -->
    ```

2.  **Communicate via `postMessage`:**
    (See API reference below)

## Usage Examples

### Standard Editor Basic Integration

```javascript
// Reference to the iframe
const editorFrame = document.getElementById('monacoEditorFrame');
let isEditorReady = false;

// Listen for messages from the iframe
window.addEventListener('message', (event) => {
    // In production, always check event.origin for security
    
    const { type, event: eventName, payload } = event.data;
    
    if (type === 'editorReady') {
        console.log('Editor is ready to use!');
        isEditorReady = true;
        
        // Once ready, you can set initial content
        setEditorContent('{"example": "JSON content"}');
    } else if (type === 'editorEvent' && eventName === 'contentChanged') {
        console.log('Content changed:', payload.content);
    }
});

// Helper function to post messages to the editor
function postToEditor(type, payload = {}) {
    if (!isEditorReady) {
        console.warn('Editor not ready yet');
        return;
    }
    editorFrame.contentWindow.postMessage({ type, payload }, '*');
}

// Example functions for common operations
function setEditorContent(content) {
    postToEditor('setContent', { content });
}

function getEditorContent() {
    return new Promise((resolve) => {
        const handler = (event) => {
            const { type, subType, content } = event.data;
            if (type === 'response' && subType === 'editorContent') {
                resolve(content);
                window.removeEventListener('message', handler);
            }
        };
        
        window.addEventListener('message', handler);
        postToEditor('getContent');
    });
}

function changeLanguage(language) {
    postToEditor('setLanguage', { language });
}

function formatDocument() {
    postToEditor('triggerAction', { actionId: 'editor.action.formatDocument' });
}

// Usage example
async function demo() {
    // Set some content
    setEditorContent('{"name": "Example", "value": 42}');
    
    // Change language
    changeLanguage('javascript');
    
    // Format the document
    formatDocument();
    
    // Get the current content
    const content = await getEditorContent();
    console.log('Current content:', content);
}
```

### Diff Editor Basic Integration

```javascript
// Reference to the iframe
const diffFrame = document.getElementById('diffEditorFrame');
let isDiffEditorReady = false;

// Listen for messages from the iframe
window.addEventListener('message', (event) => {
    // In production, always check event.origin for security
    
    const { type } = event.data;
    
    if (type === 'diffEditorReady') {
        console.log('Diff Editor is ready to use!');
        isDiffEditorReady = true;
        
        // Once ready, you can set initial diff content
        setDiffContent(
            '{"version": "1.0.0", "enabled": true}',
            '{"version": "2.0.0", "enabled": false}'
        );
    }
});

// Helper function to post messages to the diff editor
function postToDiffEditor(type, payload = {}) {
    if (!isDiffEditorReady) {
        console.warn('Diff Editor not ready yet');
        return;
    }
    diffFrame.contentWindow.postMessage({ type, payload }, '*');
}

// Example functions for common operations
function setDiffContent(originalContent, modifiedContent, language = 'json') {
    postToDiffEditor('setDiffContent', { 
        originalContent, 
        modifiedContent,
        language
    });
}

function toggleInlineView() {
    postToDiffEditor('updateDiffSettings', {
        settings: { renderSideBySide: false }
    });
}

function toggleSideBySideView() {
    postToDiffEditor('updateDiffSettings', {
        settings: { renderSideBySide: true }
    });
}

function getDiffContent() {
    return new Promise((resolve) => {
        const handler = (event) => {
            const { type, subType, originalContent, modifiedContent } = event.data;
            if (type === 'response' && subType === 'diffContent') {
                resolve({ originalContent, modifiedContent });
                window.removeEventListener('message', handler);
            }
        };
        
        window.addEventListener('message', handler);
        postToDiffEditor('getDiffContent');
    });
}

// Usage example
async function diffDemo() {
    // Set initial diff content
    setDiffContent(
        '{\n  "config": {\n    "version": "1.0",\n    "active": true\n  }\n}',
        '{\n  "config": {\n    "version": "1.1",\n    "active": false,\n    "newField": true\n  }\n}'
    );
    
    // Change to inline view
    toggleInlineView();
    
    // Then back to side-by-side
    setTimeout(() => {
        toggleSideBySideView();
    }, 2000);
    
    // Get current diff content
    const content = await getDiffContent();
    console.log('Original:', content.originalContent);
    console.log('Modified:', content.modifiedContent);
}
```

### Advanced Usage Examples

#### Handling Correlation IDs for Multiple Concurrent Requests

```javascript
let requestCounter = 0;
const pendingRequests = new Map();

function makeRequest(editorFrame, type, payload = {}) {
    return new Promise((resolve, reject) => {
        const correlationId = `req-${Date.now()}-${requestCounter++}`;
        
        const handler = (event) => {
            const { type: respType, correlationId: respId } = event.data;
            
            if (respId === correlationId) {
                if (respType === 'response') {
                    resolve(event.data);
                } else if (respType === 'error') {
                    reject(new Error(event.data.message));
                }
                window.removeEventListener('message', handler);
            }
        };
        
        window.addEventListener('message', handler);
        
        // Set timeout to prevent hanging promises
        setTimeout(() => {
            const stillPending = pendingRequests.has(correlationId);
            if (stillPending) {
                pendingRequests.delete(correlationId);
                reject(new Error(`Request timed out: ${type}`));
                window.removeEventListener('message', handler);
            }
        }, 5000);
        
        // Send the request
        editorFrame.contentWindow.postMessage({
            type,
            payload: { ...payload, correlationId }
        }, '*');
    });
}

// Usage
async function multipleRequests() {
    try {
        // These requests can happen concurrently
        const [content, settings] = await Promise.all([
            makeRequest(editorFrame, 'getContent'),
            makeRequest(editorFrame, 'getSettings')
        ]);
        
        console.log('Content:', content);
        console.log('Settings:', settings);
    } catch (error) {
        console.error('Request failed:', error);
    }
}
```

#### Debouncing Editor Events

```javascript
// Debounce function to limit how often a function runs
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Listen for content changes with debouncing
const handleContentChange = debounce((content) => {
    console.log('Content changed (debounced):', content);
    // Process content here, e.g., save to localStorage
}, 500);

window.addEventListener('message', (event) => {
    const { type, event: eventName, payload } = event.data;
    
    if (type === 'editorEvent' && eventName === 'contentChanged') {
        handleContentChange(payload.content);
    }
});
```

#### Setting Different Editor Themes

```javascript
function changeEditorTheme(theme) {
    postToEditor('updateSettings', {
        settings: { theme }
    });
}

// Available themes
const themes = [
    'vs-dark',    // Dark theme (default)
    'vs',         // Light theme
    'hc-black',   // High contrast dark
    'hc-light'    // High contrast light
];

// Example: Switch to light theme
changeEditorTheme('vs');

// Create a theme selector
function createThemeSelector(container) {
    const select = document.createElement('select');
    
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        if (theme === 'vs-dark') option.selected = true;
        select.appendChild(option);
    });
    
    select.addEventListener('change', () => {
        changeEditorTheme(select.value);
    });
    
    container.appendChild(select);
}
```

**General Communication Pattern:**

```javascript
const targetFrame = document.getElementById('monacoEditorFrame'); // Or 'diffEditorFrame'
const targetOrigin = 'http://localhost:3000'; // Or 'http://localhost:8080' or your deployed origin

// --- Sending Messages --- 
function postEditorMessage(frame, type, payload = {}) {
    // Check readiness if needed (isEditorReady or isDiffEditorReady)
    frame.contentWindow.postMessage({ type, payload }, targetOrigin);
}

// Example
postEditorMessage(targetFrame, 'setContent', { content: '...' }); 

// --- Receiving Messages --- 
window.addEventListener('message', (event) => {
    // **IMPORTANT SECURITY:** Always verify the origin!
    if (event.origin !== targetOrigin) {
      console.warn('Message received from unexpected origin:', event.origin);
      return;
    }

    const { type, ...data } = event.data;

    if (type === 'editorReady') {
        console.log('Standard Editor is ready!');
    } else if (type === 'diffEditorReady') {
        console.log('Diff Editor is ready!');
    } else if (type === 'editorEvent') {
        console.log(`Std Editor Event: ${data.event}`, data.payload);
    } else if (type === 'response') {
        console.log(`Response: ${data.subType}`, data);
        // Handle responses using data.correlationId if applicable
    } else if (type === 'error') {
        console.error(`Editor Error (request: ${data.requestType}):`, data.message);
    } else {
        console.log('Unknown message received:', event.data);
    }
});
```

**Note:** Always replace placeholder origins with the actual origin where the editor iframe is hosted for security.

## `postMessage` API Reference

### Standard Editor (`editor.html`)

#### Parent → Editor Messages

*   **`getContent`**: Requests the current editor content.
    *   Request: `{ correlationId?: string }`
    *   Response: `{ type: 'response', correlationId?: string, subType: 'editorContent', content: string }`

*   **`setContent`**: Replaces the entire editor content.
    *   Request: `{ content: string }`
    *   No response is sent

*   **`updateSettings`**: Updates one or more editor options.
    *   Request: `{ settings: object }` where settings is a Monaco IEditorOptions object
    *   No response is sent
    *   Examples:
         ```javascript
         { settings: { theme: 'vs-dark' } } // Change theme
         { settings: { readOnly: true } } // Make editor read-only
         { settings: { minimap: { enabled: false } } } // Disable minimap
         ```

*   **`getSettings`**: Requests the current editor settings.
    *   Request: `{ correlationId?: string }`
    *   Response: `{ type: 'response', correlationId?: string, subType: 'editorSettings', settings: object }`

*   **`setLanguage`**: Changes the editor's language mode.
    *   Request: `{ language: string }` 
    *   No response is sent
    *   Examples: `'json'`, `'javascript'`, `'typescript'`, `'python'`, etc.

*   **`triggerAction`**: Executes a built-in editor action.
    *   Request: `{ actionId: string, args?: any }`
    *   No response is sent
    *   Common actionId examples:
         *   `'editor.action.formatDocument'` - Format the entire document
         *   `'undo'` - Undo last action
         *   `'redo'` - Redo last undone action
         *   `'actions.find'` - Open find dialog
         *   `'editor.action.startFindReplaceAction'` - Open find & replace dialog

*   **`getModelMarkers`**: Requests diagnostic markers (errors, warnings, etc.).
    *   Request: `{ correlationId?: string }`
    *   Response: `{ type: 'response', correlationId?: string, subType: 'editorMarkers', markers: array }`

*   **`focusEditor`**: Sets focus to the editor.
    *   Request: `{}`
    *   No response is sent

*   **`blurEditor`**: Removes focus from the editor.
    *   Request: `{}`
    *   No response is sent

#### Editor → Parent Messages

*   **`editorReady`**: Sent once when the editor is initialized and ready to receive messages.
    *   Payload: `{ type: 'editorReady' }`

*   **`editorEvent`**: Sent when specific editor events occur.
    *   Event types:
        *   `'contentChanged'`: When editor content changes
            *   Payload: `{ type: 'editorEvent', event: 'contentChanged', payload: { content: string, event: object } }`
        *   `'cursorPositionChanged'`: When cursor position changes
            *   Payload: `{ type: 'editorEvent', event: 'cursorPositionChanged', payload: { position: object } }`

*   **`response`**: Sent in reply to a request message.
    *   Structure: `{ type: 'response', correlationId?: string, subType: string, ... }`
    *   subType values:
        *   `'editorContent'`: Includes `content: string`
        *   `'editorSettings'`: Includes `settings: object`
        *   `'editorMarkers'`: Includes `markers: array`

*   **`error`**: Sent if an error occurs processing a message.
    *   Structure: `{ type: 'error', message: string, requestType: string }`
    *   `message`: Error message string
    *   `requestType`: The type of the parent message that caused the error

### Diff Editor (`diff.html`)

#### Parent → Editor Messages

*   **`setDiffContent`**: Sets the original and modified content, and optionally the language.
    *   Request: `{ originalContent: string, modifiedContent: string, language?: string }`
    *   No response is sent
    *   Default language is `'json'` if not specified

*   **`updateDiffSettings`**: Updates one or more diff editor options.
    *   Request: `{ settings: object }` where settings is a Monaco IDiffEditorOptions object
    *   No response is sent
    *   Examples:
        ```javascript
        { settings: { renderSideBySide: false } } // Switch to inline view
        { settings: { theme: 'vs-light' } } // Change theme
        ```

*   **`getDiffContent`**: Requests the current content of both panes.
    *   Request: `{ correlationId?: string }`
    *   Response: `{ type: 'response', correlationId?: string, subType: 'diffContent', originalContent: string, modifiedContent: string }`

*   **`getDiffSettings`**: Requests the current diff editor settings.
    *   Request: `{ correlationId?: string }`
    *   Response: `{ type: 'response', correlationId?: string, subType: 'diffSettings', settings: object }`

*   **`focusDiffEditor`**: Sets focus to the modified editor pane.
    *   Request: `{}`
    *   No response is sent

#### Editor → Parent Messages

*   **`diffEditorReady`**: Sent once when the diff editor is initialized and ready to receive messages.
    *   Payload: `{ type: 'diffEditorReady' }`

*   **`response`**: Sent in reply to a request message.
    *   Structure: `{ type: 'response', correlationId?: string, subType: string, ... }`
    *   subType values:
        *   `'diffContent'`: Includes `originalContent: string, modifiedContent: string`
        *   `'diffSettings'`: Includes `settings: object`

*   **`error`**: Sent if an error occurs processing a message.
    *   Structure: `{ type: 'error', message: string, requestType: string }`
    *   `message`: Error message string
    *   `requestType`: The type of the parent message that caused the error