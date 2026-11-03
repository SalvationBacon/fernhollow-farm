# Fernhollow Farm — Project Instructions

## Overview
Single HTML file farming game. No frameworks, vanilla JS only. Pixel aesthetic, Press Start 2P font.
Working file: `index.html` — only build file (~8,550 lines).
Hosted as PWA on GitHub Pages: https://salvationbacon.github.io/fernhollow-farm/
Current version: **v1.2** (shown on title screen and in feature requests).

---

## Deployment Files
| File | Purpose |
|---|---|
| `index.html` | Full game + PWA meta tags + service worker registration |
| `manifest.json` | App name, icons, theme colors, standalone display, orientation: any |
| `sw.js` | Service worker — network-first for HTML, cache-first for assets. Current: `fernhollow-v16` |
| `icon-192.png` | Android home screen icon |
| `icon-512.png` | Splash screen / store icon |
| `apple-touch-icon.png` | iOS home screen icon |
| `README.md` | GitHub repo readme |
| `CLAUDE.md` | These instructions |

### Updating GitHub
- Upload changed files via Add file → Upload files, or `.` web editor (or git push)
- Always bump cache version in `sw.js` on every update (`fernhollow-v16` → `fernhollow-v17`)
- GitHub Pages auto-redeploys within 1–2 minutes
- SW uses **network-first for HTML** — players automatically get updates on next open without clearing cache

---

## Dev Mode
Unlock: Settings → Import Save → type `2531` → Import
Disable: Same, type `2531OFF`
Persists in save, shows 🛠 HUD button
Dev menu: skip days, add gold/wood, refill energy, unlimited energy, instant grow, rare forage, speed buttons (1x/10x/60x/300x — legacy, crops are day-based)

---

## Save System
Key: `pelican_farm_v1`
Tutorial: `pelican_tut_v1`
Tab tips: `hh_tab_tips_v1`
Skill tip: `hh_skill_tip_v1`
Ach seen: `hh_ach_seen`
Install dismissed: `hh_install_dismissed`
Notif prompted: `hh_notif_prompted`
Autosave: 30s. Also saves on: page hide, end of day, purchases, building, importing, reset, chopping, cooking

**Day clock is saved as `daySecs` (seconds into the day), never as a timestamp.** On load,
`dayStartTime = Date.now() - daySecs*1000`. Legacy saves (with only `dayStartTime`) restart the
day at 6am. Never persist `dayStartTime` directly — doing so made reopened apps instantly hit 1am.

When adding a new persisted variable: declare it in the state block, reset it in `defaultState()`,
add it to `saveGame()`, and restore it with a safe default in `loadGame()`.

---

## Design System

### CSS Variables
```
--ink:#1a1208  --deep:#241a0c  --mid:#2e2010  --lift:#3a2a14
--border:#5a3e1b  --rim:#7a5828
--cream:#f5dfa0  --muted:#9a7a50  --dim:#5a4030
--gold:#e8c040  --green:#7ec850  --green2:#4a8a28
--blue:#60a8d8  --red:#d04040  --pink:#e04090
```

### Font Sizes
5px tiny · 6px body · 7px subheadings · 8px primary UI · 9px HUD/titles

### Game Wrapper
Mobile: `width:100%;max-width:420px` centred via `body{display:flex;justify-content:center}`
PC/Landscape: 220px sidebar + 420px game column
**Important:** `#pc-wrap` and `#pc-right` use `display:contents` on mobile — do not add flex wrappers around them

### Pixel Art
All art is custom pixel art drawn in code — **no emoji are shown to the player**.
- The first `<script>` in `index.html` holds the art: `PX_PAL` (palette letters → colours), `PX_SPRITES`
  (rows of palette letters, `.` = transparent, or a recolour `{base, map, flipY}`) and `PX_EMOJI` (emoji → sprite).
- **Game code keeps writing emoji in strings.** A MutationObserver (`pxStart` → `pxScan`/`pxText`) swaps every
  emoji in on-screen text for `<img class="px">` of its sprite. Text inside `<option>`, `<textarea>`, `<input>` is skipped.
- **Adding a new emoji anywhere? Give it a sprite in `PX_SPRITES` and an entry in `PX_EMOJI`**, or it will show as a
  raw emoji. Arrows/ticks/`▸ ✦ ✕ ✓` are text glyphs and stay as text.
- Inline icons render on a 12×12 canvas, displayed at `max(12px, 1.35em)` so they're never smaller than 1:1.
- Scene sprites are `<img class="pxs" data-px="name">`, drawn at 2× by `pxSetSprite(el, name, scale)`.
  Variants swapped at runtime: `farmhouse[_snow][_night]`, `tree / tree_spring / tree_fall / tree_winter`,
  `sun_big / sun_set`, `farmer / farmer_step` (step frame + `scaleX(-1)` facing when walking).
- Helpers: `pxURL(name, square)` (cached data URL), `pxSize(name)`, `pxSetSprite(el, name, scale)`.

---

