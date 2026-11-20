# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline, open guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5 — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online — for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## What it is

- **Tracker** — a checklist saved in your browser (localStorage): tick trophies off, see progress by grade and in PSN points (1,350 total), filter by story / missable / collectibles / activities / online / earned / still to earn, search, and sort.
- **Roadmap to the platinum** — three steps, about 200 hours, difficulty 4/10, with sources. One playthrough is enough; there is no mission replay, so keep a manual save at the start and end of each chapter.
- **The one missable trophy** — Positive Mental Attitude (meditate at every spot) is the only one that can be missed: during Chapter 1, follow Lucia to the balcony at Jason's house and accept the optional meditation.
- **Cited guides** — every trophy has a guide written in our own words plus named sources (PowerPyx, Sixshore, GameMapa, KeenGamer, ViceCityHustle, EGamers). The five trophies the community has not solved yet say so honestly instead of inventing steps.
- **Spoiler setting** — hides the names and descriptions of story trophies until you earn them.
- **Export / import** — save your progress as a JSON file and bring it back on any device.

## Run it

Serve the `app/` folder over HTTP (it loads its data with `fetch`, so `file://` will not work):

```sh
python3 -m http.server --directory app 8080
# open http://localhost:8080/
```

## Build the entry

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`. Node 22, standard library only:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- PowerPyx — GTA 6 Trophy Guide & Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vI-trophy-guide-roadmap/
- Sixshore — GTA 6 Trophy and Achievement List: https://sixshore.com/gta-6/guides/trophies-and-achievements/
- GameMapa — All 55 GTA 6 Trophies: https://gamemapa.com/en/gta-6/guides/gta-6-trophy-achievement-list/
- KeenGamer — GTA 6 Trophy Guide: https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/
- ViceCityHustle — GTA 6 Trophy List: https://www.vicecityhustle.com/guides/gta-6-trophy-list-all-55-trophies
- EGamers — GTA 6 Trophy List: https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/
- Official names, descriptions and grades: the PlayStation trophy list, as listed by Exophase and PSNProfiles.

## Referral

Made with [make.fun](https://make.fun/r/204hjvsp) — sign up through our referral link: https://make.fun/r/204hjvsp

## Disclaimer

Grand Theft Auto and GTA are trademarks of Rockstar Games. This is an unofficial fan guide, not affiliated with Rockstar Games or Sony Interactive Entertainment. No Rockstar artwork or logo is used here.
