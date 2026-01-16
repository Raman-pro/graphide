/*---------------------------------------------------------------------------------------------
 *  GraphIDE View Pane
 *  Stage 1.5: Enhanced UI with loading states and clear button
 *--------------------------------------------------------------------------------------------*/

import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IRequestService, asJson } from '../../../../platform/request/common/request.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IFileDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import * as dom from '../../../../base/browser/dom.js';

interface ChatMessage {
    role: 'user' | 'system';
    content: string;
    timestamp: Date;
}

export class GraphIDEViewPane extends ViewPane {

    static readonly ID = 'graphide.panel';

    private messagesContainer!: HTMLElement;
    private inputContainer!: HTMLElement;
    private inputElement!: HTMLTextAreaElement;
    private sendButton!: HTMLButtonElement;
    private clearButton!: HTMLButtonElement;
    private messages: ChatMessage[] = [];
    private isLoading = false;

    constructor(
        options: IViewPaneOptions,
        @IKeybindingService keybindingService: IKeybindingService,
        @IContextMenuService contextMenuService: IContextMenuService,
        @IConfigurationService configurationService: IConfigurationService,
        @IContextKeyService contextKeyService: IContextKeyService,
        @IViewDescriptorService viewDescriptorService: IViewDescriptorService,
        @IInstantiationService instantiationService: IInstantiationService,
        @IOpenerService openerService: IOpenerService,
        @IThemeService themeService: IThemeService,
        @IHoverService hoverService: IHoverService,
        @IEditorService private readonly editorService: IEditorService,
        @IRequestService private readonly requestService: IRequestService,
        @IFileDialogService private readonly fileDialogService: IFileDialogService
    ) {
        super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
    }