## Layout
```
HUD (Title | Day | Energy | Gold | ⭐ Achievements | ⚙ Settings | 🛠 Dev)
Season bar · Clock bar
Status bar (#status-bar — festival today/countdown + active meal buff; hidden when empty)
Skills bar (Farming | Foraging | Fishing | Woodcutting | Mining — tappable)
Scene (sky/sun/moon/stars/clouds/trees/house/coop/barn/shipping crate/farmer/crops) — all pixel sprites
  Positions are % of scene width so nothing clips/overlaps at any width:
  tree 1% | coop 9% | crate 33% | house 52% (centred) | barn right 9% | tree right 1%
  Crops `SCENE_CROP_X=[5,16,27,61,72,83]` (%). Farmer walks to the crop being worked (`moveFarmer`).
Farm plot (3×2 grid)
Info bar
Tabs: SEEDS | BAG | VALLEY | ANIMALS (hidden until building) | TOWN
Panel content
Install banner (bottom, one-time PWA prompt)
```

### PC/Landscape Mode
Left sidebar (220px): Farm Status, Skills, Animals, Activity Log. Right: full game. Class: `body.pc-mode`.
Auto-detect: `pcMode` defaults to `window.innerWidth >= 800`. Saved preference overrides on return visits.
`body.pc-mode` must include `justify-content:flex-start` to override mobile centring.

---

## Core Game Loop
Plant → Water → Grow → Harvest → BAG → Ship Box → Sleep → New day payout

### Day System
- **1 in-game day = 10 real minutes** (600 seconds)
- Day runs 6:00 AM → 1:00 AM = 600 real seconds
- `DAY_SECS = 600`, `DAY_START_H = 6`, `DAY_END_H = 25`
- `getGameH()` maps 0–600 real seconds to 6–25 in-game hours
- **Clock freezing:** `freezeClock()` / `unfreezeClock()` with `clockFrozenAt`. The clock is frozen while
  the title screen is open (`titleScreenOpen`) and while the page is hidden (`visibilitychange`).
  `getSessionSec()` returns `clockFrozenAt` while frozen.
- Sleep trigger: tap house in scene (from 8am) → confirm popup → `doSleep()` — no penalty
- **Forced sleep at 1:00 AM** → `forceSleep()` → `dayPenaltyEnergy=true` → next morning energy is 90% of max
- `PENALTY_CUTOFF_H=20` is only used for the evening house-label styling now
- `doSleep()` calls `musicStop()` before new day sequence
- `dismissSummary()` calls `musicStart()` to restart music fresh, then `announceEventToday()`

### Shipping
Pays out at sleep (`triggerNewDay`). UI says "SELLS TONIGHT".
`getShipBaseTotal()` = raw value; `getShipTotal()` = raw × `eventShipMult()` (Blossom Fair +25%).

---

## Seasons
4 seasons, 28 days each. Full year = 112 days. Crops from wrong season wilt on change.
`seasonHarvests {spring,summer,fall,winter}` — persists, used for crop unlock checks.
`gameYear()` = `floor((day-1)/112)+1`.

---

## Crop System
24 crops, 6 per season, identical tier structure. Tier = position in the season's `crops` list (`cropTier(crop)`).

| Tier | Unlock (season harvests) | Cost | Sell | Grow | Special |
|---|---|---|---|---|---|
| 1 | 0 | 20g | 22g | 1 day | — |
| 2 | 8 | 30g | 63g | 2 days | — |
| 3 | 20 | 40g | 113g | 3 days | 25% double yield |
| 4 | 40 | 50g | 210g | 5 days | — |
| 5 | 80 | 70g | 598g | 8 days | — |
| 6 | 160 | 100g | 1645g | 14 days | — |

**Unlock pacing:** T2 unlocks ~Day 4, T3 ~Day 9, T4 ~Day 16, T5 ~Day 26, T6 ~Day 80

Plots 0–1 start unlocked. Plot 2=300g, 3=800g, 4=1500g, 5=3000g (tap locked tile to buy).
Double yield crops (25% base, 35% at Farming LV8): Potato, Wheat, Yam, Crocus.
Quality items are stored as `id|silver` / `id|gold`; their sell price is computed live in `getItemInfo()`
(×1.25 / ×1.5, plus the Farming LV10 ×1.1 bonus).

Seasons:
- Spring: Parsnip/Cauliflower/Potato/Garlic/Tulip/Kale
- Summer: Tomato/Radish/Wheat/Blueberry/Sunflower/Starfruit
- Fall: Pumpkin/Bok Choy/Yam/Amaranth/Grape/Cranberry
- Winter: Holly/Snow Yam/Crocus/Winter Root/Crystal Fruit/Ice Leek

---

## Watering System
**Every crop must be watered every day** or growth pauses (tile shows 💧 WATER!).
Watering sets `waterDueDay = day+1`; `advanceCropDay()` (at sleep) only grows watered, non-overdue crops.
Watering costs 1 energy per plot. Can tiers water 1/2/4/6 plots per tap (Mayor shop).
Sprinklers (Forest Spirit shop, after Great Hall) water 1/3/6 plots for free — run at dawn in
`triggerNewDay` and every 60s in `wateringTick`.

