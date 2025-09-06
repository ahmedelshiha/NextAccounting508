import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'

interface Props {
  params: {
    slug: string
  }
}

export default async function PostPage({ params }: Props) {
  // Await params before using properties (Next.js app router requirement)
  const { slug } = await params

  // Try find by slug, fallback to id
  let post = await prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true, image: true } } }
  })

  if (!post) {
    post = await prisma.post.findUnique({
      where: { id: slug },
      include: { author: { select: { id: true, name: true, image: true } } }
    })
  }

  if (!post) return notFound()

  const contentHtml = post.content
    ? post.content
        .split('\n\n')
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('')
    : ''

  const displayDate = post.publishedAt ?? post.createdAt ?? new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article className="bg-white rounded-lg shadow-sm p-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>{post.author?.name || 'Author'}</span>
              <span>•</span>
              <span>{new Date(displayDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{post.readTime ? `${post.readTime} min read` : ''}</span>
            </div>
          </header>

          {post.coverImage && (
            <div className="mb-6">
              <Image src={post.coverImage} alt={post.title} width={1200} height={400} className="w-full h-64 object-cover rounded" />
            </div>
          )}

          <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  let post = await prisma.post.findUnique({ where: { slug } })
  if (!post) post = await prisma.post.findUnique({ where: { id: slug } })
  if (!post) return {}

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
  }
}
