import * as monaco from 'monaco-editor';

// Initialize the editor
const editor = monaco.editor.create(document.getElementById('editor-container'), {
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
        enabled: true
    },
    scrollBeyond: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    cursorStyle: 'line',
    tabSize: 4,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    wordBasedSuggestions: true,
    parameterHints: {
        enabled: true
    }
});

// --- Event Listeners --- 

editor.onDidChangeModelContent((event) => {
    window.parent.postMessage({
        type: 'editorEvent',
        event: 'contentChanged',
        payload: { content: editor.getValue(), event: event }
    }, '*');
});

editor.onDidChangeCursorPosition((event) => {
    window.parent.postMessage({
        type: 'editorEvent',
        event: 'cursorPositionChanged',
        payload: event
    }, '*');
});

// --- Message Handler --- 

window.addEventListener('message', (event) => {
    // IMPORTANT: Add origin check in production
    // if (event.origin !== "YOUR_PARENT_DOMAIN") return;

    const { type, payload } = event.data;

    try {
        switch (type) {
            case 'getContent':
                window.parent.postMessage({
                    type: 'response', 
                    correlationId: payload?.correlationId, 
                    subType: 'editorContent', 
                    content: editor.getValue()
                }, '*');
                break;

            case 'setContent':
                editor.setValue(payload.content);
                break;

            case 'updateSettings':
                editor.updateOptions(payload.settings);
                break;

            case 'getSettings':
                window.parent.postMessage({
                    type: 'response', 
                    correlationId: payload?.correlationId, 
                    subType: 'editorSettings', 
                    settings: editor.getOptions()
                }, '*');
                break;

            case 'setLanguage':
                monaco.editor.setModelLanguage(editor.getModel(), payload.language);
                break;

            case 'triggerAction':
                editor.trigger('parentApp', payload.actionId, payload.args);
                break;

            case 'getModelMarkers':
                window.parent.postMessage({
                    type: 'response', 
                    correlationId: payload?.correlationId, 
                    subType: 'editorMarkers', 
                    markers: monaco.editor.getModelMarkers({ resource: editor.getModel().uri })
                }, '*');
                break;
            
            case 'focusEditor':
                editor.focus();
                break;
            
            case 'blurEditor':
                editor.getDomNode()?.blur();
                break;
        }
    } catch (error) {
        console.error("Error processing message in editor iframe:", type, payload, error);
        window.parent.postMessage({ type: 'error', message: error.message, requestType: type }, '*');
    }
});

// Let parent know the editor is ready
window.parent.postMessage({ type: 'editorReady' }, '*'); 