const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: {
    editor: './src/editor.js',
    diff: './src/diff.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name]_bundle.js',
    publicPath: '/',
    globalObject: 'self'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'json', 'python'],
      features: [
        'bracketMatching',
        'caretOperations',
        'clipboard',
        'codeAction',
        'codelens',
        'colorDetector',
        'comment',
        'contextmenu',
        'cursorUndo',
        'dnd',
        'find',
        'folding',
        'fontZoom',
        'format',
        'gotoError',
        'gotoLine',
        'gotoSymbol',
        'hover',
        'iPadShowKeyboard',
        'inPlaceReplace',
        'inspectTokens',
        'linesOperations',
        'linkedEditing',
        'links',
        'multicursor',
        'parameterHints',
        'quickCommand',
        'quickHelp',
        'quickOutline',
        'referenceSearch',
        'rename',
        'smartSelect',
        'snippets',
        'suggest',
        'toggleHighContrast',
        'toggleTabFocusMode',
        'transpose',
        'unusualCharacters',
        'viewportSemanticTokens',
        'wordHighlighter',
        'wordOperations',
        'wordPartOperations',
        'bracketPairColorization',
        'guides',
        'indentation',
        'inlineHints',
        'linesDecorations',
        'matchBrackets',
        'renderWhitespace',
        'rulers',
        'scrollBeyondLastLine',
        'smoothScrolling',
        'stickyScroll',
        'suggestOnTriggerCharacters',
        'unicodeHighlight',
        'unusualCharacters',
        'wordHighlighter',
        'wordOperations',
        'wordPartOperations',
        'wordSeparators',
        'wordWrap',
        'wordWrapColumn',
        'wordWrapMinified',
        'wrappingIndent',
        'wrappingStrategy',
        'zones',
        'diffEditor'
      ],
      filename: '[name].worker.js',
      publicPath: '/'
    })
  ],
  devServer: {
    static: {
      directory: __dirname + '/public'
    },
    port: 3000,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
}; 