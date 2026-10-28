(function () {
  var root = document.documentElement;
  // The build stamps the theme's color mode on <html> (see vite.config.ts).
  var defaultDarkMode = root.getAttribute('data-default-color-mode') !== 'light';
  var toggleLocked = root.getAttribute('data-color-mode-toggle') === 'off';
  var darkModeEnabled = defaultDarkMode;

  try {
    var storedPreference = toggleLocked ? null : localStorage.getItem('darkMode');
    if (storedPreference === 'true') darkModeEnabled = true;
    if (storedPreference === 'false') darkModeEnabled = false;
  } catch (_error) {
    darkModeEnabled = defaultDarkMode;
  }

  root.classList.toggle('dark', darkModeEnabled);
  root.style.colorScheme = darkModeEnabled ? 'dark' : 'light';
})();
