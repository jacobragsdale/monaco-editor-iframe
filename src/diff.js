import * as monaco from 'monaco-editor';

// --- Initialize Diff Editor --- 

const diffEditorContainer = document.getElementById('diff-editor-container');

if (!diffEditorContainer) {
    throw new Error("Container element #diff-editor-container not found.");
}

const diffEditor = monaco.editor.createDiffEditor(diffEditorContainer, {
    // Diff Editor specific options
    enableSplitViewResizing: true,
    renderSideBySide: true, // true for side-by-side, false for inline
    readOnly: false, // Can be configured
    automaticLayout: true,
    theme: 'vs-dark', 
    scrollBeyondLastLine: false,
});

// Initial empty models
let originalModel = monaco.editor.createModel("// Original JSON content", "json");
let modifiedModel = monaco.editor.createModel("// Modified JSON content", "json");

diffEditor.setModel({
    original: originalModel,
    modified: modifiedModel
});

// --- Message Handler --- 

window.addEventListener('message', (event) => {
    // IMPORTANT: Add origin check in production
    // if (event.origin !== "YOUR_PARENT_DOMAIN") return;

    const { type, payload } = event.data;

    try {
        switch (type) {
            case 'setDiffContent': 
                const newOriginalModel = monaco.editor.createModel(payload.originalContent || "", payload.language || 'json');
                const newModifiedModel = monaco.editor.createModel(payload.modifiedContent || "", payload.language || 'json');
                
                diffEditor.setModel({
                    original: newOriginalModel,
                    modified: newModifiedModel
                });
                
                // Dispose old models after setting new ones
                if (originalModel) originalModel.dispose();
                if (modifiedModel) modifiedModel.dispose();
                originalModel = newOriginalModel;
                modifiedModel = newModifiedModel;
                break;

            case 'updateDiffSettings':
                diffEditor.updateOptions(payload.settings);
                break;

            case 'getDiffContent':
                window.parent.postMessage({
                    type: 'response',
                    correlationId: payload?.correlationId,
                    subType: 'diffContent',
                    originalContent: diffEditor.getOriginalEditor().getValue(),
                    modifiedContent: diffEditor.getModifiedEditor().getValue()
                }, '*');
                break;

            case 'getDiffSettings':
                 window.parent.postMessage({
                    type: 'response',
                    correlationId: payload?.correlationId,
                    subType: 'diffSettings',
                    settings: diffEditor.getOptions()
                }, '*');
                break;
            
            case 'focusDiffEditor': // Focus the modified side by default
                diffEditor.getModifiedEditor().focus();
                break;
        }
    } catch (error) {
        console.error("Error processing message in diff editor iframe:", type, payload, error);
        window.parent.postMessage({ type: 'error', message: error.message, requestType: type }, '*');
    }
});

// Let parent know the diff editor is ready
window.parent.postMessage({ type: 'diffEditorReady' }, '*'); 