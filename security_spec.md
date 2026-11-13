# Security Specification — Aj League Cloud Firestore

## 1. Data Invariants
1. **Master Gate & League Integrity**: Every subcollection document (`gameweeks`, `fixtures`, `predictions`) belongs to an existing `/leagues/{leagueId}` document with `isPublicLeague == true`.
2. **Identity Integrity**: Every write requires an authenticated, email-verified user (`request.auth != null && request.auth.token.email_verified == true`). All author/owner UID fields (`ownerUid`, `createdByUid`, `updatedByUid`, `authorUid`) must match `request.auth.uid` on write (or stay immutable where specified).
3. **Referential Integrity**: Creating a `Fixture` requires its parent `Gameweek` to exist (`existsAfter`), and creating a `Prediction` requires its parent `Fixture` to exist (`existsAfter`).
4. **Strict Schema & Bounds**:
   - All document IDs (`leagueId`, `gwId`, `fixtureId`, `predictionId`) must satisfy `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
   - `League.predictors` is strictly bounded (`1 <= size <= 30`) and validated for string content (`predictors[0] is string`).
   - `Fixture.actualA` and `actualB` must be either `null` or an integer in `[0, 20]`.
   - `Prediction.scoreA` and `scoreB` must be integers in `[0, 20]`, and `note` is a string with `size <= 500`.
   - All `createdAt` and `updatedAt` timestamps must equal `request.time`, with `createdAt` immutable on updates.
5. **No PII & No Blanket Reads**: League data contains no emails, phone numbers, or addresses. All `list` rules explicitly filter on `resource.data.isPublicLeague == true` (no `get()` inside `allow list`).

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Write**: Creating a `Prediction` without `request.auth` -> DENIED.
2. **Unverified Email Write**: Creating a `Prediction` with `email_verified: false` -> DENIED.
3. **Identity Spoofing (Prediction Create)**: Creating a `Prediction` with `authorUid: "someone_else"` instead of `request.auth.uid` -> DENIED.
4. **Identity Spoofing (League Create)**: Creating a `League` with `ownerUid: "victim_uid"` -> DENIED.
5. **Shadow / Ghost Field Injection**: Updating a `Prediction` with an extra field `isAdmin: true` -> DENIED (`keys().hasOnly` + `affectedKeys().hasOnly`).
6. **ID Poisoning**: Creating a `Prediction` at `/leagues/aj_league_26_27/predictions/bad$id` or 200-char ID -> DENIED (`isValidId`).
7. **Unbounded Array / Resource Exhaustion**: Updating `League.predictors` with 35 entries or empty list -> DENIED (`size() >= 1 && size() <= 30`).
8. **Type Poisoning**: Updating `Fixture.actualA` to `"two"` (string) or `999` (out of range) -> DENIED.
9. **Note Buffer Overflow**: Creating a `Prediction` with a 1,000-character `note` -> DENIED (`size() <= 500`).
10. **Orphaned Record**: Creating a `Prediction` referencing a non-existent `fixtureId` -> DENIED (`existsAfter`).
11. **Immortal Field Tampering**: Updating a `Fixture` to alter `createdAt` or `gwId` -> DENIED.
12. **Client Timestamp Spoofing**: Creating a `Gameweek` with a forged past/future `createdAt` instead of `request.time` -> DENIED.
