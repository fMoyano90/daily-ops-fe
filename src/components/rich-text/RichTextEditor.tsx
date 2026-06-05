'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import { Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Strikethrough } from 'lucide-react'
import { richTextExtensions } from './extensions'
import { ImageLightbox } from './ImageLightbox'
import { emptyRichTextDoc, hydrateRichTextImages, richTextDocFromPlainText } from '@/lib/rich-text'
import type { RichTextDoc } from '@/lib/types'
import { cn } from '@/lib/utils'

interface UploadedImage {
  attachmentId: string
  src: string
  fileName?: string
}

interface RichTextEditorProps {
  value?: RichTextDoc | null
  fallbackText?: string | null
  placeholder?: string
  minHeightClassName?: string
  onChange: (doc: RichTextDoc, plainText: string) => void
  uploadImage?: (file: File) => Promise<UploadedImage>
  resolveImageUrl?: (attachmentId: string) => Promise<string>
}

export function RichTextEditor({
  value,
  fallbackText,
  placeholder = 'Escribe detalles...',
  minHeightClassName = 'min-h-40',
  onChange,
  uploadImage,
  resolveImageUrl,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialValueRef = useRef(value)
  const initialFallbackRef = useRef(fallbackText)
  const initialResolveImageUrlRef = useRef(resolveImageUrl)
  const initialContent = (value || richTextDocFromPlainText(fallbackText) || emptyRichTextDoc()) as JSONContent

  const getClipboardImage = (event: ClipboardEvent): File | null => {
    const files = Array.from(event.clipboardData?.files || [])
    const pastedFile = files.find((file) => file.type.startsWith('image/'))
    if (pastedFile) return pastedFile

    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
    return imageItem?.getAsFile() || null
  }

  const editor = useEditor({
    extensions: richTextExtensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn('rich-text-content focus:outline-none px-3 py-2', minHeightClassName),
        'aria-label': placeholder,
      },
      handlePaste: (_view, event) => {
        if (!uploadImage) return false
        const image = getClipboardImage(event)
        if (!image) return false
        event.preventDefault()
        void insertImage(image)
        return true
      },
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
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as RichTextDoc, editor.getText())
    },
  })

  useEffect(() => {
    if (!editor) return
    let cancelled = false
    const next = initialValueRef.current || richTextDocFromPlainText(initialFallbackRef.current) || emptyRichTextDoc()
    const setContent = (doc: RichTextDoc) => {
      if (!cancelled) editor.commands.setContent(doc as JSONContent, { emitUpdate: false })
    }
    if (initialResolveImageUrlRef.current) {
      hydrateRichTextImages(next, initialResolveImageUrlRef.current).then((doc) => setContent(doc || emptyRichTextDoc()))
    } else {
      setContent(next)
    }
    return () => {
      cancelled = true
    }
  }, [editor])

  const insertImage = async (file: File) => {
    if (!editor || !uploadImage) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return
    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no puede superar 8MB')
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadImage(file)
      editor.chain().focus().setImage({
        src: uploaded.src,
        alt: uploaded.fileName || file.name,
        title: uploaded.fileName || file.name,
        attachmentId: uploaded.attachmentId,
      } as never).run()
    } catch (err) {
      console.error('Failed to upload image:', err)
      alert(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!editor) return null

  const buttonClass = (active = false) => cn(
    'p-2 rounded-lg text-sm transition-colors',
    active ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text hover:bg-bg-muted'
  )

  return (
    <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-bg-muted/40">
        <button type="button" className={buttonClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><Bold className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><Italic className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><Strikethrough className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()} title="Código"><Code className="w-4 h-4" /></button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={buttonClass(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título"><Heading2 className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo"><Heading3 className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" className={buttonClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita"><Quote className="w-4 h-4" /></button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          className={buttonClass(editor.isActive('link'))}
          onClick={() => {
            const previous = editor.getAttributes('link').href as string | undefined
            const href = window.prompt('URL', previous || 'https://')
            if (href === null) return
            if (!href.trim()) editor.chain().focus().unsetLink().run()
            else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
          }}
          title="Enlace"
        >
          <Link2 className="w-4 h-4" />
        </button>
        {uploadImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) insertImage(file)
              }}
            />
            <button type="button" className={buttonClass(uploading)} onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Imagen">
              <ImagePlus className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  )
}
