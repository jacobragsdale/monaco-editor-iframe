# Monaco Editor iframe Component

This project provides a Monaco Editor instance running inside an iframe, designed to be embedded and controlled by a parent web application.

## Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npm start
    ```
    The editor will be available, typically at `http://localhost:3000`.

## Parent Application Integration

1.  **Embed the iframe:**
    Add an `<iframe>` element to your parent application, setting its `src` attribute to the URL where the Monaco Editor component is hosted.
    ```html
    <iframe id="monacoEditorFrame" src="http://localhost:3000/index.html" style="width: 100%; height: 600px; border: none;"></iframe>
    ```

2.  **Communicate via `postMessage`:**
    Use the `window.postMessage` API to send commands to the iframe and add an event listener to receive messages (events and responses) from the iframe.

    ```javascript
    const editorFrame = document.getElementById('monacoEditorFrame');

    // --- Sending Messages to the Editor --- 
    function postEditorMessage(type, payload = {}) {
        // Wait for editor readiness if necessary
        editorFrame.contentWindow.postMessage({ type, payload }, 'TARGET_ORIGIN'); // Replace TARGET_ORIGIN
    }

    // Example: Set content
    postEditorMessage('setContent', { content: 'console.log("Hello from parent!");' });

    // --- Receiving Messages from the Editor --- 
    window.addEventListener('message', (event) => {
        // **IMPORTANT SECURITY:** Always verify the origin of the message!
        // if (event.origin !== "EXPECTED_EDITOR_ORIGIN") { // Replace EXPECTED_EDITOR_ORIGIN
        //   console.warn('Message received from unexpected origin:', event.origin);
        //   return;
        // }

        const { type, event: eventName, payload, correlationId, subType, ...rest } = event.data;

        if (type === 'editorReady') {
            console.log('Editor is ready!');
            // Now safe to send messages
        } else if (type === 'editorEvent') {
            console.log(`Editor Event Received: ${eventName}`, payload);
            // Handle events like contentChanged, cursorPositionChanged, etc.
        } else if (type === 'response') {
            console.log(`Response Received (subType: ${subType}, correlationId: ${correlationId}):`, rest);
            // Handle responses to specific requests (getContent, getSelection, etc.)
            // Use correlationId to match response to request
        } else if (type === 'error') {
            console.error(`Editor Error (request: ${event.data.requestType}):`, event.data.message);
        } else {
            console.log('Unknown message received:', event.data);
        }
    });
    ```

    **Note:** Replace `TARGET_ORIGIN` with the actual origin where the editor iframe is hosted (e.g., `'http://localhost:3000'`) for security. Similarly, replace `EXPECTED_EDITOR_ORIGIN` when checking received messages.

## `postMessage` API Reference

### Parent -> Editor Messages

These are the message `type` values you can send *to* the editor iframe.

*   **`setContent`**: Replaces the entire editor content.
    *   `payload`: `{ content: string }`
*   **`updateSettings`**: Updates one or more editor options.
    *   `payload`: `{ settings: IEditorOptions }`
    *   See Monaco Editor Docs for [IEditorOptions](https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html).
*   **`setLanguage`**: Changes the editor's language mode.
    *   `payload`: `{ language: string }` (e.g., `'javascript'`, `'python'`, `'json'`). Also resets content to a default for JSON/Python.
*   **`triggerAction`**: Executes a built-in editor action.
    *   `payload`: `{ actionId: string, args?: any }`
    *   Common `actionId` examples: `'editor.action.formatDocument'`, `'undo'`, `'redo'`, `'actions.find'`.
    *   Find more action IDs in the Monaco/VS Code Command Palette or documentation.
*   **`focusEditor`**: Sets focus to the editor.
    *   `payload`: `{}` (Optional)
*   **`blurEditor`**: Removes focus from the editor.
    *   `payload`: `{}` (Optional)

*   **Requesting Data (Requires Response Handling):**
    These messages expect a `response` message back from the editor. Include a unique `correlationId` in the payload to match the response.
    *   **`getContent`**: Requests the current editor content.
        *   `payload`: `{ correlationId: string }` (Optional but recommended)
    *   **`getSettings`**: Requests the current editor settings object.
        *   `payload`: `{ correlationId: string }` (Optional but recommended)
    *   **`getSelection`**: Requests the currently selected text.
        *   `payload`: `{ correlationId: string }` (Optional but recommended)
    *   **`getModelMarkers`**: Requests diagnostic markers (errors, warnings).
        *   `payload`: `{ correlationId: string }` (Optional but recommended)

### Editor -> Parent Messages

These are the message `type` values the editor iframe sends *to* the parent.

*   **`editorReady`**: Sent once when the editor is initialized and ready to receive messages.
*   **`editorEvent`**: Sent when specific editor events occur.
    *   `event`: The name of the event (e.g., `'contentChanged'`, `'cursorPositionChanged'`, `'selectionChanged'`).
    *   `payload`: Event-specific data provided by Monaco.
        *   `contentChanged`: Includes `{ content: string, event: IModelContentChangedEvent }`
        *   `cursorPositionChanged`: Includes `{ position: IPosition, ... }`
        *   `selectionChanged`: Includes `{ selection: ISelection, ... }`
*   **`response`**: Sent in reply to a request message (`getContent`, `getSettings`, etc.).
    *   `correlationId`: Matches the `correlationId` sent in the original request.
    *   `subType`: Indicates the type of data being returned (e.g., `'editorContent'`, `'editorSettings'`, `'editorSelection'`, `'editorMarkers'`).
    *   Additional properties depend on `subType`:
        *   `editorContent`: Includes `content: string`
        *   `editorSettings`: Includes `settings: IEditorOptions`
        *   `editorSelection`: Includes `selectedText: string`
        *   `editorMarkers`: Includes `markers: IMarkerData[]`
*   **`error`**: Sent if an error occurs within the iframe while processing a message.
    *   `message`: The error message string.
    *   `requestType`: The `type` of the parent message that caused the error. 