// Built-in Node runner plus the project's existing TypeScript compiler: no test dependency needed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    }).outputText, filename);
  };
}
require.extensions['.css'] = () => {};
const storage = new Map([['user', '{malformed-json']]);
global.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
const BrowserRequest = global.Request;
global.Request = class extends BrowserRequest {
  constructor(input, options) { super(typeof input === 'string' ? new URL(input, 'http://test.local') : input, options); }
};
const requests = [];
let fetchHandler = () => ({ data: [] });
global.fetch = async (request) => {
  requests.push({ path: new URL(request.url).pathname, method: request.method });
  const { data, status = 200 } = await fetchHandler(request);
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
};
const { store } = require('../src/store/index.ts');
const { api, studentsApi, noticesApi, authApi } = require('../src/store/api.ts');
const { setCredentials, logout } = require('../src/store/authSlice.ts');
const credentials = (id) => ({ user: { id, name: id, role: 'OWNER', email: `${id}@example.test`, workspaceId: id }, accessToken: `token-${id}` });
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const count = (path, method = 'GET') => requests.filter(r => r.path === path && r.method === method).length;

test('cache reuse, targeted invalidation, session isolation and local loading semantics', async () => {
  assert.equal(store.getState().auth.user, null, 'malformed stored auth should not crash startup');
  store.dispatch(setCredentials(credentials('one')));
  fetchHandler = request => ({ data: request.url.includes('/students') ? { students: [], total: 0 } : [] });
  const students = store.dispatch(studentsApi.endpoints.getStudents.initiate({ page: 1 }));
  const notices = store.dispatch(noticesApi.endpoints.getNotices.initiate({}));
  await Promise.all([students, notices]);
  await store.dispatch(studentsApi.endpoints.getStudents.initiate({ page: 1 }, { subscribe: false }));
  assert.equal(count('/api/students'), 1, 'repeat queries reuse the same cache entry');
  await store.dispatch(noticesApi.endpoints.createNotice.initiate({ title: 'Test', content: 'Test' }));
  await tick();
  assert.equal(count('/api/notices'), 2, 'creating a notice refreshes notices');
  assert.equal(count('/api/students'), 1, 'notice mutation must not refetch students');

  fetchHandler = request => request.method === 'POST' ? ({ status: 500, data: { message: 'Test failure' } }) : ({ data: [] });
  await store.dispatch(noticesApi.endpoints.createNotice.initiate({ title: 'Failed' }));
  await tick();
  assert.equal(count('/api/notices'), 2, 'failed mutations do not trigger refetches');

  let release;
  fetchHandler = () => new Promise(resolve => { release = resolve; });
  const refreshing = students.refetch();
  await tick();
  const during = studentsApi.endpoints.getStudents.select({ page: 1 })(store.getState());
  assert.equal(during.status, 'pending');
  assert.deepEqual(during.data, { students: [], total: 0 }, 'cached content stays available while refreshing');
  release({ data: { students: [{ id: 'new' }], total: 1 } });
  await refreshing;

  store.dispatch(logout());
  assert.equal(Object.keys(store.getState().api.queries).length, 0, 'logout clears sensitive cached queries');
  assert.equal(store.getState().auth.token, null);
  students.unsubscribe(); notices.unsubscribe();

  store.dispatch(setCredentials(credentials('two')));
  fetchHandler = () => ({ data: { students: [], total: 0 } });
  await store.dispatch(studentsApi.endpoints.getStudents.initiate({ page: 1 }, { subscribe: false }));
  assert.ok(Object.keys(store.getState().api.queries).length);
  store.dispatch(setCredentials(credentials('three')));
  assert.equal(Object.keys(store.getState().api.queries).length, 0, 'account switch also clears cache');

  fetchHandler = () => new Promise(resolve => { release = resolve; });
  const oldSession = store.dispatch(authApi.endpoints.getProfile.initiate(undefined, { subscribe: false }));
  await tick();
  store.dispatch(setCredentials(credentials('four')));
  release({ status: 401, data: { message: 'Token has expired' } });
  await oldSession;
  assert.equal(store.getState().auth.token, 'token-four', 'late 401 from old session cannot log out the new user');
  assert.equal(Object.keys(store.getState().api.queries).length, 0, 'late responses do not restore a cleared cache');

  fetchHandler = () => ({ status: 401, data: { message: 'Token has expired' } });
  await store.dispatch(authApi.endpoints.getProfile.initiate(undefined, { subscribe: false }));
  assert.equal(store.getState().auth.token, null, 'current-session 401 clears auth without document navigation');
  assert.equal(store.getState().auth.logoutReason, 'expired');
  store.dispatch(api.util.resetApiState());
});

test('shared fields expose labels, error descriptions and button loading state', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { Input } = require('../src/components/ui/Input.tsx');
  const { Button } = require('../src/components/ui/Button.tsx');
  const html = renderToStaticMarkup(React.createElement(Input, { id: 'email', label: 'Email', error: 'Enter your email', type: 'email' }));
  assert.match(html, /for="email"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="email-help"/);
  assert.match(html, /id="email-help"/);
  const button = renderToStaticMarkup(React.createElement(Button, { isLoading: true }, 'Save'));
  assert.match(button, /aria-busy="true"/);
  assert.match(button, /disabled=""/);
  assert.match(button, />Save<\//, 'loading button retains its accessible name');
});
