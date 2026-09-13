# Technical Interview Presentation Plan: Cricket Fantasy Draft Platform

---

## 1. Presentation Strategy (Meta-Level)

### What Interviewers Are Evaluating

Interviewers are not evaluating whether your app works. They already assume it does. They are evaluating:

1. **Architectural reasoning** — Can you explain *why* you made the choices you made, not just *what* you built?
2. **Tradeoff awareness** — Do you understand the cost of your decisions? Do you know what you gave up?
3. **Ownership depth** — Did you build this or copy-paste it? Can you go three levels deep on any topic?
4. **Production thinking** — Do you think about failure modes, edge cases, concurrency, and scale?
5. **Communication clarity** — Can you explain complex systems to experienced engineers without drowning them in detail or boring them with trivia?

### Common Failure Modes

| Failure Mode | How It Looks | How to Avoid |
|---|---|---|
| **Feature tour** | "And then you can click here and it does this..." | Lead with architecture, not UI |
| **Shallow breadth** | Covers 10 topics at surface level | Go deep on 3-4 topics, mention others briefly |
| **No tradeoffs** | "I used React because it's popular" | Always pair decisions with alternatives considered |
| **Demo dependency** | Presentation collapses if demo breaks | Architecture diagrams > live demos |
| **Reading slides** | Monotone recitation of bullet points | Tell a story, use diagrams as visual anchors |

### How to Signal Technical Depth Early

In the first 90 seconds, say something that only someone who truly built the system would say. Examples:

- *"The hardest constraint was preventing mathematically invalid draft picks — not just validating the current pick, but ensuring every pick leaves a valid path to complete the roster."*
- *"I use row-level PostgreSQL locks inside a transaction for pick operations because optimistic concurrency wasn't sufficient for a multi-user real-time draft."*

These statements immediately tell the room: this person understands the real engineering challenges.

### Balancing Clarity vs Complexity

- **First pass**: Explain the system so a junior engineer could understand it (30 seconds)
- **Second pass**: Zoom into one area and go deep enough to impress a senior engineer (2-3 minutes)
- **Repeat** this zoom pattern for each major section
- **Rule of thumb**: If you haven't said something surprising or non-obvious in the last 60 seconds, you're being too shallow

---

## 2. Minute-by-Minute Presentation Timeline

**Total target: 17-18 minutes** (leaves buffer before 20-minute limit)

### Minute 0:00 — 1:30 | Opening & Problem Statement

**Topic:** What this is and why it's interesting  
**Depth:** High-level, but technically framed  
**Goal:** Hook the audience with the *engineering* challenge, not the product

**Key points:**
- One sentence on what it is
- Frame the three core engineering challenges
- State the tech stack in one breath

**Transition:** *"Let me walk you through the architecture that solves these problems."*

---

### Minute 1:30 — 4:30 | System Architecture Overview (3 min)

**Topic:** High-level architecture, component boundaries, data flow  
**Depth:** Broad overview, then zoom into the real-time data flow  
**Goal:** Prove you understand the full system end-to-end

**Key points:**
- Three-tier view: Client (Next.js RSC + Client Components) → API Layer → PostgreSQL
- Real-time layer: Pusher as a side-channel
- Show the architecture diagram (see Section 6)
- Trace one complete pick operation through the entire system

**Transition:** *"The most interesting engineering challenge was the draft logic itself — specifically, preventing invalid states."*

---

### Minute 4:30 — 8:00 | Deep Dive #1: Draft Engine & State Management (3.5 min)

**Topic:** Rule engine, state machine, snake order, concurrency  
**Depth:** This is your deepest section. Show algorithmic thinking.  
**Goal:** Demonstrate you can design non-trivial stateful logic

**Key points:**
- Draft state machine: not_started → in_progress ⇄ paused → completed
- Snake order implementation: read-time reversal vs write-time direction
- `getEligiblePlayers()` algorithm: look-ahead constraint solving
- Concurrency: Row-level locks, double-check pattern in transactions
- Validation: Client-side preview + server-side enforcement (defense-in-depth)