    protected override renderBody(container: HTMLElement): void {
        super.renderBody(container);

        // Main container styling - Cursor-like feel (clean, modern)
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.padding = '0px'; // Remove padding for full width
        container.style.backgroundColor = 'var(--vscode-sideBar-background)'; // Match sidebar

        // Header Area
        const header = dom.append(container, dom.$('.graphide-header'));
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '10px 15px';
        header.style.borderBottom = '1px solid var(--vscode-sideBarSectionHeader-border)';
        header.style.backgroundColor = 'var(--vscode-sideBarSectionHeader-background)';

        const title = dom.append(header, dom.$('.graphide-title'));
        title.textContent = 'Analyze Code';
        title.style.fontWeight = '600';
        title.style.fontSize = '11px';
        title.style.textTransform = 'uppercase';
        title.style.letterSpacing = '0.5px';
        title.style.color = 'var(--vscode-sideBarTitle-foreground)';

        const actionsContainer = dom.append(header, dom.$('.graphide-actions'));
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = '8px';

        this.clearButton = dom.append(actionsContainer, dom.$('div.graphide-icon-button')) as HTMLButtonElement;
        this.clearButton.title = 'Clear Chat';
        this.clearButton.classList.add('codicon', 'codicon-clear-all');
        this.clearButton.style.cursor = 'pointer';
        this.clearButton.style.padding = '4px';
        this.clearButton.style.color = 'var(--vscode-icon-foreground)';
        this.clearButton.addEventListener('click', () => this.clearHistory());

        // Analyze Button Container (Prominent)
        const analyzeContainer = dom.append(container, dom.$('.graphide-analyze-section'));
        analyzeContainer.style.padding = '15px';
        analyzeContainer.style.borderBottom = '1px solid var(--vscode-panel-border)';

        const analyzeBtn = dom.append(analyzeContainer, dom.$('button.graphide-analyze-btn'));
        analyzeBtn.textContent = '✨ Analyze Files...';
        analyzeBtn.style.width = '100%';
        analyzeBtn.style.padding = '8px 12px';
        analyzeBtn.style.backgroundColor = 'var(--vscode-button-background)';
        analyzeBtn.style.color = 'var(--vscode-button-foreground)';
        analyzeBtn.style.border = 'none';
        analyzeBtn.style.borderRadius = '4px';
        analyzeBtn.style.cursor = 'pointer';
        analyzeBtn.style.fontSize = '12px';
        analyzeBtn.style.fontWeight = '500';
        analyzeBtn.style.display = 'flex';
        analyzeBtn.style.alignItems = 'center';
        analyzeBtn.style.justifyContent = 'center';
        analyzeBtn.style.gap = '6px';

        analyzeBtn.onmouseover = () => { analyzeBtn.style.backgroundColor = 'var(--vscode-button-hoverBackground)'; };
        analyzeBtn.onmouseout = () => { analyzeBtn.style.backgroundColor = 'var(--vscode-button-background)'; };
        analyzeBtn.addEventListener('click', () => this.handleAnalyze());

        // Messages area (scrollable)
        this.messagesContainer = dom.append(container, dom.$('.graphide-messages'));
        this.messagesContainer.style.flex = '1';
        this.messagesContainer.style.overflowY = 'auto';
        this.messagesContainer.style.padding = '15px';

        // Welcome message
        this.addMessage('system', '👋 **Ready to help!**\n\nClick "Analyze Files" to give me context, or just start chatting below.');

        // Input container
        const inputWrapper = dom.append(container, dom.$('.graphide-input-wrapper'));
        inputWrapper.style.padding = '15px';
        inputWrapper.style.borderTop = '1px solid var(--vscode-panel-border)';
        inputWrapper.style.backgroundColor = 'var(--vscode-sideBar-background)';

        this.inputContainer = dom.append(inputWrapper, dom.$('.graphide-input-container'));
        this.inputContainer.style.display = 'flex';
        this.inputContainer.style.gap = '8px';
        this.inputContainer.style.backgroundColor = 'var(--vscode-input-background)';
        this.inputContainer.style.borderRadius = '6px';
        this.inputContainer.style.padding = '8px';
        this.inputContainer.style.border = '1px solid var(--vscode-input-border)';

        // Text input
        this.inputElement = dom.append(this.inputContainer, dom.$('textarea.graphide-input')) as HTMLTextAreaElement;
        this.inputElement.placeholder = 'Ask a question...';
        this.inputElement.style.flex = '1';
        this.inputElement.style.resize = 'none';
        this.inputElement.style.border = 'none';
        this.inputElement.style.outline = 'none';
        this.inputElement.style.backgroundColor = 'transparent'; // Inherit from container
        this.inputElement.style.color = 'var(--vscode-input-foreground)';
        this.inputElement.style.fontFamily = 'var(--vscode-font-family)';
        this.inputElement.style.fontSize = '13px';
        this.inputElement.style.lineHeight = '1.4';
        this.inputElement.rows = 1;

        // Auto-resize textarea
        this.inputElement.addEventListener('input', () => {
            this.inputElement.style.height = 'auto';
            this.inputElement.style.height = (this.inputElement.scrollHeight) + 'px';
        });

        // Handle Enter key to send
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Send button (Icon)
        this.sendButton = dom.append(this.inputContainer, dom.$('div.graphide-send-btn')) as HTMLButtonElement;
        this.sendButton.classList.add('codicon', 'codicon-send');
        this.sendButton.style.cursor = 'pointer';
        this.sendButton.style.padding = '8px';
        this.sendButton.style.alignSelf = 'flex-end';
        this.sendButton.style.borderRadius = '4px';
        this.sendButton.title = 'Send';

        this.sendButton.onmouseover = () => { this.sendButton.style.backgroundColor = 'var(--vscode-toolbar-hoverBackground)'; };
        this.sendButton.onmouseout = () => { this.sendButton.style.backgroundColor = 'transparent'; };
        this.sendButton.addEventListener('click', () => this.handleSend());
    }

    private clearHistory(): void {
        this.messages = [];
        dom.clearNode(this.messagesContainer);
        this.addMessage('system', '🗑️ Chat cleared. How can I help you?');
    }

    private addMessage(role: 'user' | 'system', content: string): void {
        const message: ChatMessage = { role, content, timestamp: new Date() };
        this.messages.push(message);
        this.renderMessage(message);
    }

