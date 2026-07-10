# Anno Trader — Game Design Document

## Vision

A browser-based trading and colonization game set in a pre-rendered isometric archipelago world. The player is a merchant expanding a maritime trade empire across procedurally arranged islands. Cities grow organically based on the goods the player delivers — the player never places individual buildings but instead shapes civilization through commerce and infrastructure.

**Core fantasy:** "I am a merchant who turned scattered fishing villages into thriving cities by connecting them with trade routes."

**Inspirations:**
- **Anno 1602** — Island colonization, resource chains, isometric pixel art aesthetic
- **Patrician 3** — Maritime trade mechanics, buy/sell at ports, supply/demand pricing, fleet management
- **OpenTTD** — Autonomous city growth driven by player-delivered goods, functional toolbar UI, infrastructure focus over micromanagement

---

## Core Loop

```
Explore islands → Establish trade posts → Discover supply/demand →
Set up trade routes → Deliver goods → Cities grow →
New goods demanded → Expand routes → Colonize new islands → ...
```

The player's minute-to-minute activity is:
1. Reading the market (which cities want what)
2. Buying low, sailing, selling high
3. Investing profits into ships, warehouses, and new trade posts
4. Watching cities evolve as a result of their trade decisions
5. Establish industry to produce new goods with lower prices

---

## World

### Map
- A procedurally generated archipelago of **12–20 islands** of varying sizes
- Islands are connected by sea lanes with varying distances
- Each island has a **climate zone** (temperate, tropical, arid) that determines which goods it can produce naturally
- The map is revealed through exploration — unexplored areas are covered in fog of war

### Islands
Each island starts with a small settlement (a dock and a few houses). Islands have:
- **Natural resources** — determined by climate (e.g. tropical islands produce spices and sugar, temperate islands produce grain and wool, arid islands produce salt and clay)
- **Population** — grows when the settlement's needs are met
- **Development level** — Village → Town → City → Metropolis (visual transformation of the settlement)
- **Production slots** — as population grows, new production buildings appear automatically based on available resources

### Climate Zones & Native Resources

| Climate    | Raw Resources                              | Processed Goods Potential                        |
|------------|--------------------------------------------|--------------------------------------------------|
| Temperate  | Grain, Hops, Wool, Cattle, Timber, Iron    | Bread, Beer, Cloth, Salted Meat, Lumber, Tools   |
| Tropical   | Sugar, Spices, Cotton, Cacao, Tobacco, Dye | Rum, Luxury Cloth, Chocolate, Cigars, Paint      |
| Arid       | Salt, Clay, Hemp, Stone, Grapes, Gems      | Pottery, Rope, Bricks, Wine, Jewelry             |

Some base resources are available everywhere like in Anno. For example: Timber, Fish

---

## Economy & Trading

### Goods System

Goods exist in two tiers:

**Raw materials** — produced by primary industries that appear on islands with matching natural resources. Production is automatic and continuous once the island has enough population.

**Processed goods** — produced when a settlement grows large enough to build workshops. Requires raw material input. A Town-level settlement on a temperate island with grain will automatically build a bakery, producing bread — but only if grain is available locally or being delivered by the player.

### Production Chains

All processed goods and their inputs. Most chains take a single input; a few take two — these are the most profitable goods and often require inputs from *different climate zones*, deliberately forcing long-distance trade (marked ⚓).

| Processed Good | Input(s)          | Climate   | First demanded at    |
|----------------|-------------------|-----------|----------------------|
| Cloth          | Wool              | Temperate | Village (growth)     |
| Tools          | Iron              | Temperate | Village (growth)     |
| Bread          | Grain             | Temperate | Town (growth)        |
| Beer           | Hops              | Temperate | Town (growth)        |
| Lumber         | Timber            | Any       | Town (growth)        |
| Pottery        | Clay              | Arid      | Town (growth)        |
| Salted Meat ⚓  | Cattle + Salt     | Temperate | City (growth)        |
| Rum            | Sugar             | Tropical  | City (growth)        |
| Luxury Cloth   | Cotton            | Tropical  | City (growth)        |
| Rope           | Hemp              | Arid      | City (growth)        |
| Bricks         | Stone             | Arid      | City (growth)        |
| Chocolate ⚓    | Cacao + Sugar     | Tropical  | Metropolis (growth)  |
| Cigars         | Tobacco           | Tropical  | Metropolis (growth)  |
| Paint          | Dye               | Tropical  | Metropolis (growth)  |
| Wine           | Grapes            | Arid      | Metropolis (growth)  |
| Jewelry        | Gems              | Arid      | Metropolis (growth)  |

