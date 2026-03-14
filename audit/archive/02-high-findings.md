# High Severity Findings

**Severity**: 🟠 High  
**Count**: 4 findings  
**Impact**: These issues cause functional failures, security gaps, and significant developer friction.

---

## HIGH-001: Authentication Backend Missing

| Attribute | Value |
|-----------|-------|
| **Location** | `frontend/src/services/auth.service.ts` |
| **Severity** | 🟠 High |
| **Effort to Fix** | High (24-40 hours) or Low (2 hours to remove) |
| **Category** | Security, Implementation |

### Description

The frontend `AuthService` implements a comprehensive authentication system with login, register, token verification, profile management, and password changes. However, the V backend has **zero** authentication implementation - no handlers, no user storage, no session management.

### Evidence

**Frontend AuthService** (`frontend/src/services/auth.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Comprehensive auth implementation with:
  // - Login with credentials
  // - Registration
  // - Token verification
  // - Profile updates
  // - Password changes
  // - Role-based authorization
  // - Permission checks

  async login(credentials: LoginCredentials): Promise<Result<UserProfile>> {
    const result = await this.webui.call<{ token: string; UserProfile }>('login', [
      JSON.stringify(credentials),
    ]);
    // ❌ Backend has NO 'login' handler!
  }

  async register(data: RegistrationData): Promise<Result<UserProfile>> {
    const result = await this.webui.call<UserProfile>('register', [JSON.stringify(data)]);
    // ❌ Backend has NO 'register' handler!
  }

  private async verifyToken(token: string): Promise<Result<UserProfile>> {
    return this.webui.call<UserProfile>('verify_token', [token]);
    // ❌ Backend has NO 'verify_token' handler!
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<Result<UserProfile>> {
    const result = await this.webui.call<UserProfile>('update_profile', [
      userId.toString(),
      JSON.stringify(updates)
    ]);
    // ❌ Backend has NO 'update_profile' handler!
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<Result<boolean>> {
    return this.webui.call<boolean>('change_password', [
      userId.toString(),
      oldPassword,
      newPassword
    ]);
    // ❌ Backend has NO 'change_password' handler!
  }

  hasRole(requiredRole: UserRole): boolean {
    // Complete role hierarchy implementation
  }

  hasPermission(permission: UserPermission): boolean {
    // Complete permission checking
  }
}

// Defines complete type system
export type UserRole = 'guest' | 'user' | 'moderator' | 'admin' | 'superadmin';
export type UserPermission = 'read' | 'write' | 'delete' | 'admin' | 'manage_users' | ...;
export interface UserProfile {
  id: number | string;
  username: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
  // ...
}
```

**Backend Reality** (`src/main.v`, `src/app.v`):
```v
// No authentication handlers exist
// No user data structures
// No session management
// No password hashing
// No token generation

// WebUI bindings only include:
w.bind('getSystemInfo', handle_get_system_info)
w.bind('getMemoryStats', handle_get_memory_stats)
w.bind('browseDirectory', handle_browse_directory)
// ... system info handlers only
```

### Impact

1. **All auth features non-functional** - Login, register, profile management all fail
2. **False sense of security** - UI may appear to work but provides no actual security
3. **Wasted development effort** - ~400 lines of frontend auth code with no backend
4. **Potential security risk** - Users might think they're authenticated when they're not
5. **Broken user flows** - Any feature depending on auth will fail

### Recommendation

**Option A: Implement Backend Authentication** (24-40 hours)
1. Add user data structures to V backend
2. Implement password hashing (bcrypt or similar)
3. Create session/token management
4. Add handlers: `login`, `register`, `verify_token`, `logout`, `update_profile`, `change_password`
5. Add user storage (file-based or database)
6. Implement role/permission checking on backend

**Option B: Remove Frontend Auth** (2 hours)
1. Delete `frontend/src/services/auth.service.ts`
2. Remove auth imports from components
3. Update documentation to remove auth references
4. Label as "planned feature" if intended for future

**Option C: Mock Auth for Development** (4 hours)
1. Add mock backend handlers that always succeed
2. Clearly label as development-only
3. Document that real auth is not implemented

### Files to Modify

- `src/app.v` or `src/main.v` - Add auth handlers (Option A)
- `frontend/src/services/auth.service.ts` - Remove or update (Option B)
- `README.md` - Update feature list
- `docs/*.md` - Update auth references

---

## HIGH-002: Build Path Inconsistency

| Attribute | Value |
|-----------|-------|
| **Location** | `run.sh`, `rsbuild.config.ts`, `angular.json` |
| **Severity** | 🟠 High |
| **Effort to Fix** | Low (15 minutes) |
| **Category** | Build/DevOps |

### Description

Three different build output paths are configured across the project, causing the build script to fail when trying to locate the built frontend files.

### Evidence

**run.sh** (line 20):
```bash
# Angular 19+ with application builder outputs to dist/browser/browser/
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser/"
```

**rsbuild.config.ts**:
```typescript
export default defineConfig({
  output: {
    distPath: {
      root: 'dist/browser',  // ❌ Not dist/browser/browser/
    },
    cleanDistPath: false,
  },
  // ...
})
```

**angular.json**:
```json
{
  "build": {
    "builder": "@angular-devkit/build-angular:application",
    "options": {
      "outputPath": "dist-angular",  // ❌ Different path entirely!
    }
  }
}
```

**Actual Angular 19 output** (with `@angular-devkit/build-angular:application`):
```
frontend/dist/browser/
├── browser/
│   ├── index.html
│   ├── main-xxxx.js
│   ├── styles-xxxx.css
│   └── ...
└── server/  (if SSR enabled)
```

### Impact

1. **Build script fails** - `run.sh` cannot find built files
2. **Application cannot start** - Binary loads but no frontend to display
3. **Developer frustration** - Wasted time debugging build issues
4. **CI/CD failures** - Automated builds will fail

### Recommendation

**Fix `run.sh` to use correct path**:

```bash
# Current (wrong)
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser/"

# Fixed - check both possible locations
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser"

# Or better, detect actual output:
if [ -d "${FRONTEND_DIR}/dist/browser/browser" ]; then
    BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser"
elif [ -d "${FRONTEND_DIR}/dist/browser" ]; then
    BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser"
else
    log_error "Build output not found"
    exit 1
fi
```

**Also update rsbuild.config.ts** to match:
```typescript
output: {
    distPath: {
        root: 'dist/browser',  // Keep as-is
    },
}
```

**Remove or update angular.json** if not using Angular CLI for builds.

### Files to Modify

- `run.sh` - Line 20, fix path
- `rsbuild.config.ts` - Verify output path
- `angular.json` - Remove if unused or update to match

---

## HIGH-003: Missing Core DI Infrastructure Files

| Attribute | Value |
|-----------|-------|
| **Location** | `src/core/` (missing files) |
| **Severity** | 🟠 High |
| **Effort to Fix** | Medium-High (8-16 hours implement, 1 hour doc update) |
| **Category** | Architecture |

### Description

Documentation references core DI infrastructure files that don't exist in the codebase.

### Evidence

**Documentation** (`docs/10-backend-dependency-injection.md`):
```
src/
├── core/
│   ├── di_container.v              # Service container implementation
│   └── base_service.v              # Base service types and interfaces
├── services/
│   ├── logging_service.v
│   └── ...
```

**Reality**:
```bash
$ ls -la src/core/
ls: cannot access 'src/core/': No such file or directory

$ find . -name "di_container.v"
# No results

$ find . -name "base_service.v"
# No results
```

**Current src/ structure**:
```
src/
├── app.v
├── config_service.v
├── errors_test.v
├── errors.v
├── file_service.v
├── logging_service.v
├── main.v
├── network_service.v
├── service_provider.v
└── system_info_service.v
```

### Impact

1. **Documentation references non-existent code** - Developers will search for missing files
2. **Cannot implement DI pattern** - Infrastructure doesn't exist
3. **Confusion about architecture** - Unclear what the intended design is
4. **Wasted time** - Developers will look for files that don't exist

### Recommendation

**Option A: Create Missing Files** (8-16 hours)

Create `src/core/di_container.v`:
```v
module core

// ServiceContainer manages service registration and resolution
pub struct ServiceContainer {
mut:
    services     map[string]voidptr
    lifetimes    map[string]ServiceLifetime
    scopes       map[string]Scope
}

pub enum ServiceLifetime {
    singleton
    scoped
    transient
}

// Create a new service container
pub fn new_service_container() ServiceContainer {
    return ServiceContainer{
        services: map[string]voidptr{}
        lifetimes: map[string]ServiceLifetime{}
        scopes: map[string]Scope{}
    }
}

// Register a service
pub fn (mut c ServiceContainer) register<T>(name string, lifetime ServiceLifetime) {
    c.lifetimes[name] = lifetime
}

// Resolve a service
pub fn (mut c ServiceContainer) get<T>(name string) ?T {
    // Implementation
}

// ... additional DI methods
```

Create `src/core/base_service.v`:
```v
module core

// BaseService interface for all services
pub interface IService {
    initialize() bool
    shutdown()
    name() string
}

// ServiceStatus enumeration
pub enum ServiceStatus {
    created
    initializing
    ready
    error
    stopped
}
```

Update `service_provider.v`:
```v
module main

import core

pub fn register_services_in_container(mut container core.ServiceContainer) {
    container.register<LoggingService>('logging', .singleton)
    container.register<SystemInfoService>('system_info', .singleton)
    container.register<FileService>('file', .singleton)
    container.register<NetworkService>('network', .singleton)
    container.register<ConfigService>('config', .singleton)
}

pub fn initialize_services(mut container core.ServiceContainer) {
    logging := container.get<LoggingService>('logging')
    logging.initialize()
    
    system_info := container.get<SystemInfoService>('system_info')
    system_info.initialize()
    
    // ... initialize all services
}
```

**Option B: Update Documentation** (1 hour)

Remove references to non-existent files and document the actual simplified architecture.

### Files to Create/Modify

- `src/core/di_container.v` - Create (Option A)
- `src/core/base_service.v` - Create (Option A)
- `src/service_provider.v` - Update to use container
- `docs/10-backend-dependency-injection.md` - Update or wait for implementation

---

## HIGH-004: WebUI Binding Mismatch

| Attribute | Value |
|-----------|-------|
| **Location** | `src/main.v`, `src/app.v`, `frontend/src/services/webui.service.ts` |
| **Severity** | 🟠 High |
| **Effort to Fix** | Medium (4-8 hours) |
| **Category** | Integration |

### Description

Frontend and backend use different naming conventions for WebUI bindings, and frontend expects handlers that don't exist on the backend.

### Evidence

**Frontend expects** (`frontend/src/services/webui.service.ts`, `auth.service.ts`):
```typescript
// Auth calls (camelCase)
await this.webui.call('login', [credentials])
await this.webui.call('register', [data])
await this.webui.call('verify_token', [token])
await this.webui.call('update_profile', [id, data])
await this.webui.call('change_password', [id, old, new])
await this.webui.call('reset_password', [email])
await this.webui.call('logout')

// System calls (camelCase)
await this.webui.call('getSystemInfo')
await this.webui.call('getMemoryStats')
await this.webui.call('getCpuUsage')
await this.webui.call('getDiskUsage')
await this.webui.call('browseDirectory')
```

**Backend provides** (`src/main.v`):
```v
// snake_case handler functions
fn handle_get_app_info(e &ui.Event) string { ... }
fn handle_get_system_info(e &ui.Event) string { ... }
fn handle_get_memory_stats(e &ui.Event) string { ... }
fn handle_list_processes(e &ui.Event) string { ... }
fn handle_browse_directory(e &ui.Event) string { ... }
fn handle_get_cpu_info(e &ui.Event) string { ... }
fn handle_get_cpu_usage(e &ui.Event) string { ... }
fn handle_get_disk_usage(e &ui.Event) string { ... }
fn handle_get_disk_partitions(e &ui.Event) string { ... }
fn handle_get_network_interfaces(e &ui.Event) string { ... }
fn handle_get_network_stats(e &ui.Event) string { ... }
fn handle_get_ip_addresses(e &ui.Event) string { ... }
fn handle_get_system_load(e &ui.Event) string { ... }
fn handle_get_uptime(e &ui.Event) string { ... }
fn handle_get_hostname_info(e &ui.Event) string { ... }
fn handle_get_user_info(e &ui.Event) string { ... }
fn handle_get_environment_variables(e &ui.Event) string { ... }
fn handle_get_hardware_info(e &ui.Event) string { ... }
fn handle_get_sensor_temperatures(e &ui.Event) string { ... }
fn handle_read_file(e &ui.Event) string { ... }
fn handle_write_file(e &ui.Event) string { ... }
fn handle_create_directory(e &ui.Event) string { ... }
fn handle_delete_file_or_directory(e &ui.Event) string { ... }

// Bindings (mixed naming - some camelCase, some from snake_case)
w.bind('getSystemInfo', handle_get_system_info)      // camelCase binding
w.bind('getMemoryStats', handle_get_memory_stats)    // camelCase binding
w.bind('browseDirectory', handle_browse_directory)   // camelCase binding
w.bind('getCpuInfo', handle_get_cpu_info)            // camelCase binding
// ... etc
```

**Missing backend handlers**:
- `login`
- `register`
- `verify_token`
- `update_profile`
- `change_password`
- `reset_password`
- `logout`

### Impact

1. **Auth features fail immediately** - No backend handlers exist
2. **Naming confusion** - Developers must mentally translate between conventions
3. **Runtime errors** - Calling non-existent functions
4. **Integration friction** - Every new feature requires coordination

### Recommendation

**Standardize on camelCase for WebUI bindings**:

1. **Update backend bindings** to be consistent:
```v
// In main.v or app.v initialization
w.bind('getSystemInfo', app.handle_get_system_info)
w.bind('getMemoryStats', app.handle_get_memory_stats)
w.bind('getCpuInfo', app.handle_get_cpu_info)
w.bind('getCpuUsage', app.handle_get_cpu_usage)
w.bind('getDiskUsage', app.handle_get_disk_usage)
w.bind('getDiskPartitions', app.handle_get_disk_partitions)
w.bind('getNetworkInterfaces', app.handle_get_network_interfaces)
w.bind('getNetworkStats', app.handle_get_network_stats)
w.bind('getIpAddresses', app.handle_get_ip_addresses)
w.bind('getSystemLoad', app.handle_get_system_load)
w.bind('getUptime', app.handle_get_uptime)
w.bind('getHostnameInfo', app.handle_get_hostname_info)
w.bind('getUserInfo', app.handle_get_user_info)
w.bind('getEnvironmentVariables', app.handle_get_environment_variables)
w.bind('getHardwareInfo', app.handle_get_hardware_info)
w.bind('getSensorTemperatures', app.handle_get_sensor_temperatures)
w.bind('readFile', app.handle_read_file)
w.bind('writeFile', app.handle_write_file)
w.bind('createDirectory', app.handle_create_directory)
w.bind('deleteFileOrDirectory', app.handle_delete_file_or_directory)

// Add missing auth handlers (or remove from frontend)
// w.bind('login', app.handle_login)
// w.bind('register', app.handle_register)
// w.bind('logout', app.handle_logout)
// w.bind('verifyToken', app.handle_verify_token)
```

2. **Update frontend** to match exact binding names:
```typescript
// webui.service.ts - ensure call names match backend bindings
async call<T>(functionName: string, ...): Promise<Result<T>> {
    // functionName must exactly match backend binding name
}
```

3. **Create a binding reference document** for developers:
```markdown
# WebUI Binding Reference

| Frontend Call | Backend Handler | Status |
|--------------|-----------------|--------|
| getSystemInfo | handle_get_system_info | ✅ |
| login | (not implemented) | ❌ |
| ... | ... | ... |
```

### Files to Modify

- `src/main.v` or `src/app.v` - Update bindings
- `frontend/src/services/webui.service.ts` - Verify call names
- `frontend/src/services/auth.service.ts` - Remove or implement backend

---

## Summary

| Finding | Root Cause | Business Impact |
|---------|-----------|-----------------|
| HIGH-001 | Frontend built without backend | Auth completely non-functional |
| HIGH-002 | Copy-paste error in build script | Builds fail, app won't start |
| HIGH-003 | Documentation written before implementation | Developer confusion |
| HIGH-004 | No API contract between frontend/backend | Integration failures |

**Overall Assessment**: These high-severity issues represent gaps between frontend expectations and backend reality. The frontend was built assuming backend capabilities that were never implemented.

**Recommended Action**: 
1. **Immediate**: Fix HIGH-002 (build path) - 15 minutes
2. **Short-term**: Decide on auth approach (implement or remove)
3. **Medium-term**: Standardize WebUI binding naming
4. **Documentation**: Update docs to match actual implementation
