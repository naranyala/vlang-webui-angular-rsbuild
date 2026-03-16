# Running the Application

**Note**: For comprehensive setup and running instructions, see [Getting Started Guide](02-getting-started.md).

---

## Quick Commands

```bash
# Build and run (default)
./run.sh

# Build only
./run.sh build

# Run existing binary
./run.sh run

# Clean build
./run.sh clean
```

---

## Prerequisites

- **OS**: Linux
- **V**: 0.5.1+
- **GCC**: 9.0+
- **Bun**: 1.0+ (or npm 8.0+)

See [Getting Started - Prerequisites](02-getting-started.md#prerequisites) for detailed installation instructions.

---

## Build Output

After a successful build:

| File | Location | Size |
|------|----------|------|
| Binary | `build/desktopapp` | 768K |
| Frontend | `frontend/dist/browser` | 276K |

---

## Troubleshooting

### Common Issues

**"V compiler not found"**
```bash
# Install V
cd /opt && git clone https://github.com/vlang/v && cd v && make
export PATH=/opt/v:$PATH
```

**"GCC not found"**
```bash
sudo apt install gcc build-essential
```

**"Could not find @angular-devkit/build-angular"**
```bash
cd frontend && bun install
```

For more troubleshooting, see [Getting Started - Troubleshooting](02-getting-started.md#troubleshooting).

---

*Last updated: 2026-03-16*
