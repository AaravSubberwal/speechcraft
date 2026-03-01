# Phase 1 Data Model

## Purpose

This document defines a practical data model for Phase 1 of Speechcraft.

The goal is to support the Clip Prep Workstation cleanly now while preserving provenance and leaving room for later phases without introducing unnecessary complexity.

This is a logical model, not a final database schema.

## Design Principles

The Phase 1 data model must satisfy these rules:

- Original source audio is immutable
- Derived assets preserve lineage
- Clip editing is per-clip only
- Each clip preserves source provenance
- Export is reproducible from committed state
- The model can grow later without requiring a rewrite of core clip lineage

## Core Entities

Phase 1 needs these core entities:

- `Project`
- `SourceFile`
- `DerivedAsset`
- `Clip`
- `ClipCommit`
- `Transcript`
- `Tag`
- `ClipTag`
- `ExportRun`

Optional support entities that may be useful early:

- `Job`
- `ProjectSetting`

## Project

`Project` is the top-level container for all work.

Suggested fields:

- `id`
- `name`
- `root_path`
- `created_at`
- `updated_at`
- `active_export_id`
- `status`

Suggested project statuses:

- `active`
- `archived`

Responsibilities:

- Owns source files, derived assets, clips, and exports
- Defines the workspace boundary
- Provides the context for review progress and export

## SourceFile

`SourceFile` represents an immutable original source recording.

Suggested fields:

- `id`
- `project_id`
- `path`
- `display_name`
- `sample_rate`
- `channels`
- `duration_seconds`
- `hash`
- `created_at`

Rules:

- Never modified in place by the app
- Serves as the provenance anchor for all downstream clip work

## DerivedAsset

`DerivedAsset` represents an audio file produced from another asset.

This covers:

- denoised outputs
- dereverbed outputs
- deechoed outputs
- any other upstream enhancement output
- optionally rendered intermediate assets later

Suggested fields:

- `id`
- `project_id`
- `kind`
- `path`
- `parent_asset_type`
- `parent_asset_id`
- `created_by_job_id`
- `created_at`
- `sample_rate`
- `channels`
- `duration_seconds`
- `hash`

Suggested `kind` values:

- `denoised`
- `dereverbed`
- `deechoed`
- `working_source`
- `other`

Lineage rule:

- Every derived asset must point back to exactly one parent asset

This keeps provenance explicit and allows later audit or rebuilding.

## Clip

`Clip` is the primary unit of work in Phase 1.

This entity must support both current needs and future-proof provenance.

Suggested fields:

- `id`
- `project_id`
- `source_file_id`
- `working_asset_type`
- `working_asset_id`
- `original_start_time`
- `original_end_time`
- `clip_edl`
- `review_status`
- `edit_state`
- `speaker_name`
- `language`
- `is_superseded`
- `superseded_by_clip_id`
- `created_at`
- `updated_at`

Required provenance fields:

- `source_file_id`
- `original_start_time`
- `original_end_time`
- `clip_edl`

Interpretation:

- `source_file_id`: the immutable original source
- `working_asset_id`: the current upstream asset this clip was cut from
- `original_start_time` and `original_end_time`: source-relative boundaries
- `clip_edl`: non-destructive per-clip edit recipe

Suggested `review_status` values:

- `candidate`
- `in_review`
- `accepted`
- `rejected`
- `needs_attention`

Suggested `edit_state` values:

- `clean`
- `dirty`
- `committed`

### About `clip_edl`

`clip_edl` should be stored as structured data, not opaque text.

Logical operations may include:

- `keep_range`
- `delete_range`
- `insert_silence`

That is enough for Phase 1.

The EDL should describe the clip's current state relative to the clip's original region, not relative to the whole source file.

## ClipCommit

`ClipCommit` stores durable milestones for a clip.

This separates meaningful saved states from transient local edits.

Suggested fields:

- `id`
- `clip_id`
- `parent_commit_id`
- `message`
- `clip_edl_snapshot`
- `transcript_snapshot`
- `review_status_snapshot`
- `created_at`

Rules:

- Commits are append-only
- Export should use the latest commit, not in-progress dirty state
- Commits must be reversible or loadable for comparison later

This does not need to become a full Git-like system.

## Transcript

`Transcript` stores the current text associated with a clip.

Suggested fields:

- `id`
- `clip_id`
- `text_current`
- `text_initial`
- `source`
- `confidence`
- `updated_at`

Suggested `source` values:

- `whisper`
- `manual`
- `mixed`

Rules:

- `text_initial` preserves the first machine-generated transcript
- `text_current` is what the user is editing toward export

This gives you a clean comparison point during review.

## Tag

`Tag` defines a user-visible label available within a project.

Suggested fields:

- `id`
- `project_id`
- `name`
- `color`
- `created_at`

Tags should be project-scoped for simplicity.

## ClipTag

`ClipTag` links tags to clips.

Suggested fields:

- `clip_id`
- `tag_id`

This keeps tagging flexible without hardcoding many boolean fields on `Clip`.

## ExportRun

`ExportRun` represents one export attempt for a project.

Suggested fields:

- `id`
- `project_id`
- `status`
- `output_root`
- `manifest_path`
- `accepted_clip_count`
- `failed_clip_count`
- `created_at`
- `completed_at`

Suggested `status` values:

- `queued`
- `running`
- `succeeded`
- `failed`

Rules:

- Exports are immutable records
- A new export creates a new `ExportRun`
- Prior successful exports should remain inspectable even after later changes

## Job

`Job` is optional but useful even in Phase 1 because rendering and precomputation are background work.

Suggested fields:

- `id`
- `project_id`
- `kind`
- `status`
- `payload`
- `result`
- `created_at`
- `started_at`
- `completed_at`

Relevant Phase 1 job kinds:

- `generate_peaks`
- `render_clip`
- `export_project`

Upstream phases may later add:

- `denoise`
- `dereverb`
- `deecho`
- `segment`
- `transcribe`

## Relationships

The most important logical relationships are:

- A `Project` has many `SourceFile`
- A `Project` has many `DerivedAsset`
- A `Project` has many `Clip`
- A `SourceFile` has many `Clip`
- A `Clip` has one current `Transcript`
- A `Clip` has many `ClipCommit`
- A `Clip` has many `Tag` through `ClipTag`
- A `Project` has many `ExportRun`

## Future-Proofing Without Extra Complexity

This model is intentionally ready for later phases without implementing them now.

The main future-proof choices are:

- `source_file_id` on `Clip`
- source-relative `original_start_time` and `original_end_time`
- explicit `working_asset_id`
- append-only `ClipCommit`
- lineage on `DerivedAsset`

These let later phases add:

- smarter upstream re-segmentation
- source-level rebuilds
- session-level editing
- richer audit trails

Without forcing Phase 1 to implement those features now.

## One-Line Summary

The Phase 1 data model treats each clip as a provenance-preserving, per-clip-editable unit derived from immutable source audio and rendered into reproducible export artifacts.
