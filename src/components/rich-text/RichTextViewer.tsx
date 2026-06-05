'use client'

import { useEffect, useState } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import { richTextExtensions } from './extensions'
import { ImageLightbox } from './ImageLightbox'
import { emptyRichTextDoc, hydrateRichTextImages, richTextDocFromPlainText } from '@/lib/rich-text'
import type { RichTextDoc } from '@/lib/types'

interface RichTextViewerProps {
  value?: RichTextDoc | null
  fallbackText?: string | null
  resolveImageUrl?: (attachmentId: string) => Promise<string>
}

export function RichTextViewer({ value, fallbackText, resolveImageUrl }: RichTextViewerProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState<string | undefined>()

  const editor = useEditor({
    extensions: richTextExtensions,
    content: (value || richTextDocFromPlainText(fallbackText) || emptyRichTextDoc()) as JSONContent,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'rich-text-content rich-text-viewer focus:outline-none' },
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target as HTMLElement
          if (target.tagName === 'IMG') {
            setLightboxSrc(target.getAttribute('src'))
            setLightboxAlt(target.getAttribute('alt') || undefined)
            return true
          }
          return false
        },
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    let cancelled = false
    const next = value || richTextDocFromPlainText(fallbackText) || emptyRichTextDoc()
    const setContent = (doc: RichTextDoc) => {
      if (!cancelled) editor.commands.setContent(doc as JSONContent, { emitUpdate: false })
    }
    if (resolveImageUrl) {
      hydrateRichTextImages(next, resolveImageUrl).then((doc) => setContent(doc || emptyRichTextDoc()))
    } else {
      setContent(next)
    }
    return () => {
      cancelled = true
    }
  }, [editor, fallbackText, resolveImageUrl, value])

  if (!editor) return null
  return (
    <>
      <EditorContent editor={editor} />
      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  )
}