---

## Skills System
5 skills, LV1–10. Per-level thresholds: `[10,22,38,55,72,90,112,135,160]` (SK_THRESHOLDS — XP resets each level).
Internal key → Display: `farming`→FARMING🌾 · `foraging`→FORAGING🌿 · `fishing`→FISHING🎣 · `chopping`→WOODCUTTING🪓 · `mining`→MINING⛏

**Target pacing:** ~1 year to LV10 per skill, ~2 years for all five.

XP rates:
- Farming: T1=1, T2=2, T3=4, T4=7, T5=11, T6=18 per harvest + quality bonus (+1 silver, +2 gold); ×1.5 with Harvest Tart buff
- Foraging: 1/round win, 2/sweep bonus
- Fishing: 1 normal, 2 rare (difficulty>0.6); ×2 on River Derby
- Woodcutting: 2/chop, 5/fell, 7/growth dust
- Mining: 1xp/rock (ores with minFloor ≥25 only), 1/descend

### Farming Perks
LV2 silver crops(×1.25) · LV3 more silver · LV4 gold(×1.5) · LV5 fert lasts 2 crops · LV6 more gold · LV7 mostly silver/gold · LV8 double yield 35% · LV9 gold dominant · LV10 near-perfect+10% sell bonus ✦

### Foraging Perks
LV3 +1 item on 2+ wins · LV5 spirit bias 45%→35% · LV7 +1 more item on a 3-0 · LV10 a 3-0 sweep always gives the season's rarest item ✦
Skill also gates which items can drop (`skillMin`: T1=1, T2=2, T3=4, T4=6, T5=8, T6=10).

### Fishing Perks
LV4 zone+8px · LV7 zone+16px · LV9 drain rate 4

### Woodcutting Perks
LV3 +1 wood/fell · LV5 sap 60% · LV6 +2 wood/fell · LV8 trees 7HP (starter axe only) · LV9 +3 wood/fell

### Mining Perks
LV2 20% double ore · LV4 ores 5 floors earlier · LV5 40% double · LV6 gems ×1.5/10 floors earlier · LV7 descend restores 1 energy · LV8 rocks -1HP · LV9 5% gem from any rock · LV10 8% extra legendary gem

---

## VALLEY Tab Activities

### Fishing
Gated behind meeting Wren. 2 energy/cast. Hold=zone rises, release=falls. Keep fish in green zone.
6 fish/season tiers 1–6 (sell 2/5/10/20/40/80g). Tier unlock by Fishing level: T1 1, T2 2, T3 4, T4 6, T5 8, T6 10.
`fishingRod` 0–3 adds weight to T4–T6. Lucky Bait: next cast auto-catches. Fish Net: next catch yields 2 fish.

### Foraging (RPS)
2 energy. Best of 3 vs Forest Spirit. Seasonal bias. Item tier = position in the season list (`getTier`).
1 win → T1–2 · 2 wins → T3–4 · 3 wins → T5–6. If the band isn't unlocked by skill yet, the best item below it drops.

### Woodcutting
Gated behind Ford. 1 energy/swing. Two independent trees. Tree HP by axe tier (basic=5, copper=4, iron=3, gold=2).
Felled tree: 3–6 wood + skill/axe bonus + sap chance. Regrows 3 days.

### Mining
Gated behind Bram. 100 floors. Checkpoints every 10 floors. 2–4 rocks/floor. Swing=1 energy, Descend=1 energy.
**Mine floor resets to last checkpoint on new day** (triggerNewDay).
`mineOnFloorCleared()` runs when the last rock breaks (swing or blast) — sets checkpoint, gives floor-100 reward.
**Floor 100 reward is one-time** (`achFlags.mine_fruit`): Angel Fruit (+10 max energy) or 2000g if already at the 50 cap.
Rock HP: F1–24=1, F25–49=2, F50–74=3, F75–100=4 (before pickaxe/skill/buff reduction).
Pickaxe gates: basic=F1–20, copper=F1–40, iron=F1–70, gold=F1–100.

Ore table: Stone🪨(1g,F1) · Coal⬛(2g,F1) · Copper🟤(4g,F10) · Quartz🔷(10g,F20) · Iron🔩(8g,F30) · Topaz🟠(22g,F50) · Gold Ore🟡(16g,F55) · Ruby💎(32g,F70) · Emerald🟢(32g,F85)

Iron Grip buff lasts 3 floors (tracked as countdown: grip=3→2→1→0).

---

## Inventory & Shipping
Bag starts **30 slots**, upgrades to 40/60/80 via Sal. A slot = one unique item stack.
Tap item → EAT (food only — `isEdible(id)`) / SHIP / CANCEL. SHIP opens quantity picker. Hold to lock (locked items skip SHIP ALL, donations and cooking).
Ships sell at next sleep.

