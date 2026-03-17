import { Client, auth } from 'cassandra-driver';
import { env } from './env';

let client: Client | null = null;
let initPromise: Promise<Client> | null = null;

export async function connectDatabase() {
  if (client) return client;
  if (initPromise) return initPromise;

  initPromise = initializeScylla();
  client = await initPromise;
  return client;
}

export function getDatabase() {
  if (!client) throw new Error('ScyllaDB not connected');
  return client;
}

export async function closeDatabase() {
  if (client) {
    await client.shutdown();
    client = null;
  }

  initPromise = null;
}

async function initializeScylla() {
  const keyspace = assertIdentifier(env.scyllaKeyspace);
  const bootstrapClient = new Client(createClientOptions());

  await bootstrapClient.connect();
  await bootstrapClient.execute(
    `CREATE KEYSPACE IF NOT EXISTS ${keyspace}
     WITH replication = {'class': 'SimpleStrategy', 'replication_factor': ${env.scyllaReplicationFactor}}`
  );
  await bootstrapClient.shutdown();

  const appClient = new Client({
    ...createClientOptions(),
    keyspace,
  });

  await appClient.connect();

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users_by_id (
      id text PRIMARY KEY,
      email text,
      password_hash text,
      role text,
      status text,
      failed_login_attempts int,
      last_login timestamp,
      created_at timestamp,
      updated_at timestamp
    )`,
    `CREATE TABLE IF NOT EXISTS users_by_email (
      email text PRIMARY KEY,
      id text,
      password_hash text,
      role text,
      status text,
      failed_login_attempts int,
      last_login timestamp,
      created_at timestamp,
      updated_at timestamp
    )`,
    `CREATE TABLE IF NOT EXISTS users_by_created (
      bucket text,
      created_at timestamp,
      id text,
      email text,
      password_hash text,
      role text,
      status text,
      failed_login_attempts int,
      last_login timestamp,
      updated_at timestamp,
      PRIMARY KEY ((bucket), created_at, id)
    ) WITH CLUSTERING ORDER BY (created_at DESC, id ASC)`,
    `CREATE TABLE IF NOT EXISTS sessions_by_token_hash (
      refresh_token_hash text PRIMARY KEY,
      id text,
      user_id text,
      expires_at timestamp,
      ip_address text,
      user_agent text,
      created_at timestamp
    )`,
  ];

  for (const statement of schemaStatements) {
    await appClient.execute(statement);
  }

  return appClient;
}

function createClientOptions() {
  const authProvider =
    env.scyllaUsername && env.scyllaPassword
      ? new auth.PlainTextAuthProvider(env.scyllaUsername, env.scyllaPassword)
      : undefined;

  return {
    contactPoints: env.scyllaContactPoints,
    localDataCenter: env.scyllaDatacenter,
    protocolOptions: {
      port: env.scyllaPort,
    },
    authProvider,
  };
}

function assertIdentifier(value: string) {
  if (!/^[a-z][a-z0-9_]*$/i.test(value)) {
    throw new Error(`Invalid Scylla identifier: ${value}`);
  }

  return value.toLowerCase();
}