    private renderMessage(message: ChatMessage): void {
        const messageEl = dom.append(this.messagesContainer, dom.$('.graphide-message'));
        messageEl.style.marginBottom = '12px';
        messageEl.style.padding = '10px';
        messageEl.style.borderRadius = '8px';

        if (message.role === 'user') {
            messageEl.style.backgroundColor = 'var(--vscode-button-background)';
            messageEl.style.color = 'var(--vscode-button-foreground)';
            messageEl.style.marginLeft = '15%';
        } else {
            messageEl.style.backgroundColor = 'var(--vscode-editorWidget-background)';
            messageEl.style.marginRight = '15%';
            messageEl.style.border = '1px solid var(--vscode-panel-border)';
        }

        // Role label
        const roleEl = dom.append(messageEl, dom.$('.graphide-message-role'));
        roleEl.textContent = message.role === 'user' ? '👤 You' : '🤖 Assistant';
        roleEl.style.fontWeight = '600';
        roleEl.style.fontSize = '11px';
        roleEl.style.marginBottom = '6px';
        roleEl.style.opacity = '0.8';

        // Content - use textContent (safe) instead of innerHTML
        const contentEl = dom.append(messageEl, dom.$('.graphide-message-content'));
        contentEl.textContent = message.content;
        contentEl.style.whiteSpace = 'pre-wrap';
        contentEl.style.fontSize = '13px';
        contentEl.style.lineHeight = '1.4';

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    private setLoading(loading: boolean): void {
        this.isLoading = loading;
        this.inputElement.disabled = loading;
        this.sendButton.style.opacity = loading ? '0.5' : '1';
        this.sendButton.style.cursor = loading ? 'not-allowed' : 'pointer';

        if (loading) {
            this.sendButton.classList.remove('codicon-send');
            this.sendButton.classList.add('codicon-loading', 'codicon-modifier-spin');
        } else {
            this.sendButton.classList.remove('codicon-loading', 'codicon-modifier-spin');
            this.sendButton.classList.add('codicon-send');
        }
    }

    private async handleSend(): Promise<void> {
        const text = this.inputElement.value.trim();
        if (!text || this.isLoading) {
            return;
        }

        // Add user message
        this.addMessage('user', text);
        this.inputElement.value = '';

        // Show loading
        this.setLoading(true);
        // this.addMessage('system', '🔄 *Thinking...*'); // Less noisy loading

        // Get editor context
        let filePath = '';
        let language = '';
        let codeRange: { startLine: number; endLine: number } | undefined;

        const activeResource = this.editorService.activeEditor?.resource;
        if (activeResource) {
            filePath = activeResource.fsPath;
        }

        const activeEditor = this.editorService.activeTextEditorControl;

        if (activeEditor && 'getSelection' in activeEditor) {
            const selection = (activeEditor as any).getSelection();
            if (selection && !selection.isEmpty()) {
                codeRange = {
                    startLine: selection.startLineNumber,
                    endLine: selection.endLineNumber
                };
            }
        }

        if (activeEditor && 'getModel' in activeEditor) {
            const model = (activeEditor as any).getModel();
            if (model && 'getLanguageId' in model) {
                language = model.getLanguageId();
            }
        }

        const payload = {
            intent: 'free_text',
            filePath: filePath || '/unknown',
            language: language || 'unknown',
            codeRange: codeRange,
            userQuery: text
        };

        try {
            const context = await this.requestService.request({
                type: 'POST',
                url: 'http://localhost:8000/agent/request',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(payload)
            }, CancellationToken.None);

            const data = await asJson<any>(context);

            // Remove loading message
            this.messages.pop();
            this.messagesContainer.lastChild?.remove();
            this.setLoading(false);

            if (data?.agentOutputs && data.agentOutputs.length > 0) {
                for (const output of data.agentOutputs) {
                    this.addMessage('system', output.markdownOutput || output.message || 'No response');
                }
            } else if (data?.message) {
                this.addMessage('system', data.message);
            } else {
                this.addMessage('system', `Status: ${data?.status || 'unknown'}`);
            }
        } catch (error) {
            // Remove loading message
            this.messages.pop();
            this.messagesContainer.lastChild?.remove();
            this.setLoading(false);

            const errorMessage = error instanceof Error ? error.message : String(error);
            this.addMessage('system', `⚠️ **Connection Error**\n\n${errorMessage}\n\nMake sure the backend is running:\n\`\`\`\ncd agent-runtime\nuvicorn main:app --reload\n\`\`\``);
        }
    }

    public async handleAnalyze(): Promise<void> {
        const uris = await this.fileDialogService.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: true,
            canSelectMany: true,
            openLabel: 'Analyze',
            title: 'Select Files to Analyze'
        });

        if (uris && uris.length > 0) {
            const fileList = uris.map(u => u.fsPath).join('\n- ');
            this.addMessage('user', `Please analyze these files:\n- ${fileList}`);
            this.addMessage('system', `📊 **Analysis Started**\n\nI'm reading ${uris.length} file(s)...`);

            // Here you would trigger the actual analysis request
            // For now, we simulate a response after a delay
            setTimeout(() => {
                this.addMessage('system', `✅ Analysis complete! I've indexed these files. You can now ask questions about them.`);
            }, 1500);
        }
    }

    protected override layoutBody(height: number, width: number): void {
        super.layoutBody(height, width);
    }
}
