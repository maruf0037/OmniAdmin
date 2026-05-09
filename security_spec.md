# Security Specification: OmniAdmin

## 1. Data Invariants
- A `Task` must have a `title` and an `ownerId` matching the creator.
- A `Module` must have a valid `id`, `name`, and at least one field.
- A `User` document must match the authenticating user's UID.
- All timestamps must be server-generated.

## 2. Dirty Dozen Payloads (Targeting Rejection)

### Identity Spoofing
- **P1**: Creating a user profile with a different UID.
- **P2**: Creating a task with an `ownerId` of another user.

### State/Schema Violation
- **P3**: Creating a task without a `title`.
- **P4**: Updating a module to remove all fields.
- **P5**: Spacing an ID field with a 2MB string (Denial of Wallet).
- **P6**: Injecting a 'role: admin' field into a self-profile update.

### Relational integrity
- **P7**: Creating a task with a status that isn't `todo`, `in-progress`, or `done`.
- **P8**: Creating a module with an empty `id`.

### PII/Privacy
- **P9**: Authenticated User A reading User B's profile document.
- **P10**: User A listing items in User B's private module collection.

### Immutability
- **P11**: User A trying to change their own profile's `createdAt` timestamp.
- **P12**: User A trying to change the `ownerId` of a task after creation.
