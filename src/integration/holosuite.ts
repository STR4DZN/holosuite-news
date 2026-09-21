export interface HoloSuiteRegistration {
  id: string;
  title: string;
  icon: string;
  premium: boolean;
  playerVisible: boolean;
  description: string;
  featureId: string;
  open: () => unknown;
}

export interface HoloSuiteApiLike {
  registerApp(app: HoloSuiteRegistration): unknown;
  unregisterApp?(id: string): boolean;
}

export interface HoloSuiteAdapter {
  getApi(): HoloSuiteApiLike | null | undefined;
  currentUserIsGM(): boolean;
  openManager(): unknown;
  openReader(): unknown;
}

const successfulAdapters = new WeakMap<object, HoloSuiteApiLike["registerApp"]>();

export function registerWithHoloSuite(adapter: HoloSuiteAdapter): boolean {
  const api = adapter.getApi();
  if (!api?.registerApp) return false;
  if (successfulAdapters.get(adapter) === api.registerApp) return true;
  api.registerApp({
    id: "holosuite-news",
    title: "HoloNews",
    icon: "fa-solid fa-newspaper",
    premium: false,
    playerVisible: true,
    description: "Jornal e rede de notícias do universo da campanha.",
    featureId: "holosuite-news",
    open: () => adapter.currentUserIsGM() ? adapter.openManager() : adapter.openReader()
  });
  successfulAdapters.set(adapter, api.registerApp);
  return true;
}

export function resetHoloSuiteRegistrationForTests(adapter: object): void {
  successfulAdapters.delete(adapter);
}
