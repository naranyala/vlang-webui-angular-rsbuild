# Battery Monitor

Simple battery monitor desktop app using V + WebUI with Angular frontend and Rsbuild.

## Features

- 🔋 Real-time battery monitoring
- 🎨 Modern Angular 19 + Rsbuild frontend
- 🚀 Fast incremental builds
- 📊 Enhanced terminal logging
- 🔧 Development mode with auto-rebuild

## Quick Start

```bash
# Development mode (builds frontend + V app, then runs)
./run.sh dev

# Build only (frontend + V app)
./run.sh build

# Run existing binary (no build)
./run.sh run

# Clean build artifacts
./run.sh clean

# Deep clean (including node_modules)
./run.sh clean-all
```

## Project Structure

```
.
├── src/
│   ├── main.v                    # V backend entry point
│   └── errors.v                  # Error handling system
├── v.mod                         # V module config
├── run.sh                        # Enhanced build/run script
├── .vproject.json                # V project configuration
├── frontend/
│   ├── src/                      # Angular source code
│   ├── rsbuild.config.ts         # Rsbuild configuration
│   ├── package.json              # Node.js dependencies
│   └── dist/browser/             # Build output (served by V)
├── thirdparty/
│   └── v-webui/                  # WebUI bindings
└── desktopapp                    # Compiled binary (after build)
```

## Commands

| Command | Description |
|---------|-------------|
| `./run.sh dev` | Build frontend + V app and run (default) |
| `./run.sh build` | Build frontend + V app (no run) |
| `./run.sh run` | Run existing binary (no build) |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh clean-all` | Deep clean (including node_modules) |
| `./run.sh install` | Install frontend dependencies |
| `./run.sh watch` | Start frontend dev server (watch mode) |
| `./run.sh help` | Show help message |

## Development Mode

The `dev` command provides a complete development experience:

1. **Prerequisites Check** - Verifies V, Bun/npm, GCC installations
2. **Frontend Build** - Builds Angular app with Rsbuild
3. **V App Build** - Compiles V backend with GCC
4. **Run Application** - Launches the desktop app

All output is logged to the terminal in real-time with color-coded messages:
- 🔵 `[INFO]` - General information
- 🟢 `[SUCCESS]` - Successful operations
- 🟡 `[WARN]` - Warnings
- 🔴 `[ERROR]` - Errors
- 🟣 `[STEP]` - Build steps
- **`[VLANG]`** - V compiler output
- **`[ANGULAR]`** - Frontend build output

## Build Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    ./run.sh dev                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              1. Check Prerequisites                     │
│   - V compiler version                                  │
│   - Bun/npm availability                                │
│   - GCC version                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              2. Build Frontend (Rsbuild)                │
│   - Install dependencies (if needed)                    │
│   - Run Rsbuild build                                   │
│   - Output: frontend/dist/browser/                      │
│   - Full terminal logging                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              3. Build V Application                     │
│   - Compile with GCC                                    │
│   - Output: ./battery                                   │
│   - Verbose compiler output                             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              4. Run Application                         │
│   - Launch battery executable                           │
│   - Stream all logs to terminal                         │
│   - Real-time event logging                             │
└─────────────────────────────────────────────────────────┘
```

## Logging System

All logs are output to the terminal (not log files):

### Application Logs (V)
```
[APP] [2026-03-12 10:30:45] [INFO] Starting Battery Monitor application...
[APP] [2026-03-12 10:30:45] [DEBUG] Version: 0.1.0
[APP] [2026-03-12 10:30:45] [SUCCESS] ✓ Window created successfully
[APP] [2026-03-12 10:30:45] [INFO] Binding JavaScript handlers...
```

### Build Logs (run.sh)
```
[INFO] V compiler: V 0.5.1
[INFO] Bun: v1.0.0
[STEP] Building frontend...
[ANGULAR] Starting Rsbuild build...
[SUCCESS] Frontend built: 6 files (245K)
[STEP] Building V application...
[VLANG] v build output...
[SUCCESS] V app built: battery (8.5M)
```

## Frontend Development

### Using Bun (Recommended)
```bash
cd frontend

# Install dependencies
bun install

# Development server (watch mode)
bun run dev

# Production build
bun run build:rsbuild
```

### Using npm
```bash
cd frontend

# Install dependencies
npm install

# Development server (watch mode)
npm run dev

# Production build
npm run build:rsbuild
```

## Backend Development

```bash
# Debug build with verbose output
v -cc gcc -o battery .

# Run with logging
./battery

# Clean rebuild
rm -f battery && v -cc gcc -o battery .
```

## Requirements

### System
- **OS**: Linux (tested on Ubuntu/Debian)
- **Kernel**: 4.4+ (for `/sys/class/power_supply/`)

### Build Tools
- **V**: 0.5.1+ ([Install](https://vlang.io))
- **GCC**: 9.0+ 
- **Bun**: 1.0+ (optional, recommended) or **npm**: 8.0+

### Runtime
- **WebUI**: Included in `thirdparty/v-webui`
- **Browser**: Any modern browser (Chrome, Firefox, Edge)

## Troubleshooting

### Frontend build fails
```bash
# Clean and reinstall
./run.sh clean-all
./run.sh install
./run.sh build
```

### V compiler errors
```bash
# Check V installation
v version

# Update V
v up

# Verbose build
v -cc gcc -showcc -o battery .
```

### Battery info not showing
```bash
# Check battery path
ls /sys/class/power_supply/

# Test manually
cat /sys/class/power_supply/BAT0/capacity
cat /sys/class/power_supply/BAT0/status
```

### Port already in use
The application uses a dynamic port. Check the terminal output for the assigned port.

## API Reference

### JavaScript → V Functions

```javascript
// Get battery information
const batteryInfo = webui.call('getBatteryInfo');
// Returns: { percent: 85, status: 'Full', time_left: '−', icon: '✅', color: '#4ade80' }
```

### V Event Logging

All V events are logged with timestamps:
- Window creation/close
- JavaScript function calls
- Battery data fetches
- Status changes

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./run.sh build` to verify
5. Submit a pull request
