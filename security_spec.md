# Firestore Security Specification

This specification documents the security model, invariants, and rules designed to protect the Firebase Firestore database for the Finance Monthly application.

## 1. Data Invariants
- A monthly finance record must have a unique ID that represents the specific year and month (format: `YYYY-MM`).
- The monthly finance record's payload must contain the `month_id` string matching the document ID and a `data` map containing the actual finance details.
- Deletions are forbidden from the client to prevent catastrophic data loss.
- Document IDs must conform to alphanumeric characters and dashes (`^[a-zA-Z0-9_\-]+$`) to prevent path traversal or spam injections.

## 2. The "Dirty Dozen" Payloads (Denial Scenarios)
The following payloads and actions must be rejected by the rules:
1. Create a `monthly_finance` document with an invalid ID matching malicious strings (e.g. `../../etc`.
2. Create a document where `month_id` in the body does not match the actual document ID.
3. Update a document with missing `data` payload.
4. Update a document to set an invalid data type for `month_id` (e.g., number or map instead of string).
5. Attempting to delete a record from Client SDK.
6. Create a document with a body size exceeding safety limits.
7. Attempting to write a shadow field (e.g., custom extra parameters not present in schema).
8. Attempting to read a completely different collection (e.g., `admins/` or `/user_data`).
9. Updating a document to change its existing immutable `month_id`.
10. Writing a payload where `data` is a string instead of a map.
11. Injecting a massive string (exceeding 20 chars) as `month_id` in payload.
12. Running a blanket list query across all finance logs without specifying valid monthIds.

## 3. Fortress Firestore Rules Concept
The rules enforce zero-trust access control by strictly validating schemas, types, document IDs, immutability, and denying operations that do not meet these parameters.
