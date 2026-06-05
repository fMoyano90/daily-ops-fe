import type { RichTextDoc } from '@/lib/types'

type RichTextNode = Record<string, unknown> & { content?: RichTextNode[]; attrs?: Record<string, unknown> }

export function richTextDocFromPlainText(text?: string | null): RichTextDoc | null {
  const lines = (text || '').split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return null
  return {
    type: 'doc',
    content: lines.map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    })),
  }
}

export function emptyRichTextDoc(): RichTextDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

export function isRichTextDocEmpty(doc?: RichTextDoc | null): boolean {
  if (!doc) return true
  return !extractPlainText(doc).trim() && collectImageAttachmentIds(doc).length === 0
}

export function extractPlainText(doc?: RichTextDoc | null): string {
  if (!doc) return ''
  const parts: string[] = []
  collectText(doc as RichTextNode, parts)
  return parts.join('').trim()
}

function collectText(node: RichTextNode, parts: string[]) {
  if (node.type === 'text') {
    parts.push(String(node.text || ''))
    return
  }
  if (node.type === 'image') {
    parts.push(`[${String(node.attrs?.alt || 'imagen')}]`)
    return
  }
  for (const child of node.content || []) collectText(child, parts)
  if (['paragraph', 'heading', 'listItem'].includes(String(node.type))) parts.push('\n')
}

export function collectImageAttachmentIds(doc?: RichTextDoc | null): string[] {
  const ids = new Set<string>()
  if (doc) collectImageIds(doc as RichTextNode, ids)
  return Array.from(ids)
}

function collectImageIds(node: RichTextNode, ids: Set<string>) {
  if (node.type === 'image') {
    const attachmentId = node.attrs?.attachmentId
    if (typeof attachmentId === 'string' && attachmentId) ids.add(attachmentId)
  }
  for (const child of node.content || []) collectImageIds(child, ids)
}

export function replaceImageAttachmentIds(doc: RichTextDoc, replacements: Record<string, { id: string; src?: string }>): RichTextDoc {
  return mapRichTextDoc(doc, (node) => {
    if (node.type !== 'image') return node
    const attachmentId = node.attrs?.attachmentId
    if (typeof attachmentId !== 'string') return node
    const replacement = replacements[attachmentId]
    if (!replacement) return node
    const attrs: Record<string, unknown> = {
      ...node.attrs,
      attachmentId: replacement.id,
    }
    if (replacement.src) attrs.src = replacement.src
    else delete attrs.src
    return {
      ...node,
      attrs,
    }
  })
}

export async function hydrateRichTextImages(
  doc: RichTextDoc | null | undefined,
  resolveUrl: (attachmentId: string) => Promise<string>
): Promise<RichTextDoc | null> {
  if (!doc) return null
  const ids = collectImageAttachmentIds(doc)
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        return [id, await resolveUrl(id)] as const
      } catch {
        return [id, null] as const
      }
    })
  )
  const urls = Object.fromEntries(entries.filter(([, url]) => !!url)) as Record<string, string>
  return mapRichTextDoc(doc, (node) => {
    if (node.type !== 'image') return node
    const attachmentId = node.attrs?.attachmentId
    if (typeof attachmentId !== 'string' || !urls[attachmentId]) return node
    return { ...node, attrs: { ...node.attrs, src: urls[attachmentId] } }
  })
}

function mapRichTextDoc(doc: RichTextDoc, mapper: (node: RichTextNode) => RichTextNode): RichTextDoc {
  const visit = (node: RichTextNode): RichTextNode => {
    const next = mapper({ ...node, attrs: node.attrs ? { ...node.attrs } : undefined })
    if (!next.content) return next
    return { ...next, content: next.content.map(visit) }
  }
  return visit(doc as RichTextNode) as RichTextDoc
}
