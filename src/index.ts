#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const API_KEY = process.env.SPECDOWN_API_KEY ?? ''
const API_URL = (process.env.SPECDOWN_API_URL ?? 'https://www.specdown.app').replace(/\/$/, '')

if (!API_KEY) {
  process.stderr.write(
    'Error: SPECDOWN_API_KEY must be set.\n' +
    'Get your key at https://specdown.app/settings/api-keys\n'
  )
  process.exit(1)
}

async function callApi(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${API_URL}/api/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', method, params: params ?? {}, id: 1 }),
  })

  const json = await res.json() as { result?: unknown; error?: { message: string } }
  if (json.error) throw new Error(json.error.message)
  return json.result
}

const server = new Server(
  { name: 'specdown', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const result = await callApi('tools/list') as { tools: unknown[] }
  return { tools: result.tools }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  return await callApi('tools/call', { name, arguments: args ?? {} }) as object
})

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return await callApi('resources/list') as object
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return await callApi('resources/read', { uri: request.params.uri }) as object
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('SpecDown MCP server running\n')
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`)
  process.exit(1)
})
