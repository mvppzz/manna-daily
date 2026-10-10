# Firebase setup (Spark plan)

The shared daily challenge uses the existing Firebase Authentication and
Cloud Firestore project. It does not use Cloud Functions or require a billing
upgrade. On the first request for a Pacific calendar date, a browser retrieves
ten distinct public KJV verses and uses a Firestore transaction to create
`dailyChallenges/{YYYY-MM-DD}`. Concurrent requests converge on the document
created first; subsequent requests read its stored sequence.

From the repository root, deploy only the Firestore rules:

```sh
npx firebase-tools login
npx firebase-tools use mannadaily-589f3
npx firebase-tools deploy --only firestore:rules
```

This replaces the Firestore rules currently deployed for the selected project.
Review and merge the rules with any existing rules before deploying.

The rules permit creating a daily challenge but prohibit client updates and
deletes. Because Spark has no trusted server function here, a determined
unauthenticated client could create a malformed or premature challenge for a
date. The application validates challenge shape, but client-side validation
cannot enforce trustworthy verse selection. Do not use this pattern for
security-sensitive results or prizes.
