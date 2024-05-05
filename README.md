# Ampersand

Welcome to Ampersand.

[Join our Discord](https://discord.gg/xCptGJKeKc)

## Days since last incident, but in reverse

May 4, 2024

## To Do

Please refer to [this issue](https://github.com/NyaomiDEV/Ampersand/issues/1).

## What is Ampersand?

Ampersand is a research project, and also an app. It wants to do one thing and do it reasonably well: tracking and journaling for plural systems.

## Wait, why would anyone reinvent the wheel?

Because all other approaches up until now are cloud based. We need at least one app that can be used fully offline, and that is developed with an offline-first mindset.

## So, is this for privacy reasons?

It is not. It's just because it's unreasonable that other apps and services out here do require an account somewhere to work, and while some do offer an "offline mode", they still require online signup. What if one wants their data to live and die on their phone/tablet/desktop/laptop?

But if you want to think of it on those terms, sure, having an offline app could also mean privacy.

## So, where's the download button?

Ampersand is still not ready. When it will be ready, it will be released as a Progressive Web App first. We won't really commit to "exclusivity" so alpha/beta/testing URLs will be available to everyone from day one.

We will eventually ship the app as an Android (and iOS) app, and we will get listed on Google Play / F-Droid / Apple App Store / other iPhone App Stores in the EU(?). We're still unsure about using Capacitor or Tauri 2 for that matter, so we're just waiting and building the app as a PWA mainly so that we can be ready regardless of the framework we'll be using.

## Can I check *anything* at all regarding this app?

Sure thing. Here's a [Figma prototype](https://www.figma.com/proto/vD1U1Ed4ACd55tir2bb7qJ/Ampersand-Public?type=design&node-id=23-133&viewport=212%2C585%2C0.23&t=NCu4nRO1hcwOqU0q-0&scaling=min-zoom&starting-point-node-id=23%3A133&show-proto-sidebar=1) for you.

## How will it be like when it's ready?

While the prototype is made with Material 3 in mind, we will actually ship the app with Material 2 first (however, we will use the Material You palette and we will make some adaptations to make it feel more in line with modern standards). The application will feature iOS widgets on Apple devices, and Material You coloring will be opt-in for that platform (based on chosen accent color).

We plan to keep all UI elements exactly where they are in the prototype, though, so don't worry - the final product should be plenty similar.

## Tech question: which tech stack are you using?

Ampersand is made using Vue 3 and Vite. We're using Ionic Framework 8 for our UI widgets, and we're indeed waiting for them to update to Material 3. Database is handled by Dexie.js (IndexedDB). Everything else, unless specified here, is assumed to be Nao's disaster craft.

## Can I contribute code?

Of course you can! And if you're not able to contribute code, you can still hang around, brainstorm ideas, and come up with an enticing logo for this project!

## Can I fund you?

We'd be very glad to receive funds, but right now we don't have anything set up to collect them properly. If you want to send money our way, you can donate on [nao's Ko-fi](https://ko-fi.com/nyaomipic).

Our beloved Cataclysm is also running a GoFundMe, so please fund him first and foremost. [link](https://gofund.me/d721a140)

## Who's developing this app for now?

@NyaomiDEV at the "back end" and @mecha-cat at the "front end", except that it all runs on your browser so it's unclear if we can use those terms as broadly understood.

## License

Please see the [License](LICENSE) file.