**Transition:** *"This validation layer wouldn't matter if the data couldn't reach every client in real time — let me show you how that works."*

---

### Minute 8:00 — 10:30 | Deep Dive #2: Real-Time Architecture (2.5 min)

**Topic:** Pusher integration, event model, state synchronization  
**Depth:** Medium-deep. Focus on the architectural pattern, not Pusher API details  
**Goal:** Show you understand distributed state synchronization

**Key points:**
- Event-driven architecture: pick → broadcast → `useDraftSync` update
- Single channel, typed events: PICK_MADE, ROUND_COMPLETE, DRAFT_COMPLETE, STATE_UPDATE
- `useDraftSync` as the client draft-state layer (Zustand is toast-only)
- Graceful degradation: system works without Pusher (polling fallback)
- Why NOT WebSocket server: serverless constraints

**Transition:** *"Real-time systems that face the internet need security — let me talk about the authentication and protection layers."*

---

### Minute 10:30 — 13:00 | Deep Dive #3: Security & Auth (2.5 min)

**Topic:** Authentication, authorization, rate limiting, input validation  
**Depth:** Medium. Show breadth of security thinking  
**Goal:** Demonstrate production-readiness mindset

**Key points:**
- HMAC-SHA256 signed cookies (not JWT) — explain why
- Timing-safe comparison for signature verification
- Defense-in-depth: middleware route protection + API route-level checks
- Rate limiting: per-route limits (auth 10/min, picks 30/min, general 100/min)
- Row-level DB locks prevent race conditions
- CSP headers, HSTS, anti-XSS in Next.js config

**Transition:** *"All of this needs to be verified — let me briefly cover the testing strategy."*

---

### Minute 13:00 — 15:00 | Testing Strategy (2 min)

**Topic:** Testing philosophy, test pyramid, what's tested  
**Depth:** Light-medium. Mention the approach, cite numbers  
**Goal:** Show you test intentionally, not just for coverage

**Key points:**
- Testing trophy approach: more integration tests than unit tests
- 321 unit/integration tests across 27 test files, 70%+ coverage
- E2E: Playwright with auth state reuse (setup project pattern)
- Mock factories for consistent test data
- Rule engine tests: comprehensive constraint validation
- API route tests: auth, validation, error handling
- What you'd add with more time: contract tests, load tests

**Transition:** *"Let me close with what I'd change in a production deployment and what I learned."*

---

### Minute 15:00 — 17:30 | Tradeoffs, Limitations & Future Work (2.5 min)

**Topic:** Honest assessment of limitations, what you'd do differently at scale  
**Depth:** This is where you show maturity  
**Goal:** Prove you think beyond the demo

**Key points:**
- In-memory rate limiting: works per-instance, not across serverless instances → Redis in production
- No WebSocket server: Pusher adds latency vs self-hosted WS → tradeoff: operational simplicity vs latency
- Prisma 7 adapter: newer ecosystem, less battle-tested → chose for first-class serverless support
- Single Pusher channel: works for 4-10 participants, would need channel sharding at scale
- No optimistic UI updates for picks: chose correctness over perceived speed
- Future: Redis for rate limiting + caching, WebSocket server for sub-100ms latency, background job queue for data sync

**Transition:** *"That's the system. I'm happy to go deeper into any area — architecture, concurrency, security, testing — whatever would be most valuable."*

---

### Minute 17:30 — 18:00 | Closing Statement (30 sec)

**Goal:** Land the plane cleanly, invite Q&A

---

## 3. Presentation Narrative Arc

### Structure: Problem → Design → Implementation → Tradeoffs → Impact

**Why this order works psychologically:**

1. **Problem first** establishes that you understand the *why* before the *what*. Engineers respect problem-framers over solution-describers.

2. **Design second** shows you planned before coding. You thought about the system before writing a line.

3. **Implementation third** proves you can actually execute, with enough detail to show you wrote the code.