Spices are the one raw good consumed directly by the population (Metropolis) rather than being processed.

### Supply & Demand

Each settlement has:
- **Supply** — goods currently stored at the port warehouse, plus ongoing local production
- **Demand** — goods the population wants but cannot produce locally (or produces insufficiently)
- **Prices** — driven by supply/demand ratio, updated in real-time

**Price formula (simplified):**
- Base price is fixed per good
- Surplus supply → price drops (down to ~40% of base)
- Unmet demand → price rises (up to ~250% of base)
- Prices shift gradually, not instantly — the player can exploit a price window before the market corrects

**Market information:**
- The player can see supply/demand/price for any island where they have a trade post
- Islands without a trade post show only rough demand indicators (icons showing general need categories)
- A trade overview window (OpenTTD-style sortable list) shows all known markets at a glance

### Trade Posts

To trade at an island, the player must first establish a **trade post** (costs 300 gold). Trade posts provide:
- Full market visibility (exact prices, quantities)
- Warehouse storage (goods can be stockpiled; upgradable)
- Automated loading/unloading for trade routes
- Ability to set buy/sell orders with price thresholds

Trade posts can be upgraded:
1. **Dock** (starting) — small warehouse, manual trading only
2. **Trading Post** — larger warehouse, can set up automated routes, more storage
3. **Merchant House** — largest warehouse, price alerts, can set buy/sell limits, more storage

### Manual vs. Automated Trading

**Manual trading:** Early game. The player selects a ship, sails it to a port, and manually buys/sells goods. This teaches the mechanics and lets the player discover profitable routes.

**Automated trade routes:** Mid-game. The player defines a route:
1. Pick waypoints (island A → island B → island C → ...)
2. At each stop, define: load [good] up to [amount] / unload [good] down to [amount]
3. Optionally set price thresholds: "only buy grain if price < 120%" or "only sell spices if price > 180%"
4. Assign one or more ships to the route

Ships on automated routes operate independently. The player can monitor their progress and profits through the route management panel.

---

## City Growth

Cities are **not built by the player**. They grow (or shrink) organically based on how well their population's needs are met. This is the central feedback mechanism that makes trading feel meaningful.

### Population Needs by Development Level

| Level       | Population  | Basic Needs                            | Growth Needs (to advance)                        |
|-------------|-------------|----------------------------------------|--------------------------------------------------|
| Village     | 50–200      | Food (any)                             | Cloth, Tools                                     |
| Town        | 200–800     | Food, Cloth                            | Bread, Beer, Pottery, Lumber                     |
| City        | 800–2500    | Bread, Cloth, Tools, Beer              | Luxury Cloth, Rum, Bricks, Salted Meat, Rope     |
| Metropolis  | 2500–8000   | Bread, Luxury Cloth, Salted Meat, Rum  | Spices, Paint, Chocolate, Cigars, Wine, Jewelry  |

Consumable growth needs become everyday consumption at the next level: what a Town needed to *advance* (e.g. Beer), a City consumes as a *basic* need. This creates a ratchet — a growing settlement permanently deepens its demand, and the player's supply obligations grow with it. Construction-type goods (Lumber, Pottery, Bricks, Rope) are the exception: they are consumed during the growth phase only and drop out of demand once the settlement has advanced.

### Growth Mechanics

- Each tick (e.g. every few seconds of game time), a settlement checks its warehouse
- If **basic needs** are met → population holds steady (no decline)
- If **growth needs** are partially met → slow population growth
- If **growth needs** are fully met → fast population growth, eventual level-up
- If **basic needs** are unmet → population slowly declines
- Level-up triggers a visual transformation (new buildings appear, the settlement sprite changes)

### What Growth Unlocks

When a settlement levels up:
- **New production buildings** appear automatically (bakery at Town, weaver at City, etc.)
- **Tax income** increases — the player earns passive gold from settlements where they have a trade post, proportional to population and satisfaction
- **New demand** emerges — higher-tier goods are now wanted, creating new trade opportunities
- **Harbor capacity** increases — more ships can dock simultaneously

---

## Ships & Fleet

### Ship Types

| Ship           | Cargo | Speed  | Cost   | Unlock          |
|----------------|-------|--------|--------|-----------------|
| Pinnace        | 30    | Fast   | Low    | Starting ship   |
| Fluyt          | 80    | Medium | Medium | Own a Town      |
| Galleon        | 150   | Slow   | High   | Own a City      |
| Merchantman    | 200   | Medium | V.High | Own a Metropolis|

