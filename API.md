# Edge Functions API

Human-readable reference for this app's Supabase Edge Functions — the only server-side endpoints in the app. Everything else is direct PostgREST access to Supabase tables, governed by Row Level Security. A function exists here only when it genuinely needs the `service_role` key, which must never reach the browser.

For the machine-readable version (paths, schemas, status codes), see [`supabase/functions/openapi.yaml`](supabase/functions/openapi.yaml) — an OpenAPI 3.0 spec that can be loaded into Swagger UI or any OpenAPI tool. Keep both files in sync whenever a function's request/response shape, auth, or error behavior changes.

Base URL: `https://ohzosdwdzshlciphtyuw.supabase.co/functions/v1`

---

## `POST /update-user-email`

Changes another user's Supabase Auth email address. See [`supabase/functions/update-user-email/index.ts`](supabase/functions/update-user-email/index.ts) and [DESIGN.md §6](DESIGN.md#6-edge-functions) for implementation details.

**Why this needs an Edge Function:** every other `user_profiles` write (role, disabled, name, phone) is just a table update governed by RLS. Changing the underlying Auth email requires the Supabase Admin API (`service_role` key), so it can't be done from the browser.

### Auth

`Authorization: Bearer <caller's session JWT>` — required. Identifies the caller; a second, server-side `service_role` client performs the actual privileged lookup/update only after permission checks pass.

### Permissions

- Caller's `user_profiles.role` must be `elevated` or `admin`.
- Caller's `user_profiles.disabled` must be `false`.
- If caller is `elevated`, the target user's current role must be `standard` (elevated users can't touch other elevated/admin accounts).

### Request body

```json
{
  "targetUserId": "uuid",
  "newEmail": "new-email@example.com"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `targetUserId` | string (UUID) | yes | `id` of the user whose email is being changed (matches `auth.users.id` / `user_profiles.id`). |
| `newEmail` | string (email) | yes | The new email address. |

### Responses

| Status | Meaning |
|---|---|
| `200` | Success. Body: `{ "success": true, "user": { "id": "...", "email": "..." } }` |
| `400` | Malformed JSON, missing `targetUserId`/`newEmail`, or the Admin API rejected the new email. |
| `401` | Missing `Authorization` header, or the caller's session is invalid/expired. |
| `403` | Caller's profile not found, caller is disabled, caller lacks `elevated`/`admin` role, or an `elevated` caller targeted a non-`standard` user. |
| `404` | Target user's `user_profiles` row not found. |
| `405` | Method other than `POST`/`OPTIONS`. |

All error responses share the shape `{ "error": "message" }`.

### Side effects

`user_profiles.email` is **not** written directly by this function — it's kept in sync automatically by the `sync_user_profile_email` trigger, which fires when `auth.users.email` changes.