4. **Tradeoffs fourth** is the maturity signal. Junior engineers present solutions as perfect. Senior engineers present solutions as *chosen from alternatives with known costs*.

5. **Future work last** demonstrates you see beyond the current state — you think about evolution, not just delivery.

### The Three Engineering Challenges (Narrative Thread)

Thread these through the entire presentation:

1. **Stateful constraint validation** — How do you prevent invalid draft picks across 8+ rounds with interleaving participants, team caps, role quotas, and early-round rules?

2. **Real-time multi-user synchronization** — How do you keep 4-10 participants in sync with sub-second updates while preventing race conditions?

3. **Production-grade security on a serverless platform** — How do you authenticate, rate-limit, and protect a stateful application on a stateless infrastructure?

---

## 4. Detailed Speaking Script

### Opening (0:00 — 1:30)

> *"This is a real-time fantasy cricket draft platform. Multiple participants join a live draft session and take turns selecting players from the IPL player pool to build their fantasy teams.*
>
> *The product is straightforward — the engineering challenges are not. There were three core problems I had to solve:*
>
> *First, **stateful constraint validation**. Every pick has to satisfy multiple constraints simultaneously — team caps, role quotas, early-round rules — and critically, every pick has to leave a mathematically valid path to complete the roster. You can't just validate the current pick; you have to validate the future is still solvable.*
>
> *Second, **real-time multi-user synchronization**. Multiple participants are drafting simultaneously in a snake order. Every pick needs to reach every client within seconds, and two people can't pick the same player — even if they click at the same time.*
>
> *Third, **production security on serverless**. This runs on Next.js with serverless functions, which means no persistent server state for sessions or rate limiting. I had to design authentication and protection layers that work within those constraints.*
>
> *The stack is Next.js 16 with the App Router, React 19, PostgreSQL via Prisma 7, Pusher for real-time events, hook-local draft state plus Zustand toasts, and Tailwind for styling. Let me walk you through the architecture."*

### Architecture Overview (1:30 — 4:30)

> *"At the highest level, this is a three-tier application with a real-time side-channel."*
>
> **[Show architecture diagram]**
>
> *"The client layer uses Next.js App Router with a mix of Server Components and Client Components. Server Components handle initial data fetching and rendering — pages, layouts. Client Components handle interactivity — the draft board, real-time updates, forms.*
>
> *The API layer is Next.js Route Handlers — serverless functions. These handle all mutations: making picks, managing config, authentication. Every API route follows a consistent pattern: authenticate, validate, execute in a transaction, broadcast the result.*
>
> *The data layer is PostgreSQL on Supabase, accessed through Prisma 7 with the pg adapter. The schema has 15 models covering draft state, players, participants, picks, scoring, and leaderboards.*
>
> *The real-time layer is Pusher — a managed WebSocket service. When a pick is made, the API route writes to the database, then broadcasts the event to all connected clients through Pusher. Clients receive the event and update local draft state through `useDraftSync`.*
>
> *Let me trace a single pick through the system to make this concrete:*
>
> *A participant clicks a player. The client calls POST /api/draft/pick with their participant ID and the player ID. The route authenticates the request via a signed cookie, verifies it's their turn using the snake order algorithm, validates the pick against all constraints, then opens a PostgreSQL transaction. Inside the transaction, it acquires a row-level lock on the draft state, re-verifies the turn and player availability — this double-check prevents race conditions — creates the pick record, advances the pick index, and commits. After the transaction, it broadcasts the pick via Pusher. Every connected client receives the event and updates their local state.*
>
> *That's the full round-trip. The most interesting engineering is in two areas: the draft engine and the real-time sync. Let me go deeper on both."*

### Deep Dive #1: Draft Engine (4:30 — 8:00)