- Ships are bought at any settlement with a shipyard (appears at Town level or higher)
- Ships have a cargo hold divided into slots; each slot holds one type of good
- Ships can be named by the player

### Ship Actions
- **Sail to** — manually direct a ship to an island
- **Assign to route** — put the ship on an automated trade route
- **Anchor** — park at current port
- **Patrol** — sail between two points (useful later for escort/defense if combat is added)

### Navigation
- Ships move in real-time across the sea between islands
- Wind direction affects speed (optional advanced mechanic — ships sailing with the wind move faster)
- Ships can be clicked to see their cargo, destination, and assigned route

---

## Colonization

### Discovering New Islands
- The player starts with 1–2 known islands
- Sending a ship into fog of war reveals new islands
- Each discovered island shows its climate zone, natural resources, and current settlement state

### Establishing a Colony
When the player finds an uninhabited or undeveloped island:
1. Send a ship loaded with **Pioneers** (a special "good" representing settlers) + **Tools** + **Timber**
2. The ship arrives, and a **Colony** action becomes available
3. Colonizing costs the loaded goods and establishes a Village + Trade Post on the island
4. The new village begins producing based on the island's natural resources
5. The player must now supply the village's needs to help it grow

### Island Ownership
- The first player (or NPC) to colonize an island owns it
- The owner gets tax income and can upgrade the trade post
- Other merchants can still trade at the port but cannot set up a trade post (they trade at slightly worse prices)
- In a future version, islands could be contested or bought

---

## Player Progression

### Early Game (Minutes 0–15)
- Start with one island (home port), one Pinnace, and modest gold
- Learn manual trading between home port and 1–2 nearby islands
- Goal: earn enough to establish a trade post on a second island and buy a second ship

### Mid Game (Minutes 15–45)
- 3–5 islands with trade posts
- First automated trade routes running
- Home island growing toward City level
- Exploring the map, discovering tropical/arid islands with exotic goods
- Colonizing 1–2 new islands for strategic resource access
- Fleet of 4–8 ships

### Late Game (Minutes 45–90+)
- 8+ islands connected by a web of trade routes
- Multiple Cities and at least one Metropolis
- Complex multi-leg trade routes (grain from temperate → bread baked locally → shipped to tropical island that sends back spices)
- Managing fleet efficiency, warehouse capacity, route optimization
- Passive income from taxes is substantial but not enough alone — active trade management stays rewarding

### Victory / Endgame
The game is open-ended (sandbox), but milestone achievements provide structure:
- **Merchant** — accumulate 10,000 gold
- **Admiral** — own a fleet of 10+ ships
- **Governor** — grow a settlement to Metropolis
- **Tycoon** — have trade posts on 10+ islands
- **Emperor** — grow 3 settlements to Metropolis level simultaneously
- **Cartographer** — reveal the entire map

---

## User Interface

Modeled after OpenTTD's functional, information-dense toolbar approach.

### Screen Layout

```
┌─────────────────────────────────────────────────────┐
│ [Toolbar]  Gold: 5,230  Date: March 1503   [⏸▶⏩]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              Isometric Game World                   │
│              (scrollable, zoomable)                 │
│                                                     │
│                                                     │
│                                        ┌──────────┐ │
│                                        │ Minimap  │ │
│                                        └──────────┘ │
├─────────────────────────────────────────────────────┤
│ [Status bar: selected entity info / notifications]  │
└─────────────────────────────────────────────────────┘
```

### Toolbar Buttons (left to right)
1. **Islands** — list of all known islands with population, level, key stats
2. **Ships** — list of all ships with cargo, location, assignment
3. **Routes** — list of trade routes with profitability, assigned ships
4. **Trade Overview** — matrix of goods × islands showing prices (color-coded: green = cheap, red = expensive)
5. **Build** — establish trade post, buy ship (context-sensitive to selected island)
6. **Finances** — income/expenses breakdown, balance history graph

### Interaction Model
- **Left-click** an island → select it, show port info in status bar
- **Left-click** a ship → select it, show cargo/route in status bar
- **Right-click** on sea with ship selected → sail to that point
- **Right-click** on island with ship selected → sail to that island's port
- **Double-click** an island → open its detailed trade/population panel
- **Double-click** a ship → open its cargo/route management panel
- **Scroll wheel** → zoom in/out
- **Click-drag** on empty space → pan the map
- **Keyboard shortcuts** — 1-6 for toolbar buttons, Space for pause/play, +/- for game speed

