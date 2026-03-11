import logger from './logger';

const processorLogger = logger;

/**
 * Add accessibility features to links in the document.
 */
export const processLinks = (element: HTMLElement): void => {
  const links = element.querySelectorAll('a:not([data-processed])');
  processorLogger.debug(`Processing ${links.length} new links for accessibility`);

  links.forEach((link) => {
    const linkElement = link as HTMLAnchorElement;

    linkElement.setAttribute('tabindex', '0');
    linkElement.setAttribute('data-processed', 'true');

    const handleKeydown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Enter') {
        keyboardEvent.preventDefault();
        linkElement.click();
      }
    };

    linkElement.addEventListener('keydown', handleKeydown);
  });
};

const detectChainFromAddress = (address: string): string => {
  if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address)) {
    return 'btc';
  }

  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }

  return 'eth';
};

function createInlineIcon(icon: string, width: string = '14', height: string = '14'): HTMLElement {
  const iconElement = document.createElement('iconify-icon');
  iconElement.setAttribute('icon', icon);
  iconElement.setAttribute('width', width);
  iconElement.setAttribute('height', height);
  iconElement.setAttribute('aria-hidden', 'true');
  iconElement.setAttribute('inline', '');
  return iconElement;
}

/**
 * Process wallet address elements by adding copy buttons and chain icons.
 */
export const processWalletAddresses = (element: HTMLElement): void => {
  const walletAddresses = element.querySelectorAll('.wallet-address:not([data-copy-processed])');
  processorLogger.debug(`Processing ${walletAddresses.length} new wallet addresses`);

  walletAddresses.forEach((walletElement) => {
    const address = walletElement.getAttribute('data-address');
    const chainOverride = walletElement.getAttribute('data-chain');

    if (!address) {
      processorLogger.warn('Wallet element without data-address attribute found');
      return;
    }

    walletElement.setAttribute('data-copy-processed', 'true');
    processorLogger.debug(`Adding copy button for address: ${address.substring(0, 4)}...`);

    const chain = chainOverride || detectChainFromAddress(address);

    const iconContainer = document.createElement('span');
    iconContainer.className = 'chain-icon-container';

    const chainIcon = document.createElement('iconify-icon');
    chainIcon.setAttribute('icon', `token:${chain}`);
    chainIcon.setAttribute('width', '18');
    chainIcon.setAttribute('height', '18');
    chainIcon.className = 'chain-icon';

    iconContainer.appendChild(chainIcon);
    walletElement.insertBefore(iconContainer, walletElement.firstChild);

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.setAttribute('aria-label', 'Copy to clipboard');
    copyButton.setAttribute('title', 'Copy to clipboard');
    copyButton.setAttribute('type', 'button');
    copyButton.appendChild(createInlineIcon('mingcute:copy-line'));

    const handleCopyClick = async (event: Event) => {
      event.stopPropagation();

      try {
        await navigator.clipboard.writeText(address);
        processorLogger.debug(`Copied address to clipboard: ${address.substring(0, 4)}...`);

        copyButton.replaceChildren(createInlineIcon('mingcute:check-line'));
        showCopyToast();

        setTimeout(() => {
          copyButton.replaceChildren(createInlineIcon('mingcute:copy-line'));
        }, 1500);
      } catch (error) {
        processorLogger.error('Failed to copy to clipboard:', error);
      }
    };

    copyButton.addEventListener('click', handleCopyClick);
    walletElement.appendChild(copyButton);
  });
};

let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const showCopyToast = (): void => {
  if (toastTimeout) return;

  const toast = document.createElement('div');
  toast.innerText = 'Copied to clipboard!';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-family: var(--mono-font);
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';

    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
      toastTimeout = null;
    }, 300);
  }, 1500);
};
