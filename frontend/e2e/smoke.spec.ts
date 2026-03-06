import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const AUTH_TOKEN_KEY = 'huixing_auth_token';

test('smoke: login -> create -> list -> delete record', async ({ page, request }) => {
  const suffix = `${Date.now()}`;
  const username = `e2e_user_${suffix}`;
  const password = `e2e_pass_${suffix}`;
  const city = `E2E杭州${suffix}`;

  await page.goto('/#/list');
  await expect(page.getByText('账号登录')).toBeVisible();

  await page.getByTestId('auth-username').fill(username);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-register').click();

  await expect(page.getByText('暂无足迹，请执笔绘行。')).toBeVisible();

  await expect
    .poll(
      () =>
        page.evaluate((authTokenKey) => window.localStorage.getItem(authTokenKey), AUTH_TOKEN_KEY),
      { timeout: 10_000 },
    )
    .toBeTruthy();

  const authToken = (await page.evaluate(
    (authTokenKey) => window.localStorage.getItem(authTokenKey),
    AUTH_TOKEN_KEY,
  )) as string;
  expect(authToken).toBeTruthy();

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
    headers: { Authorization: `Bearer ${authToken}` },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = await createResponse.json();

  const listResponse = await request.get(`${API_BASE_URL}/records/`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  expect(listResponse.ok()).toBeTruthy();
  const listed = await listResponse.json();
  expect(Array.isArray(listed)).toBeTruthy();
  expect(listed.some((item: any) => item.id === created.id)).toBeTruthy();

  await page.reload();
  await expect(page.getByText(city)).toBeVisible();

  const deleteResponse = await request.delete(`${API_BASE_URL}/records/${created.id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  expect(deleteResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByText(city)).toHaveCount(0);
  await expect(page.getByText('暂无足迹，请执笔绘行。')).toBeVisible();
});
