# Contributing to Ampersand

You might want to start by reading the [wiki](https://codeberg.org/Ampersand/app/wiki/Development-Environment-Setup) to know how to get a development environment running.

Other sources of interest include [Tauri](https://tauri.app), [Vue](https://vuejs.org), [TypeScript](https://typescriptlang.org), [Rsbuild](https://rsbuild.rs/).

## Definitions

1. "AI" is, in this context, a large language model (LLM), such as, but not limited to, ChatGPT, Claude, Gemini, DeepSeek, Copilot.

## Translations

If you want to translate Ampersand, you can do so on [Codeberg Translate](https://translate.codeberg.org/projects/ampersand/).

Please only contribute translations of the languages you are actually fluent in.

You may use translation tools, such as Google Translate, to aid you in your translation efforts, but you have to ensure that every translation feels natural,
that it is consistent in wording with other phrases in the same translation, and that it can be regarded to as an high-quality translation that can be understood by
anyone speaking that language.

## Reporting issues

You have to use our issue templates and you have to fill issues by hand.

You must check and reproduce your issue on the CI build before reporting it on Codeberg.

You must not use AI to generate an issue report, unless it's machine translation from your native language to English in the case you're not familiar with English itself.

Issues only reproduced on release builds (Google Play, etc.) and then reported as-is are frowned upon.

## Feature requests and discussions

You must not request features that align with the needs of the so-called "System Decor Culture."

You must not use AI to generate a feature request, unless it's machine translation from your native language to English in the case you're not familiar with English itself.

## Security testing

You may test Ampersand for security holes using all the tech you see fit, including AI.

However, we would appreciate if you took the time and effort to reach out to us and have a human-to-human conversation about your findings and the remediation steps.

Mind you that some "holes" are outside the scope of Ampersand and we will decide on a case-by-case basis if what you found counts as a vulnerability or not.

Also let us remind you that AI can hallucinate some security holes, so please test thoroughly and manually before actually reporting something that could not be there.

## Code contributions

You can contribute code to Ampersand in the form of pull requests.

All code must be reviewed by at least one repository owner, and you have to be available to make any and all changes that the repository owner tells you to make - without adding friction.

Before you contribute anything, you have to understand the code you are about to submit, line by line, as you will be held accountable for the entirety of it.
You need to understand specifically why it does what it does, and you must not rely on anyone else's explaination: you have to form your own thoughts about it.

AI contributions are permissible, even if generally we prefer human-written code.

For AI contributions specifically:

- The Agent(s) used must be disclosed in the PR description and in the commit message(s);
- Actual AI generated code should be labeled as such via comments detailing where it starts, and where it ends:
  - Entire files should have a comment at the start saying: "This file was AI-generated with the help of (Agent) and reviewed by (contributor name \<git email\>)"
  - Files which are modified to have certain AI generated sections should have a comment stating "Start of AI-generated code" at the start, and another comment stating "End of AI-generated code" at the end, plus another comment at the top of the file that recites "This source contains AI-generated snippets made by (Agent) and reviewed by (contributor name \<git email\>)"
  - On single lines of AI-generated code, a leading comment can be made: "The following line is AI-generated with (Agent)"
- The human has to thoroughly understand and test all the agent-written code beforehand;
- There has to be a certain level of human involvement in the code, even if most of it is AI-generated;
- 100% AI generated PRs with the human only understanding the effects, but not the code, are regarded as "AI Slop" and therefore, rejected;
- It'd be better for anyone to rewrite and reword the AI generated code to avoid copyright issues, as those agents tend to just copy and paste snippets from who knows where.
- Everyone should work to replace AI generated code with human-written code, sooner or later, to ensure full accountability can be taken, especially from a copyright perspective.