/**
 * Enhanced Chat Scraper
 * Captures the COMPLETE chat history with aggressive scrolling
 * Handles virtual scrolling, lazy loading, and "load more" buttons
 */

const ChatScraper = {
  capturedMessages: [],
  isCapturing: false,
  seenMessageHashes: new Set(),
  scrollAttempts: 0,
  maxScrollAttempts: 300, // Allow up to 300 scroll attempts for very long histories

  /**
   * Capture FULL chat history - aggressive approach
   * @param {Object} platform - Platform configuration
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Array of captured messages
   */
  async captureFullHistory(platform, onProgress) {
    this.isCapturing = true;
    this.capturedMessages = [];
    this.seenMessageHashes = new Set();
    this.scrollAttempts = 0;

    onProgress({
      phase: 'initializing',
      message: 'Initializing neural extraction matrix...',
      progress: 0
    });

    // Find chat container
    const chatContainer = this.findChatContainer(platform);
    if (!chatContainer) {
      throw new Error('Could not locate chat container');
    }

    // Find scrollable element (might be container or parent)
    const scrollable = this.findScrollableElement(chatContainer);

    onProgress({
      phase: 'scrolling',
      message: 'Locating temporal message origin point...',
      progress: 2
    });

    // PHASE 1: Aggressive scroll to absolute top to load ALL history
    await this.scrollToAbsoluteTop(scrollable, platform, onProgress);

    onProgress({
      phase: 'extracting',
      message: 'Initiating quantum message extraction...',
      progress: 50
    });

    // PHASE 2: Now scroll down capturing everything
    await this.scrollAndCaptureAll(scrollable, platform, onProgress);

    // PHASE 3: Final cleanup and deduplication
    onProgress({
      phase: 'finalizing',
      message: 'Crystallizing message data structures...',
      progress: 95
    });

    const finalMessages = this.processMessages();

    onProgress({
      phase: 'complete',
      message: `Extraction complete: ${finalMessages.length} messages captured`,
      progress: 100,
      count: finalMessages.length
    });

    this.isCapturing = false;
    return finalMessages;
  },

  /**
   * Scroll to absolute top of chat, handling:
   * - Virtual scrolling
   * - "Load more" buttons
   * - Infinite scroll
   * - Lazy loading
   * @param {Element} scrollable - Scrollable element
   * @param {Object} platform - Platform config
   * @param {Function} onProgress - Progress callback
   */
  async scrollToAbsoluteTop(scrollable, platform, onProgress) {
    let previousScrollHeight = -1;
    let previousScrollTop = -1;
    let stableCount = 0;
    let iteration = 0;

    // Initial scroll to top
    scrollable.scrollTop = 0;
    await this.wait(300);

    while (iteration < this.maxScrollAttempts && this.isCapturing) {
      iteration++;
      this.scrollAttempts = iteration;

      // Try clicking "Load more" / "Load earlier messages" button
      const loadMoreClicked = await this.tryClickLoadMore(platform);

      // Scroll to absolute top using multiple methods
      scrollable.scrollTo({ top: 0, behavior: 'instant' });
      scrollable.scrollTop = 0;

      // Some platforms need negative scroll attempts
      try {
        scrollable.scrollTo({ top: -1000, behavior: 'instant' });
      } catch (e) {
        // Ignore if not supported
      }

      // Wait for content to load
      await this.wait(loadMoreClicked ? 1200 : 400);

      // Trigger scroll events for virtual scroll detection
      this.triggerScrollEvents(scrollable);

      // Get current state
      const currentScrollHeight = scrollable.scrollHeight;
      const currentScrollTop = scrollable.scrollTop;

      // Progress update every 10 iterations
      if (iteration % 10 === 0) {
        onProgress({
          phase: 'scrolling',
          message: `Loading complete history... (${iteration} cycles, ${currentScrollHeight}px)`,
          progress: Math.min(45, 2 + (iteration / this.maxScrollAttempts) * 43)
        });
      }

      // Check for stability (we've reached the true top)
      const heightStable = currentScrollHeight === previousScrollHeight;
      const positionAtTop = currentScrollTop <= 5;

      if (heightStable && positionAtTop && !loadMoreClicked) {
        stableCount++;
        if (stableCount >= 5) {
          // We're definitely at the top - no more content loading
          console.log(`[ChatScraper] Reached top after ${iteration} iterations`);
          break;
        }
      } else {
        stableCount = 0;
      }

      previousScrollHeight = currentScrollHeight;
      previousScrollTop = currentScrollTop;

      // Early exit if we've been stable for a while with no load more button
      if (stableCount >= 3 && !this.hasLoadMoreButton(platform)) {
        break;
      }
    }

    console.log(`[ChatScraper] Scroll to top completed: ${iteration} iterations, ${scrollable.scrollHeight}px total height`);
  },

  /**
   * Try to click load more buttons (various patterns)
   * @param {Object} platform - Platform config
   * @returns {Promise<boolean>} True if clicked something
   */
  async tryClickLoadMore(platform) {
    // Platform-specific selector first
    if (platform.selectors?.loadMoreButton) {
      const btn = document.querySelector(platform.selectors.loadMoreButton);
      if (btn && this.isVisible(btn) && !btn.disabled) {
        btn.click();
        console.log('[ChatScraper] Clicked platform-specific load more');
        return true;
      }
    }

    // Common load more patterns
    const loadMorePatterns = [
      // Button selectors
      'button[class*="load-more"]',
      'button[class*="loadmore"]',
      'button[class*="load-earlier"]',
      'button[class*="show-more"]',
      'button[class*="view-more"]',
      'button[class*="older"]',
      '[class*="load-more"] button',
      '[class*="load-more-trigger"]',
      '[data-testid*="load-more"]',
      '[data-testid*="load-earlier"]',
      // Link patterns
      'a[class*="load-more"]',
      // Generic clickable with load text
      '[role="button"][class*="load"]'
    ];

    for (const selector of loadMorePatterns) {
      try {
        const element = document.querySelector(selector);
        if (element && this.isVisible(element) && !element.disabled) {
          element.click();
          console.log(`[ChatScraper] Clicked load more: ${selector}`);
          return true;
        }
      } catch (e) {
        // Selector might be invalid
      }
    }

    // Text-based search for load more buttons
    const textPatterns = [
      'load more',
      'load earlier',
      'show more',
      'view more',
      'see more',
      'older messages',
      'previous messages',
      'load previous'
    ];

    const clickableElements = document.querySelectorAll('button, a, [role="button"], [class*="btn"], [class*="button"]');

    for (const element of clickableElements) {
      const text = element.textContent?.toLowerCase().trim() || '';
      const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

      for (const pattern of textPatterns) {
        if ((text.includes(pattern) || ariaLabel.includes(pattern)) && this.isVisible(element)) {
          element.click();
          console.log(`[ChatScraper] Clicked load more by text: "${pattern}"`);
          return true;
        }
      }
    }

    return false;
  },

  /**
   * Check if load more button exists
   * @param {Object} platform - Platform config
   * @returns {boolean}
   */
  hasLoadMoreButton(platform) {
    if (platform.selectors?.loadMoreButton) {
      const btn = document.querySelector(platform.selectors.loadMoreButton);
      if (btn && this.isVisible(btn)) return true;
    }

    const textPatterns = ['load more', 'load earlier', 'show more'];
    const buttons = document.querySelectorAll('button, a, [role="button"]');

    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (textPatterns.some(p => text.includes(p)) && this.isVisible(btn)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Trigger scroll events for virtual scroll detection
   * @param {Element} scrollable - Scrollable element
   */
  triggerScrollEvents(scrollable) {
    const events = ['scroll', 'wheel', 'mousewheel'];
    events.forEach(eventType => {
      try {
        scrollable.dispatchEvent(new Event(eventType, { bubbles: true }));
      } catch (e) {
        // Ignore
      }
    });
  },

  /**
   * Scroll through entire chat capturing all messages
   * @param {Element} scrollable - Scrollable element
   * @param {Object} platform - Platform config
   * @param {Function} onProgress - Progress callback
   */
  async scrollAndCaptureAll(scrollable, platform, onProgress) {
    // Start from top
    scrollable.scrollTop = 0;
    await this.wait(500);

    // Capture initial visible messages
    this.captureVisibleMessages(platform);

    // Scroll down incrementally, capturing as we go
    const scrollStep = Math.max(200, scrollable.clientHeight * 0.6);
    let totalScrolled = 0;
    let previousMessageCount = 0;
    let stableCount = 0;
    const maxStable = 8;

    while (this.isCapturing) {
      // Scroll down
      scrollable.scrollBy({ top: scrollStep, behavior: 'instant' });
      totalScrolled += scrollStep;

      await this.wait(250);

      // Trigger scroll events for lazy loading
      this.triggerScrollEvents(scrollable);

      await this.wait(100);

      // Capture visible messages
      this.captureVisibleMessages(platform);

      const progress = 50 + Math.min(45, (totalScrolled / scrollable.scrollHeight) * 45);
      onProgress({
        phase: 'extracting',
        message: `Extracting quantum signatures... ${this.capturedMessages.length} messages`,
        progress: progress,
        count: this.capturedMessages.length
      });

      // Check if we've reached the bottom
      const scrollPosition = scrollable.scrollTop + scrollable.clientHeight;
      const atBottom = scrollPosition >= scrollable.scrollHeight - 20;

      if (atBottom) {
        // Final capture pass
        await this.wait(500);
        this.captureVisibleMessages(platform);

        // Double check we're really at the bottom
        scrollable.scrollBy({ top: 100, behavior: 'instant' });
        await this.wait(300);
        this.captureVisibleMessages(platform);

        break;
      }

      // Stability check
      if (this.capturedMessages.length === previousMessageCount) {
        stableCount++;
        if (stableCount >= maxStable && atBottom) {
          break;
        }
      } else {
        stableCount = 0;
      }

      previousMessageCount = this.capturedMessages.length;
    }

    console.log(`[ChatScraper] Extraction complete: ${this.capturedMessages.length} messages`);
  },

  /**
   * Capture currently visible messages (deduplicates automatically)
   * @param {Object} platform - Platform config
   * @returns {number} Number of new messages captured
   */
  captureVisibleMessages(platform) {
    const messageElements = this.findMessageElements(platform);
    let newMessages = 0;

    messageElements.forEach((el, index) => {
      const hash = this.hashElement(el);

      if (!this.seenMessageHashes.has(hash)) {
        this.seenMessageHashes.add(hash);

        const message = this.extractMessage(el, platform, this.capturedMessages.length);
        if (message && message.content && message.content.trim().length > 0) {
          this.capturedMessages.push(message);
          newMessages++;
        }
      }
    });

    return newMessages;
  },

  /**
   * Find message elements using multiple strategies
   * @param {Object} platform - Platform config
   * @returns {Array<Element>}
   */
  findMessageElements(platform) {
    // Try platform-specific selector first
    if (platform.selectors?.chatMessage) {
      const selectors = platform.selectors.chatMessage.split(',').map(s => s.trim());
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            return Array.from(elements);
          }
        } catch (e) {
          // Invalid selector
        }
      }
    }

    // Generic message selectors
    const genericSelectors = [
      '[data-testid*="message"]',
      '[data-message-id]',
      '[class*="message-container"]',
      '[class*="chat-message"]',
      '[class*="conversation-message"]',
      '[role="listitem"][class*="message"]',
      '[class*="MessageRow"]',
      '[class*="message-row"]',
      '[class*="chat-row"]',
      '.message',
      '[class*="turn"]', // ChatGPT style
      '[class*="prose"]' // Claude style
    ];

    for (const selector of genericSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return Array.from(elements);
        }
      } catch (e) {
        // Invalid selector
      }
    }

    return [];
  },

  /**
   * Extract message data from element
   * @param {Element} el - Message element
   * @param {Object} platform - Platform config
   * @param {number} index - Message index
   * @returns {Object} Message object
   */
  extractMessage(el, platform, index) {
    return {
      id: `msg_${this.hashElement(el)}_${index}`,
      role: this.extractRole(el, platform),
      content: this.extractContent(el, platform),
      timestamp: this.extractTimestamp(el),
      codeBlocks: this.extractCodeBlocks(el),
      artifacts: this.extractArtifacts(el),
      order: index,
      rawHtml: el.innerHTML?.slice(0, 500) // Keep first 500 chars of HTML for debugging
    };
  },

  /**
   * Extract role (user or assistant)
   * @param {Element} el - Message element
   * @param {Object} platform - Platform config
   * @returns {string} 'user' or 'assistant'
   */
  extractRole(el, platform) {
    // Check data attributes
    const dataRole = el.getAttribute('data-role') ||
                     el.getAttribute('data-message-role') ||
                     el.getAttribute('data-author') ||
                     el.getAttribute('data-testid') || '';

    if (dataRole.toLowerCase().includes('user') || dataRole.toLowerCase().includes('human')) {
      return 'user';
    }
    if (dataRole.toLowerCase().includes('assistant') || dataRole.toLowerCase().includes('ai') || dataRole.toLowerCase().includes('bot')) {
      return 'assistant';
    }

    // Check class names
    const className = el.className?.toLowerCase() || '';
    if (className.includes('user') || className.includes('human') || className.includes('you')) {
      return 'user';
    }
    if (className.includes('assistant') || className.includes('ai') || className.includes('bot') || className.includes('agent')) {
      return 'assistant';
    }

    // Check for avatar or icon indicators
    const hasUserAvatar = el.querySelector('[class*="user-avatar"], [class*="human-avatar"], img[alt*="you" i]');
    if (hasUserAvatar) return 'user';

    const hasAiAvatar = el.querySelector('[class*="ai-avatar"], [class*="assistant-avatar"], [class*="bot-avatar"]');
    if (hasAiAvatar) return 'assistant';

    // Check for nested role indicators
    const roleIndicator = el.querySelector('[class*="role"], [class*="author"], [class*="sender"]');
    if (roleIndicator) {
      const roleText = roleIndicator.textContent?.toLowerCase() || '';
      if (roleText.includes('you') || roleText.includes('user') || roleText.includes('human')) {
        return 'user';
      }
    }

    // Default based on position (many UIs alternate user/assistant)
    return 'assistant';
  },

  /**
   * Extract message content
   * @param {Element} el - Message element
   * @param {Object} platform - Platform config
   * @returns {string} Message content
   */
  extractContent(el, platform) {
    // Try platform-specific content selector
    if (platform.selectors?.messageContent) {
      const contentEl = el.querySelector(platform.selectors.messageContent);
      if (contentEl) {
        return this.getCleanText(contentEl);
      }
    }

    // Generic content selectors
    const contentSelectors = [
      '[class*="message-content"]',
      '[class*="message-text"]',
      '[class*="content"]',
      '[class*="text-content"]',
      '[class*="markdown"]',
      '[class*="prose"]',
      'p',
      '.text'
    ];

    for (const selector of contentSelectors) {
      const contentEl = el.querySelector(selector);
      if (contentEl) {
        const text = this.getCleanText(contentEl);
        if (text.length > 0) {
          return text;
        }
      }
    }

    // Fallback to element's own text
    return this.getCleanText(el);
  },

  /**
   * Get clean text content with code blocks preserved
   * @param {Element} el - Element to extract from
   * @returns {string} Clean text
   */
  getCleanText(el) {
    // Clone to avoid modifying original
    const clone = el.cloneNode(true);

    // Remove hidden elements
    clone.querySelectorAll('[hidden], [style*="display: none"], [aria-hidden="true"]').forEach(e => e.remove());

    // Remove navigation elements
    clone.querySelectorAll('nav, [class*="nav"], [class*="sidebar"], button, [role="button"]').forEach(e => {
      // Only remove if it doesn't contain message content
      if (!e.querySelector('[class*="content"], [class*="message"], p')) {
        e.remove();
      }
    });

    // Preserve code blocks with markers
    clone.querySelectorAll('pre, code, [class*="code-block"]').forEach(code => {
      const language = code.getAttribute('data-language') ||
                       code.className?.match(/language-(\w+)/)?.[1] ||
                       '';
      const codeText = code.textContent || '';
      code.textContent = `\n\`\`\`${language}\n${codeText}\n\`\`\`\n`;
    });

    return clone.textContent?.trim() || '';
  },

  /**
   * Extract code blocks
   * @param {Element} el - Message element
   * @returns {Array} Code blocks
   */
  extractCodeBlocks(el) {
    const blocks = [];
    const codeElements = el.querySelectorAll('pre code, pre, [class*="code-block"], [class*="CodeBlock"]');

    codeElements.forEach((code, i) => {
      const language = code.getAttribute('data-language') ||
                       code.className?.match(/language-(\w+)/)?.[1] ||
                       code.closest('pre')?.getAttribute('data-language') ||
                       'text';

      const content = code.textContent?.trim() || '';
      if (content.length > 0) {
        blocks.push({
          id: `code_${i}`,
          language: language,
          content: content
        });
      }
    });

    return blocks;
  },

  /**
   * Extract artifact references
   * @param {Element} el - Message element
   * @returns {Array} Artifact IDs
   */
  extractArtifacts(el) {
    const artifacts = [];

    // Look for artifact elements
    const artifactElements = el.querySelectorAll(
      '[data-artifact], [data-artifact-id], [class*="artifact"], a[href*="artifact"]'
    );

    artifactElements.forEach(ae => {
      const id = ae.getAttribute('data-artifact') ||
                 ae.getAttribute('data-artifact-id') ||
                 ae.getAttribute('href');
      if (id) {
        artifacts.push(id);
      }
    });

    return artifacts;
  },

  /**
   * Extract timestamp
   * @param {Element} el - Message element
   * @returns {string|null} Timestamp
   */
  extractTimestamp(el) {
    const timeSelectors = [
      'time',
      '[datetime]',
      '[data-timestamp]',
      '[class*="timestamp"]',
      '[class*="time"]',
      '[class*="date"]'
    ];

    for (const selector of timeSelectors) {
      const timeEl = el.querySelector(selector);
      if (timeEl) {
        return timeEl.getAttribute('datetime') ||
               timeEl.getAttribute('data-timestamp') ||
               timeEl.textContent?.trim() ||
               null;
      }
    }

    return null;
  },

  /**
   * Create stable hash of element or content
   * @param {Element|Object} el - Element to hash OR plain object with textContent
   * @returns {string} Hash string
   */
  hashElement(el) {
    // Handle plain objects (used in processMessages for deduplication)
    if (!el || typeof el.getAttribute !== 'function') {
      const content = (el?.textContent || '').slice(0, 300).trim();
      return this.hashString(content);
    }

    const content = (el.textContent || '').slice(0, 300).trim();
    const className = el.className || '';
    const dataId = el.getAttribute('data-message-id') || el.getAttribute('data-id') || '';

    // Use data-id if available for stable hashing
    if (dataId) {
      return `id_${dataId}`;
    }

    // Otherwise hash the content
    return this.hashString(content + (className ? className.slice(0, 50) : ''));
  },

  /**
   * Hash a string
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  },

  /**
   * Process and deduplicate final messages
   * @returns {Array} Processed messages
   */
  processMessages() {
    // Sort by order
    const sorted = [...this.capturedMessages].sort((a, b) => a.order - b.order);

    // Final deduplication by content similarity
    const unique = [];
    const contentHashes = new Set();

    for (const msg of sorted) {
      const contentHash = this.hashElement({ textContent: msg.content });
      if (!contentHashes.has(contentHash) && msg.content.trim().length > 0) {
        contentHashes.add(contentHash);
        unique.push(msg);
      }
    }

    // Re-number and clean up
    return unique.map((msg, i) => ({
      ...msg,
      order: i,
      rawHtml: undefined // Remove debug data from final output
    }));
  },

  /**
   * Find chat container element
   * @param {Object} platform - Platform config
   * @returns {Element|null}
   */
  findChatContainer(platform) {
    // Platform-specific selector
    if (platform.selectors?.chatContainer) {
      const el = document.querySelector(platform.selectors.chatContainer);
      if (el) return el;
    }

    // Generic selectors
    const selectors = [
      '[data-testid*="chat"]',
      '[class*="chat-container"]',
      '[class*="conversation-container"]',
      '[class*="messages-container"]',
      '[class*="message-list"]',
      '[role="log"]',
      '[role="main"] [class*="chat"]',
      'main [class*="messages"]'
    ];

    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (e) {
        // Invalid selector
      }
    }

    return null;
  },

  /**
   * Find scrollable element
   * @param {Element} container - Container element
   * @returns {Element}
   */
  findScrollableElement(container) {
    // Check if container itself is scrollable
    const isScrollable = (el) => {
      const style = getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
             el.scrollHeight > el.clientHeight;
    };

    if (isScrollable(container)) {
      return container;
    }

    // Check children (depth 3)
    const checkChildren = (el, depth = 0) => {
      if (depth > 3) return null;
      for (const child of el.children) {
        if (isScrollable(child)) return child;
        const found = checkChildren(child, depth + 1);
        if (found) return found;
      }
      return null;
    };

    const childScrollable = checkChildren(container);
    if (childScrollable) return childScrollable;

    // Check parents
    let parent = container.parentElement;
    while (parent && parent !== document.body) {
      if (isScrollable(parent)) return parent;
      parent = parent.parentElement;
    }

    // Fallback to container itself
    return container;
  },

  /**
   * Check if element is visible
   * @param {Element} el - Element to check
   * @returns {boolean}
   */
  isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 &&
           rect.height > 0 &&
           style.visibility !== 'hidden' &&
           style.display !== 'none' &&
           style.opacity !== '0';
  },

  /**
   * Wait helper
   * @param {number} ms - Milliseconds
   * @returns {Promise}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Stop capturing
   */
  stop() {
    this.isCapturing = false;
  }
};

// Export to window
window.ChatScraper = ChatScraper;
