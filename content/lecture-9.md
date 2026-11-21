---
id: 9
subject: { code: CPE333, title: Operating Systems }
tags: [Concurrency, Synchronization, Semaphores]
source: 9.pdf
title: Conditions & Semaphores
subtitle: Trace wakeups, buffer predicates and the order of semaphore operations.
sections:
  - title: Condition variables
    start: 1
    end: 9
  - title: Producer/consumer with conditions
    start: 10
    end: 22
  - title: Counting and binary semaphores
    start: 23
    end: 35
lab:
  title: A wakeup is not a reservation
  reference: 18
  nodes:
    - Consumer C1
    - One-slot buffer
    - Consumer C2
  frames:
    - focus: 0
      states:
        - asleep on not-empty
        - empty
        - runnable
      caption: C1 waits and releases the mutex.
    - focus: 1
      states:
        - signaled
        - item X
        - runnable
      caption: The producer puts X, signals C1, and unlocks. C1 has not reacquired the mutex yet.
    - focus: 2
      states:
        - runnable
        - empty
        - took X
      caption: C2 wins the mutex and removes X before C1 returns from wait.
    - focus: 0
      states:
        - waits again
        - empty
        - done
      caption: C1 reacquires the mutex. A while loop rechecks the predicate and waits again instead of reading an empty buffer.
quiz:
  - prompt: When condition wait returns, what is held?
    choices:
      - No mutex
      - The associated mutex
      - Every mutex used by the thread
    answer: 1
    explanation: Wait releases the mutex during sleep and reacquires it before returning.
    slide: 9
  - prompt: Why use while rather than if?
    choices:
      - The predicate may no longer hold
      - Signals count slots
      - It stops the scheduler
    answer: 0
    explanation: A different consumer can act before the awakened one.
    slide: 20
  - prompt: How should an empty capacity-N queue initialize empty/full?
    choices:
      - 0 / N
      - N / N
      - N / 0
    answer: 2
    explanation: All slots are initially available; no items are present.
    slide: 30
  - prompt: Why reserve a permit before locking the buffer?
    choices:
      - Holding the mutex while blocked can stop the other side making progress
      - A semaphore cannot be used with a mutex
      - Permits are only useful after the write
    answer: 0
    explanation: A producer waiting on empty with the mutex held prevents a consumer from freeing a slot.
    slide: 33
  - prompt: "Capacity is 3 and fill is 2. Where do the next two writes go?"
    choices:
      - "2, 3"
      - "0, 1"
      - "2, 0"
    answer: 2
    explanation: "Advance fill modulo the capacity after each write."
    slide: 21
---

## Condition variables

A condition variable is a waiting mechanism, <mark>not the predicate itself</mark>. Hold the mutex while testing shared state; wait <mark>atomically releases the mutex</mark> and blocks, then <mark>reacquires it before returning</mark>. Change the predicate under the same mutex. Signal wakes a waiter if present, but <mark>does not store a permit</mark>.

## Producer/consumer with conditions

Track buffer occupancy under the mutex. A woken thread is merely eligible to run: another thread can change the predicate before it reacquires the lock, and spurious wakeups are possible. Use while, not if. Separate not-empty and not-full conditions target the right group. A circular buffer advances fill/use indexes modulo capacity.

## Counting and binary semaphores

wait consumes a permit or blocks; post makes a permit available or enables a waiter. Initialize a binary semaphore to 1 for mutual exclusion or to 0 for an event. A bounded buffer starts empty=capacity and full=0; <mark>reserve a slot/item before taking the mutex</mark>, update the buffer, unlock, then post to the other semaphore. Waiting for capacity while holding the buffer mutex can deadlock.

## Trace the two buffer bugs separately

For a parent waiting on a child, the parent checks `while (!done)` under the mutex; the child sets `done = true` and signals under that mutex. If the child runs first, the parent sees the stored state. The condition variable itself does not save a permit. `signal` wakes one waiter if present; `broadcast` wakes all, and each must reacquire the lock and recheck.

```mermaid
sequenceDiagram
accTitle: A wakeup does not reserve an item
participant A as Consumer 1
participant P as Producer
participant B as Consumer 2
A->>A: Wait and release mutex
P->>A: Publish item and signal
B->>B: Acquire mutex and consume first
A->>A: Reacquire, see empty, wait again
```

Split `not_full` from `not_empty` to fix the wrong-queue bug; use `while` to fix the predicate bug. In a ring with capacity N, advance `fill` after writing and `use` after reading, modulo N. A count distinguishes full from empty when both indices coincide.

| Phase | Producer | Consumer |
| --- | --- | --- |
| Reserve | `sem_wait(empty)` | `sem_wait(full)` |
| Update | lock → put → unlock | lock → get → unlock |
| Publish | `sem_post(full)` | `sem_post(empty)` |

In `sem_init(&s, 0, initial)`, zero in the second argument means shared among threads of the same process. Capacity permits do not protect the buffer indices. Waiting for `full` while holding the mutex prevents producers from filling the buffer; unlike condition wait, semaphore wait does not release that mutex. Implement a semaphore with a mutex, count and condition: while count is zero, wait; then decrement. Post increments and signals under the lock.

## Exam focus: fill in synchronization code

Check the condition in a <mark>while loop</mark>, and <mark>reserve a permit before locking</mark> when using semaphores for the buffer.

The final buffer figures on PDF pages 21–22 pair each predicate with its own waiting queue. The mutex is held at entry to each sequence and released at the end:

```text
Producer: while count == N: wait(not_full, mutex)
          put at fill; advance fill; increment count; signal(not_empty)
Consumer: while count == 0: wait(not_empty, mutex)
          get from use; advance use; decrement count; signal(not_full)
```

With capacity 3 and `fill = 2`, follow the writes across the end of the array:

| Event | Slot 0 | Slot 1 | Slot 2 | Next fill |
| --- | --- | --- | --- | ---: |
| Start empty | — | — | — | 2 |
| Put A | — | — | A | 0 |
| Put B | B | — | A | 1 |

Starting with `use = 2`, the consumer reads A then B. The count distinguishes full from empty even if the cursors coincide.

```mermaid
flowchart TB
accTitle: Why waiting for full inside the buffer lock deadlocks
C[Consumer acquires mutex] --> W[Consumer waits for full permit]
W --> P[Only producer can publish full]
P --> M[Producer needs mutex held by consumer]
M --> W
```

Fix the code on PDF pages 31–34 by taking the permit **before** the mutex. In the semaphore implementation on page 35, a condition wait is different: it releases the internal mutex while waiting, then reacquires it before decrementing the count. Post increments the count and signals under that mutex.
