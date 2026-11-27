# 🚨 MISS-ELS: Matsn0w's Incredible Server-Sided ELS

![MISS-ELS](assets/MISS-ELS_Logo.png)

MISS-ELS is an all-in-one configurable Emergency Lighting System (ELS) for the popular Grand Theft Auto V (GTA V) multiplayer client called FiveM.

The server checks every change: only the driver (and optionally their passengers) controls the lights and sirens, and everyone nearby sees and hears the same. You get up to 10 light stages, each with its own key binding.

Welcome to the best server-sided Emergency Lighting System for FiveM!

Oh, and you might ask yourself where all the 'Els' or 'Miss Els' jokes come from. It's a [meme](https://youtu.be/X-PgamXIWRQ?t=75). Loes is calling her grandchild Els. Els? Els! ELS!

## ⚡ Key Features

MISS ELS is very different compared to most other ELS resources! These are some key features:

- Fully customizable light patterns
- Support for up to 38 independent light sources (12 extras + 26 miscs)
- Use native game sirens or your own with [WMServerSirens](https://github.com/Walsheyy/WMServerSirens) or [SirenSharp](https://github.com/BJDubb/SirenSharp)
- Optional light reflections around the vehicle
- [A VCF configuration wizard](https://matsn0w.github.io/MISS-ELS) to make your life easier

Furthermore...

- Sirens and lights synced across the entire server, every player sees the same flash
- Up to 10 light stages, each with patterns that run at the same time
- Support for up to 4 different sirens per vehicle
- Indicator controls
- Flashing high beams
- Stop sign beeping
- Customizable personal keybinds
- [Exports and a synced state](docs/api.md) for HUDs, AI vehicles and other resources
- ...

## 🧩 Requirements

You need to have the following resources installed on your server:

- [FiveM baseevents](https://docs.fivem.net/docs/resources/baseevents) (shipped by default)
- [WarMenu](https://github.com/warxander/warmenu)

MISS-ELS 3 also requires [OneSync](https://docs.fivem.net/docs/scripting-reference/onesync/), which is on by default for servers started with txAdmin.

## ⚙️ Installation and Configuration

See the instructions in the [documentation](docs/README.md)!

## 🚓 Vehicle Configuration Files

If you have any existing VCF files from the [original author](https://github.com/InfImpSolutions) of this resource, then you'll probably be fine. The XML should be fully backwards compatible.

**⚠️ If you have a VCF from any other resource, that'll most likely not work.**

In both cases, it's probably best to re-create them by either writing them yourself OR... use the convenient configuration GUI! Using this tool, you can easily generate configuration files for your vehicles. You can find it here:

[![Open VCF Configurator](https://dabuttonfactory.com/button.png?t=MISS+ELS+VCF+Configurator&f=Open+Sans-Bold&ts=16&tc=fff&hp=45&vp=20&c=10&bgt=unicolored&bgc=1a37a8&be=1&bs=1&bc=fff)](https://matsn0w.github.io/MISS-ELS/configurator)

## 💭 Questions or problems?

👉 Please read the [documentation](docs/README.md) first and check the [Q&A section](https://github.com/matsn0w/MISS-ELS/discussions/categories/q-a) on Github if your question has already been asked. It probably is!

👉 Didn't find an answer? Then feel free to [start a new topic](https://github.com/matsn0w/MISS-ELS/discussions/new?category=q-a). The community is here to help you! You can also join the official [MISS ELS Discord server](https://matsn0w.dev/discord).

👉 Found a bug? Please [make an issue](https://github.com/matsn0w/MISS-ELS/issues/new)!

## 🛣️ Roadmap

👀 You can take a look at the [Milestones](https://github.com/matsn0w/MISS-ELS/milestones) for this project to see what's coming to MISS ELS!

💡 Feel free to [create an issue](https://github.com/matsn0w/MISS-ELS/issues/new) if you have an idea.

## ❤️ Credits

This resource wasn't possible without these libraries:

- [semver.lua](https://github.com/kikito/semver.lua) by _kikito_
- [SLAXML](https://github.com/Phrogz/SLAXML) by _Phrogz_

### Special thanks

- [@ImperiousTT](https://github.com/ImperiousTT) - for all his help in setting up this resource, especially writing documentation, creating the logo and providing support
- [@JustinRijsdijk](https://github.com/JustinRijsdijk) 🐔🎩 - for all his help in many areas, especially the VCF Configurator

_...and everyone else who contributed to the development of this resource - it would never have been this good without you! ❤️_

## 📃 Changelog

See [CHANGELOG.md](CHANGELOG.md).
