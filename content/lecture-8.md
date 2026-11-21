---
id: 8
subject: { code: CPE333, title: Operating Systems }
tags: [Concurrency, Locks, Atomic operations]
source: 8.pdf
title: Lock Mechanisms
subtitle: Compare atomic instructions, fairness, spinning and sleeping.
sections:
  - title: What makes a good lock?
    start: 1
    end: 11
  - title: Atomic hardware primitives
    start: 12
    end: 22
  - title: Spin, yield or park?
    start: 23
    end: 32
lab:
  title: "Take a number: ticket lock"
  reference: 20
  nodes:
    - Thread A
    - Shared lock
    - Thread B
  frames:
    - focus: 1
      states:
        - no ticket
        - next 0 / turn 0
        - no ticket
      caption: The next ticket and serving turn start at 0.
    - focus: 0
      states:
        - ticket 0 · inside
        - next 1 / turn 0
        - no ticket
      caption: A fetches and increments next atomically. Ticket 0 matches turn.
    - focus: 2
      states:
        - ticket 0 · inside
        - next 2 / turn 0
        - ticket 1 · waiting
      caption: B gets ticket 1 and waits for its turn.
    - focus: 1
      states:
        - released
        - next 2 / turn 1
        - ticket 1 · inside
      caption: A advances turn. B now owns the lock.
quiz:
  - prompt: What is wrong with a separate test and set?
    choices:
      - Two threads may both observe unlocked
      - It always deadlocks
      - It requires a disk write
    answer: 0
    explanation: The flag check and store must be indivisible.
    slide: 8
  - prompt: What gives a ticket lock its ordering?
    choices:
      - CPU priority
      - Ticket equals turn
      - Random backoff
    answer: 1
    explanation: Fetch-and-add gives distinct tickets; turn advances in sequence.
    slide: 20
  - prompt: Why protect enqueue-to-sleep?
    choices:
      - To disable memory
      - To make tickets larger
      - To avoid a wake arriving before the thread sleeps
    answer: 2
    explanation: Otherwise the waiter may remain asleep after the lock is free.
    slide: 29
  - prompt: What remains a downside of a ticket spinlock?
    choices:
      - It spins while waiting
      - It cannot enforce mutual exclusion
      - It always lets later arrivals in first
    answer: 0
    explanation: Fair order does not eliminate CPU consumption while waiting.
    slide: 23
  - prompt: "A queued mutex owner hands off to a waiter. What happens to the ownership flag?"
    choices:
      - "It stays held during handoff"
      - "It must be cleared first"
      - "It becomes the queue length"
    answer: 0
    explanation: "Keeping the flag held prevents a fresh arrival from stealing the lock before the successor runs."
    slide: 28
---

## What makes a good lock?

Evaluate <mark>correctness (mutual exclusion)</mark>, <mark>fairness (including starvation)</mark>, and performance under different contention and CPU conditions. Disabling interrupts is privileged and does not stop other CPUs. Separate ordinary load and store instructions cannot safely claim an unlocked flag.

## Atomic hardware primitives

Test-and-set swaps in a new value and <mark>returns the old one</mark>. Compare-and-swap only changes the value if it <mark>matches the expected one</mark>. Fetch-and-add returns the old value while incrementing; a ticket lock <mark>serves tickets in order</mark> using a separate turn counter. Real implementations also require proper memory ordering.

## Spin, yield or park?

Spinning repeatedly checks readiness and wastes CPU if the owner cannot run. Yield lets the scheduler try another runnable thread, but does not guarantee fairness. A guarded queue lets contenders sleep. Coordinate enqueue and sleep with wakeup (e.g. park preparation or a conditional wait) so a wake cannot disappear just before the contender parks.

## Compare implementations

