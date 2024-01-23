const EXPORTED_SYMBOLS = [];

const { XPCOMUtils } = ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');
const Services = globalThis.Services || ChromeUtils.import('resource://gre/modules/Services.jsm').Services;
XPCOMUtils.defineLazyModuleGetters(this, {
  LangPackMatcher: "resource://gre/modules/LangPackMatcher.jsm",
});

// Register the available localization sources
Services.obs.addObserver(async () => {
  console.log('Loading custom localization sources!');
  const l10nLocales =  await LangPackMatcher.getAvailableLocales();
  if (!l10nLocales.includes('en-US')) l10nLocales.push('en-US');
  const l10nSource = new L10nFileSource('pwa', 'app', l10nLocales, 'resource://pwa/localization/{locale}/');
  L10nRegistry.getInstance().registerSources([l10nSource]);
}, 'final-ui-startup');
