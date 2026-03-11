import { NextResponse } from 'next/server'
import { getAllTags, createTag, getTagByName } from '@/lib/db'
import { createTagSchema } from '@/lib/validation'

export async function GET() {
  const tags = getAllTags()
  return NextResponse.json({ success: true, data: tags })
}

export async function POST(request: Request) {
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
  } catch (err) {
    console.error('POST /api/tags error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to create tag. Please try again.' },
      { status: 500 }
    )
  }
}
