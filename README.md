# 🌾 Fernhollow Farm

A cozy pixel-art farming game that runs entirely in your browser. Live your days on the farm — wake at 6am, tend your crops, explore the valley, and sleep when you're ready. Each day is yours to shape.

## 🎮 Play Now

**[Play Now →](https://salvationbacon.github.io/fernhollow-farm/)**

Installable as an app on mobile — tap "Add to Home Screen" for the full offline experience.

---

## v1.1 — What's in the game

### 🌱 Farming
- **24 crops** across 4 seasons — Parsnip to Ice Leek, T1 (1 day) through T6 (14 days)
- **Quality tiers** — Silver 🥈 and Gold 🥇 harvests worth up to 50% more
- **6 farm plots** — start with 2, unlock all 6 as you earn gold
- **Daily watering** — all crops need water every day or growth pauses
- **Fertilizer** — reduce grow time by 1 day per crop
- **Sprinklers** — auto-water plots after rebuilding the Great Hall

### 🕐 Player-Driven Days
- Wake at **6am**, sleep whenever you want by tapping the farmhouse
- **Forced sleep at 1am** — getting kicked out costs 10% energy next morning
- Day clock pauses when you leave the app (and on the title screen) — no offline punishment
- **Ship your harvest** when you sleep — payout lands each morning

### 🌲 The Valley
- 🎣 **Fishing** — hold-and-release minigame with 24 seasonal fish, rod upgrades, Lucky Bait and Fish Net
- 🌿 **Foraging** — rock-paper-scissors vs the Forest Spirit for seasonal loot
- 🪓 **Woodcutting** — two independent trees, axe upgrades, growth dust
- ⛏ **Mining** — 100 floors of ore, gems and checkpoints. Reach the bottom for an Angel Fruit.

### 🐾 Animals
- **Chickens, cows and sheep** with daily products
- Build a **Coop** and **Barn** through Bess in town
- **Auto Feeder** and **Auto Collector** for hands-free mornings

### 🏛 Town Hall — One Year to Rebuild
Four rooms, each tied to a season. Complete them all to restore Fernhollow:
- **Great Hall** (Spring) → Forest Spirit shop, sprinklers
- **Kitchen** (Summer) → cook meals for energy or gold
- **Workshop** (Fall) → forge copper, iron and gold ingots
- **Storeroom** (Winter) → preserve crops into pickles, jams and wines

### 🫙 Preserving
- Jar a single crop type into **Pickles** (1 day), **Jam** (3 days) or **Wine** (24 days)
- Output value scales with what you put in — T5 Tulip wine is worth far more than Parsnip wine
- Silver and Gold quality crops add a bonus multiplier

### 🍳 Cooking
- **11 Kitchen recipes** — Hob teaches new ones as your friendship grows
- Specific ingredients: eggs, milk, wool, forage, coal and **sap** (finally useful — it's maple syrup!)
- **Meal buffs** that last until you sleep: bigger fishing zone, softer rocks, extra wood, extra forage, faster farming XP
- The **Golden Banquet** grants every buff at once

### 🎪 Seasonal Festivals
One special day (day 14) every season, each with a villager visit and a once-a-year gift:
- 🌸 **Blossom Fair** (Spring) — everything shipped sells for +25%
- 🎣 **River Derby** (Summer) — every fish counts double, double Fishing XP
- 🍂 **Harvest Supper** (Fall) — gifts are worth double hearts
- 🏮 **Lantern Night** (Winter) — every rock in the mine drops extra ore

### 👥 Villagers
Six characters to befriend through daily gifts — each with their own shop, personality and story:
**Wren** (fishing), **Hob** (food), **Sal** (merchant), **Bess** (animals), **Ford** (woodcutting), **Bram** (mining), **Mayor Johnson** (energy upgrades).

- **5 hearts per villager** — takes about a year of daily gifting
- **Sal's Rare Stock** — out-of-season T2 crops delivered every 5 days at a premium
- **Bulk Deal** (Sal H5) — sell your shipping box instantly at 1.5× value, once per season

### ⚒ Skills
Five skills (Farming, Foraging, Fishing, Woodcutting, Mining) each with 10 levels and meaningful perks. Expect ~1 year to max any single skill, ~2 years for all five.

### ⭐ Achievements
48 achievements across 9 categories. Reach the bottom of the mine, harvest every season, max a skill, restore the town.

### 🎵 Music & Audio
Procedural folk music — pentatonic pluck engine with bass, day/night volume dynamics, full audio pause/resume on app hide.

### 📱 PWA
- Installable on Android, iOS and desktop
- Works fully offline
- Autosaves every 30 seconds
- "Farm misses you" reminder after 2 hours away

---

## Tech

Single HTML file (~8,200 lines). No frameworks, no build step, no server. Vanilla JS, Web Audio API, CSS. Press Start 2P pixel font.

## Install as App

- **Android**: Visit in Chrome → menu → Install app (or tap the install banner)
- **iOS**: Visit in Safari → Share → Add to Home Screen
- **Desktop**: Chrome address bar → install icon

## Dev Mode

Settings → Import Save → type `2531` → Import. Speed controls, instant grow, unlimited energy.

---

## Changelog

### v1.1 — Kitchen, festivals & fixes
**New**
- Cooking overhaul: 11 recipes with specific ingredients, taught by Hob as hearts rise, with day-long meal buffs
- Sap is now a cooking ingredient
- Four seasonal festivals with same-day effects and yearly villager gifts
- Status strip under the clock shows today's festival / countdown and active meal buffs
- 3 new achievements (Home Cooking, Master Chef, Festival Regular)
- Bug reports and feature requests can post straight to Formspree (falls back to email)

**Fixes**
- Reopening the app no longer skips straight to 1am — the day clock is saved as time-into-day
- Day clock is paused on the title screen
- Staying up until 1am now correctly costs 10% energy next morning
- Older saves no longer drop the bag to 20 slots
- Forage rewards now match wins (1 win could previously give the rarest item; 2–3 wins always gave the same one)
- Floor-100 Angel Fruit can only be claimed once; max energy capped at 50
- Mine ladder no longer disappears for good after reaching your pickaxe limit
- Blast Powder now triggers checkpoint / floor-100 rewards
- Bess no longer charges you again for a coop or barn you already own; no materials lost on failed purchases
- Silver/Gold preserves keep their quality and value
- Ores, gems, wood and preserves can no longer be "eaten"
- Animals can be fed while a product is waiting to be collected
- Bram counts all ores, gems and ingots as favourites consistently
- Workshop now requires T2 crops, as described
- Sal's "next delivery" countdown is correct
- Sprinklers water at dawn instead of up to a minute later
- Skill level XP labels, music resume volume, Lucky Bait / Fish Net status, save import refresh, dev Instant Grow crash

### v1.0 — Initial release
- Full game loop: plant, water, harvest, ship, sleep
- 24 crops across 4 seasons with quality tiers
- Daily watering required for all crops
- 5 valley activities: fishing, foraging, woodcutting, mining, cooking
- 7 villagers with heart system and individual shops
- Town Hall with 4 seasonal rooms: Great Hall, Kitchen, Workshop, Storeroom
- Forge (smelting), Preserves (pickles, jams, wines)
- Animal system: chickens, cows, sheep with auto feeder/collector
- 5 skills (LV1–10) with unlockable perks
- 45 achievements across 9 categories
- Procedural folk music engine
- Full PWA: offline, installable, autosave, push notification
- PC/landscape sidebar layout
- Bug reporting and feature request forms

## License

MIT
