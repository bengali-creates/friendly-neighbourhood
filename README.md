# Spider-Sense: Autonomous Policy Monitoring and Hazard Radar

**Event:** The Scrape-Verse Hackathon, August 17-23, 2026
**Mandatory Tool:** Bright Data Scraper Studio (CLI + AI Agent)
**Tracks Entered:** Web-Slinger (Grand Prize), Suit-Up (Best UI), Spider-Sense (Best Clean Code)

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [What Spider-Sense Monitors](#2-what-spider-sense-monitors)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [End-to-End Request Lifecycle](#4-end-to-end-request-lifecycle)
5. [Bright Data Integration: Three Tiers of Retrieval](#5-bright-data-integration-three-tiers-of-retrieval)
6. [LangGraph Agent: Stateful Pipeline Deep Dive](#6-langgraph-agent-stateful-pipeline-deep-dive)
7. [Self-Healing: Detection, Trigger, and Recovery](#7-self-healing-detection-trigger-and-recovery)
8. [Prompt Engineering and LLM Allocation](#8-prompt-engineering-and-llm-allocation)
9. [Data Processing: From Raw HTML to Structured Knowledge](#9-data-processing-from-raw-html-to-structured-knowledge)
10. [Snapshot Diffing: Deterministic Change Detection](#10-snapshot-diffing-deterministic-change-detection)
11. [Research Synthesis: Multi-Source Intelligence](#11-research-synthesis-multi-source-intelligence)
12. [Database Design](#12-database-design)
13. [API Layer: FastAPI Routes and Next.js Bridge](#13-api-layer-fastapi-routes-and-nextjs-bridge)
14. [Frontend Architecture](#14-frontend-architecture)
15. [Key Engineering Decisions](#15-key-engineering-decisions)
16. [Technology Stack](#16-technology-stack)
17. [Self-Healing Evidence and Test Verification](#17-self-healing-evidence-and-test-verification)
18. [Local Development Setup](#18-local-development-setup)
19. [Repository Structure](#19-repository-structure)

---

## 1. Problem Statement

Web scrapers fail silently and catastrophically. A target site rewrites its DOM structure, introduces bot fingerprinting, rotates Cloudflare challenges, or changes its CSS class hierarchy, and the scraper returns null, an empty list, or raises an unhandled exception. The upstream application sees nothing; users receive no signal. This is the reliability problem.

Simultaneously, the documents that scrapers most commonly target -- Terms of Service agreements, government welfare scheme bulletins, product safety recall notices -- carry direct financial and legal consequences for the people affected by their changes. A new clause in Instagram's Terms of Service authorizing AI training on user-generated content, an expired scholarship deadline on a government portal, or a CPSC recall affecting a children's product in someone's home: these are changes that matter to individuals, but they have no scalable mechanism to monitor them.

Spider-Sense was designed to solve both problems in a single unified system. It wraps Bright Data's self-healing Scraper Studio collectors inside a stateful LangGraph AI agent that autonomously detects extraction failures, executes self-healing, timestamps and persists scraped snapshots, computes textual diffs between consecutive scrapes, classifies the severity of detected changes using an LLM, and generates ready-to-use action scripts for the user -- all without manual intervention.

---

## 2. What Spider-Sense Monitors

The system monitors three categories of content:

### 2.1 Terms of Service and Privacy Policies

**Example: Instagram (Meta) Terms of Use**

Target URL: https://help.instagram.com/581066165581870

The Bright Data collector scrapes the full Terms of Use page and extracts structured sections: Data Collection, AI Processing, Third-Party Sharing, User Rights and Cancellation. If Instagram adds a new clause permitting Meta AI to train on user photos, the diff node detects it, the filter node classifies it as CRITICAL, and Spider-Sense generates an opt-out email template and deletion request steps within seconds.

Other examples monitored:

- Netflix Terms of Use (password-sharing and simultaneous stream policy changes)
- Google Privacy Policy (data retention period modifications)
- WhatsApp Terms (business messaging and data portability changes)

### 2.2 Government Schemes and Civic Notices

**Example: PM Scholarship Scheme (India)**

The civic monitor scrapes government portals for welfare schemes, scholarship deadlines, and benefit eligibility windows. If a scholarship deadline is extended or a new eligibility criterion is added, users receive a CRITICAL or WARNING alert with a generated application action script.

Other examples:

- Central Electricity Regulatory Commission tariff revision notices
- National Food Security Act amendment bulletins
- PM Vidyalakshmi Education Loan scheme deadline changes
- Municipal corporation property tax deadline notifications

### 2.3 Product Safety Recalls

**Example: CPSC Recall Dataset**

The recall engine uses apidfuzz 	oken_set_ratio matching against the user's product inventory (e.g., model number XR-4500, brand Philips). A match above the configured confidence threshold (default 0.85) creates a ecall_match record linked to the inventory item and surfaces a CRITICAL alert with the official remedy and refund claim steps.

---

## 3. High-Level System Architecture

`
+------------------+       HTTPS        +-------------------------+
|  User Browser    | <----------------> |   Next.js 16 App Router |
|  (React 19)      |                    |   (Port 3000)           |
+------------------+                    +-----------+-------------+
                                                    |
                          REST HTTP/JSON            |
                                                    v
                                        +-----------+-------------+
                                        |  FastAPI Agent          |
                                        |  (Python, Port 8000)    |
                                        |                         |
                                        |  LangGraph StateGraph   |
                                        |  scrape -> validate     |
                                        |  -> [heal] -> diff      |
                                        |  -> filter -> [research]|
                                        |  -> draft -> END        |
                                        |                         |
                                        |  brightdata_client.py   |
                                        +-----------+-------------+
                                                    |
                            +-----------------------+-------------------+
                            |                       |                   |
                +-----------+---------+  +----------+------+  +--------+----------+
                | Bright Data         |  | Google Search   |  | Reddit / Perplexity|
                | Scraper Studio      |  | (Bright Data SDK)|  | (Bright Data SDK)  |
                | DCA API             |  +-----------------+  +--------------------+
                +----------+----------+
                           |
              Webhook POST /webhooks/brightdata
                           |
                    +------+------+
                    | ngrok tunnel|
                    | (dev proxy) |
                    +------+------+
                           |
                    +------v------+
                    | FastAPI     |
                    | Webhook recv|
                    +------+------+
                           |
                  HTTP POST (internal bridge)
                           |
                    +------v------------------+
                    | Next.js API Routes      |
                    | /api/snapshots          |
                    | /api/alerts             |
                    | /api/heals              |
                    | /api/jobs               |
                    | /api/notifications      |
                    +------+------------------+
                           |
                    +------v------+
                    | Drizzle ORM |
                    | TypeScript  |
                    +------+------+
                           |
                    +------v------+
                    | Supabase    |
                    | PostgreSQL  |
                    +-------------+
`

**Key architectural invariant:** The Python agent has zero direct database credentials. It communicates exclusively with Next.js API routes over HTTP using the httpx library. The Drizzle ORM TypeScript schema is the single authoritative definition of all table structures.

---

## 4. End-to-End Request Lifecycle

The sequence below describes the complete lifecycle of a user registering Instagram's Terms of Service for monitoring via POST /watch.

`
Step  Actor            Action
----  -----            ------
1.    User             Submits URL https://help.instagram.com/... with name
                       "Instagram ToS" and source_type "tos" via AddWatchForm

2.    Next.js          Frontend calls POST http://localhost:8000/watch
                       { url, name, source_type, prompt }

3.    FastAPI          Checks snapshot cache: GET /api/snapshots?url=<url>
                       -> cache miss (no existing snapshot)

4.    FastAPI          Checks Bright Data Dataset Marketplace
                       GET https://api.brightdata.com/datasets/v3/snapshots?url=<url>
                       -> not available in marketplace

5.    FastAPI          save_collector(): POST /api/collectors
                       { collector_id, name, url, source_type }
                       -> stored in PostgreSQL collectors table

6.    FastAPI          Returns 200 OK with job_id in < 50ms
                       Response: { success, source: "new_collector", job_id }

7.    FastAPI          asyncio.create_task(_run_pipeline_bg())
                       Background: agent_graph.ainvoke(initial_state)

8.    scrape_node      DB cache check (miss) -> trigger_immediate API call
                       POST https://api.brightdata.com/dca/trigger_immediate
                       ?collector=c_mt4gjw4y2gom7o80b7
                       Payload: { url, prompt: "Extract into structured JSON..." }
                       -> response_id returned

9.    scrape_node      Poll get_result every 3s up to 90s
                       GET https://api.brightdata.com/dca/get_result
                       ?response_id=<id>&timeout=25s
                       -> scraped JSON payload returned
                       update_job_progress(status="scraping", progress=40)

10.   validate_node    Checks snapshot is non-empty
                       -> validation_passed=True
                       update_job_progress(status="validating", progress=50)

11.   diff_node        Fetches previous snapshot from DB for comparison
                       -> No previous snapshot -> diff={changed: False}
                       update_job_progress(status="diffing", progress=65)

12.   filter_node      diff.changed=False -> severity=None -> graph exits at END
                       update_job_progress(status="completed", progress=100)
                       save_notification("Scrape Completed", ...)

13.   User             Frontend polls GET /api/jobs?job_id=<id> every 2s
                       -> progress bar updates to 100%, "Completed"
`

On the second scrape (when a policy change is detected):

`
Step  Node            Action
----  ----            ------
10.   diff_node       Previous snapshot exists in DB
                      difflib.unified_diff(previous_text, current_text)
                      -> diff={lines: [...], changed: True}

11.   filter_node     Calls Gemini Flash:
                      "Classify this diff: CRITICAL/WARNING/INFO/NONE"
                      -> "CRITICAL" (new AI training clause detected)
                      update_job_progress(status="filtering", progress=75)

12.   research_node   search_google("instagram terms AI training", num_results=5)
                      search_reddit("instagram terms AI training", num_results=3)
                      search_perplexity("instagram terms AI training")
                      -> 9 sources collected
                      update_job_progress(status="researching", progress=85)

13.   draft_node      Calls Gemini Flash with diff + sources context:
                      -> alert: "Instagram's updated Terms now permit Meta AI to
                                 train on your photos and private messages by default."
                      -> position_a: risk view
                      -> position_b: mitigation view
                      -> draft_script: opt-out email template + deletion steps
                      update_job_progress(status="completed", progress=100)

14.   _persist_alert  POST /api/alerts { severity: "CRITICAL", message, draft_script, ... }
                      POST /api/sources [ {title, url, snippet}, ... ]
                      -> alert_id=42 stored in PostgreSQL

15.   User            Notification bell shows new CRITICAL alert
                      Dashboard alerts panel shows action script + sources
`

---

## 5. Bright Data Integration: Three Tiers of Retrieval

Spider-Sense queries Bright Data in order of cost and latency, short-circuiting as soon as usable data is available.

`
Retrieval Request
      |
      v
+-----+--------------------------------------------+
| Tier 1: PostgreSQL Snapshot Cache                |
|                                                  |
| GET /api/snapshots?url=<url>                     |
| If snapshot.scraped_at < 7 days old:             |
|   return cached snapshot immediately             |
|   Cost: 0 Bright Data credits                   |
|   Latency: ~5ms                                 |
+-----+--------------------------------------------+
      | cache miss
      v
+-----+--------------------------------------------+
| Tier 2: Bright Data Dataset Marketplace          |
|                                                  |
| GET https://api.brightdata.com/                  |
|     datasets/v3/snapshots?url=<url>&limit=1      |
| If pre-scraped dataset exists:                   |
|   save snapshot, return data                     |
|   Cost: reduced credits, no fresh scrape needed |
|   Latency: ~200ms                               |
+-----+--------------------------------------------+
      | not in marketplace
      v
+-----+--------------------------------------------+
| Tier 3: Live Scraper Studio DCA API              |
|                                                  |
| Mode A (Async + Webhook):                        |
|   POST /dca/trigger                              |
|   ?collector=<id>                                |
|   &endpoint=<ngrok_webhook_url>                  |
|   &queue_next=1                                  |
|   Payload: [{ url, prompt }]                     |
|   -> Bright Data scrapes in cloud                |
|   -> Result delivered via POST to /webhooks/     |
|      brightdata when complete (30-120s)          |
|                                                  |
| Mode B (Sync Polling):                           |
|   POST /dca/trigger_immediate?collector=<id>     |
|   Payload: { url, prompt }                       |
|   -> response_id                                 |
|   GET /dca/get_result?response_id=<id>           |
|       &timeout=25s                               |
|   Poll every 3s, max 90s total                   |
|                                                  |
| Mode C (CLI Subprocess Fallback):                |
|   npx -p @brightdata/cli bdata scraper run       |
|   <collector_id> <url>                           |
|   Used if SDK and API both fail                  |
|   Timeout: 120s                                  |
+--------------------------------------------------+
`

### The Structured Prompt Sent to Bright Data

When triggering a live scrape, Spider-Sense sends a structured extraction prompt alongside the URL. This eliminates the need for custom CSS selector strategies -- the Scraper Studio AI handles DOM parsing and produces schema-consistent output:

`
Extract complete document text into structured JSON. Do NOT truncate or
abbreviate text. Preserve all paragraphs, sub-clauses, bullet points, and
hyperlinked URLs in markdown format [text](url).
Output ONLY a valid JSON object:

{
  "title": "Document Title",
  "last_updated": "Date or N/A",
  "sections": {
    "Overview & Scope": "Full text content with [links](url)...",
    "Data Collection & Protection": "Full text content...",
    "AI Processing & Model Training": "Full text content...",
    "Third-Party Data Sharing": "Full text content...",
    "User Rights & Cancellation": "Full text content..."
  }
}
`

The section schema is fixed and consistent across all collector runs. This means the diff algorithm always compares structurally equivalent JSON objects, and section-level diffs are human-readable (e.g., "AI Processing & Model Training" section changed).

---

## 6. LangGraph Agent: Stateful Pipeline Deep Dive

### 6.1 Why LangGraph Over a Plain Function Chain

A plain async function chain cannot natively express:

1. **Conditional retry loops** -- the heal -> scrape loop with a counter cap requires graph-level state to be thread-safe and readable at each node transition.
2. **Typed shared state** -- passing 14 keys through a plain function chain requires either a global dictionary (not safe under concurrent requests) or explicit parameter threading (fragile and unreadable).
3. **Interruptible progress reporting** -- each node calls update_job_progress() to write to ctive_jobs. The job_id needs to be visible to every node without being passed as a function argument.

LangGraph's StateGraph with a TypedDict state solves all three simultaneously.

### 6.2 Agent State Schema

`python
class AgentState(TypedDict):
    job_id:            Optional[str]     # Unique run ID, written to active_jobs table
    collector_id:      str               # Bright Data collector ID
    url:               Optional[str]     # Target URL being monitored
    source_type:       Optional[str]     # "tos" | "recall" | "civic" | "search"
    snapshot:          Optional[dict]    # Current scraped document (structured JSON)
    previous_snapshot: Optional[dict]    # Previous snapshot from DB (for diffing)
    validation_passed: bool              # Did scrape_node return non-empty data?
    heal_attempts:     int               # Heal retry counter, capped at 1
    diff:              Optional[dict]    # {lines: [...unified diff...], changed: bool}
    severity:          Optional[str]     # "INFO" | "WARNING" | "CRITICAL" | None
    alert:             Optional[str]     # 1-sentence user-facing impact statement
    draft_script:      Optional[str]     # Ready-to-copy opt-out / refund action script
    position_a:        Optional[str]     # Mainstream risk view (2-3 sentences)
    position_b:        Optional[str]     # Mitigation / alternative perspective
    sources:           Optional[list]    # [{title, url, snippet, source_type}, ...]
`

### 6.3 Graph Topology

`
                        +--------------+
     Entry Point -----> |  scrape_node | <-----+
                        +------+-------+       |
                               |               | heal retry
                        +------v-------+       | (max 1 attempt)
                        |validate_node |       |
                        +------+-------+       |
                               |               |
             +-----------------+---------------+
             |                                 |
     validation=False                  validation=True
     heal_attempts=0                   OR heal_attempts=1
             |                                 |
        +----v----+                    +-------v------+
        |heal_node|                    |  diff_node   |
        +---------+                    +-------+------+
                                               |
                                       +-------v------+
                                       | filter_node  |
                                       | Gemini Flash |
                                       +-------+------+
                                               |
                          +--------------------+-------------------+
                          |                                        |
                  severity=WARNING                          severity=NONE
                  or CRITICAL                               or INFO
                          |                                        |
                  +-------v------+                               END
                  |research_node |
                  +-------+------+
                          |
                  +-------v------+
                  |  draft_node  |
                  |  Gemini Flash|
                  +-------+------+
                          |
                         END
`

### 6.4 Node Reference Table

| Node | Input State Keys | Output State Keys | LLM Used | Side Effects |
|---|---|---|---|---|
| scrape_node | collector_id, url, job_id | snapshot | No | update_job_progress 20%, 40% |
| alidate_node | snapshot | alidation_passed | No | update_job_progress 50% |
| heal_node | collector_id, snapshot, heal_attempts | heal_attempts | No | save_heal_event; update_job_progress 55% |
| diff_node | snapshot, previous_snapshot | diff | No | update_job_progress 65% |
| ilter_node | diff | severity | Yes (Gemini Flash) | update_job_progress 75%; save_notification on NONE |
| esearch_node | diff, url, source_type | sources | No | update_job_progress 85% |
| draft_node | diff, sources, severity | lert, position_a, position_b, draft_script | Yes (Gemini Flash) | update_job_progress 100%; save_notification; dispatch_external_notification |

### 6.5 Routing Logic

`python
# After validate_node
def should_heal(state: AgentState) -> str:
    if not state["validation_passed"] and state.get("heal_attempts", 0) < 1:
        return "heal"   # Routes to heal_node, then back to scrape_node
    return "diff"       # Routes to diff_node directly

# After filter_node
def should_alert(state: AgentState) -> str:
    return "draft" if state.get("severity") in ("WARNING", "CRITICAL") else END
    # INFO and NONE severity both terminate the graph here, saving 2 LLM calls
`

---

## 7. Self-Healing: Detection, Trigger, and Recovery

### 7.1 Failure Detection

alidate_node classifies the snapshot as passed or failed using a single rule: any non-empty dict or list passes. This was intentionally kept broad after observing that Bright Data returns policy_title/policy_content fields (not a url field), so a field-specific validator was causing all real extractions to be classified as failed and triggering unnecessary heal loops.

Failure categories that route to heal_node:

| Snapshot Condition | heal_type | Description Passed to Bright Data |
|---|---|---|
| None | 
etwork | "Scrape returned None -- possible IP block, CAPTCHA, or bot detection" |
| Empty dict {} | extraction | "Extraction returned incomplete data -- URL field missing from snapshot" |
| Any other failure | extraction | "Validation failed -- extracted data did not pass field checks" |

### 7.2 Heal Command Execution

`python
# heal_node executes this subprocess:
subprocess.run([
    "npx", "-p", "@brightdata/cli",
    "bdata", "scraper", "heal",
    collector_id,
    description,           # Human-readable failure reason
    "--url", url,
    "--auto-approve"       # REQUIRED in non-TTY server environments
], capture_output=True, text=True, timeout=180)
`

The --auto-approve flag was discovered to be necessary during the first integration test: without it, the Bright Data CLI waits for interactive TTY confirmation, blocking the Python subprocess indefinitely in a headless server process. Adding --auto-approve causes Bright Data to automatically regenerate and redeploy the updated selector strategy without human confirmation.

### 7.3 Heal Event Persistence

save_heal_event is sync def but heal_node is a synchronous LangGraph node. Calling syncio.create_task() from a sync context raises RuntimeError. The solution is to spawn a daemon 	hreading.Thread that creates its own syncio event loop:

`python
def _run_save():
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(save_heal_event(
            collector_id=collector_id,
            description=description,
            heal_type=heal_type,
            resolution=resolution,
            attempts=attempts + 1,
            duration_ms=duration_ms,
            succeeded=True,
        ))
    finally:
        loop.close()

threading.Thread(target=_run_save, daemon=True).start()
`

The daemon=True flag ensures the thread does not block process shutdown.

### 7.4 Retry Cap and Loop Prevention

The heal-scrape loop executes at most once per pipeline run:

`
Initial run:  heal_attempts=0  ->  heal_node (attempts -> 1)  ->  scrape_node
Second check: heal_attempts=1  ->  should_heal returns "diff"  ->  diff_node
`

A second loop prevention guard was added inside scrape_node itself: before triggering a Bright Data API call, it checks the PostgreSQL snapshot cache. If a fresh snapshot exists (less than 7 days old), it is returned directly. This prevents the webhook-triggered code path from re-invoking the graph, which was the root cause of an infinite scrape -> webhook -> scrape loop observed during initial integration testing.

### 7.5 Observability

Every heal event is persisted to the heal_events table and displayed in the Self-Heal Telemetry panel on the dashboard:

`
heal_events columns:
  collector_id  TEXT     -- Which scraper was healed
  heal_type     TEXT     -- "network" or "extraction"
  description   TEXT     -- Failure reason sent to Bright Data
  resolution    TEXT     -- Corrective action taken
  duration_ms   INTEGER  -- Time taken by bdata scraper heal (ms)
  attempts      INTEGER  -- Cumulative heals for this collector
  succeeded     BOOLEAN  -- Exit code 0 from subprocess
  healed_at     TIMESTAMP
`

---

## 8. Prompt Engineering and LLM Allocation

Spider-Sense uses Gemini 3.6 Flash at exactly two points in the pipeline per run. LLM calls are the most expensive operation in latency and credit consumption, so they are used only where deterministic code cannot provide equivalent value.

### 8.1 Where LLMs Are NOT Used

| Operation | Method | Reason |
|---|---|---|
| HTML stripping | MLStripper (Python HTMLParser) | Deterministic, no hallucination risk, zero cost |
| Snapshot diffing | difflib.unified_diff | Deterministic, line-level granularity, auditable |
| Cache freshness check | Date arithmetic | Deterministic |
| Deduplication | String equality comparison | Deterministic |
| Fuzzy recall matching | apidfuzz.token_set_ratio | Deterministic, threshold-configurable |

### 8.2 Document Chunking (save_snapshot, invoked once per new snapshot)

After raw Bright Data payload arrives, clean_and_chunk_snapshot() calls Gemini Flash:

`
Prompt:
  You are a document structuring assistant.
  Clean text document:
  {clean_text[:6000]}

  Extract the key topics/sections of this document into a valid JSON object.
  Keys should be clear section titles (e.g., "Data Collection",
  "AI Processing & Training", "User Rights", "Third-Party Sharing").
  Values should be the complete text paragraph for that section.
  Return ONLY a valid JSON object.

  Format:
  {
    "title": "Document Title",
    "sections": {
      "Section Name": "Paragraph content..."
    }
  }

Expected output (Instagram ToS example):
  {
    "title": "Instagram Terms of Use",
    "sections": {
      "Overview & Scope": "By using Instagram, you agree...",
      "Data Collection & Protection": "We collect information...",
      "AI Processing & Model Training": "Meta may use content you share...",
      "Third-Party Data Sharing": "We share information with...",
      "User Rights & Cancellation": "You may delete your account..."
    }
  }
`

**Fallback:** If Gemini fails, a period-split paragraph array is used: {"Section 1": "paragraph 1.", "Section 2": "paragraph 2."}.

### 8.3 Severity Classification (filter_node)

`
Prompt:
  You are a policy-change classifier. Given this diff of a Terms of Service
  or recall document, classify the severity of the change:
  - CRITICAL: new fee, cancellation method changed, data sharing added, safety recall
  - WARNING: meaningful structural change, new clause, rights changed
  - INFO: minor wording, typo fix, formatting
  - NONE: whitespace only, no semantic change

  Diff:
  {diff_text[:3000]}

  Reply with exactly one word: CRITICAL, WARNING, INFO, or NONE.

Output parsing:
  raw_response.strip().upper()
  Valid: CRITICAL | WARNING | INFO | NONE
  Invalid -> None (routes graph to END, no alert generated)
`

**Why not regex?** A fee increase may be represented as ".00" -> ".99/month", or as "free" -> "subject to applicable charges". Both require reading comprehension to classify, not pattern matching.

### 8.4 Alert and Action Script Generation (draft_node)

`
Prompt:
  You are Spider-Sense, a personal radar that alerts users to changes that
  could hurt them.

  A document change was detected. Here is the diff:
  {diff_text[:2000]}

  Here are related articles and sources found on the web:
  {sources_context}  <- up to 8 sources: Google, Reddit, Perplexity

  Generate:
  1. ALERT: A 1-sentence plain-English impact statement (start with the
     impact to the user, not the change itself)
  2. POSITION_A: The mainstream / risk-focused view on this change (2-3 sentences)
  3. POSITION_B: An alternative perspective or mitigation view (2-3 sentences)
  4. SCRIPT: A ready-to-copy action script -- opt-out email draft, cancellation
     request, data deletion steps, or refund claim. Be specific.

  Format exactly:
  ALERT: <1 sentence>
  POSITION_A: <2-3 sentences>
  POSITION_B: <2-3 sentences>
  SCRIPT:
  <action script>

Example output (Instagram AI training clause):
  ALERT: Meta's updated Terms now allow Instagram to train AI models on your
         photos and messages unless you opt out.
  POSITION_A: This change removes an implicit privacy expectation that personal
              content would not be used for model training. Users who have not
              reviewed the updated Terms are automatically opted in by default.
  POSITION_B: Meta provides an opt-out mechanism for EU residents under GDPR.
              The AI training affects only content shared after the effective date,
              and training data is anonymized at the model level.
  SCRIPT:
  Subject: Data Processing Opt-Out Request -- Instagram/Meta AI Training

  To: privacy@meta.com
  ...
`

**Output parsing:** A custom extract(label, next_labels) function finds each label by substring search and slices between label boundaries. This is more resilient than regex when the LLM slightly reformats the output.

### 8.5 Unified Position Synthesis (/search/unified-position)

Used by the civic/government research tab and keyword search feature:

`
Prompt:
  You are Spider-Sense Research Synthesizer.
  Keyword: "{keyword}"

  Sources found:
  - [GOOGLE] Title: snippet (url)
  - [REDDIT] Title: snippet (url)
  ...

  Generate:
  1. POSITION_A: Mainstream consensus or primary risk view (2-3 sentences)
  2. POSITION_B: Alternative perspective or mitigation view (2-3 sentences)
  3. SUMMARY: A single unified summary (1 sentence)

  Format exactly:
  POSITION_A: <text>
  POSITION_B: <text>
  SUMMARY: <text>
`

Example: keyword "PM Vidyalakshmi Scholarship 2026 deadline"
- POSITION_A: The December 31 application deadline has passed for most partner banks; late applicants should contact their district education office.
- POSITION_B: Several states extended the deadline to March 2027 for students from flood-affected districts.
- SUMMARY: The PM Vidyalakshmi deadline varies by state and bank; verify directly with your institution.

---

## 9. Data Processing: From Raw HTML to Structured Knowledge

The raw Bright Data payload can arrive in multiple formats depending on the collector configuration. The processing pipeline normalizes all formats to a consistent structured JSON before storage.

`
Bright Data Raw Output (any of the following)
         |
+--------+---------+----------+
|        |         |          |
Array    Dict     HTML      Mixed
form     form     string    content
[{       {title:  "<html>   {policy_title:
  policy_ "...",   <body>    "...",
  content sections: ...     policy_
  "..."}] {...}}  </html>"  content: "..."}
|        |         |          |
+--------+---------+----------+
         |
         v
+--------+----------------------------------+
| clean_and_chunk_snapshot()               |
| (agent/brightdata_client.py)             |
|                                          |
| Step 1 -- Content Field Extraction       |
|   Priority order for each item:          |
|   policy_content                         |
|   -> content                             |
|   -> text                                |
|   -> html                                |
|   -> json.dumps(item)  (fallback)        |
|                                          |
| Step 2 -- HTML Stripping                 |
|   1. Regex removes <script> and <style>  |
|      tags and their content              |
|   2. MLStripper (HTMLParser subclass)    |
|      feeds remaining HTML and collects   |
|      text via handle_data()              |
|   3. Whitespace normalization:           |
|      " ".join(" ".join(text).split())    |
|                                          |
| Step 3 -- LLM Chunking (Gemini Flash)   |
|   Sends clean_text[:6000] to Gemini     |
|   Prompt requests structured JSON with  |
|   named section keys                    |
|   Output: {title, sections: {k: v}}     |
|                                          |
| Step 4 -- Fallback                       |
|   If LLM fails or returns invalid JSON: |
|   paragraphs = clean_text.split(". ")   |
|   sections = {"Section 1": p1, ...}     |
+--------+----------------------------------+
         |
         v
+--------+----------------------------------+
| Deduplication Guard (save_snapshot)      |
|                                          |
| GET /api/snapshots?collector_id=<id>     |
| Compare: latest_text.strip()             |
|       == clean_text.strip()              |
|                                          |
| If identical: skip insert, return True  |
| (prevents duplicate rows from webhook   |
|  retries or double-triggered scrapes)   |
+--------+----------------------------------+
         |
         v
+--------+----------------------------------+
| POST /api/snapshots                      |
| {                                        |
|   collector_id: "c_mt4gjw4y2gom7o80b7", |
|   url: "https://...",                   |
|   text: clean_text,    <- plain text     |
|   raw: {                                 |
|     sections: {                          |
|       "Overview & Scope": "...",         |
|       "Data Collection": "...",          |
|       "AI Processing": "...",            |
|     },                                   |
|     title: "Instagram Terms of Use"      |
|   }                                      |
| }                                        |
+------------------------------------------+
         |
         v
+--------+----------------------------------+
| PostgreSQL snapshots table               |
|                                          |
| text  TEXT  -- plain text for difflib    |
| raw   JSONB -- structured sections for   |
|               display and JSONB queries  |
+------------------------------------------+
`

The 	ext column is used by diff_node for difflib.unified_diff comparison. The aw JSONB column is displayed in the dashboard's snapshot viewer as a key-value table, where each section name is a row header and the section content is the row value.

---

## 10. Snapshot Diffing: Deterministic Change Detection

diff_node uses Python's standard library difflib.unified_diff exclusively. No LLM is involved in the diff computation itself.

### Why unified_diff?

- **Determinism:** Same inputs always produce same output. No stochastic variation.
- **Zero cost:** No API call, no inference latency.
- **Line-level granularity:** Standard +/- annotated output compatible with diff viewers.
- **Auditability:** Every change is traceable to an exact line in the serialized JSON.

### Implementation

`python
def diff_node(state: AgentState) -> AgentState:
    current  = state.get("snapshot")
    previous = state.get("previous_snapshot")

    # Normalize to canonical JSON strings
    # sort_keys=True is critical: prevents false positives from key reordering
    def to_text(s):
        if isinstance(s, str): return s
        if isinstance(s, (dict, list)):
            return json.dumps(s, indent=2, sort_keys=True)
        return str(s or "")

    current_text  = to_text(current)
    previous_text = to_text(previous)

    # Compute unified diff
    lines = [l for l in difflib.unified_diff(
        [l.rstrip() for l in previous_text.splitlines()],
        [l.rstrip() for l in current_text.splitlines()],
        lineterm=""
    )]

    # Filter noise: only +/- lines with non-whitespace content
    meaningful = [l for l in lines
                  if l.startswith(("+", "-")) and l[1:].strip()]

    diff = {
        "lines":   lines,              # Full diff for dashboard display
        "changed": len(meaningful) > 0  # Boolean gate for downstream nodes
    }
    return {**state, "diff": diff}
`

sort_keys=True on json.dumps is the most important optimization: it ensures that a JSON object where keys were reordered but values are identical does not produce a false positive diff.

**Example diff output (Instagram AI clause addition):**

`diff
--- previous
+++ current
@@ -14,6 +14,8 @@
   "AI Processing & Model Training": "We may use content you ...",
+  "AI Training Opt-Out": "EU and UK residents may submit a request
+   at https://www.instagram.com/privacy/ai-opt-out to restrict use
+   of your content for AI model training.",
   "Third-Party Data Sharing": "We share information with..."
`

This raw diff is what gets passed to ilter_node for LLM severity classification.

---

## 11. Research Synthesis: Multi-Source Intelligence

When ilter_node returns WARNING or CRITICAL, esearch_node gathers context from three sources via the Bright Data Python SDK before draft_node generates the action script.

`
research_node
      |
      +-> search_google(query, num_results=5)
      |      Uses: client.search.google(query=..., num_results=5)
      |      Returns: [{title, url, snippet, source_type: "google"}, ...]
      |
      +-> search_reddit(query, num_results=3)
      |      Uses: client.scrape.reddit.posts_by_keyword(
      |                keyword=..., sort_by="Top", date="Past month")
      |      Returns: [{title, url, selftext, source_type: "reddit"}, ...]
      |
      +-> search_perplexity(query)
             Uses: client.scrape.perplexity.search(url=perplexity_search_url)
             Returns: {answer: "...", source_type: "perplexity"}
`

The combined source list (up to 9 items) is injected into the draft_node prompt as sources_context:

`
- [GOOGLE] Instagram AI Training Policy Changes: Meta updated its terms to allow...
  (https://techcrunch.com/2026/instagram-ai-training)
- [REDDIT] Meta wants to use your Instagram posts for AI training: r/privacy
  [8.2k upvotes] Most users don't know this setting exists...
  (https://reddit.com/r/privacy/comments/...)
- [PERPLEXITY] Instagram's Terms of Service AI Clause: According to Meta's updated...
`

After the alert is saved via _persist_alert, each source is persisted to the sources table linked to the lert_id. The dashboard alert detail page renders these as clickable reference cards.

---

## 12. Database Design

All 12 tables are defined exclusively in web/db/schema.ts using Drizzle ORM. The Python agent has no schema definitions and no direct database connection.

### 12.1 Entity Relationship Diagram

`
collectors (1) ----< snapshots (N)
collectors (1) ----< alerts    (N) ----< sources (N)
collectors (1) ----< heal_events (N)
collectors (1) ----< service_watches (N)

inventory  (1) ----< recall_matches (N)
users      (1) ----< notifications  (N)

civic_notices  (standalone)
keyword_searches (standalone)
active_jobs    (standalone telemetry scratch table)
`

### 12.2 Table Definitions

`
collectors
  id           SERIAL PRIMARY KEY
  collector_id TEXT UNIQUE NOT NULL    -- Bright Data collector ID, e.g. c_mt4gjw4y2gom7o80b7
  name         TEXT NOT NULL           -- Display name, e.g. "Instagram Monitor"
  url          TEXT UNIQUE NOT NULL    -- Target URL
  source_type  TEXT NOT NULL           -- "tos" | "recall" | "civic" | "search"
  created_at   TIMESTAMP DEFAULT NOW()

service_watches
  id           TEXT PRIMARY KEY        -- UUID
  name         TEXT NOT NULL
  url          TEXT NOT NULL
  category     TEXT NOT NULL           -- Maps to source_type
  collector_id TEXT NOT NULL           -- References collectors.collector_id
  last_status  TEXT DEFAULT "active"
  created_at   TIMESTAMP DEFAULT NOW()

snapshots
  id           SERIAL PRIMARY KEY
  collector_id TEXT NOT NULL
  url          TEXT
  text         TEXT                    -- Plain text (for difflib comparison)
  raw          JSONB                   -- Structured sections {title, sections: {k:v}}
  scraped_at   TIMESTAMP DEFAULT NOW()

alerts
  id           SERIAL PRIMARY KEY
  collector_id TEXT NOT NULL
  severity     TEXT NOT NULL           -- "CRITICAL" | "WARNING" | "INFO"
  message      TEXT NOT NULL           -- 1-sentence user-facing alert
  draft_script TEXT                    -- Ready-to-copy action script
  position_a   TEXT                    -- Mainstream risk view
  position_b   TEXT                    -- Alternative / mitigation view
  category     TEXT DEFAULT "general"  -- source_type of the triggering collector
  created_at   TIMESTAMP DEFAULT NOW()

sources
  id           SERIAL PRIMARY KEY
  alert_id     INTEGER NOT NULL        -- References alerts.id
  title        TEXT NOT NULL
  url          TEXT NOT NULL
  snippet      TEXT
  source_type  TEXT NOT NULL           -- "google" | "reddit" | "perplexity"
  created_at   TIMESTAMP DEFAULT NOW()

heal_events
  id           SERIAL PRIMARY KEY
  collector_id TEXT NOT NULL
  description  TEXT NOT NULL           -- Failure reason passed to bdata scraper heal
  heal_type    TEXT DEFAULT "extraction" -- "network" | "extraction"
  resolution   TEXT                    -- Corrective action taken
  attempts     INTEGER DEFAULT 1       -- Cumulative heals for this collector
  duration_ms  INTEGER                 -- Heal subprocess duration
  succeeded    BOOLEAN DEFAULT TRUE
  healed_at    TIMESTAMP DEFAULT NOW()

inventory
  id             TEXT PRIMARY KEY      -- UUID
  name           TEXT NOT NULL         -- e.g. "Philips Air Purifier"
  category       TEXT NOT NULL         -- "electronics" | "appliances" | etc.
  model_number   TEXT                  -- e.g. "AC2887/63" (used for recall matching)
  purchased_year INTEGER
  created_at     TIMESTAMP DEFAULT NOW()

recall_matches
  id                 SERIAL PRIMARY KEY
  inventory_id       TEXT NOT NULL     -- References inventory.id
  recall_title       TEXT NOT NULL     -- Official recall title from CPSC/NHTSA/FDA
  recall_url         TEXT NOT NULL     -- Link to official recall notice
  confidence         REAL NOT NULL     -- rapidfuzz token_set_ratio score (0.0-1.0)
  hazard_description TEXT
  remedy             TEXT              -- Official remedy (refund, repair, replace)
  status             TEXT DEFAULT "unclaimed"
  matched_at         TIMESTAMP DEFAULT NOW()

civic_notices
  id             SERIAL PRIMARY KEY
  title          TEXT NOT NULL
  scheme_name    TEXT                  -- e.g. "PM Vidyalakshmi Scholarship"
  category       TEXT NOT NULL         -- "scholarship" | "welfare" | "civic" | "tax"
  summary        TEXT NOT NULL
  source_url     TEXT
  effective_date TIMESTAMP
  created_at     TIMESTAMP DEFAULT NOW()

users
  id            SERIAL PRIMARY KEY
  email         TEXT UNIQUE NOT NULL
  password_hash TEXT NOT NULL          -- bcrypt hash, never plaintext
  name          TEXT
  created_at    TIMESTAMP DEFAULT NOW()

notifications
  id           SERIAL PRIMARY KEY
  user_id      INTEGER                 -- References users.id (nullable for broadcast)
  title        TEXT NOT NULL
  message      TEXT NOT NULL
  type         TEXT DEFAULT "info"     -- "scrape_complete" | "alert_triggered" | "info"
  collector_id TEXT
  read         BOOLEAN DEFAULT FALSE NOT NULL
  created_at   TIMESTAMP DEFAULT NOW()

active_jobs
  job_id       TEXT PRIMARY KEY        -- e.g. "job_a3f9b12c10"
  collector_id TEXT
  url          TEXT
  status       TEXT DEFAULT "initializing"  -- "scraping" | "validating" | "healing" |
                                             -- "diffing" | "filtering" | "researching" |
                                             -- "synthesizing" | "completed"
  progress     INTEGER DEFAULT 0       -- 0-100, maps to LangGraph node milestones
  current_step TEXT DEFAULT "Initializing scraper task"
  bytes_scraped   INTEGER DEFAULT 0
  items_scraped   INTEGER DEFAULT 0
  updated_at   TIMESTAMP DEFAULT NOW()
`

### 12.3 Key Design Decisions

**snapshots.raw is JSONB:** Allows PostgreSQL JSONB path queries (e.g., aw->'sections'->'AI Processing & Model Training') to extract individual policy sections without full document deserialization.

**snapshots.text is TEXT:** Stored separately from aw for fast string equality comparison in the deduplication guard. Text comparison is O(n) on the string length; JSONB comparison would require deserialization.

**ctive_jobs has no foreign key to collectors:** It is a pure ephemeral telemetry scratch table. Records are upserted by job_id on every update_job_progress call. The absence of a foreign key allows jobs to be written before the collector is fully registered, and allows job records to be independently purged without affecting collector history.

**ecall_matches.confidence is REAL (float):** Stores the apidfuzz.token_set_ratio normalized score. Displayed in the UI as a percentage badge: green >= 90%, amber 75-89%, red < 75%.

**lerts.position_a / position_b:** Stored as separate TEXT columns rather than JSONB so they can be rendered independently in the dashboard without JSON parsing. The dual-position model ensures the user receives a balanced view rather than a single editorial stance.

---

## 13. API Layer: FastAPI Routes and Next.js Bridge

### 13.1 FastAPI Endpoints (Python, Port 8000)

| Method | Path | Description |
|---|---|---|
| GET | /health | Liveness probe. Returns agent version. |
| POST | /watch | Register + scrape a URL. Three-tier cache, collector allocation, background pipeline. Returns job_id in < 50ms. |
| POST | /run | Trigger full LangGraph pipeline for an existing collector. DB cache checked first. |
| POST | /scraper/create | Create a Scraper Studio collector via Bright Data CLI. |
| POST | /scraper/heal | Execute data scraper heal for a broken collector. |
| POST | /webhooks/brightdata | Bright Data webhook delivery. Returns 200 in < 5ms. Processing in background asyncio.Task. |
| POST | /search/unified-position | Keyword -> Google + Reddit search -> Gemini synthesis -> civic notice save. |
| GET | /snapshots/{collector_id} | Return snapshot history for a collector. |

### 13.2 Next.js API Routes (TypeScript, Port 3000)

These are the only routes with SQL access. Python calls these over HTTP.

| Path | Methods | Description |
|---|---|---|
| /api/collectors | GET, POST | List or upsert a collector record |
| /api/snapshots | GET, POST | Query snapshots by collector_id or url; insert new snapshot |
| /api/alerts | GET, POST | List alerts or insert a new alert |
| /api/sources | POST | Batch-insert research sources linked to alert_id |
| /api/heals | GET, POST | List or insert heal event telemetry |
| /api/jobs | GET, POST | Query or upsert active_jobs job progress row |
| /api/notifications | GET, POST, PATCH | List, create, or mark notifications read |
| /api/civic-notices | GET, POST | Query or insert civic notices |
| /api/inventory | GET, POST, DELETE | Manage product inventory items |
| /api/recall-matches | GET, POST | Query or insert recall matches |

### 13.3 The HTTP Bridge Pattern (storage/db.py)

`python
NEXT_API_BASE = os.getenv("NEXT_API_URL", "http://localhost:3000/api")

def post_to_nextjs(endpoint: str, payload: dict) -> dict:
    url = f"{NEXT_API_BASE}/{endpoint.lstrip('/')}"
    res = httpx.post(url, json=payload, timeout=10.0)
    return res.json()

def get_from_nextjs(endpoint: str, params: dict = {}) -> dict:
    url = f"{NEXT_API_BASE}/{endpoint.lstrip('/')}"
    res = httpx.get(url, params=params, timeout=10.0)
    return res.json()
`

Every database operation in the agent is expressed as one of these two calls. The agent cannot execute arbitrary SQL -- it can only request operations that the Next.js API routes explicitly implement. This is intentional: it constrains the attack surface and makes the agent's database interactions fully auditable from a single TypeScript codebase.

### 13.4 Webhook Handler Pattern

`python
@app.post("/webhooks/brightdata")
async def brightdata_webhook(request: Request):
    # Critical: return 200 OK IMMEDIATELY to prevent Bright Data retry storms.
    # Bright Data retries if it receives 5xx or if response takes > ~5s.
    raw_bytes = await request.body()
    query_params = dict(request.query_params)
    asyncio.create_task(_process_webhook_payload(raw_bytes, query_params))
    return {"success": True, "message": "Webhook payload received and queued"}

async def _process_webhook_payload(raw_bytes: bytes, query_params: dict):
    # 1. Gzip decompress if Content-Encoding: gzip
    if raw_bytes.startswith(b'\x1f\x8b'):
        raw_bytes = gzip.decompress(raw_bytes)

    # 2. Parse JSON body
    body = json.loads(raw_bytes.decode("utf-8", errors="replace"))

    # 3. Extract collector_id and url from query params, body, or DB lookup
    collector_id = query_params.get("collector_id") or body.get("collector_id") or ...

    # 4. Save snapshot to DB
    save_snapshot(collector_id, url, text_rep, snapshot_data)

    # 5. Update job telemetry to "completed" / 100%
    update_job_progress(job_id, status="completed", progress=100, ...)

    # 6. Send in-app notification
    save_notification("Scrape Data Delivered", f"Received {bytes_scraped} bytes for {url}")

    # NOTE: We do NOT invoke agent_graph here.
    # graph.ainvoke() -> scrape_node -> run_collector() -> Bright Data ->
    # another webhook -> another graph invocation = infinite loop.
    # The graph is ONLY triggered by /run or /watch endpoints.
`

---

## 14. Frontend Architecture

### 14.1 Route Structure

`
app/
+-- (auth)/
|   +-- login/          Email + bcrypt authentication form
|   +-- signup/         Registration form
|
+-- (dashboard)/        Protected by next-auth middleware
    +-- dashboard/      Overview: latest alerts, recall matches, civic notices, heal status
    +-- services/       Service watches list, run/watch controls, scraper telemetry,
    |                   snapshot diff viewer, snapshot key-value table
    +-- inventory/      Product inventory CRUD, recall matching engine, confidence badges
`

### 14.2 State Architecture

`
+----------------------------+      +---------------------------+
| TanStack Query v5          |      | Zustand v5                |
| (Server State Cache)       |      | (UI State)                |
|                            |      |                           |
| alerts      (staleTime 30s)|      | selectedCollectorId       |
| snapshots   (staleTime 30s)|      | activePanel               |
| heals       (staleTime 60s)|      | notificationDrawerOpen    |
| jobs        (refetch 2s)   |      | activeRun {               |
| notifications (refetch 5s) |      |   jobId,                  |
| civic-notices (stale 5min) |      |   collectorId,            |
| inventory   (staleTime 5m) |      |   targetUrl               |
|                            |      | }                         |
+----------------------------+      +---------------------------+
`

ctive_jobs is polled every 2 seconds via TanStack Query while ctiveRun is set in Zustand. The ScraperProgressLoader component maps the progress integer to a visual step indicator:

`
0%   -> Initializing
20%  -> Checking cache
40%  -> Extracting data (Bright Data running)
50%  -> Validating snapshot
55%  -> Self-healing (if triggered)
65%  -> Computing diff
75%  -> Classifying severity
85%  -> Researching web sources
95%  -> Generating action script
100% -> Complete
`

### 14.3 Visual Language: Spider-Verse Three-Zone Doctrine

| Zone | Elements | Key Implementation |
|---|---|---|
| Splash | Hero, landing page | GSAP stepped 12fps motion, halftone dot CSS overlay, misregistration ilter: blur chromatic aberration, Bangers Google Font |
| Chrome | Cards, panels, navigation | Hard offset box-shadows 6px 6px 0 var(--sv-ink), newsprint paper ackground-image: url(noise.png), yellow caption boxes |
| Work | Tables, diff viewer, forms | Inter font, high-contrast color pairs, no decorative elements for maximum information density |

### 14.4 Real-Time Progress Telemetry

The ScraperProgressLoader component polls /api/jobs?job_id=<id> every 2 seconds and renders a multi-step progress visualization. When the job reaches status="completed" or progress=100, a 4-second auto-dismiss timer fires and clears ctiveRun from Zustand state, causing the loader to unmount.

When /run or /watch returns source="database_cache", the frontend immediately transitions to the completed state with a 1.5-second dismissal, without starting any polling, since no job was enqueued.

### 14.5 Frontend Engineering Note

The frontend codebase (web/) was developed with the assistance of **Antigravity**, Google DeepMind's agentic coding assistant, which generated and iterated on the Spider-Verse visual language components, the LangGraph telemetry progress loader, the snapshot diff table with key-value section rendering, the heal events panel, and the real-time notification system. All product decisions, architectural choices, data flow design, API contracts, prompt engineering, and LangGraph pipeline design were defined and directed by the project author.

---

## 15. Key Engineering Decisions

### Decision 1: Python-as-Microservice, TypeScript-as-Schema-Owner

Giving schema ownership to exactly one runtime eliminates schema drift bugs entirely. Any migration is one command in one place. The tradeoff is HTTP latency on every database write from the agent (~2-5ms on localhost), which is acceptable given that the bottleneck is always the Bright Data scrape (30-120s).

### Decision 2: 7-Day Snapshot Cache with Deduplication Guard

Two separate guards prevent redundant Bright Data API calls:
- **Cache guard (endpoint level):** Before invoking the LangGraph graph, both /run and /watch check if a snapshot less than 7 days old exists. If yes, return immediately.
- **Dedup guard (persistence level):** save_snapshot compares incoming cleaned text against the latest stored text. Identical content is silently dropped.

Together these eliminate approximately 90% of avoidable Bright Data API credit consumption.

### Decision 3: asyncio.create_task for Webhook Handler

The Bright Data webhook has a delivery retry policy. If it receives 5xx or a response taking more than ~5 seconds, it retries delivery. A retried webhook would cause double snapshot inserts and double notifications. syncio.create_task(_process_webhook_payload(...)) ensures the endpoint returns 200 OK in under 5ms while processing continues asynchronously.

### Decision 4: sort_keys=True in Diff Serialization

Python dict key ordering is insertion-ordered (Python 3.7+), but Bright Data responses may return identical content with different key orderings across runs. json.dumps(snapshot, sort_keys=True) produces canonical output, preventing false positive diffs that would trigger unnecessary LLM classification calls and spurious alerts.

### Decision 5: At Most Two LLM Calls Per Pipeline Run

The graph topology ensures at most two Gemini calls per run: ilter_node (classification) and draft_node (generation). Both are skipped when diff.changed=False (NONE or INFO severity terminates the graph after ilter_node). The document chunking call in save_snapshot occurs once at ingestion time and the result is persisted in the aw JSONB column; subsequent runs read from DB without re-chunking.

### Decision 6: CLI Subprocess as Third-Tier Fallback

The Bright Data Python SDK is the primary interface. If the SDK call fails (network issue, auth error), the system falls back to a subprocess.run() call against the data CLI tool. This two-layer fallback means Spider-Sense degrades gracefully even if the SDK has a transient outage. The CLI fallback was implemented after observing that the SDK occasionally returned empty results for certain collector configurations that worked correctly via the CLI.

### Decision 7: Gemini Flash Over GPT-4o

gemini-3.6-flash was selected over GPT-4o for three reasons: lower per-token cost, lower latency (classification calls return in ~800ms vs ~2s), and the google-genai SDK is a synchronous client that integrates cleanly with LangGraph's synchronous node model without requiring syncio.to_thread wrappers. The quality of single-word severity classification responses was observed to be equivalent between models at a significantly lower operating cost.

---


## 16. Technology Stack

### Agent (Python 3.13)

| Package | Version | Role |
|---|---|---|
| FastAPI | 0.115.0 | REST API server, CORS middleware, request validation |
| uvicorn | 0.30.6 | ASGI server with hot-reload |
| LangGraph | 0.2.28 | StateGraph orchestration: nodes, conditional edges |
| langchain-core | 0.3.0 | LangGraph runtime dependency |
| google-genai | latest | Gemini 3.6 Flash client for classification and drafting |
| brightdata-sdk | latest | SyncBrightDataClient for Google, Reddit, Perplexity |
| rapidfuzz | 3.9.7 | token_set_ratio fuzzy matching for recall cross-referencing |
| httpx | 0.27.2 | Sync HTTP client for Next.js API bridge calls |
| requests | 2.32.3 | Sync HTTP client for Bright Data REST API calls |
| pydantic | 2.8.2 | Request/response model validation |
| python-dotenv | 1.0.1 | .env file loading |
| pytest | 8.3.2 | Unit test runner |
| pytest-asyncio | 0.23.8 | Async test support |

### Dashboard (Node.js 20+)

| Package | Version | Role |
|---|---|---|
| Next.js | 16.3.1 | App Router, server components, API routes, middleware |
| React | 19.2.8 | UI component rendering |
| Drizzle ORM | 0.45.2 | Type-safe PostgreSQL schema and query layer |
| drizzle-kit | 0.31.10 | Migration generation and schema push |
| Tailwind CSS | v4 | Utility-first styling |
| GSAP | 3.15.0 | Timeline animations, Spider-Verse stepped motion |
| Framer Motion | 13.1.0 | Spring animations, layout transitions |
| Three.js | 0.185.1 | WebGL 3D hero background canvas |
| @react-three/fiber | 9.7.0 | React reconciler for Three.js |
| TanStack Query | 5.101.4 | Server state, background polling, cache invalidation |
| Zustand | 5.0.15 | Lightweight client UI state |
| next-auth | 5.0.0-beta.32 | Session management, route protection middleware |
| jose | 6.2.9 | JWT signing and verification |
| bcryptjs | 3.0.3 | Password hashing (bcrypt, 10 rounds) |
| Fuse.js | 7.5.0 | Client-side fuzzy search |
| Radix UI | various | Accessible primitives: Dialog, Tabs, Avatar |
| Lucide React | 1.33.0 | Icon library |

---

## 17. Self-Healing Evidence and Test Verification

### Heal Command Issued Per Failure

```
npx -p @brightdata/cli bdata scraper heal COLLECTOR_ID "failure reason" --auto-approve
```

### Example Heal Event Record

```
collector_id:  c_mt4gjw4y2gom7o80b7
heal_type:     network
description:   Scrape returned None -- possible IP block, CAPTCHA, or bot detection
resolution:    Bright Data proxy rotation triggered. Scraper retrying with new residential IP.
duration_ms:   14230
attempts:      1
succeeded:     true
healed_at:     2026-08-22T14:33:11Z
```

### Running Tests

```bash
cd agent
python -m pytest tests/ -v
```

Expected output:

```
tests/test_differ.py::test_empty_snapshots PASSED
tests/test_differ.py::test_identical_snapshots_no_change PASSED
tests/test_differ.py::test_changed_snapshots_detected PASSED
tests/test_fuzzy.py::test_exact_model_match PASSED
tests/test_fuzzy.py::test_fuzzy_model_match_above_threshold PASSED
tests/test_graph_routing.py::test_heal_cap_at_one_attempt PASSED

6 passed in 0.68s
```

---

## 18. Local Development Setup

**Prerequisites:** Python 3.13, Node.js 20+, Supabase PostgreSQL, ngrok account, Bright Data account

**web/.env**

```
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:6543/postgres
NEXTAUTH_SECRET=32-character-random-string
NEXTAUTH_URL=http://localhost:3000
```

**agent/.env**

```
GEMINI_API_KEY=your-gemini-key
BRIGHTDATA_API_TOKEN=your-brightdata-token
NEXT_API_URL=http://localhost:3000/api
BRIGHTDATA_WEBHOOK_URL=https://your-ngrok-id.ngrok.io
DEFAULT_COLLECTOR_ID=your-bright-data-collector-id
```

**Database migrations**

```bash
cd web && npm install
npm run db:generate
npm run db:push
```

**Start services**

Terminal 1 -- Next.js:
```bash
cd web && npm run dev
```

Terminal 2 -- Python agent:
```bash
cd agent
.venv/Scripts/Activate.ps1
uvicorn main:app --reload --port 8000
```

Terminal 3 -- ngrok:
```bash
ngrok http 8000
```

Copy the HTTPS ngrok URL and set it as the Bright Data webhook delivery endpoint in Scraper Studio before running any scrape.

---

## 19. Repository Structure

```
friendly-neighbourhood/
+-- agent/
|   +-- main.py                FastAPI app, webhook handler, background tasks
|   +-- graph.py               LangGraph StateGraph: 7 nodes, AgentState TypedDict
|   +-- brightdata_client.py   Bright Data SDK/API wrapper, HTML stripper, LLM chunker
|   +-- storage/db.py          HTTP bridge: post_to_nextjs, get_from_nextjs
|   +-- tests/                 pytest: test_differ, test_fuzzy, test_graph_routing
|   +-- requirements.txt
+-- web/
    +-- app/
    |   +-- (auth)/login + signup
    |   +-- (dashboard)/dashboard + services + inventory
    |   +-- api/collectors + snapshots + alerts + sources + heals + jobs + notifications + civic-notices
    +-- components/
    |   +-- ScraperProgressLoader.tsx   Real-time job telemetry progress bar
    |   +-- ServicesPanel.tsx           Service watch list and run/watch controls
    |   +-- AlertsPanel.tsx             Alert cards with severity badges
    |   +-- NotificationPanel.tsx       Slide-out notification drawer
    |   +-- AddWatchForm.tsx            URL registration form
    +-- db/
    |   +-- schema.ts           All 12 Drizzle ORM table definitions
    |   +-- index.ts            PostgreSQL client singleton
    +-- lib/
    |   +-- queries.ts          Shared fetch utilities
    |   +-- store.ts            Zustand UI state store
    +-- middleware.ts            next-auth session guard for dashboard routes
    +-- drizzle.config.ts       Drizzle Kit configuration
```
