# Security Notes

## Current Risks
- JWT secret is still using a development default if env is not set.
- Frontend currently bootstraps a local account automatically (needs proper login UX).
- OSS and AI credentials handling is environment-based and not fully hardened.

## V0 Mitigations
- Keep secrets in `.env` and out of git.
- Fail fast with explicit config validation for OSS upload path.
- Records API now requires JWT bearer token and rejects anonymous requests.

## Follow-up
Replace default JWT secret in all environments and add explicit startup guard.
