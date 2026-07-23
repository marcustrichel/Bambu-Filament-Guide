// Intercepts every request the app sends to Supabase (REST + Auth) and serves
// canned responses, so E2E tests exercise the real app/browser/network stack
// without touching the live Supabase project or requiring real credentials.

export const mockAuthUser = { id: 'e2e-user-1', email: 'e2e@example.com' };

let idCounter = 0;
const nextId = (table) => `mock-${table}-${++idCounter}`;

export async function mockSupabase(page, { profiles = [], filaments = [], printers = [], favorites = [] } = {}) {
  const state = { print_profiles: profiles, filaments, printers, favorites };

  await page.route('**/auth/v1/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes('/auth/v1/recover')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (url.includes('/auth/v1/token')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: mockAuthUser,
        }),
      });
    }
    if (url.includes('/auth/v1/signup')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: mockAuthUser,
        }),
      });
    }
    if (url.includes('/auth/v1/logout')) {
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.includes('/auth/v1/user')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAuthUser) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAuthUser) });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/').pop();
    const method = req.method();
    const list = state[table] || (state[table] = []);

    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(list) });
    }
    if (method === 'POST') {
      const body = req.postDataJSON();
      const created = { created_at: new Date().toISOString(), ...body, id: body.id || nextId(table) };
      list.push(created);
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    }
    if (method === 'PATCH') {
      const body = req.postDataJSON();
      const idFilter = url.searchParams.get('id'); // e.g. "eq.printer-1"
      const id = idFilter?.split('.')[1];
      const item = list.find((i) => i.id === id) || list[0];
      if (item) Object.assign(item, body);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(item || body) });
    }
    if (method === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });

  return state;
}

export async function signIn(page) {
  await page.getByRole('button', { name: 'Sign In / Up' }).click();
  await page.getByLabel('Email').fill(mockAuthUser.email);
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.getByText(mockAuthUser.email).waitFor();
}