> *"The draft state is a finite state machine. It starts as 'not_started', transitions to 'in_progress' when an admin starts the draft, can be paused and resumed, and transitions to 'completed' when all rounds finish.*
>
> *The pick order uses a snake pattern. In a four-person draft, round one goes A, B, C, D. Round two reverses: D, C, B, A. Round three: A, B, C, D again. The implementation is clean: the pick index always increments linearly from 0 to n-1 regardless of round direction. The snake reversal happens at read time — when you ask 'who picks next?', the getter checks if we're in an even round and reverses the index. This means the advance logic is trivial: increment and wrap. One line of code instead of branching on direction.*
>
> *The most interesting algorithm is the eligible player computation. When it's your turn, the system calculates exactly which players you're allowed to pick — not just which ones satisfy the current constraints, but which ones leave a valid path to completing your roster.*
>
> *For example: if you have 3 picks remaining and still need 2 bowlers and 1 wicketkeeper, you cannot pick a batsman — even though it's a valid role — because it would make it mathematically impossible to fill your mandatory slots. The algorithm checks five constraints for every available player: is it already drafted, does it violate the team cap, does it violate early-round Bat/Bowl requirements with look-ahead, does it make mandatory role completion impossible, and if there are no free slots, is the role actually needed.*
>
> *This runs on every pick as a single pass over the player pool with pre-computed roster counts. The result is a Set of eligible player IDs that the UI uses to grey out ineligible players. The participant never has to guess what's valid.*
>
> *For concurrency: two participants could theoretically click at the same time. I use PostgreSQL's SELECT FOR UPDATE inside a transaction to acquire a row-level lock on the draft state. Inside the locked section, I re-verify whose turn it is and whether the player is still available. If there's a conflict, the transaction throws and returns a 409. This guarantees exactly one pick succeeds per turn — no double-picks, no turn-skipping."*

### Deep Dive #2: Real-Time Architecture (8:00 — 10:30)

> *"For real-time updates, I chose Pusher over building my own WebSocket server. The reason is infrastructure simplicity — this runs on serverless functions that can't hold persistent connections. Pusher gives me managed WebSocket infrastructure with a clean pub/sub API.*
>
> *The event model uses a single channel — 'draft-channel' — with typed events. When a pick is made, the server broadcasts PICK_MADE with the pick data and the full updated draft state. Clients receive this through `useDraftRealtime` / `useDraftSync`, which keep draft state in React state on the draft page.*
>
> *That hook state is the source of truth for the live draft UI: current draft state, available players, and connection status. Roster and turn helpers are derived from that state. Zustand is only used for toast notifications.*
>
> *I designed the system to degrade gracefully. If Pusher isn't configured — in development or if the service is down — the broadcast calls become no-ops. The app still works; you just need to refresh to see other people's picks. This was a deliberate choice to avoid coupling availability to a third-party service.*
>
> *The tradeoff with Pusher is latency. A self-hosted WebSocket server could achieve sub-50ms delivery. With Pusher, typical latency is 100-300ms. For a draft with 30-second pick timers, this is perfectly acceptable. If I needed real-time gaming-level latency, I'd self-host with something like Socket.io on a persistent server."*

### Deep Dive #3: Security (10:30 — 13:00)

> *"Authentication uses HMAC-SHA256 signed cookies — not JWTs. The session payload is a JSON object with the participant or admin ID and an expiry timestamp. I sign it with a server-side secret using HMAC-SHA256, and the signature is appended to the cookie value. On every request, I re-compute the signature and compare using crypto.timingSafeEqual — this prevents timing attacks on signature verification.*
>
> *Why not JWT? JWTs are larger, require a library, and the standard gotchas — algorithm confusion, no revocation without a denylist — aren't worth it for this use case. Signed cookies give me the same integrity guarantee with less surface area.*
>
> *I separate participant and admin sessions into different cookies. This prevents privilege escalation — a participant cookie can never be reinterpreted as an admin session.*
>
> *Protection is defense-in-depth. The middleware layer runs before every request and handles route protection and rate limiting. Admin routes require an admin cookie; draft routes require a participant cookie. Then each API route independently verifies the session again. Two layers, same check — so if the middleware has a bug, the route still rejects unauthorized requests.*
>
> *Rate limiting is in-memory with a sliding window. I have different limits per route class: 10 per minute for auth endpoints, 30 per minute for draft picks, 100 per minute for read-only endpoints. The limiter identifies clients by IP from the X-Forwarded-For header. The limitation is that this is per-instance — in a multi-instance serverless deployment, each instance has its own counter. In production, I'd use Redis for shared rate limiting state.*
>
> *The Next.js config also sets security headers: strict CSP, HSTS with preload, X-Frame-Options, X-Content-Type-Options. These are table-stakes for a web application facing the internet."*

