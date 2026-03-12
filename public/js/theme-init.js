(function () {
  try {
    var storedPreference = localStorage.getItem('darkMode');
    var darkModeEnabled = storedPreference !== 'false';

    document.documentElement.classList.toggle('dark', darkModeEnabled);
    document.documentElement.style.colorScheme = darkModeEnabled ? 'dark' : 'light';
  } catch (_error) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();
