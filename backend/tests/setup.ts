// Runs before every backend test file (see bunfig.toml).
// Sets the env vars the app reads, so tests never depend on your real .env.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.SECRET = "test-session-secret";
process.env.UPLOADTHING_TOKEN ??= "test-uploadthing-token";
process.env.MAPTILER_KEY = "test-maptiler-key";
