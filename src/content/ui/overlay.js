// Overlay UI - Main UI overlay for capture process
// Sci-fi themed overlay with progress visualization

const Overlay = {
    overlay: null,
    isVisible: false,
    isCapturing: false,
    capturedData: null,
    progressAnimation: null,
    currentPhase: null,

    /**
     * Create and show overlay
     * @param {Object} platform - Platform configuration
     */
    show(platform) {
        if (this.isVisible) return;

        // Create overlay element
        this.overlay = document.createElement('div');
        this.overlay.id = 'kriptik-import-overlay';
        this.overlay.innerHTML = this.getTemplate(platform);
        document.body.appendChild(this.overlay);

        // Initialize progress animation
        const animationContainer = this.overlay.querySelector('.animation-container');
        const canvas = document.createElement('canvas');
        animationContainer.appendChild(canvas);
        this.progressAnimation = new ProgressAnimation(canvas);
        this.progressAnimation.start();

        // Bind events
        this.bindEvents(platform);

        // Add initial log entries
        this.addLog('[INIT] Import assistant activated');
        this.addLog(`[SCAN] Platform identified: ${platform.name}`);
        this.addLog('[READY] Awaiting capture command...');

        this.isVisible = true;

        // Trigger entrance animation
        setTimeout(() => {
            this.overlay.classList.add('visible');
        }, 10);
    },

    /**
     * Hide overlay
     */
    hide() {
        if (!this.isVisible || this.isCapturing) return;

        this.overlay.classList.remove('visible');

        setTimeout(() => {
            if (this.progressAnimation) {
                this.progressAnimation.stop();
            }
            this.overlay.remove();
            this.isVisible = false;
        }, 300);
    },

    /**
   * Get overlay HTML template
   * @param {Object} platform - Platform configuration
   * @returns {string} HTML template
   */
    getTemplate(platform) {
        return `
      <div class="import-overlay-backdrop"></div>
      <div class="import-overlay-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="header-logo">
              <img src="${chrome.runtime.getURL('assets/logo.png')}" alt="KripTik AI" />
            </div>
            <div class="header-text">
              <h2 class="panel-title">PROJECT IMPORT ASSISTANT</h2>
              <div class="panel-subtitle">${platform.name} • Context Capture System</div>
            </div>
          </div>
          <button class="close-btn" aria-label="Close">×</button>
        </div>

        <div class="panel-body">
          <div class="status-indicator">
            <div class="status-dot"></div>
            <span class="status-text">Ready to capture</span>
          </div>

          <div class="animation-container">
            <!-- Canvas will be inserted here -->
          </div>

          <div class="phase-display">
            <div class="phase-name">STANDBY</div>
            <div class="phase-message">Awaiting capture initialization...</div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value" id="stat-messages">--</span>
              <span class="stat-label">Messages</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="stat-errors">--</span>
              <span class="stat-label">Errors</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="stat-files">--</span>
              <span class="stat-label">Files</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-primary" id="btn-capture">
              <span class="btn-icon">▶</span>
              <span class="btn-text">START CAPTURE</span>
            </button>
            <button class="btn btn-secondary" id="btn-export" disabled>
              <span class="btn-icon">↓</span>
              <span class="btn-text">EXPORT</span>
            </button>
          </div>

          <div class="progress-log">
            <div class="log-header">
              <span class="log-indicator"></span>
              SYSTEM LOG
            </div>
            <div class="log-content" id="log-content"></div>
          </div>
        </div>

        <div class="panel-footer">
          <div class="footer-text">
            Powered by <strong>KripTik AI</strong> • Secure Local Processing
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Bind event listeners
     * @param {Object} platform - Platform configuration
     */
    bindEvents(platform) {
        // Close button
        this.overlay.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Backdrop click (only if not capturing)
        this.overlay.querySelector('.import-overlay-backdrop').addEventListener('click', () => {
            if (!this.isCapturing) this.hide();
        });

        // Start capture button
        this.overlay.querySelector('#btn-capture').addEventListener('click', () => {
            this.startCapture(platform);
        });

        // Export button
        this.overlay.querySelector('#btn-export').addEventListener('click', () => {
            this.triggerExport(platform);
        });
    },

    /**
     * Start the capture process
     * @param {Object} platform - Platform configuration
     */
    async startCapture(platform) {
        if (this.isCapturing) return;
        this.isCapturing = true;

        const captureBtn = this.overlay.querySelector('#btn-capture');
        captureBtn.disabled = true;
        captureBtn.querySelector('.btn-text').textContent = 'CAPTURING...';

        this.updateStatus('capturing', 'Capture in progress');
        this.addLog('[START] Initiating capture sequence...');

        try {
            // Initialize capture data
            const capturedData = {
                platform: platform.id,
                projectName: platform.projectId || 'unknown-project',
                capturedAt: new Date().toISOString()
            };

            // Phase 1: Initialize
            await this.runPhase('init', async () => {
                await this.wait(1500);
            });

            // Phase 2: Scan
            await this.runPhase('scan', async () => {
                await this.wait(2000);
            });

            // Phase 3: Extract chat history
            capturedData.chatHistory = await this.runPhase('extract', async (updateProgress) => {
                return await ChatScraper.captureFullHistory(platform, (progress) => {
                    updateProgress(progress.progress);
                    this.updatePhaseMessage(progress.message);
                    if (progress.count) {
                        this.updateStat('messages', progress.count);
                    }
                });
            });

            // Phase  4: Error analysis
            const errorData = await this.runPhase('errors', async () => {
                const data = ErrorScraper.getAll(platform);
                this.updateStat('errors', data.errors.length);
                this.addLog(`[ERROR] Captured ${data.errors.length} error records`);
                return data;
            });
            capturedData.errors = errorData.errors;
            capturedData.consoleLogs = errorData.consoleLogs;

            // Phase 5: File tree
            capturedData.fileTree = await this.runPhase('files', async (updateProgress) => {
                return await FileTreeScraper.capture(platform, (progress) => {
                    updateProgress(progress.progress);
                    this.updatePhaseMessage(progress.message);
                    if (progress.count) {
                        this.updateStat('files', progress.count);
                    }
                });
            });

            // Phase 6: Artifacts (if supported)
            if (PlatformRegistry.hasFeature(platform, 'artifacts')) {
                capturedData.artifacts = await this.runPhase('artifacts', async (updateProgress) => {
                    return await ArtifactScraper.capture(platform, (progress) => {
                        updateProgress(progress.progress);
                        this.updatePhaseMessage(progress.message);
                    });
                });
            }

            // Phase 7: Diffs (if supported)
            if (PlatformRegistry.hasFeature(platform, 'diffTracking') ||
                PlatformRegistry.hasFeature(platform, 'fileChanges')) {
                capturedData.diffs = await this.runPhase('diffs', async (updateProgress) => {
                    return await DiffScraper.capture(platform, (progress) => {
                        updateProgress(progress.progress);
                        this.updatePhaseMessage(progress.message);
                    });
                });
            }

            // Phase 8: Terminal (if supported)
            if (PlatformRegistry.hasFeature(platform, 'terminal')) {
                capturedData.terminal = await this.runPhase('terminal', async (updateProgress) => {
                    return await TerminalScraper.capture(platform, (progress) => {
                        updateProgress(progress.progress);
                        this.updatePhaseMessage(progress.message);
                    });
                });
            }

            // Phase 9: Compile metadata
            await this.runPhase('compile', async () => {
                await this.wait(1500);
                this.addLog('[COMPILE] Building metadata package...');
            });

            // Phase 10: Complete
            await this.runPhase('complete', async () => {
                await this.wait(500);
            });

            // Store captured data
            this.capturedData = capturedData;

            // Enable export button
            this.updateStatus('complete', 'Capture complete!');
            captureBtn.querySelector('.btn-text').textContent = 'CAPTURE COMPLETE';

            const exportBtn = this.overlay.querySelector('#btn-export');
            exportBtn.disabled = false;
            exportBtn.classList.add('ready');

            this.addLog('[DONE] Capture sequence complete');
            this.addLog(`[DATA] ${capturedData.chatHistory?.length || 0} messages, ${capturedData.errors?.length || 0} errors, ${capturedData.fileTree?.stats?.totalFiles || 0} files`);
            this.addLog('[READY] Click EXPORT to trigger platform export');

        } catch (error) {
            console.error('[Overlay] Capture error:', error);
            this.addLog(`[ERROR] Capture failed: ${error.message}`);
            this.updateStatus('error', 'Capture failed');

            captureBtn.disabled = false;
            captureBtn.querySelector('.btn-text').textContent = 'RETRY CAPTURE';
        }

        this.isCapturing = false;
    },

    /**
     * Run a capture phase
     * @param {string} phaseId - Phase ID
     * @param {function} callback - Phase callback function
     * @returns {Promise<*>} Phase result
     */
    async runPhase(phaseId, callback) {
        const phase = CapturePhases.getPhase(phaseId);
        if (!phase) return;

        this.currentPhase = phaseId;
        this.progressAnimation.setPhase(phaseId);

        // Update UI
        this.overlay.querySelector('.phase-name').textContent = phase.name;
        this.overlay.querySelector('.phase-message').textContent = CapturePhases.getRandomMessage(phaseId);

        this.addLog(`[${phase.name}] ${phase.messages[0]}`);

        // Progress updater
        const updateProgress = (progress) => {
            const overallProgress = CapturePhases.getProgressForPhase(phaseId, progress);
            this.progressAnimation.setProgress(overallProgress);
        };

        // Run the phase
        const result = await callback(updateProgress);

        // Complete phase
        const overallProgress = CapturePhases.getProgressForPhase(phaseId, 100);
        this.progressAnimation.setProgress(overallProgress);

        return result;
    },

    /**
     * Trigger platform export
     * @param {Object} platform - Platform configuration
     */
    async triggerExport(platform) {
        if (!this.capturedData) return;

        this.addLog('[EXPORT] Preparing export handler...');

        try {
            // Get appropriate export handler
            const ExportHandler = this.getExportHandler(platform);
            const handler = new ExportHandler(platform);

            // Set captured data
            handler.setCapturedData(this.capturedData);

            this.addLog(`[EXPORT] Using ${platform.exportMechanism} export method`);

            // Execute export
            const success = await handler.export();

            if (success) {
                this.addLog('[SUCCESS] Export initiated successfully');
                this.updateStatus('exported', 'Export complete');
            } else {
                this.addLog('[ERROR] Export failed');
            }
        } catch (error) {
            console.error('[Overlay] Export error:', error);
            this.addLog(`[ERROR] Export failed: ${error.message}`);
        }
    },

    /**
     * Get export handler class for platform
     * @param {Object} platform - Platform configuration
     * @returns {class} Export handler class
     */
    getExportHandler(platform) {
        switch (platform.exportMechanism) {
            case 'zip-download':
                return DownloadZipHandler;
            case 'copy-code':
                return CopyCodeHandler;
            case 'github-export':
                return GitHubExportHandler;
            case 'api':
                return APIExportHandler;
            default:
                return DownloadZipHandler;
        }
    },

    /**
     * Update status indicator
     * @param {string} status - Status type
     * @param {string} text - Status text
     */
    updateStatus(status, text) {
        const statusDot = this.overlay.querySelector('.status-dot');
        const statusText = this.overlay.querySelector('.status-text');

        statusDot.className = `status-dot status-${status}`;
        statusText.textContent = text;
    },

    /**
     * Update phase message
     * @param {string} message - Message text
     */
    updatePhaseMessage(message) {
        this.overlay.querySelector('.phase-message').textContent = message;
    },

    /**
     * Update stat value
     * @param {string} statId - Stat ID (messages, errors, files)
     * @param {number} value - Stat value
     */
    updateStat(statId, value) {
        const statEl = this.overlay.querySelector(`#stat-${statId}`);
        if (statEl) {
            statEl.textContent = value;
        }
    },

    /**
     * Add log entry
     * @param {string} message - Log message
     */
    addLog(message) {
        const logContent = this.overlay.querySelector('#log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        logContent.appendChild(entry);

        // Auto-scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;

        // Keep only last 50 entries
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.firstChild);
        }
    },

    /**
     * Wait helper
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after wait
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

window.Overlay = Overlay;
