import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const AUTH_USERNAME_KEY = 'huixing_auth_username';
const AUTH_PASSWORD_KEY = 'huixing_auth_password';
const AUTH_TOKEN_KEY = 'huixing_auth_token';

async function loginWith(request: any, username: string, password: string): Promise<string> {
  const register = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { username, password },
  });
  expect([201, 409]).toContain(register.status());

  const login = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username, password },
  });
  expect(login.ok()).toBeTruthy();
  const data = await login.json();
  return data.access_token as string;
}

test('smoke: create -> list -> delete record', async ({ page, request }) => {
  const suffix = `${Date.now()}`;
  const city = `E2E杭州${suffix}`;

  await page.goto('/#/list');
  await expect(page.getByText('暂无足迹，请执笔绘行。')).toBeVisible();

  await expect
    .poll(
      () =>
        page.evaluate(
          ({ authUsernameKey, authPasswordKey }) => ({
            username: window.localStorage.getItem(authUsernameKey),
            password: window.localStorage.getItem(authPasswordKey),
          }),
          { authUsernameKey: AUTH_USERNAME_KEY, authPasswordKey: AUTH_PASSWORD_KEY },
        ),
      { timeout: 15_000 },
    )
    .toEqual(
      expect.objectContaining({
        username: expect.any(String),
        password: expect.any(String),
      }),
    );

  const credentials = await page.evaluate(
    ({ authUsernameKey, authPasswordKey, authTokenKey }) => {
      const username = window.localStorage.getItem(authUsernameKey);
      const password = window.localStorage.getItem(authPasswordKey);
      window.localStorage.removeItem(authTokenKey);
      return { username, password };
    },
    {
      authUsernameKey: AUTH_USERNAME_KEY,
      authPasswordKey: AUTH_PASSWORD_KEY,
      authTokenKey: AUTH_TOKEN_KEY,
    },
  );

  const token = await loginWith(
    request,
    credentials.username as string,
    credentials.password as string,
  );

  const createResponse = await request.post(`${API_BASE_URL}/records/`, {
    data: {
      province: '浙江省',
      city,
      spot_name: '西湖',
      travel_date: '2026-03-05',
      weather: 'sunny',
      thoughts: 'e2e smoke test',
      images: [],
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = await createResponse.json();

  const listResponse = await request.get(`${API_BASE_URL}/records/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(listResponse.ok()).toBeTruthy();
  const listed = await listResponse.json();
  expect(Array.isArray(listed)).toBeTruthy();
  expect(listed.some((item: any) => item.id === created.id)).toBeTruthy();

  await page.evaluate(
    ({ authTokenKey, authTokenValue }) => window.localStorage.setItem(authTokenKey, authTokenValue),
    { authTokenKey: AUTH_TOKEN_KEY, authTokenValue: token },
  );

  const browserFetch = await page.evaluate(
    async ({ apiBaseUrl, authTokenValue }) => {
      try {
        const response = await fetch(`${apiBaseUrl}/records/`, {
          headers: { Authorization: `Bearer ${authTokenValue}` },
        });
        const body = await response.text();
        return { ok: response.ok, status: response.status, body };
      } catch (error) {
        return { ok: false, status: 0, body: String(error) };
      }
    },
    { apiBaseUrl: API_BASE_URL, authTokenValue: token },
  );

  expect(browserFetch.ok, JSON.stringify(browserFetch)).toBeTruthy();
  expect(browserFetch.body).toContain(city);

  await page.reload();
  await expect(page.getByText(city)).toBeVisible();

  const deleteResponse = await request.delete(`${API_BASE_URL}/records/${created.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(deleteResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByText(city)).toHaveCount(0);
  await expect(page.getByText('暂无足迹，请执笔绘行。')).toBeVisible();
});
