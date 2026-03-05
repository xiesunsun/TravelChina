# Scenario: Records CRUD Smoke

## Preconditions
- Backend dependencies are installable.
- Test database can be created locally.

## Steps
1. Create a record via `POST /api/v1/records/`.
2. Verify it appears in `GET /api/v1/records/`.
3. Update it via `PUT /api/v1/records/{id}`.
4. Delete it via `DELETE /api/v1/records/{id}`.
5. Verify it no longer appears in list.

## Expected
- Each API call returns success status.
- Response schema remains stable for frontend adapter.
