# Scenario: Records CRUD Smoke

## Preconditions
- Backend dependencies are installable.
- Test database can be created locally.

## Steps
1. Register/login via `/api/v1/auth/*` to obtain JWT bearer token.
2. Create a record via `POST /api/v1/records/`.
3. Verify it appears in `GET /api/v1/records/`.
4. Update it via `PUT /api/v1/records/{id}`.
5. Delete it via `DELETE /api/v1/records/{id}`.
6. Verify it no longer appears in list.

## Expected
- Each API call returns success status.
- Response schema remains stable for frontend adapter.
