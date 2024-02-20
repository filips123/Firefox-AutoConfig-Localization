# Issue with Firefox AutoConfig Localization

This issue contains a minimal reproducible example for an issue with Firefox Fluent localization when loading bundles using AutoConfig scripting.

The problem is that when my own resources and normal Firefox resources are loaded at the same time, the localization system breaks and returns only English messages, regardless of what the chosen locale is. Interestingly, when only my resources (or only Firefox resources) are loaded, they seem to work fine.

See more details [here](https://github.com/filips123/PWAsForFirefox/issues/340#issuecomment-1880122284).

## Update

This issue has been solved. The solution is to register each language separately and include it into the same metasource as normal language pack for that language. You can see the fix implemented [here](https://github.com/filips123/PWAsForFirefox/commit/ed95d39388e89f143d9031900ae66366a1ce946c).

## Steps to Reproduce

## Preparation

1. Copy your Firefox installation into the `runtime` directory.
2. Rename `profile/chrome/pwa/localization/sl/` directory into directory for your preferred language (must be non-English), or keep it `sl` for Slovene.
3. Run Firefox from the root of this repository with: `runtime/firefox --profile profile`
4. Change Firefox language into the same language that you used for the previously mentioned directory.
5. Close Firefox and start it again with command from step 2.
6. Open the browser toolbox console.

## Basic Testing

Create a `Localization` instance with a few built-in Firefox resources and confirm that they are translated into your language:

```js
loc1 = new Localization(["browser/newtab/onboarding.ftl", "branding/brand.ftl"], true)
loc1.formatValueSync("onboarding-welcome-header") // "Dobrodošli v Firefoxu"
```

Create another `Localization` instance with only custom resources from this repository and also confirm that they are also translated into your language:

```js
loc2 = new Localization(["pwa/example.ftl"], true)
loc2.formatValueSync("hello-world") // "Pozdravljen svet!" 
```

Create a third localization instance that includes both built-in Firefox resources and our custom resources and try to translate any message:

```js
loc3 = new Localization(["browser/newtab/onboarding.ftl", "branding/brand.ftl", "pwa/example.ftl"], true)
loc3.formatValueSync("onboarding-welcome-header") // "Welcome to Firefox"
loc3.formatValueSync("hello-world") // "Hello World!"
```

All messages are returned in English, even though the configured language is different and that all resources contain translations for the configured language. This is the described bug.

## More Testing

Still in a developer toolbox, create a helper function:

```js
async function getBundles (locales, resources) {
  const registry = L10nRegistry.getInstance()
  const generator = registry.generateBundles(locales, resources)
  const bundles = []
  while (true) {
    const result = await generator.next()
    if (result.done) break
    bundles.push(result.value)
  }
  return bundles
}
```

This is a function that returns all bundles for the specified locales and resource IDs. Normally, this should return two bundles, one for each language.

Check that two bundles are returned when loading built-in Firefox resources, and that they translate messages correctly:

```js
bundles1 = await getBundles(["sl", "en-US"], ["browser/newtab/onboarding.ftl", "branding/brand.ftl"])
// Array [ FluentBundle, FluentBundle ]
// 0: FluentBundle { locales: (1) [ "sl" ] }
// 1: FluentBundle { locales: (1) [ "en-US" ] }

bundles1[0].formatPattern(bundles1[0].getMessage("onboarding-welcome-header").value)
// "Dobrodošli v Firefoxu"

bundles1[1].formatPattern(bundles1[1].getMessage("onboarding-welcome-header").value)
// "Welcome to Firefox"
```

In a similar way, check that two bundles are returned when loading only our custom resources:

```js
bundles2 = await getBundles(["sl", "en-US"], ["pwa/example.ftl"])
// Array [ FluentBundle, FluentBundle ]
// 0: FluentBundle { locales: (1) [ "sl" ] }
// 1: FluentBundle { locales: (1) [ "en-US" ] }

bundles2[0].formatPattern(bundles2[0].getMessage("hello-world").value)
// "Pozdravljen svet!"

bundles2[1].formatPattern(bundles2[1].getMessage("hello-world").value)
// "Hello World!" 
```

Now, see that when generating bundles that include both built-in and custom resources, only the English bundle is returned:

```js
bundles3 = await getBundles(["sl", "en-US"], ["browser/newtab/onboarding.ftl", "branding/brand.ftl", "pwa/example.ftl"])
// Array [ FluentBundle ]
// 0: FluentBundle { locales: (1) [ "en-US" ] }

bundles3[0].formatPattern(bundles3[0].getMessage("hello-world").value)
// "Hello World!" 
```

## Comments

The bundles are probably generated in Firefox in [this](https://searchfox.org/mozilla-central/rev/5ad3692e95f0d1bd31134783bb916b70c489335a/intl/l10n/rust/l10nregistry-rs/src/registry/asynchronous.rs#187), so the problem might be there.

I tried a bunch of things (changed how filesources are registered, registered each language in a separate filesource, created a new `DOMLocalization` instance, etc.), but I couldn't fix the problem. However, I think I found where this problem might happen, I just don't know why it happens and how to fix it.

See more details [here](https://github.com/filips123/PWAsForFirefox/issues/340#issuecomment-1880122284) and in related comments.
