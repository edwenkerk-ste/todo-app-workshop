import { NextResponse } from 'next/server'
import { getAllTags, createTag, getTagByName } from '@/lib/db'
import { createTagSchema } from '@/lib/validation'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const tags = getAllTags()
    return NextResponse.json({ success: true, data: tags })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load tags.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  try {
    const body = await request.json().catch(() => ({}))
    const parseResult = createTagSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.flatten().formErrors.join('; ') },
        { status: 400 }
      )
    }

    const { name, color } = parseResult.data
    const existing = getTagByName(name)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A tag with this name already exists' },
        { status: 409 }
      )
    }

    const tag = createTag({ name, color })
    return NextResponse.json({ success: true, data: tag }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create tag. Please try again.' },
      { status: 500 }
    )
  }
}
