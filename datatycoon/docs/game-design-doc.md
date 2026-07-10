# Data Miner Idle – Game Design Document

**Version:** 1.0 Draft
**Genre:** Idle / Incremental / Logic Puzzle Hybrid
**Platform:** Mobile-first (iOS & Android)
**Business Model:** Freemium (early game free, premium unlock for full content)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Game Overview](#2-game-overview)
3. [Core Mechanics](#3-core-mechanics)
4. [Economy & Resources](#4-economy--resources)
5. [Progression System](#5-progression-system)
6. [Infrastructure & Hardware](#6-infrastructure--hardware)
7. [Marketplaces](#7-marketplaces)
8. [World Map & Regions](#8-world-map--regions)
9. [Competition & Social](#9-competition--social)
10. [UI & Screens](#10-ui--screens)
11. [Visual Style & Theme](#11-visual-style--theme)
12. [Audio Design](#12-audio-design)
13. [Narrative & Flavor](#13-narrative--flavor)
14. [Onboarding & Tutorial](#14-onboarding--tutorial)
15. [Technical Considerations](#15-technical-considerations)
16. [Risks & Open Questions](#16-risks--open-questions)

---

## 1. Executive Summary

**Data Miner Idle** is a mobile idle game where you build a data processing empire — starting from a single computer in a garage and scaling to a global network of data centers. What sets it apart from typical idle games is a **logic puzzle core**: you design algorithms by connecting processing nodes, and the efficiency of your solution directly determines your throughput. Better puzzlers earn faster. Everyone else still progresses — just slower.

**The pitch:** *Factorio meets 2048 meets crypto miner tycoon — but the mining is your brain.*

### Target Audience

- Idle/incremental game fans who want more agency than tapping
- Puzzle game fans who enjoy optimization (SpaceChem, Opus Magnum, Factorio)
- Players who enjoy tycoon/empire building on mobile
- Age 16+, skewing toward players who enjoy systems thinking

### Unique Selling Points

- **Skill matters in an idle game.** Algorithm quality directly impacts earnings — not just time invested.
- **Two engagement modes.** Active play (puzzle solving, optimization) and passive play (idle accumulation, management) coexist naturally.
- **Competitive idle.** Visible competition for data packages creates urgency without stress.
- **Deep infrastructure strategy.** Hardware, networking, geography, and energy costs form a rich management layer.

---

## 2. Game Overview

### 2.1 Core Fantasy

You are a data miner in a near-future digital economy. Companies and institutions post data processing contracts on open marketplaces. Anyone with hardware and the right algorithms can claim a contract, crunch the data, and get paid. You start small. You grow big.

The fantasy is one of **building intelligence into machines** — you're not clicking to generate money, you're engineering systems that generate money. The puzzle layer reinforces this: you literally design the logic that makes your operation faster.

### 2.2 High-Level Game Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   BROWSE marketplace for data packages                  │
│        ↓                                                │
│   CLAIM a package (or multiple)                         │
│        ↓                                                │
│   BUILD / ASSIGN an algorithm (logic puzzle)            │
│        ↓                                                │
│   ALLOCATE hardware resources (CPU, RAM, bandwidth)     │
│        ↓                                                │
│   PROCESS — data crunches over time (idle or active)    │
│        ↓                                                │
│   DELIVER results → get paid                            │
│        ↓                                                │
│   UPGRADE hardware, unlock markets, expand              │
│        ↓                                                │
│   (loop)                                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Session Structure

**Short session (1–3 min):** Collect offline earnings. Check marketplace for good contracts. Reassign CPU time. Start new jobs. Leave.

**Medium session (5–15 min):** Above, plus solve a new algorithm puzzle. Optimize an old algorithm. Upgrade some hardware. Compare leaderboard.

**Long session (15–45 min):** Above, plus explore new marketplace tier. Plan data center expansion. Tackle a hard algorithm puzzle. Manage multi-site operations on the world map.

### 2.4 Idle vs. Active Balance

The game always makes progress while idle. Processing continues, packages complete, money accumulates. But active play is **rewarded, not required**:

- Optimizing an algorithm can 2×–5× your processing speed for that data type — a massive advantage that only comes from solving puzzles.
- Manual CPU reallocation during peak contract windows can boost earnings vs. the auto-balance default.
- Scouting marketplaces for high-value packages before competitors claim them rewards active attention.

**Design principle:** Idle earnings should feel good. Active earnings should feel *great*. Neither should feel mandatory.

---

## 3. Core Mechanics

### 3.1 Algorithm Builder — The Logic Puzzle

This is the game's signature mechanic and primary skill differentiator.

#### 3.1.1 Concept

Each **data type** in the game (see §7) requires an algorithm to process it. An algorithm is a visual pipeline you construct by placing and connecting **processing nodes** on a grid. Data flows in on one side, passes through your node chain, and the correct output must emerge on the other side.

Think of it as a **visual programming puzzle** — but abstracted to be accessible to non-programmers. No code. No syntax. Just boxes, connections, and logic.

#### 3.1.2 The Grid

- A rectangular workspace, sized per puzzle difficulty (4×4 for early, up to 10×8 for late-game).
- **Input port(s)** on the left edge. **Output port(s)** on the right edge.
- Each cell can hold one node or be empty.
- Connections flow left-to-right by default, with some node types allowing branching (splits) and merging (joins).

#### 3.1.3 Node Types

Nodes are the building blocks of algorithms. They are unlocked progressively through the research tree (see §5).

**Tier 1 — Basic (available from start):**

| Node | Function | Example |
|------|----------|---------|
| **PASS** | Forwards data unchanged | Routing/spacing |
| **FILTER** | Removes data matching a condition | Remove nulls |
| **SORT** | Reorders data by a property | Sort ascending |
| **COMPARE** | Outputs true/false branch | Value > threshold? |
| **MERGE** | Combines two inputs into one stream | Join datasets |

**Tier 2 — Intermediate (unlocked mid-game):**

| Node | Function | Example |
|------|----------|---------|
| **COMPRESS** | Reduces data size (speeds transfer) | Zip output |
| **ENCRYPT** | Required for secure data types | Apply cipher |
| **TRANSFORM** | Maps values via a function | Normalize 0–1 |
| **BUFFER** | Stores data, releases in batch | Accumulate rows |
| **SPLIT** | Divides stream into N sub-streams | Parallel paths |

**Tier 3 — Advanced (late-game):**

| Node | Function | Example |
|------|----------|---------|
| **ML MODULE** | Pattern recognition, auto-classifies | Categorize images |
| **GPU ACCEL** | Massively speeds adjacent nodes | Parallel compute |
| **QUANTUM GATE** | Solves certain NP-type nodes instantly | Collapse search |
| **LOOP** | Iterates a sub-path N times | Recursive refine |
| **CACHE** | Remembers results, skips re-computation | Memoize patterns |

#### 3.1.4 Solving a Puzzle

When you encounter a new data type, you are presented with:

1. **Sample input data** — a small, visible dataset showing what comes in.
2. **Expected output** — what the processed result should look like.
3. **Available nodes** — which nodes you've unlocked.
4. **Grid size** — the workspace available.

You place nodes on the grid and connect them. A **"Test Run"** button executes your pipeline against the sample data and shows you intermediate results at each node (for debugging). When the output matches the expected result, the algorithm is **validated**.

#### 3.1.5 Efficiency Scoring

A valid algorithm works — but not all valid algorithms are equal. Efficiency is scored on three axes:

- **Node count** — fewer nodes = less compute overhead. Weight: 40%
- **Path length** — shorter critical path = less latency per cycle. Weight: 35%
- **Elegance bonus** — using certain advanced techniques (parallelism, caching, compression) triggers multipliers. Weight: 25%

The resulting **efficiency score** is a multiplier on processing speed (e.g., 1.0× baseline, up to ~5.0× for an optimal solution). This score is displayed as a letter grade for quick readability:

| Grade | Efficiency Multiplier | Meaning |
|-------|-----------------------|---------|
| F | 1.0× | Valid but brute-force |
| D | 1.3× | Below average |
| C | 1.7× | Decent |
| B | 2.2× | Good — most players land here |
| A | 3.0× | Excellent |
| S | 4.0× | Near-optimal |
| S+ | 5.0× | Theoretically perfect or exceptionally creative |

Players can **revisit and re-optimize** any algorithm at any time. Improved efficiency retroactively speeds up all active jobs of that type.

#### 3.1.6 Multiple Solutions & Discovery

Most puzzles have multiple valid solutions. The game tracks:

- Your **current best** efficiency for each data type.
- A **community benchmark** (median grade of all players for that puzzle) — to show how you compare without spoiling solutions.
- Optional **hints** purchasable with in-game currency (not premium) that reveal one optimal node placement.

#### 3.1.7 Algorithm Slots

You can save multiple algorithm variants per data type (e.g., one optimized for speed, one using fewer rare nodes). Slot count starts at 1 per type and can be expanded.

---

### 3.2 Data Package Processing

#### 3.2.1 What Is a Data Package?

A data package is a job. It has:

| Property | Description |
|----------|-------------|
| **Type** | The kind of data (determines which algorithm is needed) |
| **Size** | Total data units to process (determines duration) |
| **Payout** | Credits earned on completion |
| **Source marketplace** | Which market it came from |
| **Competition** | Whether other miners are working on the same package |
| **Deadline** (optional) | Time limit for bonus payout |
| **Requirements** | Minimum hardware specs (RAM, CPU tier, bandwidth) |

#### 3.2.2 Processing Flow

1. **Claim** a package from a marketplace.
2. **Assign** it to a computer (or computer cluster).
3. The game calculates **processing speed** based on:
   - Algorithm efficiency score
   - CPU power allocated to the job
   - RAM available (bottleneck if insufficient — speed penalty)
   - Network bandwidth (for data transfer phases at start and end)
4. A **progress bar** fills over time. This continues while offline.
5. On completion, results are **uploaded** (bandwidth-dependent) and you receive payment.

#### 3.2.3 Processing Speed Formula

```
Base Speed = CPU_Power × Algorithm_Efficiency_Multiplier

RAM_Factor = min(1.0, Available_RAM / Required_RAM)
    → If RAM < Required: speed penalty (linear)
    → If RAM >= Required: no penalty (factor = 1.0)

Effective Speed = Base_Speed × RAM_Factor

Processing Time = Package_Size / Effective_Speed

Transfer Time = Package_Size / Bandwidth (applies to download + upload phases)

Total Time = Transfer_Time_Down + Processing_Time + Transfer_Time_Up
```

Latency modifiers from network routing and geographical distance are added in mid-to-late game (see §8).

#### 3.2.4 Multi-Job Management

Multiple packages can process simultaneously if you have the hardware. Each computer (or core within a computer) can run one job at a time. CPU time is split via a **slider allocation system** (see §3.3).

---

### 3.3 CPU Time Allocation & Job Management

#### 3.3.1 The CPU Budget

Each computer has a total **compute budget** measured in abstract "cycles per second" (cps). When multiple jobs run on the same machine, you allocate what percentage of the budget each job receives.

**Interface:** A set of horizontal sliders, one per active job, that must sum to 100%. Dragging one slider auto-adjusts the others proportionally (with a lock toggle to pin specific jobs).

#### 3.3.2 Auto-Balance vs. Manual

- **Auto-balance (default):** Distributes CPU equally among all active jobs. Simple, hands-off, works fine for casual play.
- **Manual allocation:** Player sets exact percentages. Useful for prioritizing a high-payout or deadline-critical job while letting others trickle.
- **Priority queue mode (unlockable):** Assign priority ranks. The system auto-allocates more CPU to higher-priority jobs and dynamically rebalances as jobs complete.

#### 3.3.3 Job Queue

If more packages are claimed than can run simultaneously, excess jobs enter a **queue**. The queue can be reordered manually. Jobs in queue do not consume resources.

When a job finishes, the next queued job auto-starts (inheriting the freed resources).

#### 3.3.4 Cluster Distribution

When multiple computers are linked in a **cluster** (see §6), the CPU budget becomes pooled. The player allocates across the combined pool. However, inter-machine communication introduces a small **overhead penalty** (e.g., 5% efficiency loss for 2 machines, 8% for 3, etc.) — mitigable via better networking hardware.

---

### 3.4 Idle Progression & Offline Earnings

#### 3.4.1 Offline Processing

All active jobs continue processing while the app is closed. On return, the player receives a summary screen:

```
┌──────────────────────────────────────┐
│         WELCOME BACK, MINER          │
│                                      │
│  Time away: 6h 23m                   │
│                                      │
│  Jobs completed: 4                   │
│  Revenue earned: 12,450 cr           │
│  Packages delivered: 3               │
│  Jobs still running: 2 (67%, 23%)    │
│                                      │
│  Energy cost: -1,200 cr              │
│  Net profit: 11,250 cr               │
│                                      │
│           [ COLLECT ]                │
└──────────────────────────────────────┘
```

#### 3.4.2 Offline Limitations

To preserve engagement incentives, offline mode operates at a slight disadvantage:

- Processing speed runs at **80% of active speed** (a "thermal throttle" fiction — your systems conserve energy when unmonitored).
- No new packages are auto-claimed. Only jobs that were already running or queued continue.
- Marketplace packages may be claimed by competitors while you're away. Time-sensitive contracts can expire.

These limitations are gentle enough that offline play never feels punishing, but active players maintain a meaningful edge.

#### 3.4.3 Idle Milestones

Returning after long absences (8h+) may trigger **idle bonuses**: a free marketplace refresh, a temporary processing boost, or a chance at a rare package — to make coming back feel rewarding.

---

## 4. Economy & Resources

### 4.1 Currencies

The game uses a **single primary currency** with secondary resources that act as soft gates.

#### 4.1.1 Credits (cr)

The universal currency. Earned by completing data packages. Spent on everything: hardware, marketplace access, energy bills, bandwidth, research, expansion.

**Design intent:** One currency keeps mental overhead low. Progression is gated by *income rate* vs. *cost rate* rather than juggling multiple token types.

#### 4.1.2 Data Tokens (dt)

A secondary currency earned from **high-tier marketplace contracts** and special events. Used for:

- Unlocking premium marketplace tiers
- Purchasing rare hardware components
- Accessing exclusive research branches

Data tokens cannot be bought directly. They are the skill-reward currency — the best algorithm builders and most active players accumulate them faster.

#### 4.1.3 Research Points (rp)

Earned passively over time (proportional to total processing throughput) and as bonuses for achieving algorithm efficiency milestones. Spent exclusively on the **research tree** (see §5.3).

### 4.2 Income

| Source | Scaling |
|--------|---------|
| Package completion payouts | Primary. Scales with package tier, size, and speed bonuses |
| Speed bonuses | +10–50% payout for finishing before deadline or ahead of competition |
| Streak bonuses | Consecutive completions of the same type grant escalating bonuses |
| Idle earnings | Same sources, slightly throttled (see §3.4) |

### 4.3 Costs (Sinks)

| Cost | Description | Scaling |
|------|-------------|---------|
| **Energy** | Per-computer ongoing cost. Scales with hardware power. | Linear with compute power |
| **Bandwidth** | Per-GB transfer cost. Scales with connection tier. | Per-unit, decreasing with scale |
| **Storage** | Monthly cost per TB of active storage. | Linear |
| **Hardware** | One-time purchase costs. Upgrades get exponentially more expensive. | Exponential curve |
| **Marketplace access** | One-time or subscription fee per marketplace tier. | Stepped |
| **Data center rent** | Ongoing cost per facility. Location-dependent. | Fixed per site + variable |
| **Maintenance** | Small ongoing cost per machine to prevent degradation. | Linear with fleet size |

### 4.4 Economic Balance Principles

- **Early game:** Income comfortably exceeds costs. Player should feel growth momentum. Costs are simple (just energy).
- **Mid game:** Costs become meaningful. Player must choose what to invest in. Bad decisions slow you down but never bankrupt you. Cost categories expand (bandwidth, storage).
- **Late game:** Optimization matters. The difference between a well-managed operation and a bloated one is significant. Players who solve algorithms well and allocate resources wisely profit far more than those who brute-force scale.

### 4.5 Anti-Inflation Mechanics

- Hardware costs follow an **exponential curve** — each upgrade of the same component costs ~2.5× the previous one.
- Higher-tier marketplaces require both **credits and data tokens** — preventing pure idle accumulation from unlocking everything.
- Energy costs scale with compute power — bigger operations have proportionally larger overhead.
- Prestige resets (see §5.5) act as a major sink while providing long-term progression.

---

## 5. Progression System

### 5.1 Phases / Eras

The game is divided into distinct phases that change the scope and feel of play.

#### Phase 1: The Garage (Free Tier)

- **Setup:** One desk, one PC, one monitor. Your "office" is a cluttered room.
- **Scope:** 1 computer, Tier 1 marketplace, 3–4 data types, basic nodes only.
- **Focus:** Learn the algorithm builder. Understand the process loop. First upgrades.
- **Duration:** ~1–3 hours of active play (1–2 days with idle).
- **Milestone to advance:** Earn 10,000 cr total, complete first B-grade algorithm.

#### Phase 2: The Home Office (Free Tier)

- **Setup:** Upgraded room. Desk space for 2–3 machines. Better internet.
- **Scope:** Up to 3 computers, clustering unlocked, Tier 2 marketplace, 6–8 data types, intermediate nodes begin unlocking.
- **Focus:** Multi-machine management. CPU allocation becomes relevant. First taste of competition on marketplace.
- **Duration:** ~3–8 hours active (3–5 days with idle).
- **Milestone to advance:** Earn 100,000 cr total, own 3 computers, cluster them.

#### Phase 3: The Startup (Premium Unlock Required)

- **Setup:** Small office space. Dedicated server room. Agents (automation helpers).
- **Scope:** Server racks (up to 10 machines), Tier 3 marketplace, 10+ data types, full intermediate node set, agent automation.
- **Focus:** Scaling. Managing multiple simultaneous high-value contracts. Deeper algorithm challenges. First agents who auto-handle queuing and basic reallocation.
- **Duration:** ~8–20 hours active (1–2 weeks with idle).
- **Milestone to advance:** Earn 1M cr total, achieve A-grade on 5 algorithms.

#### Phase 4: The Company

- **Setup:** First data center. World map unlocks. Multiple locations.
- **Scope:** Data center construction, regional marketplaces, Tier 4 marketplace, advanced nodes, distributed processing.
- **Focus:** Geographic strategy. Latency optimization. Energy cost management. Distributed storage and caching.
- **Duration:** ~20–50 hours active (3–6 weeks with idle).
- **Milestone to advance:** Own 3 data centers on 2 continents, earn 100M cr total.

#### Phase 5: The Enterprise

- **Setup:** Global network. Dozens of data centers. Massive throughput.
- **Scope:** Tier 5 marketplace, quantum computing nodes, AI-assisted algorithm optimization, mega-contracts, full global map.
- **Focus:** End-game optimization. Competing on leaderboards. Prestige mechanics. Mastering the hardest algorithm puzzles.
- **Duration:** Ongoing / infinite.
- **Prestige available:** Reset for permanent bonuses (see §5.5).

### 5.2 Unlock Sequence

Unlocks are tied to specific milestones rather than a single XP bar:

| Unlock | Trigger |
|--------|---------|
| 2nd computer | Earn 5,000 cr |
| Clustering | Own 2+ computers |
| Tier 2 marketplace | Complete 10 packages |
| Intermediate nodes | Research points spent |
| Auto-balance mode | Complete 20 packages |
| Agent #1 | Reach Phase 3 |
| World map | Reach Phase 4 |
| Distributed storage | Own 2+ data centers |
| Quantum nodes | Research + Phase 5 |
| Prestige | Complete Phase 5 milestone |

### 5.3 Research Tree

Research is the primary unlock mechanism for new capabilities. It's structured as a branching tree with three main paths:

**Processing Branch:**
```
Basic Nodes → Intermediate Nodes → Advanced Nodes
    ↓               ↓                    ↓
  SORT+         COMPRESS+            ML MODULE
  FILTER+       ENCRYPT+             GPU ACCEL
  COMPARE+      TRANSFORM+           QUANTUM GATE
                BUFFER+               LOOP
                SPLIT+                CACHE
```
Each "+" indicates an upgraded version with better performance or additional parameters.

**Hardware Branch:**
```
CPU Overclock → Multi-Core → Hyper-Threading → Parallel Clusters
     ↓              ↓              ↓                  ↓
  RAM Expand    SSD Cache     NVMe Arrays        Distributed RAM
     ↓              ↓              ↓                  ↓
  Basic NIC     Fast NIC      Fiber Optic        Dedicated Lines
```

**Infrastructure Branch:**
```
Home Network → Office Network → Data Center Basics → Global Network
      ↓              ↓                 ↓                   ↓
   Storage       RAID Arrays     Distributed FS        CDN Caching
      ↓              ↓                 ↓                   ↓
   Cooling       AC Systems       Liquid Cool          Cryo Systems
```

### 5.4 Pacing

The game follows a **logarithmic reward curve** with periodic spikes:

- Base income grows steadily but new cost categories regularly appear to create pressure.
- **Breakthrough moments** occur when: a new marketplace tier is unlocked (sudden income jump), a difficult algorithm is optimized to A/S grade (big speed boost), or a new hardware tier becomes affordable.
- The time between breakthroughs gradually increases, but each one feels proportionally impactful.

### 5.5 Prestige: "System Reboot"

Upon reaching Phase 5 milestones, the player can trigger a **System Reboot** — a prestige reset that:

- Resets all hardware, money, and marketplace access back to Phase 1.
- Grants **Legacy Cores** — permanent multipliers that boost base processing speed, research rate, and starting capital.
- Unlocks **Legacy Nodes** — special algorithm nodes only available post-prestige.
- Each subsequent reboot requires a higher milestone but grants larger bonuses.

**The hook:** Post-prestige, the early game moves dramatically faster. Phases that took days now take hours. The player quickly reaches the frontier again — but higher, with more tools.

---

## 6. Infrastructure & Hardware

### 6.1 Computer Components

Each computer is composed of upgradeable components:

| Component | Function | Impact |
|-----------|----------|--------|
| **CPU** | Raw processing power | Base cycles/second (cps) |
| **RAM** | Working memory | Determines max package size handleable without penalty |
| **Storage** | Data capacity | How many packages can be stored locally |
| **NIC** | Network interface | Upload/download bandwidth per machine |
| **Cooling** | Thermal management | Unlocks overclocking; prevents throttling |
| **PSU** | Power supply | Caps max component tier; efficiency affects energy cost |

Each component has **tiers** (e.g., CPU Tier 1–10). Higher tiers are exponentially more expensive but provide diminishing-returns improvements — incentivizing horizontal scaling (more machines) over pure vertical scaling (one mega-machine).

### 6.2 Upgrade Curve

```
Component Cost = Base_Cost × (2.5 ^ Current_Tier)

Performance  = Base_Value × (1 + 0.6 × Current_Tier)
```

This means doubling your CPU power costs ~6× as much as the previous doubling. At some point, buying a second machine is cheaper — which is the intended strategic inflection.

### 6.3 Computer Archetypes

Rather than building from scratch each time, players can purchase **pre-built archetypes** as a convenience:

| Archetype | Strengths | Weakness |
|-----------|-----------|----------|
| **Budget Rig** | Cheap, low energy | Slow, limited RAM |
| **Workstation** | Balanced | No single standout stat |
| **Processing Tower** | High CPU, good cooling | Expensive, high energy |
| **Storage Node** | Massive storage, RAID | Weak CPU |
| **Network Relay** | Fast NIC, low latency | Low processing power |

All archetypes can be upgraded component-by-component after purchase.

### 6.4 Clustering

Two or more computers can be **linked** into a cluster to pool resources for large jobs.

**Mechanics:**

- Combined CPU budget is the sum of individual machines, minus an **overhead penalty** (starts at 10%, reducible via research to ~2%).
- RAM is not pooled — the machine with the most RAM determines the max package size.
- Bandwidth is pooled for transfers.
- Clusters require a **switch/router** hardware item (bought separately, with tiers affecting overhead penalty).

**Cluster management** happens on the Computer Lab screen. A drag-and-drop interface lets you assign machines to clusters or keep them independent.

### 6.5 Data Centers (Phase 4+)

A data center is a **location on the world map** that houses multiple computers in a managed facility.

| Property | Description |
|----------|-------------|
| **Rack slots** | How many machines it can hold (expandable) |
| **Power capacity** | Max total energy draw (limits number of high-tier machines) |
| **Cooling class** | Determines max overclocking tier available |
| **Network backbone** | Bandwidth cap for the entire facility |
| **Location** | Affects latency to marketplaces, energy cost, local regulations |

Data centers are bought or leased. Buying is expensive but has no ongoing rent. Leasing is cheap upfront but adds a monthly cost. Players can upgrade facilities over time (expand racks, improve cooling, upgrade power infrastructure).

### 6.6 Networking

Network infrastructure determines how fast data moves between your systems and the marketplaces.

**Tiers:**

| Tier | Name | Bandwidth | Unlock |
|------|------|-----------|--------|
| 1 | Home DSL | 10 Mbps | Start |
| 2 | Cable | 50 Mbps | Phase 1 |
| 3 | Fiber | 200 Mbps | Phase 2 |
| 4 | Business Fiber | 1 Gbps | Phase 3 |
| 5 | Dedicated Line | 10 Gbps | Phase 4 |
| 6 | Backbone Peering | 100 Gbps | Phase 5 |

**Traffic costs:** Each GB transferred costs a small fee. Higher network tiers have lower per-GB costs but higher base fees — rewarding high-volume operations.

### 6.7 Distributed Storage & Caching

In Phase 4+, players can designate data centers as **storage nodes** or **cache nodes**:

- **Storage nodes** hold raw and processed data packages, reducing re-download costs for recurring data types.
- **Cache nodes** keep frequently-accessed intermediate results, speeding up processing of similar packages.
- **Distribution:** Placing caches near marketplaces reduces transfer times. A cache in Frankfurt speeds up EU marketplace access; a cache in Virginia speeds up US East.

The caching system is a strategic layer: maintaining caches costs storage and energy, but well-placed caches significantly boost throughput.

---

## 7. Marketplaces

### 7.1 Overview

Marketplaces are where you find work. They are themed exchanges that offer data packages of various types, sizes, and values. Each tier represents a step up in complexity, payout, and competition.

### 7.2 Marketplace Tiers

#### Tier 1: Local Exchange

- **Theme:** Community bulletin board. Small jobs from local businesses.
- **Package types:** Text parsing, basic sorting, simple filtering.
- **Package sizes:** 1–100 data units.
- **Payouts:** 10–500 cr.
- **Competition:** Minimal. Most packages are uncontested.
- **Access cost:** Free.

#### Tier 2: Regional Hub

- **Theme:** Regional business network. Mid-size companies posting jobs.
- **Package types:** Image classification, log analysis, pattern matching, data cleanup.
- **Package sizes:** 100–5,000 data units.
- **Payouts:** 200–5,000 cr.
- **Competition:** Moderate. Popular packages attract 2–5 miners.
- **Access cost:** 5,000 cr.

#### Tier 3: National Grid

- **Theme:** Government and corporate contracts. Standardized, high-volume.
- **Package types:** Financial modeling, genome sequencing, weather simulation, network optimization.
- **Package sizes:** 1,000–50,000 data units.
- **Payouts:** 2,000–50,000 cr.
- **Competition:** Significant. Most packages are contested. Deadlines common.
- **Access cost:** 50,000 cr + 10 dt.

#### Tier 4: Global Prime

- **Theme:** International exchange for serious operations. Premium contracts.
- **Package types:** Full ML training sets, cryptographic analysis, planetary-scale simulations, real-time stream processing.
- **Package sizes:** 10,000–500,000 data units.
- **Payouts:** 20,000–500,000 cr.
- **Competition:** Intense. Only well-equipped miners compete.
- **Access cost:** 500,000 cr + 100 dt.

#### Tier 5: Deep Net Nexus

- **Theme:** Invite-only, bleeding-edge. Mysterious clients. Exotic data.
- **Package types:** Quantum-encrypted data, anomalous signals, AI model distillation, classified research.
- **Package sizes:** 100,000–5,000,000 data units.
- **Payouts:** 200,000–5,000,000 cr.
- **Competition:** Elite. The leaderboard lives here.
- **Access cost:** 5,000,000 cr + 1,000 dt + Phase 5 reached.

### 7.3 Data Types

Each data type is essentially a **puzzle template**. When a new data type appears, you must build an algorithm for it before you can process packages of that type.

**Comprehensive data type list:**

| Data Type | Tier Introduced | Puzzle Complexity | Description |
|-----------|-----------------|-------------------|-------------|
| Text Parsing | 1 | Simple (3–5 nodes) | Extract structured data from raw text |
| Numeric Sorting | 1 | Simple | Order datasets by value |
| Data Filtering | 1 | Simple | Remove entries matching criteria |
| Deduplication | 1 | Simple | Remove duplicate entries |
| Image Classification | 2 | Medium (5–8 nodes) | Categorize images by content |
| Log Analysis | 2 | Medium | Find patterns in system logs |
| Pattern Matching | 2 | Medium | Identify recurring sequences |
| Data Cleanup | 2 | Medium | Normalize messy datasets |
| Sentiment Analysis | 2 | Medium | Classify text by tone/intent |
| Financial Modeling | 3 | Complex (8–12 nodes) | Run predictive calculations |
| Genome Sequencing | 3 | Complex | Align and process DNA data |
| Weather Simulation | 3 | Complex | Process atmospheric models |
| Network Optimization | 3 | Complex | Find optimal routing paths |
| Fraud Detection | 3 | Complex | Identify anomalous transactions |
| Cryptographic Analysis | 4 | Advanced (10–15 nodes) | Break or verify encryption schemes |
| ML Model Training | 4 | Advanced | Train neural networks on datasets |
| Real-Time Streaming | 4 | Advanced | Process continuous data flows |
| Planetary Simulation | 4 | Advanced | Model large-scale physical systems |
| Quantum Decryption | 5 | Expert (12–18 nodes) | Quantum-assisted cipher operations |
| Anomaly Detection | 5 | Expert | Identify unknown patterns in noise |
| AI Distillation | 5 | Expert | Compress large AI models |
| Classified Research | 5 | Expert | Redacted. Results speak for themselves. |

### 7.4 Package Listings

The marketplace screen shows a scrollable list of available packages. Each entry displays:

```
┌─────────────────────────────────────────────────────┐
│  📦 Financial Modeling — "Q3 Hedge Fund Backtest"   │
│                                                     │
│  Size: 12,400 DU          Payout: 18,600 cr        │
│  Deadline: 4h 22m         Speed Bonus: +25%         │
│  Competitors: ███░░ (3 miners, leader at 47%)       │
│  Requires: CPU T4+, RAM 8GB+, Algorithm B+ or above│
│                                                     │
│         [ CLAIM ]              [ DETAILS ]          │
└─────────────────────────────────────────────────────┘
```

### 7.5 Competition Mechanics

When multiple miners work on the same package:

- **Open contracts:** Everyone who completes the package gets full payout. First to finish gets a **speed bonus** (+10–50%).
- **Exclusive contracts:** Only the first N miners to finish get paid. Appears in Tier 3+. High risk, high reward.
- **Auction contracts:** Payout decreases over time. Early finishers earn more. Creates time pressure.

The **competition bar** on each listing shows how many miners are working on it and the leader's progress. This creates a tension: claiming a heavily-contested package might not be worth it if someone else is close to finishing.

### 7.6 Marketplace Refresh

Packages rotate on a timer:

| Tier | Refresh Cycle | Packages Available |
|------|---------------|--------------------|
| 1 | Every 5 min | 10–15 |
| 2 | Every 15 min | 8–12 |
| 3 | Every 30 min | 6–10 |
| 4 | Every 1 hour | 4–8 |
| 5 | Every 2 hours | 2–5 |

Unclaimed packages from the previous cycle may carry over (if not claimed by anyone) or expire.

---

## 8. World Map & Regions

### 8.1 Overview

Unlocked in Phase 4, the world map transforms the game from a single-location operation to a global logistics challenge. It's a stylized, dark-themed map showing major data hubs around the world.

### 8.2 Regions & Properties

Each region offers different strategic advantages:

| Region | Energy Cost | Latency to Markets | Special Property |
|--------|-------------|--------------------|----|
| **US East (Virginia)** | Medium | Low to Tier 3–4 | Proximity to government contracts |
| **US West (Oregon)** | Medium | Low to Tier 2–3 | Tech hub — faster research |
| **EU Central (Frankfurt)** | High | Low to EU markets | Strong infrastructure, reliable power |
| **Nordics (Stockholm)** | Low | Medium | Cheap green energy, natural cooling |
| **East Asia (Tokyo)** | High | Low to Asian markets | Access to unique data types |
| **Southeast Asia (Singapore)** | Medium | Central routing | Low-latency hub between regions |
| **South America (São Paulo)** | Low | High to most markets | Budget expansion, growing local market |
| **Middle East (Dubai)** | Medium | Medium | Energy data type specialization |
| **Oceania (Sydney)** | Medium | High to most markets | Isolated but unique research bonuses |
| **Africa (Nairobi)** | Low | High | Emerging market, cheap expansion |

### 8.3 Latency

Latency is the delay caused by distance between your data center and the marketplace server. It adds a fixed time to every package transfer.

```
Latency (ms) = Base_Latency × Distance_Factor × (1 / Network_Tier_Modifier)
```

For small packages, latency is negligible. For large packages with multiple transfer phases, it matters significantly. Players are incentivized to place processing capacity near the marketplaces they use most.

### 8.4 Network Routing

When you own multiple data centers, you can set up **routing rules**:

- **Direct routing:** Package goes straight from marketplace to assigned data center.
- **Relay routing:** Package routes through an intermediate cache node for speed.
- **Load balancing:** Incoming packages auto-distribute to the least-loaded data center that has the required algorithm.

Routing is visualized on the world map as animated data streams flowing between locations — a satisfying visual payoff for building a global network.

### 8.5 Expansion Strategy

The world map introduces a **strategy layer** that doesn't exist in earlier phases:

- **Do you concentrate** in one region for low latency to specific markets? Or **spread out** for coverage and redundancy?
- **Do you build or lease?** Building a data center is a major investment but has no rent. Leasing is flexible but costs add up.
- **Do you specialize** each location for certain data types? Or keep them general-purpose?

There is no single correct strategy — it depends on the player's preferred marketplace, active data types, and algorithm strengths.

---

## 9. Competition & Social

### 9.1 Leaderboards

Multiple leaderboard categories keep competition interesting across playstyles:

| Leaderboard | Measures |
|-------------|----------|
| **Total Earnings** | Lifetime credits earned |
| **Processing Speed** | Highest throughput (DU/second) |
| **Algorithm Master** | Total S/S+ grades achieved |
| **Speed Demon** | Most speed bonuses collected |
| **Empire Builder** | Total data centers operated |
| **Efficiency King** | Best profit-to-cost ratio |

Leaderboards reset **seasonally** (e.g., monthly) with rewards for top performers, while all-time boards exist separately.

### 9.2 Contract Races

Periodically (e.g., weekly), a **mega-contract** appears across all Tier 3+ marketplaces. It's an enormous package that no single player can complete quickly. All miners race to finish it.

- **Format:** The package is so large that it's divided into segments. Each miner's processing contributes to the global completion percentage.
- **Rewards:** Tiered by contribution. Top contributors get data tokens and exclusive cosmetics. All participants who contribute above a threshold get a reward.
- **Duration:** 24–72 hours.

This is the game's **event system** — a recurring reason to log in and push hard.

### 9.3 Co-ops / Guilds

Players can form **syndicates** (guilds) of up to 20 members.

**Benefits:**

- **Shared contracts:** Syndicate-exclusive packages that are too large for individuals. Payout is split based on contribution.
- **Bandwidth pooling:** Syndicate members can share network resources, reducing latency for all.
- **Research sharing:** Syndicate members unlock research 10% faster (collaborative bonus).
- **Leaderboard:** Syndicate vs. syndicate rankings.

**Constraints:**

- Joining/leaving a syndicate has a cooldown (e.g., 7 days) to prevent hopping.
- Syndicate contracts require a minimum number of members to participate.

### 9.4 Light PvP: Network Interference

An optional, toggle-able system for players who want competitive tension:

- **DDoS events:** Random events that temporarily slow all miners in a marketplace. Players with **firewall** upgrades are less affected.
- **Bandwidth contention:** During high-traffic periods (when many miners are active on the same marketplace), everyone's transfer speeds slow slightly — simulating shared infrastructure.
- **Counter-measures:** Firewall hardware, VPN routing (uses a different network path), and priority bandwidth (purchasable per-marketplace).

This is not direct player-vs-player attack capability — it's environmental pressure that rewards preparation.

---

## 10. UI & Screens

### 10.1 Screen Map

The game uses a **tab-based navigation** system with 5–6 main screens, accessible via a bottom nav bar.

```
┌─────────────────────────────────────┐
│              MAIN SCREENS           │
│                                     │
│  [Market] [Lab] [Algo] [Map] [Menu] │
└─────────────────────────────────────┘
```

| Tab | Screen | Available From |
|-----|--------|----------------|
| 📦 Market | Marketplace Browser | Start |
| 🖥 Lab | Computer Lab | Start |
| 🧩 Algo | Algorithm Workshop | Start |
| 🌍 Map | World Map | Phase 4 |
| ☰ Menu | Settings, Research, Finances | Start |

### 10.2 Marketplace Browser

**Layout:** Vertical scrolling list of available packages. Top bar shows current marketplace tier with tabs or swipe to switch tiers.

**Key elements:**

- Marketplace tier selector (horizontal scroll or dropdown)
- Filter/sort options (by type, size, payout, competition level, deadline)
- Package cards showing type icon, name, size, payout, competition bar, deadline timer
- Claim button per card (grayed if requirements not met, with tooltip showing what's missing)
- Active contracts section at top showing your claimed packages and their progress

**Interactions:**

- Tap package → expanded details view (full stats, algorithm requirement, history of similar packages)
- Swipe package card left → quick-claim
- Pull to refresh → manual marketplace refresh (with cooldown timer shown)

### 10.3 Computer Lab

**Layout:** Visual representation of your computing setup. In Phase 1–2, it's a desk view. In Phase 3+, it's a rack view. In Phase 4+, it switches to a schematic/list view (with tap-to-inspect per machine).

**Key elements:**

- Visual computer/rack display
- Per-machine: status indicator (idle/processing/queued), current job name + progress bar, component list with tier badges
- CPU allocation panel: slides out from bottom. Shows all active jobs on this machine with sliders.
- Cluster view: shows linked machines as a group with combined stats
- Upgrade button per component → opens upgrade shop for that component type
- "Buy New" button → computer shop with archetypes

**Interactions:**

- Tap machine → inspect/manage view (components, active jobs, stats)
- Long-press machine → drag to rearrange or assign to cluster
- Tap "CPU" on a machine → CPU allocation sliders appear
- Pinch-zoom in rack view to see more/fewer machines

### 10.4 Algorithm Workshop

**Layout:** The puzzle screen. Full-screen grid workspace with node palette on the side or bottom.

**Key elements:**

- Grid workspace (pannable, zoomable on mobile)
- Node palette: scrollable tray of available nodes. Locked nodes shown grayed with unlock requirements.
- Input/output ports clearly marked on grid edges
- "Test Run" button — runs animation showing data flowing through the pipeline
- Efficiency score display (updates in real-time as you build)
- Grade indicator (F through S+)
- Library button → saved algorithms list, sortable by type and grade

**Interactions:**

- Drag node from palette → place on grid
- Tap node on grid → rotate, configure parameters, delete
- Draw connections by dragging from node output to node input
- Pinch-zoom the grid for large puzzles
- Two-finger pan to scroll the workspace
- Shake device (or button) → clear all nodes (with confirmation)
- "Test Run" shows animated data particles flowing through the pipeline with intermediate results displayed at each node

### 10.5 World Map

**Layout:** Stylized globe or flat map with data center locations marked. Animated data flows between locations.

**Key elements:**

- Map with region markers (pulsing dots at available locations)
- Owned data centers shown as building icons with status glow (green = healthy, yellow = high load, red = capacity)
- Network links shown as animated lines between data centers (thickness = bandwidth)
- Data flow animations showing active transfers
- Marketplace locations shown as diamond icons
- Region info panel: tap a region to see energy cost, latency, available sites, local market info

**Interactions:**

- Tap region → region detail panel (buy/lease options, data center management)
- Tap owned data center → jump to its Computer Lab view
- Tap network link → bandwidth management, routing options
- Drag between two owned locations → create/upgrade network link
- Pinch-zoom for overview vs. detail

### 10.6 Menu / Management

**Sub-screens accessible from the menu tab:**

| Sub-Screen | Content |
|------------|---------|
| **Research Tree** | Visual tech tree with three branches. Tap a node to research (if affordable). |
| **Financials** | Income/expense breakdown, charts, profit per data type, per location. |
| **Syndicate** | Guild management, shared contracts, member list. |
| **Leaderboards** | Rankings across categories. |
| **Settings** | Sound, notifications, display, offline behavior, account. |
| **Achievements** | Achievement list with progress tracking. |

### 10.7 Navigation Flow

```
                        ┌──────────┐
                        │  Market   │──→ Package Detail
                        └──────────┘──→ Active Contracts
                              │
    ┌────────────────────────┤────────────────────────┐
    │                        │                        │
┌──────────┐          ┌──────────┐          ┌──────────┐
│   Lab    │──→       │   Algo   │──→       │   Map    │──→ Region Detail
│          │  Machine │          │  Library  │          │──→ DC Management
│          │  Detail  │          │  Puzzle   │          │──→ Routing
└──────────┘          └──────────┘          └──────────┘
    │                        │                        │
    └────────────────────────┤────────────────────────┘
                              │
                        ┌──────────┐
                        │   Menu   │──→ Research
                        └──────────┘──→ Finances
                                    ──→ Syndicate
                                    ──→ Leaderboards
                                    ──→ Settings
```

### 10.8 Notifications & Overlays

- **Job completion toast:** Brief notification when a package finishes processing (with payout).
- **Marketplace alert:** Optional push notification when a high-value package appears in your preferred types.
- **Competition alert:** Notification when someone is about to beat you on a contested package.
- **Welcome back overlay:** Summary screen shown on app return after extended absence (see §3.4).
- **Achievement popup:** Brief celebratory overlay when milestones are hit.

---

## 11. Visual Style & Theme

### 11.1 Art Direction

**Aesthetic:** Sci-fi futuristic with a **dark base palette** and **vivid neon accents**. Think: cyberpunk terminal meets modern fintech dashboard. Clean lines, not gritty.

**Key visual references:**

- Bloomberg Terminal (dense information, dark background, color-coded data)
- Tron Legacy (luminous circuits, clean geometry)
- Hackers (1995) (playful tech fantasy, not photorealistic)
- Satisfactory / Factorio UI (information density done right)

### 11.2 Color Palette

| Use | Color | Hex (approximate) |
|-----|-------|--------------------|
| Background | Deep navy / near-black | `#0A0E1A` |
| Panel backgrounds | Dark blue-gray | `#141B2D` |
| Primary accent | Electric cyan | `#00E5FF` |
| Secondary accent | Vivid magenta | `#FF2D78` |
| Success / income | Neon green | `#39FF14` |
| Warning / expense | Amber | `#FFB300` |
| Error / critical | Red-orange | `#FF3D00` |
| Text primary | White-blue | `#E0E8FF` |
| Text secondary | Muted blue-gray | `#7B8CA8` |
| Grid lines | Subtle blue | `#1A2540` |

### 11.3 Typography

- **Headers:** A geometric, slightly futuristic sans-serif (e.g., Exo 2, Rajdhani, or Orbitron for the logo/titles).
- **Body text:** Clean, highly legible sans-serif (e.g., Inter, Space Grotesk). Readability at small sizes on mobile is paramount.
- **Monospace:** Used for numbers, stats, and code-like displays (e.g., JetBrains Mono, IBM Plex Mono).

### 11.4 UI Component Style

- **Cards:** Slightly rounded corners, subtle border glow on interactive elements. Semi-transparent backgrounds with a faint gradient.
- **Buttons:** Flat with a neon border on focus. Confirm actions have a brief "power-up" animation (a glow pulse).
- **Progress bars:** Animated with a subtle particle/scanline effect moving along the fill direction.
- **Icons:** Line-art style, consistent stroke weight, neon coloring matching their category.
- **Sliders:** Horizontal with a glowing thumb and a trail effect.

### 11.5 Visual Feedback

- **Processing animation:** Data particles flowing through circuits on the machine view.
- **Algorithm test run:** Animated data blobs traveling through the node pipeline, changing color/shape at each transformation node.
- **Package completion:** A satisfying "upload complete" burst animation — a pulse of light expanding from the machine.
- **Upgrade purchase:** Component slot glows, old component slides out, new one slides in with a power-up sound.
- **World map data flow:** Glowing lines pulsing between data centers. Thickness and pulse speed represent bandwidth and activity.

### 11.6 Responsiveness & Performance

- Target **60fps** for all animations on mid-range devices.
- Reduce particle effects and animation complexity on low-end devices (detect on startup or provide a settings toggle).
- Dark theme is not optional — it's the game's identity. No light mode.

---

## 12. Audio Design

### 12.1 Music

**Style:** Ambient electronic / synthwave. Low-intensity, loop-friendly. Evolves with game phase.

| Phase | Musical Character |
|-------|-------------------|
| Phase 1–2 | Minimal, lo-fi synth. Quiet hum of a single workstation. Cozy and focused. |
| Phase 3 | Adds rhythmic elements. A steady pulse. Things are moving. |
| Phase 4 | Fuller arrangement. Pads, arpeggios, a sense of scale. |
| Phase 5 | Grand, sweeping. Orchestral synth elements. You've built an empire. |

Music should **never be intrusive**. Players will be in the app for extended sessions; the soundtrack should enhance focus, not fatigue.

### 12.2 Sound Effects

**Design philosophy:** Snappy, satisfying, and brief. Every interaction should have audio feedback that reinforces the sci-fi theme.

| Action | Sound Character |
|--------|-----------------|
| Tap / select | Soft click with a subtle electronic zing |
| Place algorithm node | Magnetic "snap" — a soft thud with a high-frequency tail |
| Connect nodes | Quick ascending tone (like a circuit completing) |
| Test run start | Power-up whir, building energy |
| Test run data flow | Soft rhythmic pulses traveling left-to-right |
| Test run success | Bright, clear chime. Satisfying harmonic resolution. |
| Test run failure | Low buzz, descending tone. Non-punishing but clear. |
| Claim package | Brief "download initiated" chirp |
| Package complete | Triumphant micro-fanfare (< 2 seconds) |
| Upgrade purchased | Mechanical "slot-in" with a power surge tone |
| Currency received | Coin-like chime but synthetic/digital |
| Error / can't afford | Muted buzz, single low tone |

### 12.3 Ambient Sound

The Computer Lab and Data Center screens feature **ambient background audio**:

- Fan hum (scales with number of machines)
- Soft HDD chatter / SSD whir
- Occasional data transfer blips
- Air conditioning in data center view

This is subtle and atmospheric — it makes the spaces feel alive.

---

## 13. Narrative & Flavor

### 13.1 World Setting

The year is 2089. The global economy runs on data. Raw data is worthless — processed data is gold. Megacorps dominate, but an open marketplace system allows independent operators ("data miners") to compete for contracts. You are one such miner.

The story is **told entirely through flavor**, not cutscenes or dialogue:

- Marketplace descriptions hint at the clients behind contracts ("A biotech startup needs this genome data processed — quietly.")
- Package names tell micro-stories ("Emergency: Power Grid Failure Analysis — São Paulo")
- Research tree descriptions are written in-character ("Your cooling systems can now reach sub-zero temps. Your neighbors have questions.")
- Achievement descriptions are dry, wry commentary.

### 13.2 Tone

**Smart, dry, slightly irreverent.** The game respects the player's intelligence and doesn't talk down. Humor is subtle — a raised eyebrow, not a punchline.

Examples:

- *Upgrade description for CPU Tier 7:* "Technically this violates several thermodynamic suggestions."
- *Tier 5 marketplace intro:* "Welcome to the Deep Net Nexus. The clients here don't ask questions. Neither should you."
- *Achievement for first S+ algorithm:* "Theoretically optimal. Your CS professor would weep."
- *Offline return message after 24h:* "Your machines kept working. They don't have a choice."

### 13.3 Story Beats (Optional / Light)

The game does **not** have a linear story, but certain milestones can trigger **flavor events** — brief text popups that hint at a larger world:

- **Phase 2 transition:** "A message from an anonymous sender: *'Interesting throughput for a garage operation. Keep it up.'*"
- **First data center:** "You're in the registry now. CorpoNet has flagged your operation as 'emerging competitor.' That's either good or bad."
- **Tier 5 access:** "Welcome to the deep end. The data here doesn't always make sense. That's by design."
- **First prestige:** "You wipe the drives. Start fresh. But the knowledge stays. It always stays."

These events are rare, brief, and entirely optional to engage with.

---

## 14. Onboarding & Tutorial

### 14.1 Philosophy

The tutorial should feel like **playing the game**, not reading about it. Every mechanic is introduced by doing it, with minimal text overlays. The game holds your hand lightly for the first 5 minutes, then lets go.

### 14.2 First-Time Flow

**Step 1: The First Package (30 seconds)**

- The game opens on the Marketplace screen with one available package highlighted: "Text Parsing — *Hello World Dataset*"
- A brief prompt: "Claim this package to get started."
- Player taps Claim. Screen transitions to the Algorithm Workshop with a subtle pulse on the Algo tab.

**Step 2: The First Algorithm (2–3 minutes)**

- The puzzle grid is pre-loaded with input/output. A tooltip points to the node palette: "Drag a FILTER node onto the grid."
- The player places the node. A tooltip shows how to connect it to the input port.
- The player connects input → FILTER → output. A tooltip prompts: "Tap Test Run."
- The test run animation plays. If correct: success chime, efficiency score appears. If wrong: brief feedback showing where the output diverges.
- For this first puzzle, only one node is needed. The solution is nearly impossible to get wrong.
- Tooltip: "Your algorithm scores a C. Tap the grade to see how to improve it." (Optional — player can skip optimization for now.)

**Step 3: Processing (1 minute)**

- Screen transitions to the Computer Lab. The package is auto-assigned to the player's single machine.
- A progress bar fills (accelerated for the tutorial — ~30 seconds).
- On completion: payout animation, credit balance updates. Brief toast: "Package complete! +150 cr."

**Step 4: Freedom (ongoing)**

- The Marketplace now shows 3–4 more packages. One new data type is available (Numeric Sorting), requiring a new algorithm.
- No further hand-holding. The player explores at their own pace.
- **Contextual tooltips** appear as new features unlock (first upgrade, first multi-job, first cluster), but they're dismissible and never block interaction.

### 14.3 Introducing Complexity

New mechanics are introduced **one at a time**, tied to natural progression:

| Mechanic | Introduced When | How |
|----------|-----------------|-----|
| Upgrading components | After first 3 package completions | "Your CPU is running hot. Tap to upgrade." |
| Multiple jobs | After buying 2nd computer | Brief overlay showing CPU allocation sliders |
| Clustering | After buying 3rd computer | Tooltip on long-press suggesting linking machines |
| Competition | On first Tier 2 package with a competitor | Competition bar appears with brief explanation |
| Marketplace tiers | When Tier 2 access becomes affordable | New tab pulses with "New marketplace available" |
| Research tree | After earning first 10 RP | Menu tab pulses, research tree has one affordable node highlighted |

### 14.4 Help System

- **Contextual help icon (?)** on every screen. Tapping opens a brief, visually-illustrated explainer for that screen's mechanics.
- **Algorithm hint system:** In the Algorithm Workshop, a lightbulb icon offers hints for the current puzzle (costs in-game credits, not premium currency). Hints reveal one correct node placement.
- **No in-game manual.** If a player is confused, the contextual help and tooltips should suffice. An external wiki/guide can exist for deep strategy.

---

## 15. Technical Considerations

### 15.1 Platform

- **Primary:** iOS (iPhone) and Android.
- **Minimum supported devices:** iPhone SE (2nd gen) / Android devices with 3GB+ RAM.
- **Orientation:** Portrait only (all UI designed for portrait; landscape not supported).
- **Tablet:** Functional but not optimized. No tablet-specific layouts in v1.

### 15.2 Engine

**Recommended:** Unity (2D) or a custom engine using a lightweight framework (e.g., Defold, Cocos2d-x).

**Rationale:** The game is primarily UI-driven with minimal physics or 3D. A 2D engine with strong UI toolkit support is ideal. Unity offers broad device support and a mature ecosystem. Defold is lighter-weight and may yield better battery performance for an always-running idle game.

### 15.3 Save System

- **Local save:** Automatic, continuous. Save state persists between sessions.
- **Cloud save:** Synced to player's account (device-agnostic). Required for cross-device play.
- **Save data includes:** All game state — resources, hardware, algorithms, marketplace state, progress, settings.
- **Offline calculation:** On app launch, the game calculates elapsed time since last save and simulates progress. This must be deterministic and match what would have happened in real-time (within the 80% offline throttle).

### 15.4 Server Requirements

- **Marketplace synchronization:** Marketplace state (available packages, competition progress, deadlines) is server-authoritative. Requires a lightweight backend to manage shared state.
- **Leaderboards and syndicates:** Server-managed.
- **Anti-cheat:** Server validates package completion times against known processing speeds. Implausible results are flagged and excluded from leaderboards. Local play (non-competitive) is not policed.
- **Real-time requirements:** Low. Most interactions are near-real-time (marketplace refresh every few minutes). No frame-level networking needed.

### 15.5 Data & Privacy

- Minimal personal data collected. Account system can be email or platform-native (Apple ID / Google).
- No ads. No ad tracking. No third-party analytics SDKs that harvest personal data.
- GDPR and CCPA compliant. Data export and deletion supported.

### 15.6 Performance Budget

| Metric | Target |
|--------|--------|
| App launch to interactive | < 3 seconds |
| Screen transition | < 300ms |
| Animation framerate | 60fps (30fps floor on low-end) |
| Battery drain (active play) | < 10% per hour |
| Battery drain (background processing) | Negligible (OS-managed) |
| App size | < 150MB initial download |

---

## 16. Risks & Open Questions

### 16.1 Design Risks

**Risk: Algorithm puzzles too hard for casual players.**
The game targets a hybrid audience. If the puzzles frustrate casual idle players, retention suffers.
*Mitigation:* Generous hint system. F-grade algorithms still work — just slowly. The game should clearly communicate that optimization is optional for progressing, but rewarding for those who engage.

**Risk: Algorithm puzzles too easy / samey for puzzle fans.**
If solutions become obvious or formulaic, the puzzle core loses its appeal.
*Mitigation:* Later data types should introduce genuinely novel constraints (real-time processing, branching outputs, resource limits). Community benchmarks create implicit challenge. Post-prestige "legacy puzzles" add variants of solved puzzles with new constraints.

**Risk: Idle earnings feel pointless if active play is much better.**
If the gap between idle and active is too large, the game stops feeling like an idle game.
*Mitigation:* The 80% offline throttle is intentionally gentle. Algorithm optimization is a one-time act per data type — once you've got an S grade, your idle and active speeds are nearly identical for that type. The active advantage should come from **strategic decisions** (which contracts to take, when to upgrade), not from constant presence.

**Risk: Economy inflates or deflates too fast.**
Balancing an incremental economy across 5+ phases is notoriously difficult.
*Mitigation:* Prestige resets act as a pressure valve. Aggressive playtesting of the cost curve. Server-side tuning of marketplace payouts post-launch.

**Risk: Multiplayer competition feels unfair.**
Whales (premium players) or power users may dominate marketplaces, discouraging newcomers.
*Mitigation:* Tier segmentation naturally separates players by progression. Competitive features (contract races, leaderboards) can be segmented by account age or tier. The premium unlock gates content access, not power — no pay-to-win mechanics.

### 16.2 Open Questions

| Question | Options | Decision Needed By |
|----------|---------|-------------------|
| Should the algorithm grid be hex-based or square? | Hex (more elegant routing) vs. square (simpler, more familiar) | Prototype phase |
| Should marketplaces be shared across all players or instanced? | Shared (more competitive feel) vs. instanced (fairer, less server load) | Architecture design |
| Should there be a "story mode" with curated puzzle sequences? | Yes (adds narrative progression) vs. No (keep it open-ended) | Pre-production |
| How aggressive should offline throttling be? | 80% (gentle) vs. 50% (strong incentive to play active) | Playtesting |
| Should algorithm solutions be shareable between players? | Yes (community, collaboration) vs. No (personal achievement) | Social feature design |
| What's the premium unlock price point? | $4.99 / $6.99 / $9.99 | Market research |
| Should the game support cross-platform play (iOS ↔ Android)? | Yes (larger competitive pool) vs. No (simpler infrastructure) | Architecture design |
| How many data types should exist at launch? | 10 (tight, polished) vs. 20+ (more variety, more design work) | Content planning |

### 16.3 Prototype Priorities

The following should be built and tested first, in order:

1. **Algorithm builder UX on mobile.** Does the drag-connect-test flow feel good on a phone screen? This is the make-or-break mechanic.
2. **Idle loop feel.** Does the process-earn-upgrade loop feel satisfying in the first 10 minutes?
3. **Economy curve through Phase 1–2.** Does the pacing feel right? Are there dead spots?
4. **Competition feel.** Does seeing other miners on a package create excitement or anxiety? Is it motivating?
5. **Offline return.** Does the welcome-back screen feel rewarding? Does the player want to jump back in?

---

*End of document. Version 1.0 — Draft for review and iteration.*
