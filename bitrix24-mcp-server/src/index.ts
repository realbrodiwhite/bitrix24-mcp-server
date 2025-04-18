#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { configEnv } from './config.js';

class Bitrix24Server {
  private server: Server;
  private axiosInstance;

  constructor() {
    console.error('[Setup] Initializing Bitrix24 MCP server...');
    this.server = new Server(
      {
        name: configEnv.SERVER_NAME,
        version: configEnv.SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: "https://" + configEnv.BITRIX24_DOMAIN + ".bitrix24." + configEnv.BITRIX24_ZONE + "/rest/" + configEnv.BITRIX24_USER_ID + "/" + configEnv.BITRIX24_WEBHOOK_TOKEN + "/",
      timeout: configEnv.API_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[Error]', error);

    process.on('SIGINT', async () => {
      console.error('[Shutdown] SIGINT received, closing server...');
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_leads',
          description: 'Fetch leads from Bitrix24',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'object', description: 'Filter criteria for leads' },
            },
            required: [],
          },
        },
        {
          name: 'create_lead',
          description: 'Create a new lead in Bitrix24',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Lead title' },
              status: { type: 'string', description: 'Lead status' },
            },
            required: ['title'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('get_leads', async (request) => {
      try {
        const filter = request.input?.filter || {};
        const response = await this.axiosInstance.post('crm.lead.list', {
          filter,
          select: ['*', 'PHONE', 'EMAIL'],
        });
        return { leads: response.data.result };
      } catch (error) {
        console.error('[get_leads] Error:', error);
        throw new McpError(ErrorCode.TOOL_EXECUTION_ERROR, 'Failed to fetch leads');
      }
    });

    this.server.setRequestHandler('create_lead', async (request) => {
      try {
        const { title, status } = request.input || {};
        if (!title) {
          throw new McpError(ErrorCode.INVALID_INPUT, 'Title is required');
        }
        const fields: any = { TITLE: title };
        if (status) {
          fields.STATUS_ID = status;
        }
        const response = await this.axiosInstance.post('crm.lead.add', {
          fields,
        });
        return { leadId: response.data.result };
      } catch (error) {
        console.error('[create_lead] Error:', error);
        throw new McpError(ErrorCode.TOOL_EXECUTION_ERROR, 'Failed to create lead');
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bitrix24 MCP server running on stdio');
  }
}

const server = new Bitrix24Server();
server.run().catch(console.error);
