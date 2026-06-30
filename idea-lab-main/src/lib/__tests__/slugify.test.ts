import { describe, it, expect } from 'vitest'
import { slugify, generateShareableUrl, parseShareableUrl } from '../slugify'

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('hello@world!#$')).toBe('helloworld')
  })

  it('removes leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('handles multiple spaces and underscores', () => {
    expect(slugify('hello   world___test')).toBe('hello-world-test')
  })
})

describe('generateShareableUrl', () => {
  it('generates correct shareable URL', () => {
    const projectId = 'c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'
    const projectTitle = 'My Amazing Blog Post'

    const url = generateShareableUrl(projectId, projectTitle)
    expect(url).toBe(`http://localhost:3000/p/my-amazing-blog-post-${projectId}`)
  })

  it('handles special characters in title', () => {
    const projectId = 'c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'
    const projectTitle = 'Hello @World! #2023'

    const url = generateShareableUrl(projectId, projectTitle)
    expect(url).toBe(`http://localhost:3000/p/hello-world-2023-${projectId}`)
  })
})

describe('parseShareableUrl', () => {
  it('correctly parses slug with UUID', () => {
    const slugWithId = 'my-amazing-blog-post-c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'

    const result = parseShareableUrl(slugWithId)
    expect(result).toEqual({
      slug: 'my-amazing-blog-post',
      id: 'c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'
    })
  })

  it('returns null for invalid UUID format', () => {
    const slugWithId = 'my-amazing-blog-post-invalid-uuid'

    const result = parseShareableUrl(slugWithId)
    expect(result).toBeNull()
  })

  it('handles slug without additional content', () => {
    const slugWithId = 'c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'

    const result = parseShareableUrl(slugWithId)
    expect(result).toEqual({
      slug: '',
      id: 'c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'
    })
  })

  it('handles empty string', () => {
    const result = parseShareableUrl('')
    expect(result).toBeNull()
  })
})