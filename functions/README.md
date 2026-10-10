# Firebase Functions setup

This project uses the existing Firebase project to persist shared daily challenges.
The callable `getDailyChallenge` selects ten distinct KJV verses on first request
for a Pacific calendar date and atomically creates `dailyChallenges/{YYYY-MM-DD}`.
Later requests read that immutable record. The function uses the public
`bible-api.com` KJV endpoint; it does not require a private API key.

To deploy:

1. Enable Cloud Functions and Cloud Firestore for the Firebase project and use
   the Blaze billing plan required by Cloud Functions.
2. From the repository root, run `npm --prefix functions install`.
3. Run `firebase deploy --only functions,firestore:rules`.

The app calls the function in `us-west1`. The rules allow public reads of
challenge and leaderboard documents, block client writes to challenges, and
preserve authenticated one-score-per-day creation. Review the rules against any
additional collections used by your deployed Firebase project before deploying.
The function and rules must be deployed before the shared daily mode can load.
