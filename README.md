# Ampersand

Welcome to Ampersand.

[![Discord](https://img.shields.io/discord/1235649423439298622?style=flat&logo=discord&logoColor=white&color=%235865F2)](https://discord.gg/xCptGJKeKc)
[![Liberapay patrons](https://img.shields.io/liberapay/patrons/Ampersand)](https://liberapay.com/Ampersand)
![Android Build Status](https://img.shields.io/github/actions/workflow/status/NyaomiDEV/Ampersand/build-android.yml?style=flat&label=android%20build)
![GitHub Pages Status](https://img.shields.io/github/actions/workflow/status/NyaomiDEV/Ampersand/github-pages.yml?style=flat&label=pwa%20build)


[![Get it on Obtainium](https://github.com/user-attachments/assets/713d71c5-3dec-4ec4-a3f2-8d28d025a9c6)](https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://app/%7B%22id%22%3A%22moe.ampersand.app.ci%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FNyaomiDEV%2FAmpersand%22%2C%22author%22%3A%22NyaomiDEV%22%2C%22name%22%3A%22Ampersand%20(CI)%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Atrue%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22filterReleaseNotesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22verifyLatestTag%5C%22%3Afalse%2C%5C%22dontSortReleasesList%5C%22%3Afalse%2C%5C%22useLatestAssetDateAsReleaseDate%5C%22%3Afalse%2C%5C%22releaseTitleAsVersion%5C%22%3Atrue%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%5C%5C%5C%5C((.*)%5C%5C%5C%5C)%24%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%241%5C%22%2C%5C%22versionDetection%5C%22%3Afalse%2C%5C%22releaseDateAsVersion%5C%22%3Afalse%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Afalse%2C%5C%22appName%5C%22%3A%5C%22Ampersand%20(CI)%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22Tracking%20app%20for%20plural%20systems%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Atrue%7D%22%7D)

## Days since last incident, but in reverse

January 30, 2025

## What is Ampersand?

Ampersand is a research project, and also an app. It wants to do one thing and do it reasonably well: tracking and journaling for plural systems.

## Wait, why would anyone reinvent the wheel?

Because all other approaches up until now are cloud based. We need at least one app that can be used fully offline, and that is developed with an offline-first mindset.

## So, is this for privacy reasons?

It is not. It's just because it's unreasonable that other apps and services out here do require an account somewhere to work, and while some do offer an "offline mode", they still require online signup. What if one wants their data to live and die on their device?

But if you want to think of it on those terms, sure, having an offline app could also mean privacy.

## So, where's the download button?

Ampersand is in alpha stage. There's a preview PWA at https://app.ampersand.moe and Android builds are available in the [Releases section](https://github.com/NyaomiDEV/Ampersand/releases).

## How will it be like when it's ready?

Something like this [Figma prototype](https://www.figma.com/proto/vD1U1Ed4ACd55tir2bb7qJ/Ampersand-Public?type=design&node-id=23-133&viewport=212%2C585%2C0.23&t=NCu4nRO1hcwOqU0q-0&scaling=min-zoom&starting-point-node-id=23%3A133&show-proto-sidebar=1), hopefully; however, the application will feature native-looking UI widgets on Apple devices (expect no Material 3 on iOS).

## Tech question: which tech stack are you using?

Ampersand is made using Vue 3 and Rspack. We're using Ionic Framework 8 for our UI widgets, and while we're waiting for them to update to Material 3, we took our own CSS shortcuts to achieve that style. Database is handled by Dexie.js for the PWA, while it's a disaster craft of ours on Android (don't look at it - it will hurt you). Everything else, unless specified here, is assumed to be Nao's disaster craft.

## Can I contribute code?

Of course you can! And if you're not able to contribute code, you can still hang around, translate the app and brainstorm ideas!

## Can I fund you?

We'd be very glad to receive funds, and we've set [Liberapay](https://liberapay.com/Ampersand/) to collect them. Please donate!

If you want to send money specifically to the main developer, you can donate on [nao's Ko-fi](https://ko-fi.com/nyaomipic).

## Who's developing this app for now?

- @NyaomiDEV: Most "backend" app logic;
- @mecha-cat: Italian translation, CSS fixes, some UI work, QoL testing.

## License

Please see the [License](LICENSE) file.
