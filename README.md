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