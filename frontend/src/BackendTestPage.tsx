import { useMemo, useState } from "react";
import {
  API_BASE,
  appendClipEdlOperationStrict,
  commitClipStrict,
  fetchClipCommitsStrict,
  fetchExportPreviewStrict,
  fetchProjectExportsStrict,
  fetchHealthStrict,
  fetchProjectDetailStrict,
  fetchWaveformPeaksStrict,
  mergeWithNextClipStrict,
  redoClipStrict,
  runProjectExportStrict,
  splitClipStrict,
  undoClipStrict,
  updateClipStatusStrict,
  updateClipTagsStrict,
  updateClipTranscriptStrict,
} from "./api";
import type { ProjectDetail } from "./types";

type LogEntry = {
  step: string;
  status: "idle" | "running" | "ok" | "error";
  detail: string;
};

const demoProjectId = "phase1-demo";

function formatResult(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function BackendTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);

  const activeClipId = useMemo(() => {
    return projectDetail?.clips[0]?.id ?? "clip-001";
  }, [projectDetail]);

  function pushLog(step: string, status: LogEntry["status"], detail: string) {
    setLogs((current) => [...current, { step, status, detail }]);
  }

  async function runFullBackendTest() {
    setIsRunning(true);
    setLogs([]);

    try {
      pushLog("Health Check", "running", "Requesting /healthz");
      const health = await fetchHealthStrict();
      pushLog("Health Check", "ok", formatResult(health));

      pushLog("Project Load", "running", `Requesting /api/projects/${demoProjectId}`);
      const detail = await fetchProjectDetailStrict(demoProjectId);
      setProjectDetail(detail);
      pushLog("Project Load", "ok", formatResult(detail));

      const clipId = detail.clips[0]?.id ?? "clip-001";

      pushLog("Status Update", "running", `Setting ${clipId} to in_review`);
      const statusResult = await updateClipStatusStrict(clipId, "in_review");
      pushLog("Status Update", "ok", formatResult(statusResult));

      const transcriptSuffix = `[backend-test ${new Date().toLocaleTimeString()}]`;
      pushLog("Transcript Update", "running", `Appending test marker to ${clipId}`);
      const transcriptResult = await updateClipTranscriptStrict(
        clipId,
        `${statusResult.transcript.text_current} ${transcriptSuffix}`.trim(),
      );
      pushLog("Transcript Update", "ok", formatResult(transcriptResult));

      pushLog("Tag Update", "running", `Saving backend-test tags on ${clipId}`);
      const tagResult = await updateClipTagsStrict(clipId, [
        { name: "backend-test", color: "#2f6c8f" },
        { name: "qa", color: "#8a7a3d" },
      ]);
      pushLog("Tag Update", "ok", formatResult(tagResult));

      pushLog("EDL Append", "running", `Appending insert_silence to ${clipId}`);
      const edlResult = await appendClipEdlOperationStrict(clipId, {
        op: "insert_silence",
        duration_seconds: 0.15,
      });
      pushLog("EDL Append", "ok", formatResult(edlResult));

      pushLog("Waveform Peaks", "running", `Requesting waveform peaks for ${clipId}`);
      const waveform = await fetchWaveformPeaksStrict(clipId, 48);
      pushLog("Waveform Peaks", "ok", formatResult(waveform));

      pushLog("Undo", "running", `Undoing the last edit for ${clipId}`);
      const undoResult = await undoClipStrict(clipId);
      pushLog("Undo", "ok", formatResult(undoResult));

      pushLog("Redo", "running", `Redoing the last edit for ${clipId}`);
      const redoResult = await redoClipStrict(clipId);
      pushLog("Redo", "ok", formatResult(redoResult));

      pushLog("Commit Clip", "running", `Creating commit for ${clipId}`);
      const commitResult = await commitClipStrict(clipId, "Backend test route commit");
      pushLog("Commit Clip", "ok", formatResult(commitResult));

      pushLog("Commit History", "running", `Fetching commits for ${clipId}`);
      const commits = await fetchClipCommitsStrict(clipId);
      pushLog("Commit History", "ok", formatResult(commits));

      pushLog("Split Clip", "running", `Splitting ${clipId}`);
      const splitPoint = Math.max(
        Number((edlResult.duration_seconds / 2).toFixed(2)),
        0.1,
      );
      const splitResult = await splitClipStrict(clipId, splitPoint);
      pushLog("Split Clip", "ok", formatResult(splitResult));

      const mergeCandidate = splitResult.created_clip_ids[0];
      pushLog("Merge Next Clip", "running", `Merging ${mergeCandidate} with the next active clip`);
      const mergeResult = await mergeWithNextClipStrict(mergeCandidate);
      pushLog("Merge Next Clip", "ok", formatResult(mergeResult));

      pushLog("Export Preview", "running", `Requesting export preview for ${demoProjectId}`);
      const exportPreview = await fetchExportPreviewStrict(demoProjectId);
      pushLog("Export Preview", "ok", formatResult(exportPreview));

      pushLog("Run Export", "running", `Rendering export for ${demoProjectId}`);
      const exportRun = await runProjectExportStrict(demoProjectId);
      pushLog("Run Export", "ok", formatResult(exportRun));

      pushLog("Export Runs", "running", `Fetching export runs for ${demoProjectId}`);
      const exportRuns = await fetchProjectExportsStrict(demoProjectId);
      pushLog("Export Runs", "ok", formatResult(exportRuns));

      const refreshedDetail = await fetchProjectDetailStrict(demoProjectId);
      setProjectDetail(refreshedDetail);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown backend test failure";
      pushLog("Backend Test", "error", message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Speechcraft</p>
          <h1>Backend Test Route</h1>
        </div>
        <div className="topbar-actions">
          <a className="status-pill route-link" href="/">
            Back To Workstation
          </a>
          <button className="primary-button" type="button" onClick={runFullBackendTest} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Full Backend Test"}
          </button>
        </div>
      </header>

      <main className="backend-test-layout">
        <section className="panel backend-test-summary">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Target</p>
              <h2>Live Backend</h2>
            </div>
          </div>
          <p className="muted-copy">
            This route calls the real backend only. No local fallback data is used here.
          </p>
          <dl className="backend-test-meta">
            <div>
              <dt>API Base</dt>
              <dd>{API_BASE}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>{demoProjectId}</dd>
            </div>
            <div>
              <dt>Primary Clip</dt>
              <dd>{activeClipId}</dd>
            </div>
          </dl>
        </section>

        <section className="panel backend-test-log">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Execution Log</p>
              <h2>API Coverage</h2>
            </div>
          </div>

          <div className="test-log-list">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <article key={`${log.step}-${index}`} className={`test-log-card log-${log.status}`}>
                  <div className="test-log-header">
                    <strong>{log.step}</strong>
                    <span>{log.status}</span>
                  </div>
                  <pre>{log.detail}</pre>
                </article>
              ))
            ) : (
              <div className="empty-state">Run the test to exercise the current backend surface.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
