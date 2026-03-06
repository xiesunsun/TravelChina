#!/usr/bin/env python3
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.services.ai_service import AIService, QuestionContext  # noqa: E402


def _contains_all(text: str, tokens: list[str]) -> bool:
    return all(token in text for token in tokens)


def _contains_none(text: str, tokens: list[str]) -> bool:
    return all(token not in text for token in tokens)


def run_case(case: dict[str, Any], run_live: bool) -> dict[str, Any]:
    case_id = case.get("case_id", "unknown")
    payload = case.get("input", {})
    expected = case.get("expected", {})

    context = payload.get("context", {})
    question_type = payload.get("type")
    ctx = QuestionContext(step=question_type or "location", **context)

    prompt = AIService.build_guidance_prompt(ctx)
    offline_output = AIService.generate_guidance(ctx, use_live_client=False)

    checks: dict[str, Any] = {
        "prompt_non_empty": bool(prompt.strip()),
        "offline_non_empty": bool(isinstance(offline_output, str) and offline_output.strip()),
    }

    contains_all = expected.get("prompt_contains_all", [])
    if contains_all:
        checks["prompt_contains_all"] = _contains_all(prompt, contains_all)

    contains_none = expected.get("prompt_contains_none", [])
    if contains_none:
        checks["prompt_contains_none"] = _contains_none(prompt, contains_none)

    offline_equals = expected.get("offline_response")
    if isinstance(offline_equals, str):
        checks["offline_response_exact"] = offline_output == offline_equals

    live_output = None
    if run_live:
        live_output = AIService.generate_guidance(ctx, use_live_client=True)
        checks["live_non_empty"] = bool(isinstance(live_output, str) and live_output.strip())
        checks["live_not_missing_config"] = live_output != AIService.MISSING_CONFIG_MESSAGE

    passed = all(bool(value) for value in checks.values())

    return {
        "case_id": case_id,
        "passed": passed,
        "checks": checks,
        "input": payload,
        "preview": {
            "prompt": prompt[:120],
            "offline_output": offline_output[:120]
            if isinstance(offline_output, str)
            else str(offline_output),
            "live_output": (live_output[:120] if isinstance(live_output, str) else None),
        },
    }


def main() -> int:
    eval_file = ROOT / "harness" / "evals" / "ai_fallback_eval.jsonl"
    report_file = ROOT / "harness" / "reports" / "ai_eval_report.json"

    run_live = os.getenv("AI_EVAL_ENABLE_LIVE", "0") == "1"
    live_probe_result: dict[str, Any] | None = None
    if run_live:
        ok, detail = AIService.probe_live_client()
        live_probe_result = {"enabled": True, "passed": ok, "detail": detail}
    else:
        live_probe_result = {"enabled": False, "passed": True, "detail": "disabled"}

    cases = []
    with eval_file.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            cases.append(json.loads(line))

    results = [run_case(case, run_live=run_live) for case in cases]
    passed = sum(1 for item in results if item["passed"])
    failed = len(results) - passed

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "live+offline" if run_live else "offline-only",
        "live_probe": live_probe_result,
        "summary": {
            "total": len(results),
            "passed": passed,
            "failed": failed,
            "score": round(passed / len(results), 4) if results else 1.0,
        },
        "results": results,
    }

    report_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        f"[ai-eval] mode={report['mode']} total={len(results)} "
        f"passed={passed} failed={failed} live_probe={live_probe_result}"
    )
    print(f"[ai-eval] report={report_file}")

    return 1 if failed or not live_probe_result["passed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