### Panels & Windows
All detail panels open as **draggable, stackable windows** within the game view (OpenTTD style):
- Can have multiple windows open simultaneously
- Windows can be pinned to stay open
- Windows update in real-time

**Island Detail Panel:**
```
┌─ Havana (Tropical) ─────────────────────┐
│ Population: 1,240 (City ████████░░)     │
│ Tax Income: 45 gold/month               │
│                                         │
│ Warehouse:                              │
│  Sugar    ████████░░  80/100  Buy: 62   │
│  Spices   ██░░░░░░░░  20/100  Buy: 185  │
│  Rum      ██████░░░░  55/100  Sell: 140 │
│  Bread    ░░░░░░░░░░   0/100  ---       │
│  Cloth    ███░░░░░░░  30/100  Buy: 95   │
│                                         │
│ Needs: Bread(!!!) Tools(!) Cloth(✓)     │
│                                         │
│ [Buy/Sell]  [Upgrade Post]  [Details]   │
└─────────────────────────────────────────┘
```

**Trade Route Panel:**
```
┌─ Route: Spice Run ──────────────────────┐
│ Profit: +320 gold/month                 │
│ Ships: Santa Maria, Endeavour           │
│                                         │
│ 1. Porto (load Bread ≤50, load Tools ≤20│
│ 2. Havana (sell Bread, sell Tools,      │
│            load Spices ≤40, load Rum ≤30│
│ 3. Porto  (sell Spices, sell Rum)       │
│                                         │
│ [Edit Route]  [Add Ship]  [Pause]       │
└─────────────────────────────────────────┘
```

### Notifications
- Toast-style notifications slide in from the bottom-right:
  - "Santa Maria has arrived at Havana"
  - "Porto has grown to City level!"
  - "Bread shortage at Havana — price rising"
  - "New island discovered: Isla Verde (Tropical)"
- Clicking a notification centers the camera on the relevant entity

---

## Game Speed & Time

- Time flows continuously; one game "month" ≈ 30–60 seconds real time
- Three speed settings: Normal (1x), Fast (2x), Very Fast (4x)
- Pause available — the player can issue orders while paused, they execute on unpause
- Ships take 5–30 seconds (real time, 1x speed) to travel between islands depending on distance

---

## NPC Merchants (Future Feature)

To add life and competition:
- 2–4 NPC merchant fleets operate on the map
- They trade autonomously, affecting supply/demand at ports
- NPCs may colonize unclaimed islands
- NPCs trade at the same prices as the player (no cheating)
- The player can observe NPC ships and infer their trade routes
- No direct combat in initial version — competition is purely economic

---

## Visual Style

- **Isometric pixel art** inspired by Anno 1602's warm, detailed aesthetic
- Pre-rendered feel: rich colors, dithered shadows, visible tile grid
- Water has subtle animated waves
- Ships leave small wakes as they sail
- Settlements visually transform as they level up (more buildings, taller structures, market squares appear)
- Day/night cycle is cosmetic only (no gameplay effect) — adds atmosphere
- UI elements use a clean, functional style with muted earth-tone chrome (OpenTTD's utilitarian look, but with parchment/wood texture accents to match the colonial theme)

---

## Technical Scope (Browser Game)

- HTML5 Canvas for isometric rendering
- Vanilla JavaScript (no frameworks)
- Game state saved to localStorage
- Tile-based world with pre-drawn island templates
- Target: 60fps on modern browsers, playable on tablet screens
- Single-player only (initial version)

---

## Open Questions & Future Directions

1. **Combat** — Should pirates/naval combat exist? Could add risk to trade routes and a reason to buy escort ships. Risk: scope creep.
2. **Diplomacy** — Trade agreements with NPC merchants? Exclusive port access?
3. **Random events** — Storms that slow/damage ships, plagues that reduce population, bumper harvests that spike supply?
4. **Building placement** — Should the player ever place individual buildings, or keep it fully automatic? Current design leans fully automatic.
5. **Multiplayer** — Could work as a competitive or cooperative mode via WebSockets in a future version.
6. **Technology tree** — Unlock better ships, warehouse upgrades, navigation improvements over time?

---

## Summary of Key Design Pillars

1. **Trade is the verb** — The player trades. Cities grow as a consequence. No direct city building.
2. **Readable markets** — Prices, supply, and demand are always visible and understandable. No hidden mechanics.
3. **Automation as progression** — Manual trading early, automated routes later. The game rewards scaling up.
4. **Visual reward** — Watching a village grow into a metropolis because of your trade network is the core emotional payoff.
5. **Depth without complexity** — Few unit types, clear resource chains, emergent complexity from the economic simulation.
