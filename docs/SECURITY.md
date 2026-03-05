# Security Notes

## Current Risks
- Records endpoint currently uses a fake user identity stub.
- OSS and AI credentials handling is environment-based and not fully hardened.
- No auth middleware gate on write operations.

## V0 Mitigations
- Keep secrets in `.env` and out of git.
- Fail fast with explicit config validation for OSS upload path.
- Track auth hardening as a required follow-up before public deployment.

## Follow-up
Implement JWT auth and replace fake user dependency in records endpoints.
