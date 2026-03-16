# Rsbuild Configuration for Angular

This directory contains the Rsbuild-based build configuration for the Angular frontend.

## Overview

Rsbuild is a high-performance build tool based on Rspack, optimized for modern web projects. It provides:

- Fast builds with Rspack
- Tree shaking
- Code splitting
- Source maps
- Performance optimizations
- Bundle analysis

## Configuration

The main configuration file is `rsbuild.config.ts`.

### Key Features

1. **TypeScript Support**: SWC loader for fast TypeScript compilation
2. **Sass/SCSS Support**: Via `@rsbuild/plugin-sass`
3. **CSS Modules**: Automatic detection and processing
4. **Asset Handling**: Images, fonts, and other assets
5. **Code Splitting**: Vendor, Angular, and common chunks
6. **Optimization**: Production-ready optimizations

## Commands

```bash
# Development server
bun run dev

# Build for production
bun run build:rsbuild

# Build with watch mode
bun run watch

# Preview production build
bun run preview
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BUILD_TYPE` | Set to 'debug' for development builds | production |
| `CI` | CI/CD environment flag | false |
| `ANALYZE` | Set to 'true' for bundle analysis | false |

### Output Paths

- Development: `dist/browser/`
- Production: `dist/browser/` with hashed filenames

### Aliases

| Alias | Path |
|-------|------|
| `@core` | `src/core` |
| `@views` | `src/views` |
| `@models` | `src/models` |
| `@types` | `src/types` |
| `@environments` | `src/environments` |

## Migration from Rspack

This configuration replaces the previous `rspack.config.js`. Key changes:

1. **Simplified Configuration**: Rsbuild provides sensible defaults
2. **Better Angular Support**: Optimized for Angular projects
3. **Plugin System**: Easier to extend with plugins
4. **Performance**: Improved build times

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Clear the dist folder:
   ```bash
   rm -rf dist
   ```

2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   bun install
   ```

3. Check TypeScript configuration:
   ```bash
   cat tsconfig.json
   ```

### Performance Issues

For slow builds:

1. Enable caching (default)
2. Use `BUILD_TYPE=debug` for faster development builds
3. Consider upgrading to latest Rsbuild version

## Resources

- [Rsbuild Documentation](https://rsbuild.dev/)
- [Rsbuild Configuration](https://rsbuild.dev/config/)
- [Rsbuild Plugins](https://rsbuild.dev/plugins/)

---

*Last updated: 2026-03-16*
