// Bolt.new (StackBlitz) Platform Configuration

(function () {
    const boltConfig = {
        id: 'bolt',
        name: 'Bolt.new',
        provider: 'StackBlitz',
        tier: 1,
        hostPatterns: ['bolt.new', 'stackblitz.com'],
        projectUrlPattern: /bolt\.new\/([a-zA-Z0-9-~]+)/,
        exportMechanism: 'download-zip',

        features: {
            chatHistory: true,
            fileTree: true,
            livePreview: true,
            errorTracking: true,
            consoleAccess: true,
            terminal: true,
            codeBlocks: true
        },

        selectors: {
            chatContainer: '.chat-messages, [class*="chat"], [class*="Messages"], [class*="conversation"]',
            chatMessage: '.message, [class*="message-item"], [class*="chat-message"]',
            messageRole: 'data-sender, data-role',
            messageContent: '.message-text, .content, p, [class*="message-content"]',
            loadMoreButton: '.load-more, button[class*="load"], button:contains("Load more")',
            errorPanel: '.error-display, [class*="error"], [class*="ErrorPanel"]',
            fileTree: '.file-tree, [class*="files"], [class*="FileTree"], [class*="explorer"]',
            fileItem: '.file-node, [class*="file"], [class*="FileItem"]',
            previewFrame: 'iframe.preview, iframe[class*="preview"], iframe[title*="Preview"]',
            terminal: '[class*="terminal"], [class*="Terminal"], .xterm',
            exportButton: 'button:contains("Download"), [class*="download"], button[aria-label*="Download"]',
            codeBlocks: 'pre code, [class*="code-block"], .hljs'
        },

        metadata: {
            color: '#00ffff',
            description: 'AI-powered full-stack web development',
            url: 'https://bolt.new'
        }
    };

    // Register this platform
    if (window.PlatformRegistry) {
        window.PlatformRegistry.register(boltConfig);
    }
})();
