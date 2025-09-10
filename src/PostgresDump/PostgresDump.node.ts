import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
  INodeExecutionData,
  NodeConnectionType,
} from 'n8n-workflow';
import { exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';

export class PostgresDump implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Postgres Dump',
    name: 'postgresDump',
    group: ['transform'],
    version: 1,
    description: 'Run pg_dump and save dump to a temporary file',
    defaults: {
      name: 'Postgres Dump',
    },
    
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    properties: [
      { displayName: 'Host', name: 'host', type: 'string', default: 'localhost' },
      { displayName: 'Port', name: 'port', type: 'number', default: 5432 },
      { displayName: 'Database', name: 'database', type: 'string', default: '' },
      { displayName: 'Username', name: 'user', type: 'string', default: '' },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: { password: true },
        default: '',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const host = this.getNodeParameter('host', 0) as string;
    const port = this.getNodeParameter('port', 0) as number;
    const database = this.getNodeParameter('database', 0) as string;
    const user = this.getNodeParameter('user', 0) as string;
    const password = this.getNodeParameter('password', 0) as string;

    const tmpFile = path.join(os.tmpdir(), `pgdump-${Date.now()}.sql`);
    const dumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -F p ${database} -f "${tmpFile}"`;

    await new Promise((resolve, reject) => {
      exec(dumpCmd, (error, stdout, stderr) => {
        if (error) return reject(new Error(stderr || error.message));
        resolve(stdout);
      });
    });
    
    return [items.map(() => ({ json: { filePath: tmpFile } }))];
  }
}
