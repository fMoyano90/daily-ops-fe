import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'

export const RichTextImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => {
          if (!attributes.attachmentId) return {}
          return { 'data-attachment-id': attributes.attachmentId }
        },
      },
    }
  },
})

export const richTextExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
  }),
  Link.configure({
    autolink: true,
    openOnClick: false,
    protocols: ['http', 'https'],
    HTMLAttributes: { class: 'text-accent underline underline-offset-2' },
  }),
  RichTextImage.configure({
    HTMLAttributes: {
      class: 'rich-text-image',
    },
  }),
]