| Mechanism | What changes state | Main limitation |
| --- | --- | --- |
| Disable interrupts | CPU defers local interrupts | Privileged; does not stop other cores |
| Separate test and set | Ordinary read then write | Two callers can both observe 0 and enter |
| Atomic test-and-set | Always writes and returns old value | Correct exclusion but not FIFO |
| Compare-and-swap | Writes only when the old value equals the expected value | Spinning CAS does not ensure fairness |
| Fetch-and-add | Increments and returns the old ticket | FIFO order, but still spins |
| Guarded queue | Enqueues and hands off to the next waiter | Must coordinate sleep and wakeup |

Mutual exclusion means never two owners. Progress means somebody can enter; starvation freedom means each waiter eventually enters under the scheduling assumptions. The lecture mentions Peterson’s algorithm as an example of software locking, unlike the broken naive test–set pair. With a preempted owner and N contenders, spinning can waste N−1 time slices. Yield moves a thread from running to ready, not asleep, so it can repeatedly be scheduled and yield without making progress.

```mermaid
sequenceDiagram
accTitle: Queued lock handoff
participant W as Waiter
participant O as Owner
W->>W: Guard, enqueue, prepare to park
W->>W: Release guard and park
O->>O: Guard and dequeue waiter
O->>W: Hand off lock and unpark
```

The guard protects queue and lock bookkeeping, not the user’s critical section. Solaris `setpark()` handles the early-wake race by making a pending park return immediately; Linux futex waiting can check that the state is still as expected before sleeping. A two-phase lock spins briefly then blocks, balancing short handoff latency against wasted CPU when the owner is delayed.

## Exam focus: trace the lock flag, guard, and queue

A spinlock needs an <mark>atomic check-and-claim</mark>. A sleeping lock also needs to handle a <mark>wake that arrives before park</mark>.

### Watch two threads race for one lock

Start each example with `flag = 0` (**free**). `flag = 1` means **held**. Read downward in time.

**Separate check and write — broken (PDF pages 8–11)**

| Step | Thread A | Thread B | Shared flag after step |
| --- | --- | --- | --- |
| 1 | Reads 0, leaves the loop, then pauses | — | `0` |
| 2 | — | Reads 0 and leaves the loop too | `0` |
| 3 | — | Writes 1 and enters | `1` |
| 4 | Resumes, writes 1 and enters | Still inside | `1` |

At step 4, A does not recheck the flag. <mark>Both threads are inside.</mark> The problem is the gap between **seeing** a free lock and **claiming** it.

**Atomic check and claim — one owner (PDF pages 13–18)**

```mermaid
sequenceDiagram
accTitle: Only the first atomic claim takes the lock
participant A as Thread A
participant F as Shared flag
participant B as Thread B
Note over F: Starts free at 0
A->>F: Atomic claim
F-->>A: Old value 0, flag now 1
Note over A: Enters
B->>F: Atomic claim
F-->>B: Old value 1, flag stays 1
Note over B: Keeps spinning
```

Both instructions let A in and keep B waiting, but they do different things at the flag:

| Operation | A sees `0` | B sees `1` |
| --- | --- | --- |
| `TestAndSet(flag, 1)` | Writes `1`, returns `0` | Writes `1` again, returns `1` |
| `CAS(flag, 0, 1)` | Expected `0` matches: writes `1`, returns `0` | Expected `0` does not match: **no write**, returns `1` |

In these lecture versions, the return is the **old** value. A return of `0` tells a thread it claimed a free lock; a return of `1` tells it to retry. A ticket lock works differently: it hands out unique tickets and waits until the current `turn` matches.

### Follow ownership at unlock

```mermaid
flowchart TB
accTitle: Queued mutex release and handoff
U[Owner takes the guard] --> Q{Any waiting threads?}
Q -->|No| F[Clear flag: lock becomes free]
Q -->|Yes| H[Remove and wake next waiter; keep flag held]
F --> G[Release guard]
H --> G
```

The `guard` protects bookkeeping, while `flag` protects entry into the user’s critical section. In the queued case, <mark>keep the flag held during handoff</mark> so a new caller cannot jump ahead. On PDF pages 28–30, the waiter calls `setpark` before releasing the guard; a wake that arrives before the actual `park` is then remembered.
