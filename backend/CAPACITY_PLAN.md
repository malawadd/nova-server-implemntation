# Capacity Plan for Production Streaming Server

This document explains what level of concurrent usage this server can realistically handle, what the main bottlenecks are, and what needs to change to support higher concurrency.

## Short answer

### Likely reasonable today
- low concurrency during development
- small pilot launches
- tens of simultaneous live users on a properly sized instance

### Not safely proven today
- hundreds of simultaneous live voice sessions on one instance
- horizontal scaling without sticky sessions
- bursty traffic without queueing, rate limiting, and observability

## Why this server is expensive per user

Each active user session uses multiple resources at the same time:
- one browser `Socket.IO` connection
- one active Bedrock bidirectional stream
- continuous audio input from the browser
- continuous event processing on the server
- in-memory session state
- in-memory audio chunk buffering
- outbound audio streaming back to the browser

This is not a lightweight request/response API. It is a long-lived realtime audio session.

## Current architecture characteristics

### Stateful session handling
The server stores active sessions in process memory:
- socket session tracking in [src/server.ts](src/server.ts#L26-L39)
- active Bedrock sessions in [src/client.ts](src/client.ts#L139-L141)

This means one running Node process owns those sessions.

### One Bedrock stream per active user
Each user session eventually starts a Bedrock bidirectional stream in [src/client.ts](src/client.ts#L320-L346).

That means concurrency is limited by both:
- your server capacity
- your AWS Bedrock runtime throughput/quota

### Audio buffering per session
Each session has an audio queue in [src/client.ts](src/client.ts#L31-L38) and processes queued chunks in [src/client.ts](src/client.ts#L59-L92).

This increases memory usage as concurrency grows.

## Current code-level limits

### HTTP/2 concurrent streams configuration
The server creates the Bedrock client with:
- `maxConcurrentStreams: 10` in [src/server.ts](src/server.ts#L18-L24)

The client itself also initializes the request handler with:
- `maxConcurrentStreams: 20` in [src/client.ts](src/client.ts#L146-L153)

These values suggest the current implementation is tuned for modest concurrency, not hundreds of simultaneous users.

## Realistic concurrency expectations

These are planning estimates, not guarantees.

### Single instance, current design
- **1 to 10 concurrent users**: very realistic
- **10 to 30 concurrent users**: plausible with a decent production instance
- **30 to 50 concurrent users**: may work with tuning and Bedrock quota headroom
- **50 to 100 concurrent users**: requires testing, tuning, and careful infrastructure choices
- **100+ concurrent users**: should be treated as a scaling project, not a default assumption

## Main bottlenecks

## 1. Bedrock runtime concurrency
The most important limit may be AWS-side throughput.

Even if your Node server is healthy, each live user requires an active model stream. If Bedrock quotas are lower than your traffic, users will fail before your server CPU is fully exhausted.

### Action
Confirm Bedrock runtime quotas and expected concurrent stream capacity before launch.

## 2. Single-process memory state
All active sessions are held in memory.

Impact:
- a process restart drops sessions
- horizontal scaling is harder
- reconnect behavior depends on which instance owns the session

### Action
For early production, prefer one instance or sticky sessions.

## 3. WebSocket connection fan-out
Each active user keeps an open socket to the server.

Impact:
- more memory per connection
- more heartbeat/connection overhead
- more event fan-out on every response

## 4. Continuous audio throughput
Audio is continuously sent from browser to server, then to Bedrock, then audio/text comes back.

Impact:
- network bandwidth rises quickly
- CPU overhead grows from serialization, buffering, event handling, and playback payload delivery

## 5. Audio queue growth
Each `StreamSession` keeps queued audio chunks.

There is a queue cap in [src/client.ts](src/client.ts#L44-L49), but higher concurrency still multiplies queue memory across active sessions.

## 6. Lack of production backpressure controls
The current code does not yet include robust global concurrency caps, admission control, or queue-based overload protection.

Impact:
- users may get degraded performance under sudden bursts
- latency can rise sharply before failure is obvious

## Recommended launch strategy

## Phase 1: small production launch
Goal: support tens of concurrent users safely.

### Deployment shape
- one production instance
- HTTPS + WebSocket support
- health endpoint enabled at [src/server.ts](src/server.ts#L469-L478)
- basic dashboards for CPU, memory, and error rate

### Capacity target
Start with a target like:
- 10 concurrent live users
- then 25
- then 50 after measurement

### What to measure
- active socket count
- active Bedrock session count
- memory usage
- CPU usage
- average response latency
- disconnect rate
- Bedrock errors and throttling
- session cleanup failures

## Phase 2: tune one instance
Before horizontal scaling, make one instance predictable.

### Tune these first
- `maxConcurrentStreams`
- instance CPU and memory size
- WebSocket proxy timeouts
- session cleanup behavior
- queue depth monitoring

### Add safety controls
- maximum active sessions per instance
- reject new sessions when overloaded
- expose metrics endpoint or structured logs
- request and session IDs in logs

## Phase 3: scale horizontally
Only do this after load testing.

### Requirements
- sticky sessions at the load balancer
- per-instance concurrency caps
- autoscaling based on CPU, memory, and socket/session counts
- clear failure behavior when an instance is saturated

### Why sticky sessions matter
This server stores session state in memory. If a client reconnects to a different instance, that instance will not have the original session state.

## Recommended changes for 100+ concurrent users

## 1. Add explicit admission control
When the server reaches a configured concurrency limit, reject new session initialization gracefully.

Suggested behavior:
- return a clear `server busy` message
- do not allow sessions to degrade unpredictably

## 2. Add observability
At minimum, capture:
- active sessions
- active socket connections
- average stream duration
- average queue depth
- number of dropped audio chunks
- cleanup timeout count
- Bedrock request errors by type

## 3. Add structured logging
Current logs are helpful for development, but production scale needs structured logs with:
- session id
- socket id
- conversation id
- user id if available
- event type
- latency

## 4. Introduce sticky sessions at the load balancer
If using multiple instances, sticky routing is the simplest way to preserve session affinity.

## 5. Consider shared coordination for scale
You do not necessarily need to move full audio state out of process, but you may eventually want shared storage for:
- session metadata
- user/session mapping
- connection admission counts

## 6. Protect Bedrock quota headroom
If your app can create sessions faster than Bedrock can handle, you need:
- local concurrency caps
- retry policy
- user-facing backoff behavior

## 7. Consider reducing unnecessary payloads
For example:
- avoid persisting raw audio in app storage
- minimize verbose event logging in hot paths
- avoid excessive UI-level event fan-out if not needed

## Capacity planning assumptions to validate with load tests

These assumptions should be tested, not trusted blindly:
- average session duration
- average simultaneous speaking time
- average audio chunk frequency
- average response size
- average Bedrock latency
- number of users who overlap in peak windows

A system that supports 100 total daily users may still fail at only 15 simultaneous users if they all connect at once.

## Recommended load-testing milestones

## Milestone 1
Simulate:
- 5 concurrent sessions
- 10-minute runs
- verify stability and cleanup

## Milestone 2
Simulate:
- 10 concurrent sessions
- sustained audio streaming
- observe memory and latency growth

## Milestone 3
Simulate:
- 25 concurrent sessions
- staggered starts and stops
- verify no cleanup leaks

## Milestone 4
Simulate:
- 50 concurrent sessions
- measure Bedrock-side failures and server saturation signals

Only after these pass should you design for 100+.

## Practical production advice

### If you need a safe answer today
Plan for:
- **tens of simultaneous users**, not hundreds
- one instance first
- load tests before marketing launch

### If you need 100+ live users soon
Plan on doing all of the following:
- deploy multiple instances
- use sticky sessions
- confirm Bedrock quotas
- add concurrency limits
- add metrics and alerting
- run staged load tests

## Suggested near-term engineering tasks

- [ ] Add configurable max active sessions per instance
- [ ] Add overload rejection for `initializeConnection`
- [ ] Add structured logging with session identifiers
- [ ] Add metrics for active sessions and queue depth
- [ ] Review and tune `maxConcurrentStreams`
- [ ] Load-test at 5, 10, 25, and 50 concurrent users
- [ ] Configure sticky sessions in production load balancer
- [ ] Confirm Bedrock concurrency quotas

## Bottom line

This server is likely suitable for:
- prototypes
- internal tools
- small pilot launches
- early production with tens of concurrent live users

It is **not yet proven or architected for hundreds of simultaneous live audio users** without additional production engineering.

The good news is that it can evolve there, but that should be treated as a deliberate scaling project.
