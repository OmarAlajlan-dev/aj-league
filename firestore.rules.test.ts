// Dirty Dozen Adversarial Security Test Specification for Aj League Firestore Rules
// Mirrors security_spec.md against @firebase/rules-unit-testing when run with Firebase Emulator.

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Malformed unauthenticated authorUid (missing guest_ prefix) is denied',
    path: 'leagues/aj_league_26_27/predictions/gw11_m1__test',
    auth: null,
    payload: {
      gwId: 'gw11',
      fixtureId: 'gw11_m1',
      predictorName: 'عيلان',
      scoreA: 2,
      scoreB: 1,
      winnerLabel: 'مانشستر سيتي',
      note: '',
      isPublicLeague: true,
      authorUid: 'anon'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '2. Unverified/unauthenticated fixture deletion is denied',
    path: 'leagues/aj_league_26_27/fixtures/gw11_m1',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: false } },
    operation: 'delete',
    payload: null,
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '3. Identity spoofing on prediction create (authorUid != auth.uid) is denied',
    path: 'leagues/aj_league_26_27/predictions/gw11_m1__test',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: {
      gwId: 'gw11',
      fixtureId: 'gw11_m1',
      predictorName: 'عيلان',
      scoreA: 2,
      scoreB: 1,
      winnerLabel: 'مانشستر سيتي',
      note: '',
      isPublicLeague: true,
      authorUid: 'victim_uid'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '4. Identity spoofing on league create (ownerUid != auth.uid) is denied',
    path: 'leagues/aj_league_26_27',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: {
      name: 'Aj League',
      season: 'PL 26/27',
      activeGwId: 'gw11',
      predictors: ['عيلان', 'بونبيل'],
      whatsappUseArabicDigits: true,
      whatsappIncludeDates: false,
      isPublicLeague: true,
      ownerUid: 'victim_uid'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '5. Shadow/ghost field injection on prediction update is denied',
    path: 'leagues/aj_league_26_27/predictions/gw11_m1__test',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: { isVerified: true, scoreA: 3 },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '6. ID poisoning (invalid characters or >128 chars) is denied',
    path: 'leagues/aj_league_26_27/predictions/invalid$id!',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: {
      gwId: 'gw11',
      fixtureId: 'gw11_m1',
      predictorName: 'عيلان',
      scoreA: 2,
      scoreB: 1,
      winnerLabel: 'مانشستر سيتي',
      note: '',
      isPublicLeague: true,
      authorUid: 'u1'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '7. Unbounded predictors array (>30 items) is denied',
    path: 'leagues/aj_league_26_27',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: { predictors: Array.from({ length: 35 }, (_, i) => `P${i}`) },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '8. Type poisoning on fixture actualA (string or out of range) is denied',
    path: 'leagues/aj_league_26_27/fixtures/gw11_m1',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: { actualA: 'two', actualB: 999 },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '9. Note buffer overflow (>500 chars) is denied',
    path: 'leagues/aj_league_26_27/predictions/gw11_m1__test',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: {
      gwId: 'gw11',
      fixtureId: 'gw11_m1',
      predictorName: 'عيلان',
      scoreA: 1,
      scoreB: 0,
      winnerLabel: 'مانشستر سيتي',
      note: 'a'.repeat(1000),
      isPublicLeague: true,
      authorUid: 'u1'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '10. Orphaned prediction referencing non-existent fixture is denied',
    path: 'leagues/aj_league_26_27/predictions/nonexistent__test',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: {
      gwId: 'gw11',
      fixtureId: 'nonexistent_fixture',
      predictorName: 'عيلان',
      scoreA: 1,
      scoreB: 0,
      winnerLabel: 'مانشستر سيتي',
      note: '',
      isPublicLeague: true,
      authorUid: 'u1'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '11. Immortal field tampering (changing fixture createdAt or gwId) is denied',
    path: 'leagues/aj_league_26_27/fixtures/gw11_m1',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: { gwId: 'gw12' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '12. Client timestamp spoofing (createdAt != request.time) is denied',
    path: 'leagues/aj_league_26_27/gameweeks/gw13',
    auth: { uid: 'u1', token: { email: 'user@example.com', email_verified: true } },
    payload: {
      number: 13,
      name: 'الجولة ال١٣',
      isPublicLeague: true,
      createdByUid: 'u1',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z'
    },
    expected: 'PERMISSION_DENIED'
  }
];