Item ID conventions: crops:`parsnip` · quality:`parsnip|silver` · forage:`dandelion_forage` · fish:`catfish_fish` · animal:`chicken_product` · resources:`wood`,`sap` · ores:`stone`,`coal`,`copper_ore`,`iron_ore`,`gold_ore`,`quartz`,`topaz`,`ruby`,`emerald` · ingots:`copper_ingot`,`iron_ingot`,`gold_ingot` · preserves:`jam_parsnip`,`wine_tulip_gold` etc · meals: recipe id e.g. `anglers_pie`.

---

## Animal System
| Animal | Building | Cost | Product | Sells | Frequency |
|---|---|---|---|---|---|
| 🐔 Chicken | Coop | 300g | 🥚 Egg | 25g | 1/day |
| 🐄 Cow | Barn | 800g | 🥛 Milk | 60g | 1/day |
| 🐑 Sheep | Barn | 1000g | 🧶 Wool | 90g | 1/2 days |

Buildings go `false → 'building' → true` (built overnight in `animalNewDay`). The ANIMALS tab shows an
"under construction" row and only offers animals once the building is `true`.
Coop: 4 chickens max. Barn: 2 cows + 2 sheep max (enforced in `buyAnimal` and `vilBuy`). Feed: 10g/animal/day.
Animals can be fed even while a product is waiting. Auto Feeder + Auto Collector available from Bess.
Sheep are bought from the ANIMALS tab (not in Bess's shop).

---

## Town Hall (TOWN tab)
Sequential rooms — each unlocks only after the previous is complete:

| Room | Season | Requirements | Reward |
|---|---|---|---|
| Great Hall 🏛 | Spring | 200g + 10 wood + 15 Cauliflower | Forest Spirit shop (sprinklers) |
| Kitchen 🍳 | Summer | 150g + 15 Radish + 8 animal products + 5 fish | Cooking |
| Workshop 🔨 | Fall | 400g + 25 wood + 25 ore + 5 **T2** crops | Forge (smelting) |
| Storeroom 📦 | Winter | 500g + 30 wood + 30 ore + 10 Snow Yam | Preserves crafting |

Town Hall completion target: ~Day 100 (late Winter, Year 1). Full year arc.

### Kitchen / Cooking (Kitchen reward)
`TH_RECIPES` — 11 recipes. Ingredients: `crop` (opt. `minTier`, `quality`), `fish` (opt. `minTier`), `animal`, `forage`, `item` (exact id).
Hob teaches recipes by heart level (`hobHeart`; `recipeKnown(r)`). Cheapest matching items are used first; locked items never.
Meals are eaten from the BAG. Buff meals last until you sleep (`cookBuffs`, cleared in `triggerNewDay`).

| Recipe | Hob ❤ | Ingredients | ⚡ | Sells | Buff |
|---|---|---|---|---|---|
| 🥣 Veg Soup | 0 | 2 crop | 12 | 30 | — |
| 🍽 Fish Meal | 0 | 1 fish + 1 crop | 20 | 50 | — |
| 🐟 Smoked Fish | 0 | 2 fish | 25 | 65 | — |
| 🍲 Farm Stew | 1 | 3 crop + 1 animal | 35 | 90 | — |
| 🥗 Forager's Salad | 1 | 2 forage + 1 crop | 15 | 45 | +1 forage item on a win |
| 🥞 Maple Pancakes | 2 | 1 sap + 1 egg + 1 crop | 18 | 75 | +2 wood per fell |
| 🥧 Angler's Pie | 3 | 2 fish + 1 milk + 1 crop | 30 | 120 | fishing zone +8px |
| 🍳 Miner's Breakfast | 3 | 2 egg + 1 coal + 1 crop | 30 | 110 | rocks -1 HP |
| 🎉 Grand Feast | 4 | 3 crop + 2 fish + 2 animal | 60 | 200 | — |
| 🥮 Harvest Tart | 4 | 1 T4+ crop + 1 sap + 1 milk | 40 | 260 | +50% farming XP |
| 👑 Golden Banquet | 5 | 1 gold crop + 1 T5+ fish + 1 wool + 2 sap | 60 | 600 | all buffs |

Buff hooks: `getFishZoneSize`, `mineRockHp`, `getWoodDropBonus`, `endRps`, `harvestTile`.

### Forge / Smelting (Workshop reward)
3 slots, timed in in-game days:
- 🟤 Copper Ingot: 3 copper + 2 coal → 20g, 1 day
- 🔩 Iron Ingot: 3 iron + 3 coal → 45g, 2 days
- 🟡 Gold Ingot: 3 gold ore + 4 coal → 100g, 3 days

`townHall.forgeQueue` array of `{id, completesOnDay}`.

### Preserving (Storeroom reward)
2 slots. One crop type per jar. Output value = crop sell × qty × multiplier × quality bonus.
Quality bonus: silver +25%, gold +50%.

| Recipe | Input | Time | Multiplier |
|---|---|---|---|
| 🫙 Pickle | 2 of one crop | 1 day | ×1.5 |
| 🍯 Jam | 3 of one crop | 3 days | ×2.5 |
| 🍷 Wine | 5 of one crop | 24 days | ×6.0 |

`townHall.preserveQueue` array of `{type, cropId, cropName, cropIcon, quality, qty, sellValue, craftName, craftIcon, totalDays, completesOnDay, itemId}`.
Finished jars use `job.itemId` (includes quality) so silver/gold preserves stay separate.

---

## Seasonal Festivals
`FESTIVALS` — day 14 of each season. Same-day effect + a once-per-year gift (`eventsSeen['id_year']`)
handed over in a villager dialogue by `announceEventToday()` (on title start and each morning).

| Festival | Season | Host | Effect (that day) | Gift |
|---|---|---|---|---|
| 🌸 Blossom Fair | Spring | Mayor | shipping +25% (`eventShipMult`) | 3 Super Fertilizer |
| 🎣 River Derby | Summer | Wren | catches ×2, fishing XP ×2 | Lucky Bait |
| 🍂 Harvest Supper | Fall | Hob | gift heart XP ×2 (`eventGiftMult`) | Farm Stew |
| 🏮 Lantern Night | Winter | Bram | +1 ore per rock broken | 2 Blast Powder |

Helpers: `getEventToday()`, `eventActive(id)`, `nextEventInfo()`, `updateEventBanner()`.
The status bar shows the festival on the day, or a countdown in the final 7 days before it.

---

## Achievements System
48 achievements in 9 categories. Accessed via ⭐ HUD button. Red dot badge on new unlocks.
State: `achUnlocked{}` (persisted), `achFlags{}` (persisted event flags — also used for one-time
rewards: `mine_fruit`, `bought_<shopItemId>`, `cooked_<recipeId>`, `first_meal`).
Function: `checkAchievements()` — call after any meaningful player action.
Pop: 3s toast on unlock.

---

## PWA / Install System
- `manifest.json` declares standalone app with "any" orientation
- `sw.js` uses network-first for HTML, cache-first for static assets
- Service worker has `skipWaiting()` + `clients.claim()` for immediate activation
- Install banner shows once after tutorial ends
- Android: native Chrome install dialog; iOS: Share → Add to Home Screen
- Standalone notification: single "farm misses you" after 2hrs away (`MISS_DELAY_MS = 2*60*60*1000`)

---

## Audio System
### Sound Effects
Web Audio API. `playSound('type')`: plant · harvest · coin · chop · fell · cast · catch · forage · collect · levelup · ship · newday · build · error · rpswin · rpslose · sleep · titlestart

### Music Engine
Song library `SONGS` — 10 original simple melodies, written as `"NOTE/beats"` tokens (`r` = rest) for `mel` and `bass`
(both must total the same beats). Each song has `pool` (`spring|summer|fall|winter|night`), `bpm`, `inst`
(`pluck|flute|bell|chip`) and optional `hats:true` (soft hi-hat on off-beats).
- A song plays `SONG_LOOPS` (2) times, then `pickSong()` chooses another from the current pool
  (night = 7pm–6am, otherwise the season), never repeating the same song back-to-back.
- Look-ahead scheduler (`scheduleMusic`, every 250ms, 1.2s ahead on the AudioContext clock).
- Night volume ×0.7 (`musicTargetVol()`). Settings shows `♪ NOW PLAYING: <song>` (`#music-now`).
- `musicStart()` · `musicStop()` · `musicPause()` · `musicResume()` (restarts the current song) · `setMusicVolume()`

| Pool | Songs |
|---|---|
| Spring | Morning Fields (pluck) · Blossom Path (flute) |
| Summer | Sunny Rows (chip + hats) · River Glint (pluck) |
| Fall | Harvest Waltz (3/4 pluck) · Amber Lane (flute) |
| Winter | Frost Window (bell) · Hearthside (pluck) |
| Night | Starlit Barn (bell) · Fireflies (flute) |

### Visibility Change Handler
On hide: freeze clock, save, `musicStop()`, close both AudioContexts, set to null, schedule miss notification.
On show: unfreeze clock (unless title screen open), recreate contexts lazily, `musicStart()` if was playing, cancel miss notification.

---

## Tutorial System (7 steps)
1. SELECT A SEED (`seedSelected`)
2. PLANT IT (`firstPlant`)
3. WATER YOUR CROP (`firstWater`) — first crop instantly ripens during tutorial
4. HARVEST! (`firstHarvest`)
5. SHIP YOUR CROPS (`firstShip`)
6. SLEEP TO END YOUR DAY — `showBtn:true`, explains house/sleep confirm popup
7. THE FARM IS YOURS! — `showBtn:true`, points to VALLEY + TOWN

The intro letter (`showLetter()`) opens after the title screen whenever `pelican_tut_v1` is unset.
Tab tips fire on first visit post-tutorial. Skill intro tip fires on first level-up.
PWA install banner fires ~3s after tutorial ends.

### Sleep Confirm Popup
`clickHouse()` shows a modal with sleep/cancel buttons and shipping total preview.
`tutHook('houseClicked')` fires when house is tapped.

---

## Sal's Special Systems

### Rotating Seasonal Stock
Previous season's T2 crop available on season days 5,10,15,20,25. 3 in stock per window.
Buy price: 140g (T2 sells 63g — premium catch-up mechanic).

| Season | Sal stocks |
|---|---|
| Spring | ⬜ Snow Yam (last Winter) |
| Summer | 🥦 Cauliflower (last Spring) |
| Fall | 🌱 Radish (last Summer) |
| Winter | 🥗 Bok Choy (last Fall) |

State: `salStockRemaining`, `salStockWindow`, reset via `vilNewDay()`.

### Bulk Deal (Sal H5)
Free, once per season. Instantly sells entire shipping box at 1.5× value.
State: `salBulkDealUsed` — resets on season Day 1.

---

## Feedback (Feature Request only — bug reports were removed in v1.2)
`sendFeedback()` POSTs JSON to `FORMSPREE_ENDPOINT` when set (e.g. `https://formspree.io/f/xxxxxxx`).
If the constant is blank, the request fails, or the device is offline, it falls back to a `mailto:` to `FEEDBACK_EMAIL`.

---

## Coding Conventions
- Single HTML file, no splitting
- Vanilla JS only, no frameworks
- Always run `node --check` on extracted JS before delivering
- Max-width 420px mobile
- Always ask before changing code
- Energy cap: always use `maxEnergy` (never hardcode 100). Max energy can never exceed `MAX_ENERGY_CAP` (50)
- All state variables declared once in the central state block. No duplicate declarations.
- Service worker cache key in `sw.js` — bump version string on every update
- When delivering updates: provide both `index.html` and `sw.js` with bumped cache version
- Always verify file starts with `<!DOCTYPE html>` — never allow JS to leak before DOCTYPE
- Shop purchases: do every "can't buy" check (owned, gold, wood, ore, space) **before** deducting anything.
  Ownership for villager shops lives in `vilItemOwned(it)`.

### Key Helper Functions
`formatTime(days)` · `getItemInfo(id)` · `isEdible(id)` · `cropTier(crop)` · `pcAddLog(msg)` · `pcUpdate()` · `addToInventory(id,qty)` · `checkAchievements()` · `renderActivities()` · `renderTownHall()` · `vilToggleOpen(id)` · `vilItemOwned(it)` · `upCoins()` · `upEnergy()` · `showTabTip(key)` · `showAchPop(a)` · `scheduleInstallBanner()` · `getGameH()` · `getGameTimeStr()` · `freezeClock()` · `unfreezeClock()` · `doSleep()` · `forceSleep()` · `triggerNewDay(shipped,total)` · `forgeIngotReady()` (registers ingots, ores, wood, sap, animal products and meals in `ALL_ITEMS_MAP`) · `pxURL(name)` · `pxSetSprite(el,name)` · `moveFarmer(i)`

### Key Render Functions
| Function | Trigger |
|---|---|
| `renderSeeds()` | Season/harvest count change |
| `renderInv()` | Any inventory change |
| `renderTile(i)` | Tile state change |
| `renderAnimals()` | Animal state change |
| `renderActivities()` | VALLEY tab open |
| `renderMine()` | After mine action |
| `renderTownHall()` | TOWN tab open, donation |
| `updateAllSkillUI()` | On init |
| `updateSkillUI(name)` | After XP gain |
| `updateEventBanner()` | New day, meal eaten, season visuals |

---

## Villager System
7 Villagers (6 + Mayor)

| ID | Name | Role | Avatar | Favourite | firstMeet |
|---|---|---|---|---|---|
| wren | WREN | Fisherwoman | 🎣 | Any fish | Basic rod → `fishingUnlocked=true` |
| hob | HOB | Chef | 🍳 | Any crop | — (teaches recipes) |
| sal | SAL | Merchant | 🛒 | Gold coins (100g/day) | — |
| bess | BESS | Animal Keeper | 🐄 | Animal product | — |
| ford | FORD | Lumberjack | 🪓 | Wood | Starter axe → `hasAxe=true` |
| mayor | MAYOR JOHNSON | Mayor | 🎩 | Any crop | — |
| bram | BRAM | Miner | ⛏ | Any ore, gem or ingot | Basic pickaxe → `mineUnlocked=true` |

### Heart System
5 hearts. Thresholds: `[60, 400, 800, 1200, 1900]` (VIL_HEART_XP).
Favourite gift = 30 XP, other gift = 18 XP (×2 on Harvest Supper). 1 gift/villager/day.
`vilGiftValue()` is the single source of truth; `vilIsFav()` = value ≥ 30.

**Heart timeline (favourite gifts daily):** H1 Day 2 · H2 Day 15 · H3 Day 42 · H4 Day 82 · H5 Day 145

## Villager Shops

### Wren 🎣
Bamboo Rod (400g, H1) · Fibre Rod (1200g, H2) · Lucky Bait (80g, H3) · Master Rod (4000g, H4) · Fish Net (2000g, H5)

### Hob 🍳
Herbal Tea +5⚡ (15g, H1) · Hearty Meal +15⚡ (40g, H2) · Farm Stew +25⚡ (70g, H3) · Grand Feast +40⚡ (120g, H4) · Golden Elixir +60⚡ (250g, H5)
(Shop items are eaten instantly; Kitchen meals of the same name are separate bag items.)

### Sal 🛒
Super Fert (150g, H1, +3 charges, stacks) · Satchel 40 (500g, H2) · Large Bag 60 (1200g, H3) · Merchant Bag 80 (2500g, H4) · Bulk Deal (free, H5, once/season)

### Bess 🐄
Coop (800g+15wood, H1) · Chicken (300g, H1) · Barn (2000g+25wood, H2) · Cow (800g, H2) · Auto Feeder (500g, H3) · Auto Collector (1500g, H5)

### Ford 🪓
Copper Axe (300g+5copper, H1) · Sharpen (40g, H1) · Tree Tonic (80g, H2) · Iron Axe (800g+5iron, H3) · Growth Dust (200g, H4) · Gold Axe (2000g+3gold ore, H5)

### Mayor 🎩
Copper Can (300g, H1) · Iron Can (800g, H2) · Angel Fruit +10 max energy (1500g, H3) · Gold Can (2000g, H4) · Angel Fruit +10 max energy (3000g, H5)
Each Angel Fruit can be bought once (`achFlags.bought_mj_fruit1/2`) and never past the 50 cap.

### Bram ⛏
Copper Pick (400g+5copper, H1) · Mining Tonic (60g, H2) · Iron Pick (1000g+5iron, H3) · Iron Grip (80g, H3) · Blast Powder (120g, H4) · Gold Pick (2500g+3gold ore, H5)

---

## Key State Variables

```js
// Economy
coins, day, hvst, totalEarned, energy, maxEnergy(30, cap 50), fertilized(charges), bagCapacity(30)

// Season
seasonIndex, seasonDay, seasonHarvests{spring,summer,fall,winter}

// Day clock
dayStartTime          // runtime only — derived from saved daySecs
clockFrozenAt         // null, or seconds into the day while frozen
titleScreenOpen       // clock stays frozen until START/CONTINUE
dayPenaltyEnergy      // true after a forced 1am sleep → next morning 90% energy
DAY_SECS = 600, DAY_START_H = 6, DAY_END_H = 25

// Skills — each {xp, level}
skills{farming, foraging, fishing, chopping, mining}   // 'chopping' = Woodcutting

// Tiles
tiles[6] {st:'empty'|'grow'|'ready'|'locked', crop, plantedDay, growDays, daysGrown,
          watered, waterDueDay, iv, timer}

// Inventory
inventory{}, shipping{}, sel (selected crop), lockedItems{}

// Woodcutting
hasAxe, axeTier(0–3), treeHp, treeMaxHp, treeRespawnDaysLeft, tree2Hp, tree2RespawnDaysLeft
wcSharpenCharges, wcTonicReady, wcInstaGCharges, wateringCanTier

// Fishing
fishingUnlocked, fishingRod(0–3), luckyBaitReady, fishNetReady

// Mining
mineUnlocked, pickaxeTier(0–3), mineFloor, mineCheckpoint, mineStartFloor
mineRocks[], mineActive, mineActiveBuffs{tonic:0, grip:0}, mineConsumables{tonic, grip, blast}

// Animals
buildings{coop, barn}, animals[], autoFeeder, autoCollect

// Town Hall
townHall{rooms{}, sprinklerTier, forgeQueue:[...], preserveQueue:[...]}

// Kitchen / Festivals
cookBuffs{day, fishing, mining, wood, forage, farm}   // cleared every new day
knownRecipes{}                                        // reserved (recipes derive from Hob hearts)
eventsSeen{'blossom_1':true, ...}                     // festival gifts claimed per year

// Villagers
villagerState{[vilId]:{hearts, xp, giftedToday}}, villagerOpen, vilMet{}

// Sal special systems
salStockRemaining(3), salStockWindow(0), salBulkDealUsed(false)

// Achievements
achUnlocked{}, achFlags{}

// Settings
soundEnabled, musicEnabled, musicVolume, pcMode, devMode
devFlags{unlimitedEnergy, instantGrow, rareForage}
notifEnabled, speed

// PWA
deferredInstallPrompt, notifMissTimer
```

---

## ALL_ITEMS_MAP
Runtime registry for non-crop items (saved as `allItemsMap`). `forgeIngotReady()` pre-registers ingots, ores, wood (2g), sap (8g),
animal products and Kitchen meals at startup. Register anything new before `addToInventory`:
```js
if(!ALL_ITEMS_MAP['wood']) ALL_ITEMS_MAP['wood']={icon:'🪵',name:'WOOD',sell:2};
```
Meal entries carry `energy` and `buff`; `registerRecipeItems()` always overwrites them from `TH_RECIPES`.

---

## Notification System
Single notification only: "🌾 Fernhollow Farm Misses You" — fires after 2 hours away, scheduled on page hide,
cancelled on show, `renotify:false`, tag `farm_miss`, one per absence.
Functions: `notifScheduleMiss()`, `notifCancelMiss()`, `notifInit()`, `notifToggle(on)`, `notifRequest()`
Stub functions kept for old call sites: `notifScheduleCrop()`, `notifCancelCrop()`, `notifScheduleNewDay()`, `notifScheduleSeason()`, `notifCancelAll()`

---

## Overlays & UI Systems
- **Tab Tips** — `showTabTip(key)`: 'bag','valley','town'. Guards: `if(tutActive) return`
- **Skill Intro Tip** — `showSkillIntroTip()`: fires once on first level-up
- **Achievement Pop** — `showAchPop(a)`: 3s bottom toast. `updateAchBadge()`: red dot on ⭐
- **Dialogue Scroll** — `showVilDialogue(villager, lines[], giftInfo, onCompleteCallback)` (first meets + festivals)
- **Gift Chooser** — `openGiftChooser(vilId)` → `doGiftItem(vilId, itemId)`
- **Ship Qty Picker** — `openShipQty(itemId)` → `shipQtyConfirm()`
- **Sleep Confirm** — shown by `clickHouse()`, inline DOM overlay with cancel/sleep buttons
- **Install Banner** — `showInstallBanner()` / `dismissInstallBanner()`. Auto-detects Android vs iOS
- **Standalone Notif Prompt** — `promptStandaloneNotifs()`. Fires once on first PWA launch

---

## Fish Minigame Details
- Fill rate in zone: `dt * 30`
- Drain when out of zone: `dt * (getFishDrainRate() * drainMult + 4)`, `drainMult = 0.7 + difficulty * 0.8`
- `getFishDrainRate()`: 4 at Fishing LV9+, else 6
- Zone size: `getFishZoneSize(base)` — base = `32 - difficulty*18`, +8px LV4, +16px LV7, +8px Angler's Pie

---

## Roadmap
### Complete ✅
- Achievements, Notifications, Title screen, PWA/installable
- Town Hall (4 rooms, sequential), Villagers, Mining, Smelting
- Preserving (timed, crop-value-based)
- Player-driven day system (10 min/day)
- Two trees, Growth Dust
- Lucky Bait + Fish Net
- Sal Rare Stock + Bulk Deal
- Floor 100 Angel Fruit reward
- Balance pass (XP rates, heart curve, crop unlock pacing)
- Sleep confirm popup
- Network-first SW (auto-updates for players)
- **v1.1:** Cooking depth (11 recipes, Hob teaches, meal buffs) · Sap has a use (cooking) · Seasonal festivals · Formspree feedback integration (needs endpoint) · bug-fix pass
- **v1.2:** Custom pixel art for every icon and the whole farm scene · multi-song music engine · bug report removed · scene layout fix (coop/barn/crops)

### Long Term
- Ads for season skipping (needs an ad network account)
- Multiplayer / trading (needs a server)

---

## Balance Reference

### Crop Income (daily, 6 plots)
T1 ~132g · T2 ~189g · T3 ~226g · T4 ~252g · T5 ~448g · T6 ~705g

### Town Hall Year Arc
| Room | Completes | Key gate |
|---|---|---|
| Great Hall 🏛 | ~Day 13 | 15 Cauliflower (T2, need 8 season harvests first) |
| Kitchen 🍳 | ~Day 34 | Barn build + 8 animal products bottleneck |
| Workshop 🔨 | ~Day 45 | 25 ore grind |
| Storeroom 📦 | ~Day 88 | Snow Yam Winter-only gate |

### Skill LV10 Timeline
Farming ~90–110 days · Foraging ~87–116 · Fishing ~100–130 · Woodcutting ~69 · Mining ~70–100 · All LV10 ~200–230 days

### Energy Budget (base 30)
- Full 6-plot farm loop: ~18 energy (plant + water + harvest)
- Leaves ~12 energy for valley activities
- Max energy: 30 → 40 → 50 cap. Sources: Mayor H3 fruit, Mayor H5 fruit, Floor 100 fruit (any two reach the cap; the third pays 2000g / shows as owned)

---

## Known Issues / Watch List
- `forceSleep()` is now the only forced-sleep path (called from `clockTick` at 1am)
- `SHOP_ITEMS` / `renderShop()` / `doBuy()` are legacy (no UI uses them) — villager shops replaced them
- `knownRecipes` is saved but unused (recipes derive from Hob's hearts)
- Formspree is inactive until `FORMSPREE_ENDPOINT` is filled in

---

## File Safety Rules
- Always verify `index.html` starts with `<!DOCTYPE html>` after every edit
- Run `node --check` on extracted JS before delivering
- Check `str_replace` target strings are unique before replacing
- After any `str_replace` involving function declarations, verify the function still exists inside a `<script>` tag
- Bump `sw.js` cache version on every delivery
