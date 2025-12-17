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
            chatContainer: '[class*="chat"], [class*="Messages"], [class*="conversation"], [class*="Chat"], main',
            chatMessage: '[class*="message"], [class*="Message"], [class*="turn"], [class*="response"]',
            messageRole: 'data-sender, data-role, data-author',
            messageContent: '[class*="content"], [class*="text"], [class*="prose"], p',
            loadMoreButton: '.load-more, button[class*="load"], [class*="load-more"]',
            errorPanel: '[class*="error"], [class*="Error"], [role="alert"]',
            fileTree: '[class*="file"], [class*="File"], [class*="explorer"], [class*="sidebar"]',
            fileItem: '[class*="file"], [class*="item"], [class*="node"]',
            previewFrame: 'iframe[class*="preview"], iframe[title*="Preview"], iframe',
            terminal: '[class*="terminal"], [class*="Terminal"], .xterm',
            exportButton: '[class*="download"], [class*="export"], button[aria-label*="Download" i], button[aria-label*="Export" i]',
            codeBlocks: 'pre code, [class*="code-block"], [class*="CodeBlock"], .hljs'
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
