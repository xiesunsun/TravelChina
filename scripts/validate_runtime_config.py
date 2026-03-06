#!/usr/bin/env python3
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import ConfigValidationError, settings  # noqa: E402
from app.services.ai_service import AIService, QuestionContext  # noqa: E402


def _env_flag(name: str, default: str = "0") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def main() -> int:
    require_oss = _env_flag("RUNTIME_VALIDATE_REQUIRE_OSS", "0")
    require_llm_key = _env_flag("RUNTIME_VALIDATE_REQUIRE_LLM_KEY", "0")
    enable_live_probe = _env_flag(
        "RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE",
        os.getenv("AI_EVAL_ENABLE_LIVE", "0"),
    )

    print(
        "[runtime-config] mode"
        f" require_oss={int(require_oss)}"
        f" require_llm_key={int(require_llm_key)}"
        f" live_probe={int(enable_live_probe)}"
    )

    errors: list[str] = []
    warnings: list[str] = []

    try:
        settings.validate_oss_configuration(require_all=require_oss)
        print("[runtime-config] OSS validation passed")
    except ConfigValidationError as exc:
        errors.extend([f"OSS: {item}" for item in exc.errors])

    try:
        settings.validate_llm_configuration(require_api_key=require_llm_key)
        print("[runtime-config] LLM key validation passed")
    except ConfigValidationError as exc:
        errors.extend([f"LLM: {item}" for item in exc.errors])

    if not settings.has_gemini_api_key() and not require_llm_key:
        warnings.append("LLM: GEMINI_API_KEY is not set; AI endpoints will use fallback response.")

    offline_output = AIService.generate_guidance(
        QuestionContext(step="location", region="浙江省"),
        use_live_client=False,
    )
    if offline_output != AIService.MISSING_CONFIG_MESSAGE:
        errors.append(
            "LLM: offline deterministic path is unexpected; "
            f"expected '{AIService.MISSING_CONFIG_MESSAGE}', got '{offline_output}'"
        )
    else:
        print("[runtime-config] LLM offline deterministic fallback passed")

    if enable_live_probe:
        ok, detail = AIService.probe_live_client()
        if ok:
            print(f"[runtime-config] LLM live probe passed ({detail})")
        else:
            errors.append(f"LLM: live probe failed ({detail})")

    for warning in warnings:
        print(f"[runtime-config] WARN: {warning}")

    if errors:
        for item in errors:
            print(f"[runtime-config] ERROR: {item}")
        print("[runtime-config] FAILED")
        return 1

    print("[runtime-config] PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
