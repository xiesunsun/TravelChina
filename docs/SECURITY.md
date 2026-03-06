# Security Notes

## Current Risks
- JWT secret is still using a development default if env is not set.
- Frontend token is stored in localStorage (XSS 风险面需要持续控制).
- OSS and AI credentials handling is environment-based and not fully hardened.

## V0 Mitigations
- Keep secrets in `.env` and out of git.
- Fail fast with explicit config validation for OSS upload path.
- Records API now requires JWT bearer token and rejects anonymous requests.
- Frontend switched to explicit login/register flow; removed auto account bootstrap.
- Backend adds startup guard: production/staging must not use default JWT secret.

## Follow-up
Rotate JWT secret per environment and migrate token storage to httpOnly cookie session model.
