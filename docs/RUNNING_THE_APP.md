# Running the Desktop App - Troubleshooting Guide

## Quick Start

```bash
# Build and run
./run.sh dev

# Or build first, then run
./run.sh build
./desktopapp
```

## Expected Output

When running successfully, you should see:

```
+========================================================+
|           Desktop App v1.0.0                           |
|           Enhanced Desktop Utilities                   |
+========================================================+

[APP] [2026-03-13 09:00:00] [INFO] Starting Desktop App application...
[APP] [2026-03-13 09:00:00] [INFO] Creating WebUI window...
[APP] [2026-03-13 09:00:00] [SUCCESS] Window created successfully
[APP] [2026-03-13 09:00:00] [INFO] Opening window with index.html...
[APP] [2026-03-13 09:00:01] [SUCCESS] Window opened successfully
[APP] [2026-03-13 09:00:01] [SUCCESS] Application running. Press Ctrl+C to exit.
```

A browser window should open automatically showing the application.

---

## Common Issues and Solutions

### Issue 1: Failed to open window Error

**Error Message:**
```
[ERROR] Failed to open window: ...
```

**Cause:** WebUI cannot find a display or browser.

**Solutions:**

#### On Linux with Display:

```bash
# Check if DISPLAY is set
echo $DISPLAY

# If empty, set it (usually :0 or :1)
export DISPLAY=:0

# Then run
./run.sh dev
```

#### On Headless Server (No Display):

WebUI requires a browser. Options:

1. **Use Xvfb (Virtual Framebuffer):**
   ```bash
   # Install Xvfb
   sudo apt install xvfb  # Debian/Ubuntu
   sudo dnf install xvfb  # Fedora

   # Run with virtual display
   xvfb-run -a ./run.sh dev
   ```

2. **Use SSH X11 Forwarding:**
   ```bash
   # Connect with X11 forwarding
   ssh -X user@server

   # Then run
   ./run.sh dev
   ```

3. **Access via Network:**
   The app serves files on localhost. You can access it from another machine:
   ```bash
   # On server - run in background
   ./desktopapp &

   # On client machine - access via browser
   # http://server-ip:port
   ```

### Issue 2: No Browser Opens

**Cause:** WebUI cannot find a default browser.

**Solutions:**

#### Set Default Browser:
```bash
# Check current default
xdg-settings get default-web-browser

# Set default browser (example: Firefox)
xdg-settings set default-web-browser firefox.desktop

# Or Chrome
xdg-settings set default-web-browser google-chrome.desktop
```

#### Install a Browser:
```bash
# Firefox
sudo apt install firefox      # Debian/Ubuntu
sudo dnf install firefox      # Fedora

# Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

### Issue 3: Application Exits Immediately

**Cause:** Build error or missing dependencies.

**Solutions:**

1. **Check build output:**
   ```bash
   ./run.sh build 2>&1 | tail -50
   ```

2. **Verify dependencies:**
   ```bash
   # Check V compiler
   v version

   # Check GCC
   gcc --version

   # Check for required libraries (Linux)
   ldd ./desktopapp | grep "not found"
   ```

3. **Rebuild from clean:**
   ```bash
   ./run.sh clean-all
   ./run.sh install
   ./run.sh build
   ```

### Issue 4: Browser Shows Blank Page

**Cause:** Frontend files not found or JavaScript errors.

**Solutions:**

1. **Check frontend build:**
   ```bash
   ls -la frontend/dist/browser/
   # Should contain: index.html, static/
   ```

2. **Rebuild frontend:**
   ```bash
   cd frontend
   bun run build:rsbuild
   cd ..
   ./run.sh dev
   ```

3. **Check browser console:**
   - Press F12 in browser
   - Check Console tab for errors
   - Check Network tab for failed requests

### Issue 5: Port Already in Use

**Error:** Cannot start server, port in use.

**Solution:**
```bash
# Find process using port
sudo lsof -i :8080

# Kill process
sudo kill -9 <PID>

# Or use different port (modify src/main.v)
```

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DISPLAY` | X11 display server | `:0`, `:1` |
| `WEBUI_TLS` | Enable TLS | `1` |
| `webui_log` | Enable debug logging | `1` |

---

## Platform-Specific Notes

### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt install gcc libgtk-3-dev

# Run
./run.sh dev
```

### Linux (Fedora/RHEL)

```bash
# Install dependencies
sudo dnf install gcc gtk3-devel

# Run
./run.sh dev
```

### macOS

```bash
# Install Xcode command line tools
xcode-select --install

# Run
./run.sh dev
```

### Windows (WSL)

```bash
# WSL requires X server like VcXsrv
# Install VcXsrv on Windows
# Set DISPLAY in WSL
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0

# Run
./run.sh dev
```

---

## Verifying the Application Works

### 1. Check Process is Running
```bash
ps aux | grep desktopapp
```

### 2. Check Listening Port
```bash
netstat -tlnp | grep desktopapp
# or
ss -tlnp | grep desktopapp
```

### 3. Test HTTP Endpoint
```bash
curl http://localhost:8080
# Should return HTML
```

### 4. Check Logs
The application logs everything to stdout:
```
[INFO] - General information
[DEBUG] - Debug information (if debug_mode = true)
[SUCCESS] - Successful operations
[ERROR] - Errors
```

---

## Advanced Configuration

### Change Port
Edit `src/main.v`:
```v
// Before w.show()
w.set_port(8080)  // Set specific port
```

### Enable TLS
```bash
WEBUI_TLS=1 ./run.sh build
```

### Enable Debug Logging
```bash
webui_log=1 ./run.sh build
```

### Set Custom Root Folder
Edit `src/main.v`:
```v
root_folder := '/path/to/frontend/dist/browser'
```

---

## Getting Help

If you still have issues:

1. **Check logs carefully** - Most errors are self-explanatory
2. **Run with verbose output** - `webui_log=1 ./run.sh build`
3. **Check system requirements** - Display, browser, libraries
4. **Review the code** - `src/main.v` and error messages

---

## Quick Reference

```bash
# Full clean build and run
./run.sh clean-all
./run.sh install
./run.sh build
./run.sh dev

# Headless server with Xvfb
xvfb-run -a ./run.sh dev

# With debug logging
webui_log=1 ./run.sh dev

# With TLS
WEBUI_TLS=1 ./run.sh dev
```
