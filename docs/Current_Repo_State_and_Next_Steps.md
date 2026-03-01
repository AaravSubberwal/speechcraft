# Current Repo State And Next Steps

## Purpose

This document describes the current state of the repository after the initial planning and scaffolding work for Speechcraft.

Speechcraft is a browser-first workstation for preparing speech clips for voice model fine-tuning.

The long-term product direction is broader, but the repo is currently focused on the first usable product phase:

`smart segmentation + Whisper -> Clip Prep Workstation -> export -> fine-tuning`

Within that flow, this repository currently implements the `Clip Prep Workstation` side.

## What The Repo Contains Today

The current repository is a Phase 1 scaffold with real working interactions.

### Backend

The backend lives in `backend/` and is a FastAPI app with a file-backed demo repository.

Current backend capabilities:

- Project loading
- Clip listing and project stats
- Clip status updates
- Transcript updates
- Tag updates
- Per-clip EDL append operations
- Clip commit history
- Undo / redo for local clip edits
- Clip split
- Merge with next clip
- Waveform peak generation
- Clip audio serving
- Export preview
- Real export runs that render accepted committed clips plus a `.list`
- Persistent demo state in `backend/data/phase1-demo.json`

Current backend export output:

- Rendered clips are written under `backend/exports/<project_id>/<export_id>/rendered/`
- The manifest is written to `backend/exports/<project_id>/<export_id>/dataset.list`

Important implementation note:

- The backend currently uses deterministic synthetic clip rendering for audio and waveform output.
- It does not yet rebuild clips from true source audio plus FFmpeg/EDL.

### Frontend

The frontend lives in `frontend/` and is a React + Vite app.

Current frontend capabilities:

- Clip review queue
- Queue prioritization by unresolved review state
- Search and tag filtering
- Hide resolved clips
- Jump to next unresolved clip
- Transcript editing
- Tag editing
- Status changes
- Waveform display from backend peaks
- Real audio playback from the backend clip audio route
- Play / pause / seek
- Waveform selection
- Selection handles
- Waveform zoom
- Waveform horizontal scroll
- Delete selection
- Insert silence
- Split clip
- Merge next clip
- Undo / redo
- Commit clip snapshots
- Export preview
- Run export
- Export run history
- Backend integration test route at `/backend-test`

## Decisions Locked During Planning

The following product decisions were established during the planning conversation and are reflected in the code and docs:

- The long-term product is the useful subset of the SoVITS workflow, rebuilt with better UX.
- The current product scope is only the clip-preparation stage, not training or inference.
- Phase 1 starts after upstream segmentation and Whisper transcription.
- The main unit of work is the clip.
- Source audio is immutable.
- Derived assets preserve lineage.
- Per-clip EDL is the editing model for now.
- Clip provenance must include:
  - `source_file_id`
  - `original_start_time`
  - `original_end_time`
  - `clip_edl`
- The Phase 1 output is:
  - rendered accepted clips
  - a SoVITS-compatible `.list`

## What Has Been Completed In This Conversation

The conversation so far produced:

- The Phase 1 product contract
- The Phase 1 workflow/state model
- The Phase 1 data model
- The backend application scaffold
- The frontend application scaffold
- File-backed local persistence
- Commit history
- Undo / redo
- Export preview
- Export runs
- Split / merge support
- Real backend-served waveform and audio endpoints
- A usable Phase 1 workstation UI
- A strict backend test route for integration checks
- Basic DX documentation and startup instructions

## What Is Still Missing Inside Phase 1

The current repo is usable as a scaffold, but a few things are still intentionally demo-grade.

### Still Missing For A Fully Real Phase 1

- Source-backed audio rendering from real input files instead of synthetic audio generation
- True EDL render reconstruction against source assets
- Waveform peaks derived from source/rendered audio files instead of generated synthetic peaks
- Stronger transcript-aware split and merge based on timestamps or token boundaries
- More advanced clip QA workflows:
  - bulk actions
  - richer filtering and sorting
  - keyboard shortcuts
- More robust project persistence beyond the single demo-state JSON shape
- Dedicated job orchestration for background render / peak tasks

### Still Missing If We Want To Go Beyond Phase 1

- Source ingest UX
- Denoise / dereverb / deecho jobs
- Smart segmentation
- Whisper / ASR execution
- Alignment-aware transcript tooling
- Feature extraction
- Fine-tuning orchestration
- Inference / serving

## Recommended Next Build Order

If continuing from the current repo, the most valuable next additions are:

1. Replace synthetic audio rendering with source-backed FFmpeg rendering.
2. Introduce real source assets and project import, so exports are built from true upstream inputs.
3. Add keyboard-first review ergonomics for fast dataset cleanup.
4. Add a lightweight job layer for render and waveform generation.
5. Start the next product phase: upstream preprocessing (denoise, segmentation, ASR).

## Current Limits

This repository is currently best understood as:

- a serious product scaffold
- a working Phase 1 demo
- not yet a full production audio pipeline

It already captures the correct architecture and workflow shape, but the audio path is still simulated until real project assets and rendering are added.
