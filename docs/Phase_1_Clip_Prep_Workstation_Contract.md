# Phase 1: Clip Prep Workstation Contract

## Purpose

This document defines the product contract for Phase 1 of Speechcraft.

Phase 1 is a dedicated review and editing phase that begins after automatic segmentation and Whisper transcription have already produced candidate clips. Its purpose is to convert machine-generated candidate clips into accepted, training-ready clips for downstream fine-tuning.

The core workflow is:

`source ingest -> enhancement jobs -> smart segmentation -> Whisper transcription -> Clip Prep Workstation -> export -> fine-tuning`

Phase 1 covers only the `Clip Prep Workstation` portion of that workflow.

## Product Boundary

Phase 1 is responsible for:

- Loading a project that already contains candidate clips and initial transcripts
- Providing a clip-by-clip editing workspace
- Allowing manual transcript review and correction
- Allowing clip-level audio edits using per-clip EDL
- Allowing clip acceptance, rejection, and review tracking
- Exporting accepted clips as rendered audio plus a SoVITS-compatible `.list`

Phase 1 is not responsible for:

- Source-file ingest UX
- Denoise, dereverb, deecho, or other enhancement model execution
- Automatic segmentation logic
- Whisper ASR execution
- Feature extraction (`1-get-text.py`, `2-get-hubert-wav32k.py`, `3-get-semantic.py`)
- GPT or SoVITS training
- TTS inference or serving

Those systems may exist before or after Phase 1, but they are outside the scope of this phase.

## Phase Entry Contract

Phase 1 starts only after upstream processing has produced candidate clips.

Required inputs:

- A project record
- One or more source files already known to the project
- Candidate clips derived from those source files
- An initial transcript per candidate clip, typically produced by Whisper
- Basic clip metadata:
  `speaker`, `language`, `source_file_id`, `original_start_time`, `original_end_time`

Recommended but optional inputs:

- ASR segment timestamps
- ASR confidence or quality scores
- VAD spans used during segmentation
- Tags or flags assigned upstream

If these inputs do not exist, the Clip Prep Workstation phase has not started yet.

## Primary User Goal

The user's job in Phase 1 is:

Review each candidate clip, decide whether it belongs in the final dataset, correct the transcript and clip boundaries as needed, and produce an exportable set of accepted clips.

This phase is the manual QA and correction boundary between automated preprocessing and model fine-tuning.

## Unit of Work

The primary unit of work in Phase 1 is the clip.

Each clip is:

- Derived from a source file
- Bound to an original time range within that source file
- Edited only through per-clip EDL
- Reviewed independently
- Exported independently

Phase 1 does not introduce source-level EDL.

To future-proof the system, each clip must store provenance:

- `source_file_id`
- `original_start_time`
- `original_end_time`
- `clip_edl`

This preserves lineage without adding source-editing complexity now.

## Allowed User Actions

Within Phase 1, the user must be able to:

- Open one clip at a time in an editor
- Play, pause, seek, zoom, and scroll the waveform
- Inspect clip properties such as duration, sample rate, and channels
- Select waveform regions
- Edit the clip non-destructively through EDL
- Delete a selected region
- Insert silence at the cursor or over a selection
- Split one clip into two clips
- Merge clips when appropriate
- Edit the clip transcript
- Assign tags and review status
- Mark a clip as accepted, rejected, or needing follow-up
- Navigate quickly across clips
- Commit meaningful edits
- Export accepted clips

Phase 1 may support more actions later, but these are the required contract actions.

## Disallowed or Deferred Actions

Phase 1 should not require:

- Arbitrary source-file editing
- Multi-track audio editing
- General DAW features
- Full cross-project asset manipulation
- Running enhancement models from the clip editor
- Running ASR from the clip editor
- Training controls inside the clip editor

These should remain separate concerns.

## Editor Rules

The Clip Prep Workstation is the main UI for this phase.

Core rules:

- Editing is per-clip only
- Original source files are immutable
- Audio edits are non-destructive until render/export
- Undo/redo applies to local editing actions
- Commits capture saved milestones
- Export uses committed clip state, not transient unsaved state

The editor is the primary workspace for the phase, not a helper dialog.

## Review Status Contract

Every clip must have a review status.

Minimum required statuses:

- `candidate`
- `in_review`
- `accepted`
- `rejected`
- `needs_attention`

Optional future statuses can be added later, but these are sufficient for Phase 1.

Semantics:

- `candidate`: auto-generated and not reviewed yet
- `in_review`: currently being worked on
- `accepted`: approved for export
- `rejected`: excluded from export
- `needs_attention`: blocked by uncertainty or an unresolved issue

## Tags Contract

Tags are lightweight user-defined labels that support filtering and QA.

Examples:

- `noisy`
- `bad_transcript`
- `clipped_end`
- `breath`
- `emotion`
- `recheck`

Tags do not determine export behavior by themselves. Status determines export eligibility; tags provide information and filtering.

## Export Contract

The output of Phase 1 is a renderable, training-ready clip set.

Required export outputs:

- Rendered audio files for accepted clips
- A SoVITS-compatible `.list` manifest

The `.list` format must remain:

`wav_path|speaker_name|language|transcription_text`

Only accepted clips are included in the export by default.

Rejected clips must be excluded.

`needs_attention` clips should be excluded by default unless the user explicitly opts in later.

## Completion Criteria

Phase 1 is complete for a project when:

- Every candidate clip has reached a terminal review state
- All clips intended for training are marked `accepted`
- All accepted clips have finalized transcript text
- All accepted clips have committed EDL state
- Export succeeds and produces rendered clips plus a `.list`

This creates a clear handoff to downstream fine-tuning.

## Non-Goals

Phase 1 does not attempt to:

- Improve segmentation automatically
- Re-run Whisper or alignment inside the review phase
- Replace later feature extraction and training systems
- Act as the full Speechcraft product by itself

Its job is to convert candidate clips into trusted training data.

## One-Line Summary

Phase 1 is the dedicated manual clip review and editing phase that begins after segmentation and Whisper transcription, and ends with accepted, exportable clips ready for fine-tuning.
