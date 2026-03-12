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

function createInlineIcon(icon: 'copy' | 'check', width: string = '14', height: string = '14') {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const iconElement = document.createElementNS(svgNamespace, 'svg');
  iconElement.setAttribute('width', width);
  iconElement.setAttribute('height', height);
  iconElement.setAttribute('viewBox', '0 0 24 24');
  iconElement.setAttribute('fill', 'none');
  iconElement.setAttribute('stroke', 'currentColor');
  iconElement.setAttribute('stroke-width', '2');
  iconElement.setAttribute('stroke-linecap', 'round');
  iconElement.setAttribute('stroke-linejoin', 'round');
  iconElement.setAttribute('aria-hidden', 'true');

  const pathDefinitions =
    icon === 'check'
      ? ['M20 6 9 17l-5-5']
      : ['M9 9h13v13H9z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'];

  for (const definition of pathDefinitions) {
    const pathElement = document.createElementNS(svgNamespace, 'path');
    pathElement.setAttribute('d', definition);
    iconElement.appendChild(pathElement);
  }

  return iconElement;
}

function createChainBadge(chain: string): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = 'chain-icon';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = chain.slice(0, 3).toUpperCase();
  return badge;
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
    iconContainer.appendChild(createChainBadge(chain));
    walletElement.insertBefore(iconContainer, walletElement.firstChild);

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.setAttribute('aria-label', 'Copy to clipboard');
    copyButton.setAttribute('title', 'Copy to clipboard');
    copyButton.setAttribute('type', 'button');
    copyButton.appendChild(createInlineIcon('copy'));

    const handleCopyClick = async (event: Event) => {
      event.stopPropagation();

      try {
        await navigator.clipboard.writeText(address);
        processorLogger.debug(`Copied address to clipboard: ${address.substring(0, 4)}...`);

        copyButton.replaceChildren(createInlineIcon('check'));
        showCopyToast();

        setTimeout(() => {
          copyButton.replaceChildren(createInlineIcon('copy'));
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