### Testing Strategy (13:00 — 15:00)

> *"I follow the testing trophy approach — prioritizing integration tests over pure unit tests, because the highest-value tests exercise real interactions between components.*
>
> *The suite has 321 tests across 27 test files. The rule engine alone has extensive tests: every constraint type — roster feasibility, team caps, early-round rules, mandatory roles, player pool sufficiency — plus the eligible player algorithm with look-ahead validation. I also have integration tests for the full draft flow, the snake order sequence, and edge cases.*
>
> *For E2E, I use Playwright with a setup project pattern. Authentication happens once in a setup step, saves the session state to a file, and all subsequent test projects reuse that state. This avoids repeated logins that would trigger rate limiting and makes tests faster.*
>
> *Test data is built with factory functions — createMockPlayer, createMockConfig, createDraftState — that produce valid defaults and accept overrides. This keeps tests readable and avoids brittle fixtures.*
>
> *What I'd add with more time: contract tests for the Sportmonks API integration, load tests to verify the pick transaction under concurrent load, and visual regression tests for the draft board layout."*

### Tradeoffs & Future Work (15:00 — 17:30)

> *"Let me be honest about the limitations and what I'd change for a production deployment.*
>
> *The biggest gap is the rate limiter. In-memory rate limiting works per-instance but not across a serverless fleet. In production, this needs Redis with atomic INCR and TTL — probably a simple middleware swap with the same interface.*
>
> *Pusher adds operational simplicity but also a dependency and latency. For a high-stakes draft with real money, I'd evaluate self-hosting WebSockets. But the current design makes this a clean swap — the broadcast function is a single abstraction point.*
>
> *I chose Prisma 7 with the pg adapter specifically for serverless. The tradeoff is that Prisma 7's adapter ecosystem is newer and less battle-tested than Prisma 5. I mitigated this by keeping the Prisma layer thin — model mappers at the boundary, business logic in plain TypeScript.*
>
> *The single Pusher channel works for 4-10 participants. At 100+ concurrent users, I'd need channel sharding — probably per-draft-session channels.*
>
> *I deliberately chose not to implement optimistic UI updates for picks. When you click a player, the UI waits for the server response before confirming. This means a 200-300ms delay, but it guarantees you never see a pick that gets rolled back. For a draft where pick order matters, I valued correctness over perceived speed.*
>
> *For future work: Redis for shared rate limiting and response caching, a background job queue for Sportmonks data sync instead of synchronous API calls, and potentially a WebSocket server for sub-100ms pick delivery.*
>
> *That's the system. I'm happy to go deeper on any area — the constraint solver, the concurrency model, the security design, testing — whatever would be most useful."*

---

## 5. Architecture Deep-Dive Sections

### Which Parts Deserve Deeper Explanation

**Tier 1 — Go deep (2-3 minutes each):**

1. **Draft rule engine & `getEligiblePlayers`** — This is your strongest differentiator. The look-ahead constraint solving is non-trivial algorithm design. Be ready to whiteboard the algorithm.

2. **Concurrency model for picks** — Row-level locks, double-check pattern, transaction isolation. This shows you understand distributed systems fundamentals.

3. **Snake order implementation** — The "reversal at read-time" pattern is elegant and shows architectural thinking. Contrast it with the naive approach (reversing arrays or maintaining direction state).

**Tier 2 — Medium depth (1-2 minutes):**

