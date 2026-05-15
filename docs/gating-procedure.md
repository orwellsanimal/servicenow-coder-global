# Gating procedure

> The standard human review + commit procedure for every change in this repo.

This procedure is the **deliberate gate** that distinguishes global-scope
changes from scoped-app changes. Scoped apps ship through automated CI/CD;
global changes go through this checklist.

## Phase 1 — Author the change (AI-assisted)

1. Create `changes/<YYYY-MM>-<short-name>/` directory
2. Author `manifest.yaml` describing the change
3. Add referenced files to `source/`
4. Author `README.md` with rollback notes and any special context
5. Run the generator from a checkout of `servicenow-coder`:
   ```bash
   node ../servicenow-coder/scripts/build-update-set.js \
        changes/<YYYY-MM>-<short-name>/
   ```
6. Verify `built/` now contains four files: `update-set.xml`,
   `update-set.sha256`, `impact.md`, `preview.md`

## Phase 2 — Pull request

1. Push the branch and open a PR
2. The PR description should include:
   - Link to any related issue or CAB ticket
   - A copy or summary of `impact.md`
   - Notes on the target environment (`dev`, `test`, or `prod`)
3. CI runs `.github/workflows/validate.yml`:
   - Validates `manifest.yaml` is well-formed
   - Verifies `built/update-set.sha256` matches the actual XML hash
   - Confirms `built/update-set.xml` is well-formed XML

## Phase 3 — Review

The reviewer's checklist:

- [ ] `impact.md` accurately describes the change
- [ ] `source/` files are reviewed line-by-line (this is the real code review)
- [ ] `manifest.yaml` is consistent with `source/`
- [ ] `update-set.sha256` matches the XML in the PR diff
- [ ] Estimated rollback complexity is realistic
- [ ] Any tables/fields referenced exist on the target instance
- [ ] (Optional) Live preview against a non-prod instance:
   ```bash
   python ../servicenow-coder/scripts/python/preview-update-set.py \
        changes/<YYYY-MM>-<short-name>/built/update-set.xml
   ```

If any of the above fails, request changes on the PR.

## Phase 4 — Approval

PR approval signals "ready to import." If the target environment requires CAB
or change-management approval, attach the relevant ticket number to the PR
before merging.

**Important:** PR approval does **not** mean the change has been applied. It
means the change is ready to be applied by a developer with admin access.

## Phase 5 — Import to target instance

A developer with admin role on the target instance:

1. Downloads `built/update-set.xml` from the PR
2. On the target instance: **System Update Sets** → **Retrieved Update Sets**
3. Click **Import Update Set from XML** → select the file → **Upload**
4. Open the loaded update set
5. Click **Preview Update Set**
6. Compare the preview output against the `built/preview.md` in the PR
7. Resolve any preview errors (missing references, type conflicts, etc.)
8. If errors require code changes, **abort**, fix in the PR, regenerate, restart at step 1

## Phase 6 — Commit + mark applied

1. Click **Commit Update Set** on the target instance
2. Verify the commit completed without errors
3. Run post-import verification:
   ```bash
   python ../servicenow-coder/scripts/python/preview-update-set.py \
        changes/<YYYY-MM>-<short-name>/built/update-set.xml --post-import
   ```
   All artifacts should report `OK`.
4. Create a `.applied` marker file in the change folder:
   ```bash
   echo "applied: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > \
        changes/<YYYY-MM>-<short-name>/.applied
   echo "instance: <instance-name>" >> \
        changes/<YYYY-MM>-<short-name>/.applied
   echo "committer: <your-name>" >> \
        changes/<YYYY-MM>-<short-name>/.applied
   ```
5. Commit and push the `.applied` marker
6. Merge the PR

## Phase 7 — If something goes wrong

### During Preview (before commit)
Just close the preview without committing. The update set sits as "Loaded"
state and can be re-previewed or deleted.

### After Commit
1. ServiceNow → **System Update Sets** → **Update Sets to Commit**
2. Find the committed update set
3. Click **Back Out**
4. Resolve any back-out errors (data dependencies, child records, etc.)
5. Open a new PR documenting what failed and what the rollback did

For the FSM bridge specifically, see
[`changes/2026-05-fsm-bridge/README.md`](../changes/2026-05-fsm-bridge/README.md)
for the change-specific rollback notes.

## Code Signing (enterprise environments)

If your target instance has ServiceNow Vault + Code Signing enabled:

- Between Phase 4 and Phase 5, the update set XML should be uploaded to the
  trusted instance and signed via a Signing Job (`sn_kmf` security job, type
  "Sign Specific Records"). The signed export then replaces the original XML
  for import on the protected instance.
- The protected instance verifies the signature on commit. If verification
  fails, the commit is rejected.

This adds cryptographic non-repudiation on top of the SHA-256 tamper-evidence
that Phase 1 provides. The repository structure does not change.

References:
- `servicenow-docs/markdown/platform-security/sign-specific-records.md`
- `servicenow-docs/markdown/platform-security/code-signing-landing.md`
