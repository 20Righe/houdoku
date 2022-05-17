export default {
  write(entryName: string, data: any) {
    window.localStorage.setItem(entryName, `${data}`);
  },

  read(entryName: string): string | null {
    return window.localStorage.getItem(entryName);
  },

  remove(entryName: string): void {
    return window.localStorage.removeItem(entryName);
  },

  downloadSettings() {
    return window.localStorage.getItem('library-series-list');
  },

  restoreSettings(settings: any) {
    return window.localStorage.setItem('library-series-list', settings);
  },
};
