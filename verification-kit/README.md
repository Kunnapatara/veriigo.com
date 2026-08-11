# VERIIGO V2 - External Reproducibility Verification Kit (Sprint 3)

This kit allows third-party auditors and software verification engineers to independently verify all claims, dataset integrity, SHA-256 evidence hashes, change detection scenarios, live source matching, and performance benchmarks of VERIIGO V2.

## Quick Start (One-Command Verification)

Run the single command from the project root:

```bash
npm run verify
```

Alternatively, run the platform-specific scripts:

- **Linux / macOS**:
  ```bash
  chmod +x verification-kit/verify.sh
  ./verification-kit/verify.sh
  ```

- **Windows**:
  ```powershell
  .\verification-kit\verify.ps1
  ```

## Verification Artifacts Generated

The execution generates raw verifiable artifacts directly into `verification-kit/`:

- `verification-report.json`: Comprehensive structured verification outcomes (`VERIFIED`, `NOT VERIFIED`, or `NOT REPRODUCIBLE`) with exact document IDs.
- `verification-manifest.json`: Cryptographic manifest containing SHA-256 hashes and byte sizes of all generated evidence artifacts.
- `verification.log`: Raw timestamped console execution transcript.
- `benchmark-performance.csv`: Raw benchmark metrics for 100 and 500 job record verifications (latency, throughput, memory, CPU).
- `coverage-summary.json`: Test suite execution and coverage metrics.
- `evidence-firestore.json`: Raw Firestore document export and schema inspection.
- `evidence-lineage.json`: Manual 100-job lineage chain traversal records.
- `evidence-hashes.json`: 50-snapshot SHA-256 recomputed payload verification results.
- `evidence-live-source.json`: 20-job official source URL verification data.
- `evidence-security.json`: Security tampering rejection test outcomes.
- `evidence-change-detection.json`: 9-scenario change detection engine verification.

## Verification Rules

1. No helper functions are trusted for Firestore auditing — all reads are executed directly against the Firestore instance via the Firebase SDK.
2. Every SHA-256 hash is recomputed directly from stored payloads using Node.js `crypto`.
3. Repeatability is tested across 3 consecutive iterations. Output artifacts must match deterministically across runs.
4. No artificial scores, `100%`, or marketing claims are produced. Only raw verifiable status (`VERIFIED` / `NOT VERIFIED` / `NOT REPRODUCIBLE`) is reported with backing evidence.
