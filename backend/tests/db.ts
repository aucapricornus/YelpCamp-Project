import { beforeAll, afterAll, afterEach } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * Call once at the top of any test file that needs a database.
 * Starts a throwaway in-memory MongoDB, empties it after every test,
 * and shuts it down at the end. Your real database is never touched.
 */
export function useTestDb() {
  let mongo: MongoMemoryServer | undefined;

  beforeAll(async () => {
    // TEST_MONGO_URI lets you point tests at an existing server instead (e.g. in CI).
    // Never point it at a database you care about: every collection gets emptied.
    let uri = process.env.TEST_MONGO_URI;
    if (!uri) {
      mongo = await MongoMemoryServer.create();
      uri = mongo.getUri();
    }
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });
}
