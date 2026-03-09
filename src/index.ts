#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.MARKHUB_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.MARKHUB_SUPABASE_SERVICE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.stderr.write(
    'Error: MARKHUB_SUPABASE_URL and MARKHUB_SUPABASE_SERVICE_KEY must be set\n'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const server = new Server(
  { name: 'markhub', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
)

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_projects',
      description: 'List all documentation projects',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
    {
      name: 'list_documents',
      description: 'List all documents in a project',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project UUID' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'read_document',
      description: 'Read the full markdown content of a document',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document_id: { type: 'string', description: 'Document UUID' },
        },
        required: ['document_id'],
      },
    },
    {
      name: 'search_documents',
      description: 'Search across all documents using full-text search',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          project_id: { type: 'string', description: 'Limit to specific project' },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'read_project_context',
      description: 'Get project overview with document tree and README',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project UUID' },
        },
        required: ['project_id'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'list_projects': {
      const { data } = await supabase
        .from('projects')
        .select('id, name, slug, description, is_public, updated_at')
        .order('updated_at', { ascending: false })

      return {
        content: [{ type: 'text', text: JSON.stringify({ projects: data ?? [] }, null, 2) }],
      }
    }

    case 'list_documents': {
      const projectId = args?.project_id as string
      const { data } = await supabase
        .from('documents')
        .select('id, title, slug, path, full_path, is_folder, updated_at')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('is_folder', { ascending: false })
        .order('sort_order')
        .order('title')

      return {
        content: [{ type: 'text', text: JSON.stringify({ documents: data ?? [] }, null, 2) }],
      }
    }

    case 'read_document': {
      const docId = args?.document_id as string
      const { data: doc } = await supabase
        .from('documents')
        .select('id, title, full_path, content, updated_at')
        .eq('id', docId)
        .single()

      if (!doc) {
        return { content: [{ type: 'text', text: 'Document not found' }], isError: true }
      }

      return {
        content: [{ type: 'text', text: doc.content ?? '' }],
      }
    }

    case 'search_documents': {
      const query = args?.query as string
      const limit = Math.min((args?.limit as number) ?? 10, 50)

      const { data } = await supabase.rpc('search_documents', {
        search_query: query,
        p_project_id: (args?.project_id as string) ?? null,
        result_limit: limit,
      })

      return {
        content: [{ type: 'text', text: JSON.stringify({ results: data ?? [] }, null, 2) }],
      }
    }

    case 'read_project_context': {
      const projectId = args?.project_id as string

      const { data: project } = await supabase
        .from('projects')
        .select('name, description')
        .eq('id', projectId)
        .single()

      const { data: docs } = await supabase
        .from('documents')
        .select('title, slug, full_path, is_folder, content')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('is_folder', { ascending: false })
        .order('sort_order')

      const tree = (docs ?? [])
        .map((d) => `${d.is_folder ? 'DIR' : 'FILE'} ${d.full_path}`)
        .join('\n')

      const readme = (docs ?? []).find(
        (d) => d.slug?.toLowerCase().includes('readme')
      )

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            project: {
              name: project?.name,
              description: project?.description,
              document_tree: tree,
              readme_content: readme?.content ?? '',
              total_documents: (docs ?? []).filter((d) => !d.is_folder).length,
            },
          }, null, 2),
        }],
      }
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
  }
})

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')

  return {
    resources: [
      {
        uri: 'markhub://projects',
        name: 'All Projects',
        description: 'List of all accessible projects',
        mimeType: 'application/json',
      },
      ...(projects ?? []).map((p) => ({
        uri: `markhub://project/${p.id}`,
        name: `Project: ${p.name}`,
        description: 'Project metadata and document tree',
        mimeType: 'application/json',
      })),
    ],
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri

  if (uri === 'markhub://projects') {
    const { data } = await supabase
      .from('projects')
      .select('id, name, slug, description')

    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data) }],
    }
  }

  const projectMatch = uri.match(/^markhub:\/\/project\/(.+)$/)
  if (projectMatch) {
    const projectId = projectMatch[1]
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(project) }],
    }
  }

  return { contents: [] }
})

// Start
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('MarkHub MCP server running on stdio\n')
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`)
  process.exit(1)
})