4. **Real-time event architecture** — Pusher as a side-channel, `useDraftSync` as client draft state, graceful degradation.

5. **Authentication design** — HMAC signed cookies, timing-safe comparison, defense-in-depth.

**Tier 3 — Mention briefly (30 seconds):**

6. **Sportmonks integration** — Data sync pipeline with retry logic.
7. **Testing strategy** — Trophy approach, factory pattern, Playwright auth state reuse.
8. **Admin features** — Config validation, draft monitoring, consistency checker.

### How Deep to Go Without Exceeding Time

For each deep-dive, follow the **30-60-90 pattern**:
- **30 seconds**: What it does and why it matters
- **60 seconds**: How it works at a technical level
- **90 seconds (optional)**: Tradeoffs, alternatives considered, edge cases

If you're running long, cut the 90-second layer. If you're running short, expand it.

---

## 6. Visual Aid Guidance

### What to Show

**Diagram 1: System Architecture (show during 1:30-4:30)**

```
[Browser]                    [Pusher]
    │                           │
    ├── Server Components ──────┤
    │   (pages, layouts)        │
    │                           │
    ├── Client Components ──────┤
    │   (useDraftSync + React) ◄───┘ (WebSocket events)
    │                           
    ├── API Route Handlers ─────┐
    │   (serverless functions)  │──► Pusher broadcast
    │                           │
    └── PostgreSQL (Prisma 7) ──┘
        (Supabase)
```

**Diagram 2: Pick Operation Flow (show during 4:30-8:00)**

```
Client click
  → POST /api/draft/pick
    → Authenticate (signed cookie)
    → Verify turn (snake order)
    → Validate pick (rule engine)
    → BEGIN TRANSACTION
      → SELECT FOR UPDATE (row lock)
      → Re-verify turn + availability
      → INSERT pick
      → UPDATE draft state (advance index)
    → COMMIT
    → Pusher broadcast (PICK_MADE)
  → All clients update useDraftSync state
```

**Diagram 3: Draft State Machine (show during 4:30-8:00)**

```
not_started ──[start]──► in_progress ──[all rounds done]──► completed
                              │    ▲
                         [pause]    [resume]
                              ▼    │
                            paused
```

### What NOT to Include

- Screenshots of the UI (wastes time, invites feature-tour mode)
- Code listings longer than 10 lines (use verbal explanation)
- Dependency graphs or package.json contents
- Database ER diagrams with all 15 models (too busy)
- Anything that requires a live demo to make sense

### How to Explain Diagrams

- Put the diagram up BEFORE you start talking about it
- Give the audience 3-5 seconds to absorb it visually
- Then walk through it left-to-right or top-to-bottom
- Use your pointer/cursor to trace the flow as you speak
- Don't read every label — highlight the interesting parts

---

## 7. "Depth Signals" — Moments to Demonstrate Technical Maturity

### Signal 1: Explaining a Tradeoff

**When:** Discussing Pusher vs self-hosted WebSocket  
**Say:** *"Pusher adds 100-300ms latency compared to a self-hosted WebSocket server. I accepted this because the operational overhead of running a persistent WebSocket server alongside serverless functions wasn't justified for a draft with 30-second pick timers. If this were a real-time trading platform, I'd make a different choice."*

### Signal 2: Discussing Alternatives Considered

**When:** Explaining HMAC cookies vs JWT  
**Say:** *"I considered JWT but chose HMAC-signed cookies. JWTs are larger, require algorithm negotiation, and have well-documented pitfalls — algorithm confusion attacks, no revocation without a denylist. For this use case, signed cookies give me the same integrity guarantee with a smaller attack surface."*

### Signal 3: Acknowledging Limitations

**When:** Discussing rate limiting  
**Say:** *"The current rate limiter is in-memory, which means it's per-instance. In a multi-instance serverless deployment, each function instance has its own counter. A determined attacker could distribute requests across instances to bypass the limit. The production fix is straightforward — swap to Redis with atomic INCR — but I want to be transparent that the current implementation has this gap."*

