#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.services.ai_service import AIService, QuestionContext  # noqa: E402


def run_case(case: dict) -> dict:
    case_id = case.get("case_id", "unknown")
    payload = case.get("input", {})
    question_type = payload.get("type")
    context = payload.get("context", {})
    expected = case.get("expected", {})

    ctx = QuestionContext(step=question_type or "location", **context)
    output = AIService.generate_guidance(ctx)

    checks = {}
    checks["non_empty"] = bool(isinstance(output, str) and output.strip())

    passed = True
    if expected.get("non_empty"):
        passed = passed and checks["non_empty"]

    return {
        "case_id": case_id,
        "passed": passed,
        "expected": expected,
        "checks": checks,
        "output_preview": output[:120] if isinstance(output, str) else str(output),
    }


def main() -> int:
    eval_file = ROOT / "harness" / "evals" / "ai_fallback_eval.jsonl"
    report_file = ROOT / "harness" / "reports" / "ai_eval_report.json"

    cases = []
    with eval_file.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            cases.append(json.loads(line))

    results = [run_case(case) for case in cases]
    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
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

    print(f"[ai-eval] total={len(results)} passed={passed} failed={failed}")
    print(f"[ai-eval] report={report_file}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
