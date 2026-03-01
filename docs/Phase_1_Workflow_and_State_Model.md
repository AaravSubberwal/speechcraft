# Phase 1 Workflow and State Model

## Purpose

This document defines how Phase 1 fits into the larger preprocessing workflow and describes the object and workflow state transitions that the app must support.

Phase 1 is a distinct product phase, but it depends on upstream systems and produces inputs for downstream fine-tuning.

## End-to-End Workflow Context

The full preprocessing path is:

`source ingest -> enhancement jobs -> smart segmentation -> Whisper transcription -> Clip Prep Workstation -> export -> fine-tuning`

Phase 1 begins only after:

- Smart segmentation has created candidate clip boundaries
- Whisper has produced initial transcripts for those candidate clips

Phase 1 ends when:

- Accepted clips are exported as rendered files plus a `.list`

## Core Workflow Model

The practical user flow in Phase 1 is:

1. Open a project with candidate clips
2. Enter the clip review queue
3. Inspect each candidate clip
4. Correct transcript and audio issues
5. Mark the clip as accepted, rejected, or needing attention
6. Continue until the queue is resolved
7. Export accepted clips
8. Hand off to fine-tuning

This turns machine-generated candidates into trusted training data.

## Object Lifecycle

There are three key object tiers relevant to this phase:

1. `SourceFile`
2. `CandidateClip`
3. `Clip`

For Phase 1, `CandidateClip` and `Clip` may be implemented as one logical object with status-driven behavior, but the conceptual distinction matters:

- A `CandidateClip` is auto-generated and not yet trusted
- A `Clip` is the accepted unit of manual review and export

The system should preserve enough structure to distinguish auto-generated proposals from human-approved results.

## Source File State

Source files are not edited in Phase 1.

A source file moves through these external states:

- `available`
- `processed_upstream`
- `used_for_candidates`

Within Phase 1, source files act as provenance anchors only.

They remain immutable.

## Candidate Clip State Machine

Every candidate clip enters Phase 1 in:

- `candidate`

From there, it may move through:

- `in_review`
- `accepted`
- `rejected`
- `needs_attention`

Allowed transitions:

- `candidate -> in_review`
- `candidate -> accepted`
- `candidate -> rejected`
- `candidate -> needs_attention`
- `in_review -> accepted`
- `in_review -> rejected`
- `in_review -> needs_attention`
- `needs_attention -> in_review`
- `accepted -> in_review`

The last transition matters because users may discover issues after initially accepting a clip.

`rejected` should also be reversible:

- `rejected -> in_review`

This keeps the system forgiving during manual QA.

## Editing State Versus Review State

Review state and editing state are separate concerns.

Review state answers:

- Is this clip approved for training?

Editing state answers:

- Does this clip have unsaved local changes?
- Does this clip have committed changes?

Minimum editing states:

- `clean`
- `dirty`
- `committed`

Interpretation:

- `clean`: no uncommitted changes since last commit
- `dirty`: local edits exist
- `committed`: the latest meaningful state has been saved as a milestone

The app should not collapse review status and edit status into one field.

## Split and Merge Behavior

Phase 1 includes split and merge actions, so the workflow must define state results.

### Split

When a clip is split:

- The original clip should no longer remain a single active export unit
- Two new child clips are created
- Each child clip inherits provenance from the same `source_file_id`
- Each child clip gets its own `original_start_time` and `original_end_time`
- Each child clip gets its own `clip_edl`
- Each child clip starts in `in_review`

The original clip may be:

- archived as superseded

This is better than hard deletion because it preserves history.

### Merge

When clips are merged:

- A new merged clip is created
- The original clips are marked superseded or inactive
- The merged clip starts in `in_review`
- The merged clip is not auto-accepted

This ensures the user validates the result after the merge.

## Editor Entry Rules

A user enters the Clip Prep Workstation on any clip whose status is:

- `candidate`
- `in_review`
- `needs_attention`
- `accepted`
- `rejected`

But the default queue should prioritize:

1. `candidate`
2. `needs_attention`
3. `in_review`

This keeps unresolved work at the top.

## Export Eligibility Rules

A clip is export-eligible when:

- Review status is `accepted`
- There are no uncommitted edits
- Required metadata is present:
  `speaker`, `language`, transcript text

A clip is not export-eligible when:

- Review status is `candidate`
- Review status is `in_review`
- Review status is `rejected`
- Review status is `needs_attention`
- The clip has unsaved edits

This keeps export deterministic.

## Export State Machine

Export is a project-level operation.

Project export states:

- `not_exported`
- `export_in_progress`
- `export_succeeded`
- `export_failed`

If the project changes after a successful export, the project should return to:

- `not_exported`

That makes it clear the current export is now stale.

## Upstream and Downstream Contracts

### Upstream Contract

Phase 1 assumes upstream systems provide:

- Candidate clips
- Initial transcripts
- Provenance to source assets

Phase 1 should not need to know how enhancement, VAD, or Whisper were implemented internally.

### Downstream Contract

Downstream fine-tuning assumes Phase 1 provides:

- A final exported clip set
- Rendered audio for accepted clips
- A `.list` manifest with trusted text

Downstream systems should consume only exported artifacts, not in-progress review state.

## Failure and Recovery Rules

Phase 1 must support recovery from interruptions.

Minimum rules:

- Unsaved local edits are scoped clearly and should not be silently lost
- Committed clip states must survive app restarts
- Project review status must persist
- Export failures must not corrupt prior successful exports

The project should always be able to reopen into a consistent state.

## One-Line Summary

Phase 1 is the stateful manual QA boundary where candidate clips move from auto-generated review items into accepted, exportable training data.