### Signal 4: Production Awareness

**When:** Discussing the database layer  
**Say:** *"I set the connection pool to max 1 because this runs on serverless functions. Each invocation gets its own pool. If I set max to 10 and had 50 concurrent function invocations, I'd exhaust the database connection limit. It's a small detail, but it's the kind of thing that causes outages in production."*

### Signal 5: Showing You Understand the Algorithm

**When:** Discussing getEligiblePlayers  
**Say:** *"The key insight is that validating the current pick isn't enough. You have to validate that the pick leaves a feasible path to complete the roster. If you have 3 picks left and need 2 bowlers and 1 keeper, picking a batsman looks locally valid but creates a globally unsolvable state. The algorithm computes mandatory slots remaining after the hypothetical pick and compares against remaining picks. It's a single O(n) pass with pre-computed roster counts."*

---

## 8. Q&A Preparation Bridge

### Architectural Decisions Interviewers Will Probe

1. **"Why not use WebSockets directly?"** — Serverless constraints, Pusher as managed infra
2. **"How do you handle concurrent picks?"** — Row-level locks, transaction isolation, double-check
3. **"Why HMAC cookies over JWT?"** — Smaller surface area, no algorithm confusion
4. **"What happens if Pusher goes down?"** — Graceful degradation, polling fallback
5. **"How does the constraint solver scale?"** — O(n) per pick, pre-computed counts
6. **"Why Prisma 7 with pg adapter?"** — First-class serverless support, connection management

### Areas That Invite Deeper Questioning

Intentionally leave these slightly under-explained in the presentation to invite follow-up:

- **The specific early-round constraint algorithm** — Mention it exists, explain the concept, but don't walk through every line. If they ask, you can go very deep.
- **The Sportmonks sync pipeline** — Mention it, don't detail it. It's a clean architecture story if they ask.
- **The admin configuration validation** — Mention the consistency checker but don't elaborate. It invites questions about validation architecture.

### Closing Statement

> *"That's the system — a real-time draft platform with constraint-solving validation, concurrent pick safety through database-level locking, and layered security designed for serverless deployment. I'm ready to go deeper on any of these areas. What would be most valuable to discuss?"*

This closing does three things:
1. Summarizes the three pillars in one sentence (constraint solving, concurrency, security)
2. Signals confidence ("I'm ready")
3. Gives the interviewer control ("What would be most valuable?")

---

## 9. Likely Q&A Questions

### Architecture

| Question | Strong Answer Emphasizes |
|---|---|
| Why Next.js App Router over Pages Router? | Server Components for data fetching, streaming, layout nesting. Concrete benefits for this app. |
| Why not a global draft store? | Live draft state is page-local in `useDraftSync`. Zustand is toast-only. |
| How would you decompose this into microservices? | Draft engine as a service, player data as a service, auth as a service. Explain boundaries. |
| Why a monolith vs microservices? | Appropriate for the scale. Premature decomposition adds latency and operational cost. |

### Performance

| Question | Strong Answer Emphasizes |
|---|---|
| How fast is the pick operation end-to-end? | ~200-300ms. DB transaction is fast; Pusher broadcast is the bottleneck. |
| What happens with 100 concurrent users? | Single channel scales to ~100 with Pusher. DB connection pool is the real limit. |
| How would you cache player data? | Redis or ISR (Incremental Static Regeneration). Player data changes rarely. |
| Have you load-tested this? | Be honest. Describe what you'd test (concurrent picks, Pusher throughput). |

### Scaling

| Question | Strong Answer Emphasizes |
|---|---|
| How would you handle 1000 simultaneous drafts? | Channel-per-draft, connection pooling with PgBouncer, horizontal API scaling. |
| What's the database bottleneck? | Connection limit. Fix: PgBouncer, read replicas, connection pooling. |
| How would you shard the data? | By draft session. Each draft is independent — natural shard boundary. |

### Reliability

