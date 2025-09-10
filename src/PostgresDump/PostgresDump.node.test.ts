import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import { PostgresDump } from './PostgresDump.node';

const POSTGRES_CONTAINER_NAME = 'n8n_test_pg';
const POSTGRES_PORT = 5433; // avoid conflicts
const POSTGRES_USER = 'testuser';
const POSTGRES_PASSWORD = 'secret';
const POSTGRES_DB = 'testdb';

function createMockExecuteFunctions(): IExecuteFunctions {
  return {
    getInputData: () => [{} as INodeExecutionData],
    getNodeParameter: (name: string) => {
      const params: Record<string, any> = {
        host: 'localhost',
        port: POSTGRES_PORT,
        database: POSTGRES_DB,
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
      };
      return params[name];
    },
  } as unknown as IExecuteFunctions;
}

describe('PostgresDump Node Integration', () => {
  beforeAll(() => {
    // Start Postgres container
    execSync(
      `docker run --name ${POSTGRES_CONTAINER_NAME} -e POSTGRES_USER=${POSTGRES_USER} -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} -e POSTGRES_DB=${POSTGRES_DB} -p ${POSTGRES_PORT}:5432 -d postgres:14`,
      { stdio: 'inherit' }
    );

    // Wait for Postgres to be ready
    console.log('Waiting for Postgres to initialize...');
    execSync(`sleep 5`);
  });

  afterAll(() => {
    // Stop and remove container
    execSync(`docker rm -f ${POSTGRES_CONTAINER_NAME}`, { stdio: 'inherit' });
  });

  it('should create a pg dump file', async () => {
    const node = new PostgresDump();
    const result = await node.execute.call(createMockExecuteFunctions());

    const filePath = result[0][0].json.filePath as string;
    expect(filePath).toMatch(/pgdump-\d+\.sql/);

    // Optionally check file exists
    const fs = require('fs');
    expect(fs.existsSync(filePath)).toBe(true);
  },100000);
});
