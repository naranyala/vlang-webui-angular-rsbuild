# Quick Reference

**Project**: Vlang WebUI Angular Application  
**Audit Date**: 2026-03-14

---

## Findings at a Glance

| ID | Severity | Title | File(s) | Effort |
|----|----------|-------|---------|--------|
| CRIT-001 | 🔴 | DI System Abandoned | `src/app.v`, `src/service_provider.v` | 8-16h |
| CRIT-002 | 🔴 | Stub Services | `src/system_info_service.v` | 16-24h |
| CRIT-003 | 🔴 | Duplicate Code | `src/main.v`, `src/app.v` | 4-8h |
| CRIT-004 | 🔴 | Error Handling Not Used | `src/errors.v` | 16-24h |
| HIGH-001 | 🟠 | Auth Backend Missing | `frontend/src/services/auth.service.ts` | 24-40h |
| HIGH-002 | 🟠 | Build Path Conflicts | `run.sh` | 15min |
| HIGH-003 | 🟠 | Missing DI Files | `src/core/` | 8-16h |
| HIGH-004 | 🟠 | WebUI Mismatch | Multiple | 4-8h |
| MED-001 | 🟡 | Memory Leaks | `app.component.ts` | 1-2h |
| MED-002 | 🟡 | No Input Validation | `src/file_service.v` | 4-6h |
| MED-003 | 🟡 | Inconsistent Logging | Multiple | 4-6h |
| MED-004 | 🟡 | No Tests | Multiple | 24-40h |
| MED-005 | 🟡 | Unused Module | `app.module.ts` | 30min |
| LOW-001 | 🟢 | Naming | Multiple | 2-4h |
| LOW-002 | 🟢 | Magic Numbers | `src/main.v` | 1h |
| LOW-003 | 🟢 | No Cross-Platform | Multiple | 8-12h |
| LOW-004 | 🟢 | Docs Over-Promising | `README.md` | 4-8h |
| LOW-005 | 🟢 | Unused Config | `config_service.v` | 4-6h |

---

## Immediate Actions (Day 1)

### 1. Fix Build Path (HIGH-002) - 15 minutes
```bash
# Edit run.sh line 20
sed -i 's|dist/browser/browser/|dist/browser/|g' run.sh
```

### 2. Review Critical Findings
Read [`01-critical-findings.md`](./01-critical-findings.md) and decide on DI approach.

---

## Priority Order

### Week 1-2: Critical Fixes
1. ✅ HIGH-002: Fix build path (15 min)
2. 🔲 CRIT-003: Consolidate duplicate code (4-8h)
3. 🔲 CRIT-001: Decide DI approach (2-16h)
4. 🔲 CRIT-002: Implement real services (16-24h)
5. 🔲 MED-002: Add input validation (4-6h)

### Week 3-4: High Priority
6. 🔲 HIGH-004: Fix WebUI bindings (4-8h)
7. 🔲 HIGH-001: Decide auth approach (2-40h)
8. 🔲 MED-003: Consolidate logging (4-6h)

### Week 5-6: Medium Priority
9. 🔲 CRIT-004: Implement error handling (16-24h)
10. 🔲 MED-001: Fix memory leaks (1-2h)
11. 🔲 MED-005: Remove unused module (30min)
12. 🔲 MED-004: Add tests (24-40h)

### Week 7-8: Cleanup
13. 🔲 LOW-001: Fix naming (2-4h)
14. 🔲 LOW-002: Fix magic numbers (1h)
15. 🔲 LOW-005: Fix config (4-6h)
16. 🔲 LOW-004: Update docs (4-8h)
17. 🔲 LOW-003: Cross-platform (8-12h)

---

## File Locations

### Audit Reports
- [`00-executive-summary.md`](./00-executive-summary.md) - Overview
- [`01-critical-findings.md`](./01-critical-findings.md) - Critical issues
- [`02-high-findings.md`](./02-high-findings.md) - High severity
- [`02-medium-low-findings.md`](./02-medium-low-findings.md) - Medium/Low
- [`03-remediation-plan.md`](./03-remediation-plan.md) - Action plan

### Key Source Files
| Component | Path |
|-----------|------|
| Main entry | `src/main.v` |
| App struct | `src/app.v` |
| Services | `src/*_service.v` |
| Errors | `src/errors.v` |
| Angular app | `frontend/src/views/app.component.ts` |
| WebUI service | `frontend/src/services/webui.service.ts` |
| Auth service | `frontend/src/services/auth.service.ts` |
| Build script | `run.sh` |

---

## Key Commands

```bash
# Build
./run.sh build

# Run
./run.sh run

# Development mode
./run.sh dev

# Clean
./run.sh clean

# V tests
v test ./src

# Frontend tests
cd frontend && bun test

# Frontend dev server
cd frontend && bun run dev
```

---

## Contact

For questions about this audit, refer to the detailed findings in the full reports.

---

*Generated: 2026-03-14*
