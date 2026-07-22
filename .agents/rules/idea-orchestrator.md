---
trigger: always_on
description: Automatically process raw feature ideas through the SDD pipeline (Input Ide -> grill-me -> to-spec -> to-ticket -> implement -> code-review -> Output).
---

## Idea Orchestrator Rule

Whenever the user presents a raw feature idea, product concept, or high-level enhancement request:

1. **Activate Pipeline**: Process the idea through the 6-stage Spec-Driven Development pipeline:
   **Input Ide** ➔ **`grill-me`** ➔ **`to-spec`** ➔ **`to-ticket`** ➔ **`implement`** ➔ **`code-review`** ➔ **Output**

2. **Phase Execution Rules**:
   - **`grill-me`**: Interview the user first to clarify scope, trade-offs, tech choices, and edge cases.
   - **`to-spec`**: Synthesize answers into a technical specification document before writing code.
   - **`to-ticket`**: Break the spec down into actionable, sequential tasks with verification criteria.
   - **`implement`**: Build and empirically verify each ticket with automated tests.
   - **`code-review`**: Perform a spec-aligned review of all code diffs.
   - **Output**: Present the completed feature summary, modified files, and verification evidence.

3. **No Direct Code Generation**: Never jump directly to implementation without passing through `grill-me` and `to-spec` alignment first.
