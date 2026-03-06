# Scenario: Auth Input Validation and Error Messaging

## Preconditions
- Frontend and backend are running with `/api/v1/auth/*` endpoints enabled.
- Auth form is reachable from `/#/list`.

## Steps
1. Open auth screen.
2. Fill username `root` and password `root`.
3. Click `注册并登录`.
4. Observe validation behavior and request trace.
5. Fill legal credentials (username length 3~50, password length 6~128) and click `注册并登录`.

## Expected
- Short password is blocked by frontend before network request is sent.
- UI shows readable validation message for short password.
- Backend still rejects illegal auth payloads with `422` if called directly.
- Legal input can complete register+login flow successfully.
