---
id: 7
subject: { code: CPE333, title: Operating Systems }
tags: [Concurrency, Threads, POSIX]
source: 7.pdf
title: Threads & Concurrency
subtitle: Follow two threads through a shared counter and see where an update disappears.
sections:
  - title: Process vs. thread
    start: 1
    end: 8
  - title: Race conditions and atomicity
    start: 9
    end: 18
  - title: POSIX threads API
    start: 19
    end: 30
lab:
  title: The lost update
  reference: 12
  nodes:
    - Thread A register
    - Shared counter
    - Thread B register
  frames:
    - focus: 1
      states:
        - —
        - "0"
        - —
      caption: Both threads intend to increment the counter once.
    - focus: 0
      states:
        - "0"
        - "0"
        - —
      caption: A loads 0, then is preempted before storing.
    - focus: 2
      states:
        - "0"
        - "0"
        - "0"
      caption: B loads the same 0. Neither register is shared.
    - focus: 2
      states:
        - "0"
        - "1"
        - "1"
      caption: B adds and stores 1.
    - focus: 0
      states:
        - "1"
        - "1"
        - "1"
      caption: A resumes and stores its own 1. Two increments ran, but the counter is 1.
quiz:
  - prompt: What is private to each thread?
    choices:
      - Heap
      - Stack and registers
      - Process code
    answer: 1
    explanation: Each thread needs its own execution state even when sharing an address space.
    slide: 5
  - prompt: Why can two increments produce 1 instead of 2?
    choices:
      - They can both load the old value
      - They share a single register
      - The scheduler disables the cache
    answer: 0
    explanation: The load–add–store sequence can interleave.
    slide: 12
  - prompt: What does pthread_join do?
    choices:
      - Starts the target routine
      - Copies the target stack
      - Waits for termination and can retrieve a result
    answer: 2
    explanation: The optional result parameter is an output pointer.
    slide: 23
  - prompt: What is unsafe to return from a thread routine?
    choices:
      - A pointer to its local stack variable
      - A pointer to suitably managed heap storage
      - "NULL"
    answer: 0
    explanation: Its stack variable does not outlive the thread routine.
    slide: 26
  - prompt: "Both workers have joined. Does that make their unsynchronized increments safe?"
    choices:
      - "Yes, join serializes the workers"
      - "No, join waits for completion but does not order their increments"
      - "Yes, if the counter is volatile"
    answer: 1
    explanation: "Protect the update itself; a join after the update cannot prevent a race."
    slide: 12
---

## Process vs. thread

Threads share the <mark>process address space</mark>, including code and heap, but each has its own <mark>registers, program counter and stack</mark>. A thread switch saves and restores execution state; switching between threads in the same address space does not require switching address spaces. Creation makes a thread runnable, not necessarily next to execute.

## Race conditions and atomicity

A source-level increment can become <mark>load, add and store</mark>. If both threads load the same value before either stores, the second store overwrites the first increment. A critical section touches shared state; <mark>mutual exclusion allows only one thread</mark> into it at a time. Atomicity means other participants cannot observe an operation half-complete.

## POSIX threads API

pthread_create takes a thread-ID destination, attributes, a start routine, and a void* argument. <mark>pthread_join waits</mark> and can write the routine’s void* result into caller-owned storage via void**. Never return a pointer into the terminating thread’s stack. Initialize mutexes and condition variables, check return values, and compile/link with -pthread where supported. trylock returns rather than waiting; a timed lock bounds the wait.

## Trace execution and thread lifetime

Concurrency is overlapping progress, not necessarily parallel execution. A same-process context switch saves the outgoing program counter, stack pointer and registers in its TCB and restores another TCB without changing the address space or page table. The PCB stores process-wide state.

```mermaid
flowchart TB
accTitle: Threads share process memory
A[Thread A: own PC and registers] --> SA[Stack A]
B[Thread B: own PC and registers] --> SB[Stack B]
A --> M[Shared code, globals and heap]
B --> M
```

The lecture’s two workers each attempt 10,000,000 increments, so the intended result after both joins is 20,000,000. `volatile` does not make a load/add/store atomic. In a real C program the unsynchronized data race is undefined behavior; in the lecture’s simplified trace, the later store loses an update. Protect the whole read–modify–write, not just the store.

`pthread_create(&tid, NULL, worker, arg)` uses default attributes. `void *result; pthread_join(tid, &result);` gives join a destination for the returned pointer; `NULL` discards it. Keep arguments alive until consumed, don’t share a changing loop index accidentally, and agree on who frees a returned heap allocation. Parallel phases often join before moving on; server workers may instead stay alive to handle queued requests. `pthread_mutex_timedlock` takes an absolute deadline. The deck shows `gcc -o main main.c -Wall -lpthread`; `-pthread` is a common compiler-driver alternative.

## Exam focus: predict what each thread sees

Threads share an address space but keep <mark>separate execution state</mark>. Joining a worker <mark>waits for completion</mark>; it does not synchronize the workers’ accesses to each other.

The memory diagrams on PDF pages 4–6 show separate stacks inside the **same** address space. A stack is normally owned by one thread, but another thread can access an object on it if given its address while the object is alive. The scheduling figures on pages 12–13 show why restoring a saved register can preserve a **stale** value across a context switch.

| Schedule, starting at 0 | A’s register | B’s register | Counter |
| --- | ---: | ---: | ---: |
| A loads and adds, then is preempted | 1 | — | 0 |
| B loads, adds, and stores | 1 | 1 | 1 |
| A resumes and stores its saved value | 1 | 1 | 1 |

### Follow the pointer through join

```mermaid
flowchart TB
accTitle: How pthread join writes a returned pointer
ARG[Caller provides arg] --> W[Worker reads arg and returns a pointer]
W --> J[pthread_join waits for the worker]
S[Caller passes address of result slot] --> J
J --> R[Join writes the pointer into result]
R --> O[Caller can now access the returned object]
```

In PDF pages 22–24, `&result` locates the slot join updates; after the call, `result` identifies the object. Do not return a pointer to a worker’s local stack variable. To fix the counter example, lock **before** the load and unlock **after** the store. That protects the update from competing threads even if its owner gets preempted.
