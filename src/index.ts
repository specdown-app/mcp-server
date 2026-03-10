#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SPECDOWN_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SPECDOWN_SUPABASE_SERVICE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.stderr.write(
    'Error: SPECDOWN_SUPABASE_URL and SPECDOWN_SUPABASE_SERVICE_KEY must be set\n'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const server = new Server(
  { name: 'specdown', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
)

// ── Tools ─────────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Read-only
    {
      name: 'list_projects',
      description: 'List all documentation projects',
      inputSchema: { type: 'object' as const, properties: {} },
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
      description: 'Read full markdown content of a document by UUID or by project + path',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document_id: { type: 'string', description: 'Document UUID' },
          project_id: { type: 'string', description: 'Project UUID (use with path)' },
          path: { type: 'string', description: 'Document full_path, e.g. /design/SKILL.md' },
        },
      },
    },
    {
      name: 'search_documents',
      description: 'Full-text search across documents',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          project_id: { type: 'string', description: 'Limit to specific project' },
          limit: { type: 'number', description: 'Max results (default 10, max 50)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'read_project_context',
      description: 'Get project overview: description, document tree, and README',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project UUID' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'list_comments',
      description: 'List comments on a document including threaded replies',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document_id: { type: 'string', description: 'Document UUID' },
          include_resolved: { type: 'boolean', description: 'Include resolved comments (default false)' },
        },
        required: ['document_id'],
      },
    },
    // Write
    {
      name: 'add_comment',
      description: 'Add a comment to a document. Can anchor to text or reply to a thread.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document_id: { type: 'string', description: 'Document UUID' },
          project_id: { type: 'string', description: 'Project UUID' },
          content: { type: 'string', description: 'Comment text (max 2000 chars)' },
          selection_text: { type: 'string', description: 'Quoted text this comment anchors to' },
          parent_id: { type: 'string', description: 'Parent comment UUID for threaded reply' },
          author_name: { type: 'string', description: 'Display name (default: "AI Agent")' },
        },
        required: ['document_id', 'project_id', 'content'],
      },
    },
    {
      name: 'create_document',
      description: 'Create a new markdown document or folder in a project',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project UUID' },
          title: { type: 'string', description: 'Document title' },
          content: { type: 'string', description: 'Initial markdown content' },
          parent_path: { type: 'string', description: 'full_path of parent folder, e.g. /design. Root if omitted.' },
          is_folder: { type: 'boolean', description: 'Create a folder instead of a document' },
        },
        required: ['project_id', 'title'],
      },
    },
    {
      name: 'update_document',
      description: 'Replace document content. Auto-skips if unchanged. Creates a version entry.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document_id: { type: 'string', description: 'Document UUID' },
          content: { type: 'string', description: 'New full markdown content' },
          commit_message: { type: 'string', description: 'Optional version commit message' },
        },
        required: ['document_id', 'content'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  switch (name) {
    // ── list_projects ─────────────────────────────────────────────────────
    case 'list_projects': {
      const { data } = await supabase
        .from('projects')
        .select('id, name, slug, description, is_public, updated_at')
        .order('updated_at', { ascending: false })

      return {
        content: [{ type: 'text', text: JSON.stringify({ projects: data ?? [] }, null, 2) }],
      }
    }

    // ── list_documents ────────────────────────────────────────────────────
    case 'list_documents': {
      const { data } = await supabase
        .from('documents')
        .select('id, title, slug, full_path, is_folder, updated_at')
        .eq('project_id', args.project_id as string)
        .is('deleted_at', null)
        .order('full_path')

      return {
        content: [{ type: 'text', text: JSON.stringify({ documents: data ?? [] }, null, 2) }],
      }
    }

    // ── read_document ─────────────────────────────────────────────────────
    case 'read_document': {
      let doc: { content: string | null } | null = null

      if (args.document_id) {
        const { data } = await supabase
          .from('documents')
          .select('id, title, full_path, content, updated_at')
          .eq('id', args.document_id as string)
          .single()
        doc = data
      } else if (args.project_id && args.path) {
        const { data } = await supabase
          .from('documents')
          .select('id, title, full_path, content, updated_at')
          .eq('project_id', args.project_id as string)
          .eq('full_path', args.path as string)
          .single()
        doc = data
      }

      if (!doc) {
        return { content: [{ type: 'text', text: 'Document not found' }], isError: true }
      }

      return { content: [{ type: 'text', text: doc.content ?? '' }] }
    }

    // ── search_documents ──────────────────────────────────────────────────
    case 'search_documents': {
      const limit = Math.min((args.limit as number) ?? 10, 50)
      const { data } = await supabase.rpc('search_documents', {
        search_query: args.query as string,
        p_project_id: (args.project_id as string) ?? null,
        result_limit: limit,
      })

      return {
        content: [{ type: 'text', text: JSON.stringify({ results: data ?? [] }, null, 2) }],
      }
    }

    // ── read_project_context ──────────────────────────────────────────────
    case 'read_project_context': {
      const projectId = args.project_id as string

      const [{ data: project }, { data: docs }] = await Promise.all([
        supabase.from('projects').select('name, description').eq('id', projectId).single(),
        supabase
          .from('documents')
          .select('title, slug, full_path, is_folder, content')
          .eq('project_id', projectId)
          .is('deleted_at', null)
          .order('full_path'),
      ])

      const tree = (docs ?? [])
        .map((d) => `${d.is_folder ? '📁' : '📄'} ${d.full_path}`)
        .join('\n')

      const readme = (docs ?? []).find((d) => d.slug?.toLowerCase().includes('readme'))

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

    // ── list_comments ─────────────────────────────────────────────────────
    case 'list_comments': {
      const includeResolved = (args.include_resolved as boolean) ?? false

      let query = supabase
        .from('comments')
        .select('id, content, selection_text, resolved, resolved_at, parent_id, created_at, anonymous_name')
        .eq('document_id', args.document_id as string)
        .order('created_at', { ascending: true })

      if (!includeResolved) {
        query = query.eq('resolved', false)
      }

      const { data, error } = await query

      if (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ comments: data ?? [] }, null, 2) }],
      }
    }

    // ── add_comment ───────────────────────────────────────────────────────
    case 'add_comment': {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          document_id: args.document_id as string,
          project_id: args.project_id as string,
          content: (args.content as string).trim(),
          selection_text: (args.selection_text as string) ?? null,
          parent_id: (args.parent_id as string) ?? null,
          created_by: null,
          anonymous_name: (args.author_name as string) ?? 'AI Agent',
        })
        .select('id, content, created_at, anonymous_name')
        .single()

      if (error) {
        return { content: [{ type: 'text', text: `Failed: ${error.message}` }], isError: true }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ comment: data }, null, 2) }],
      }
    }

    // ── create_document ───────────────────────────────────────────────────
    case 'create_document': {
      const projectId = args.project_id as string
      const title = (args.title as string).trim()
      const isFolder = (args.is_folder as boolean) ?? false
      const content = (args.content as string) ?? (isFolder ? '' : `# ${title}\n`)
      const parentPath = args.parent_path as string | undefined

      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (!project) {
        return { content: [{ type: 'text', text: 'Project not found' }], isError: true }
      }

      let parentId: string | null = null
      let dirPath = '/'

      if (parentPath) {
        const { data: parentFolder } = await supabase
          .from('documents')
          .select('id, full_path')
          .eq('project_id', projectId)
          .eq('full_path', parentPath)
          .eq('is_folder', true)
          .is('deleted_at', null)
          .single()

        if (!parentFolder) {
          return {
            content: [{ type: 'text', text: `Parent folder not found: ${parentPath}` }],
            isError: true,
          }
        }

        parentId = parentFolder.id
        dirPath = (parentFolder.full_path ?? '') + '/'
      }

      const rawSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      const slug = isFolder ? rawSlug : (rawSlug.endsWith('.md') ? rawSlug : `${rawSlug}.md`)

      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          title,
          slug,
          path: dirPath,
          is_folder: isFolder,
          parent_id: parentId,
          content: isFolder ? '' : content,
          created_by: project.owner_id,
        })
        .select('id, title, full_path, is_folder')
        .single()

      if (error) {
        return { content: [{ type: 'text', text: `Failed: ${error.message}` }], isError: true }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ document: doc }, null, 2) }],
      }
    }

    // ── update_document ───────────────────────────────────────────────────
    case 'update_document': {
      const docId = args.document_id as string
      const content = args.content as string
      const commitMessage = (args.commit_message as string) ?? null

      const { data: existing } = await supabase
        .from('documents')
        .select('content_hash, project_id')
        .eq('id', docId)
        .single()

      if (!existing) {
        return { content: [{ type: 'text', text: 'Document not found' }], isError: true }
      }

      const contentHash = createHash('sha256').update(content).digest('hex')

      if (existing.content_hash === contentHash) {
        return { content: [{ type: 'text', text: 'No changes detected — content is identical' }] }
      }

      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', existing.project_id)
        .single()

      if (!project) {
        return { content: [{ type: 'text', text: 'Project not found' }], isError: true }
      }

      const { error: updateError } = await supabase
        .from('documents')
        .update({ content, content_hash: contentHash, updated_at: new Date().toISOString() })
        .eq('id', docId)

      if (updateError) {
        return { content: [{ type: 'text', text: `Update failed: ${updateError.message}` }], isError: true }
      }

      const { data: version, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: docId,
          content,
          created_by: project.owner_id,
          commit_message: commitMessage,
        })
        .select('id')
        .single()

      if (versionError) {
        return { content: [{ type: 'text', text: `Version save failed: ${versionError.message}` }], isError: true }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, version_id: version.id }, null, 2) }],
      }
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
  }
})

// ── Resources ─────────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const { data: projects } = await supabase.from('projects').select('id, name')

  return {
    resources: [
      {
        uri: 'specdown://projects',
        name: 'All Projects',
        description: 'List of all accessible projects',
        mimeType: 'application/json',
      },
      ...(projects ?? []).map((p) => ({
        uri: `specdown://project/${p.id}`,
        name: `Project: ${p.name}`,
        description: 'Project metadata and document tree',
        mimeType: 'application/json',
      })),
    ],
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  if (uri === 'specdown://projects') {
    const { data } = await supabase.from('projects').select('id, name, slug, description')
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data) }],
    }
  }

  const projectMatch = uri.match(/^specdown:\/\/project\/(.+)$/)
  if (projectMatch) {
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectMatch[1])
      .single()
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(project) }],
    }
  }

  return { contents: [] }
})

// ── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('SpecDown MCP server running on stdio\n')
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`)
  process.exit(1)
})
