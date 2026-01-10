// MongoDB Key-Value Store Implementation
// Replaces previous Supabase kv_store

import { MongoClient, Db, Collection } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let kvCollection: Collection | null = null;

const getMongoClient = async (): Promise<MongoClient> => {
  if (cachedClient) {
    return cachedClient;
  }

  const mongoUri = Deno.env.get("MONGODB_URI");
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  cachedClient = client;
  return client;
};

const getDatabase = async (): Promise<Db> => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClient();
  const dbName = Deno.env.get("MONGODB_DB_NAME") || "food_nearby";
  cachedDb = client.db(dbName);
  return cachedDb;
};

const getKVCollection = async (): Promise<Collection> => {
  if (kvCollection) {
    return kvCollection;
  }

  const db = await getDatabase();
  kvCollection = db.collection("kv_store");
  
  // Create index on key field for faster lookups
  await kvCollection.createIndex({ key: 1 }, { unique: true });
  
  return kvCollection;
};

// Set stores a key-value pair in the database.
export const set = async (key: string, value: any): Promise<void> => {
  const collection = await getKVCollection();
  await collection.updateOne(
    { key },
    { $set: { key, value, updatedAt: new Date() } },
    { upsert: true }
  );
};

// Get retrieves a key-value pair from the database.
export const get = async (key: string): Promise<any> => {
  const collection = await getKVCollection();
  const doc = await collection.findOne({ key });
  return doc?.value;
};

// Delete deletes a key-value pair from the database.
export const del = async (key: string): Promise<void> => {
  const collection = await getKVCollection();
  await collection.deleteOne({ key });
};

// Sets multiple key-value pairs in the database.
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const collection = await getKVCollection();
  const operations = keys.map((k, i) => ({
    updateOne: {
      filter: { key: k },
      update: { $set: { key: k, value: values[i], updatedAt: new Date() } },
      upsert: true,
    },
  }));
  
  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }
};

// Gets multiple key-value pairs from the database.
export const mget = async (keys: string[]): Promise<any[]> => {
  const collection = await getKVCollection();
  const docs = await collection
    .find({ key: { $in: keys } })
    .toArray();
  
  // Maintain order based on input keys
  return keys.map((k) => docs.find((d) => d.key === k)?.value);
};

// Deletes multiple key-value pairs from the database.
export const mdel = async (keys: string[]): Promise<void> => {
  const collection = await getKVCollection();
  await collection.deleteMany({ key: { $in: keys } });
};

// Search for key-value pairs by prefix.
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const collection = await getKVCollection();
  const docs = await collection
    .find({ key: { $regex: `^${prefix}` } })
    .toArray();
  return docs.map((d) => d.value);
};

// Cleanup function for graceful shutdown
export const closeConnection = async (): Promise<void> => {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    kvCollection = null;
  }
};