| Question | Strong Answer Emphasizes |
|---|---|
| What if the DB goes down mid-draft? | Draft pauses. Health check returns 503. No data loss (transaction integrity). |
| What if Pusher goes down? | Graceful degradation. Clients can poll. Picks still work. |
| How do you handle partial failures? | Transaction rollback. Pick either fully succeeds or fully fails. |
| What if a serverless function times out mid-pick? | Lock is released on connection close. Next pick retry will succeed. |

### Security

| Question | Strong Answer Emphasizes |
|---|---|
| How do you prevent session hijacking? | httpOnly cookies, secure flag, HMAC signature prevents tampering. |
| Can a participant impersonate another? | No — session cookie is signed, API route verifies participantId matches session. |
| How do you prevent CSRF? | SameSite cookies. Mutation endpoints verify authenticated session. |
| What if someone reverse-engineers the API? | Rate limiting + auth required. All mutations validate server-side. |

### Testing

| Question | Strong Answer Emphasizes |
|---|---|
| How do you test the real-time flow? | Integration tests mock Pusher. E2E tests verify full flow. |
| What's your most valuable test? | The rule engine tests — they validate every constraint edge case. |
| How do you handle flaky E2E tests? | Auth state reuse, increased timeouts, networkidle waits. |

### Future Improvements

| Question | Strong Answer Emphasizes |
|---|---|
| What would you build next? | Redis for rate limiting + caching, background sync jobs, auto-draft timer. |
| How would you add live scoring? | Webhook from Sportmonks → background job → DB update → Pusher broadcast. |
| How would you add an undo feature? | Append-only pick log with soft-delete. Admin can revert last pick. |

---

## 10. Risk Mitigation

### If You Run Out of Time

**Cut in this order:**
1. Testing Strategy (mention "321 tests, testing trophy approach" in one sentence)
2. Security deep-dive (condense to 60 seconds: "HMAC cookies, defense-in-depth, rate limiting")
3. Real-time deep-dive (condense to 60 seconds: "Pusher for events, useDraftSync for draft state, graceful degradation")

**Never cut:**
- The opening problem statement (sets the frame)
- The draft engine deep-dive (your strongest differentiator)
- Tradeoffs and limitations (your maturity signal)

### If Interviewers Interrupt Early

This is actually a **good sign** — it means they're engaged. When interrupted:

1. **Answer the question directly** — don't say "I'll get to that later"
2. After answering, say: *"I was about to cover [next topic] — shall I continue, or would you prefer to stay in this area?"*
3. This gives them control while showing you have more material

### If You Forget Details

**Don't panic. Don't guess. Say one of:**

- *"I'd need to check the exact implementation, but the design principle is [explain the concept]."*
- *"The specific numbers escape me, but the approach is [describe the approach]."*
- *"That's a good question — I implemented it but let me think through the exact flow..."* (then take 5 seconds to think)

**Never say:** "I don't know" with nothing else. Always follow with what you *do* know.

### If a Question Exposes a Knowledge Gap

**Own it, then redirect:**

- *"That's an area I haven't deeply explored yet. My current approach is [what you did], and I can see how [their suggestion] would be better because [reason]. That's something I'd research before a production deployment."*

This shows:
1. Honesty (not BS-ing)
2. You understand why their point matters
3. You have a learning mindset

---

## Summary: The Five Things to Nail

1. **Open with the engineering challenge, not the product** — Hook them with constraint-solving, concurrency, and security, not "it's a fantasy cricket app"

2. **Go deep on the draft engine** — This is your unique differentiator. The look-ahead constraint solver and row-level lock concurrency pattern are senior-level engineering.

3. **Show tradeoffs on everything** — Every technology choice should come with "I chose X over Y because Z, and the cost is W."

4. **Be honest about limitations** — In-memory rate limiting, Pusher latency, no optimistic updates. Acknowledging these builds trust.

5. **End by inviting their best question** — *"What would be most valuable to discuss?"* signals confidence and gives them the floor.
