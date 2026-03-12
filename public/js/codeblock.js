/**
 * Global code block functionality
 * Handles tab switching and copy operations for enhanced code blocks
 */

window.codeBlockData = window.codeBlockData || {};

/**
 * Switch between different code tabs in a code block
 * @param {string} blockId - The ID of the code block container
 * @param {number} tabIndex - The index of the tab to switch to
 */
function switchCodeTab(blockId, tabIndex) {
  const container = document.getElementById(blockId);
  if (!container) return;

  // Update tabs
  const tabs = container.querySelectorAll('.code-block-tab');
  tabs.forEach((tab, index) => {
    tab.classList.toggle('active', index === tabIndex);
  });

  // Update content
  const contents = container.querySelectorAll('.code-block-content');
  contents.forEach((content, index) => {
    content.classList.toggle('hidden', index !== tabIndex);
    content.classList.toggle('active', index === tabIndex);
  });

  // Update language display
  const languageElement = document.getElementById(`${blockId}-language`);
  const snippets = window.codeBlockData[blockId];
  if (languageElement && snippets && snippets[tabIndex]) {
    const snippet = snippets[tabIndex];
    languageElement.textContent = snippet.label || getLanguageDisplay(snippet.language);
  }
}

/**
 * Copy code content from a code block to clipboard
 * @param {string} blockId - The ID of the code block container
 */
async function copyCodeBlock(blockId) {
  const container = document.getElementById(blockId);
  if (!container) return;

  // Find the active content
  const activeContent = container.querySelector('.code-block-content.active');
  if (!activeContent) return;

  const codeElement = activeContent.querySelector('code');
  if (!codeElement) return;

  const code = codeElement.textContent || codeElement.innerText;

  try {
    await navigator.clipboard.writeText(code);

    // Update button to show success
    const copyButton = container.querySelector('.code-block-copy-btn');
    if (copyButton) {
      const originalContent = copyButton.innerHTML;

      copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span class="text-xs font-medium">Copied!</span>
      `;

      copyButton.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.2)';

      // Show success toast
      showCopyToast();

      // Reset button after delay
      setTimeout(() => {
        copyButton.innerHTML = originalContent;
        copyButton.style.backgroundColor = '';
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to copy code:', error);

    // Show error feedback
    const copyButton = container.querySelector('.code-block-copy-btn');
    if (copyButton) {
      copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span class="text-xs font-medium">Error</span>
      `;

      setTimeout(() => {
        copyButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          <span class="text-xs font-medium">Copy</span>
        `;
      }, 2000);
    }
  }
}

/**
 * Get display name for a programming language
 * @param {string} language - The language identifier
 * @returns {string} Display name for the language
 */
function getLanguageDisplay(language) {
  const languageMap = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    solidity: 'Solidity',
    bash: 'Bash',
    shell: 'Shell',
    json: 'JSON',
    css: 'CSS',
    html: 'HTML',
    sql: 'SQL',
    yaml: 'YAML',
    toml: 'TOML',
    go: 'Go',
    rust: 'Rust',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
  };

  return languageMap[language.toLowerCase()] || language.toUpperCase();
}

/**
 * Show a copy success toast
 */
function showCopyToast() {
  // Remove any existing toast
  const existingToast = document.querySelector('.copy-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.innerText = 'Copied to clipboard!';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: var(--background-color);
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-family: var(--mono-font);
    font-size: 0.875rem;
    font-weight: 500;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  document.body.appendChild(toast);

  // Show the toast
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Remove toast after delay
  setTimeout(() => {
    toast.style.opacity = '0';

    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// Export functions for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    switchCodeTab,
    copyCodeBlock,
    getLanguageDisplay,
    showCopyToast,
  };
}
