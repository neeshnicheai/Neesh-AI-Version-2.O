import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PublicBlog from '@/pages/PublicBlog'
import { mockApiResponses, setupFetchMock } from '@/test/api-mocks'

// Mock the entire BlogPreview component since it's complex
vi.mock('@/pages/BlogPreview', () => ({
  default: ({ publicId }: { publicId?: string }) => (
    <div data-testid="blog-preview">
      Blog Preview for Project: {publicId}
    </div>
  )
}))

describe('Blog Sharing Integration', () => {
  const fetchMock = setupFetchMock()

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderPublicBlogWithRoute = (slug: string) => {
    return render(
      <Router>
        <Routes>
          <Route path="/p/:slugWithId" element={<PublicBlog />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </Router>,
      { wrapper: undefined } // Don't use our wrapper since we're providing Router here
    )
  }

  it('should render blog when valid slug is provided', async () => {
    // Mock successful blog fetch
    fetchMock.mockResolvedValue(mockApiResponses.blog)

    const validSlug = 'amazing-blog-post-c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'

    // Navigate to the route
    window.history.pushState({}, '', `/p/${validSlug}`)

    renderPublicBlogWithRoute(validSlug)

    // Should show loading initially
    expect(screen.getByText('Loading blog...')).toBeInTheDocument()

    // Should render blog preview after loading
    await waitFor(() => {
      expect(screen.getByTestId('blog-preview')).toBeInTheDocument()
      expect(screen.getByText(/Blog Preview for Project: c7e3f37b-90fe-4d68-a2a7-bca5d2800f27/)).toBeInTheDocument()
    })

    // Verify API was called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/public/projects/blog/'),
      expect.any(Object)
    )
  })

  it('should redirect to home when invalid slug is provided', async () => {
    const invalidSlug = 'invalid-slug-without-uuid'

    // Navigate to the route
    window.history.pushState({}, '', `/p/${invalidSlug}`)

    renderPublicBlogWithRoute(invalidSlug)

    // Should show loading initially
    expect(screen.getByText('Loading blog...')).toBeInTheDocument()

    // Should redirect to home after validation fails
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    })

    // API should not be called for invalid slug
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should redirect to home when blog is not found', async () => {
    // Mock 404 response
    fetchMock.mockRejectedValue(new Error('Blog not found'))

    const validSlug = 'non-existent-blog-c7e3f37b-90fe-4d68-a2a7-bca5d2800f27'

    // Navigate to the route
    window.history.pushState({}, '', `/p/${validSlug}`)

    renderPublicBlogWithRoute(validSlug)

    // Should show loading initially
    expect(screen.getByText('Loading blog...')).toBeInTheDocument()

    // Should redirect to home when blog is not found
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    })

    // Verify API was called but failed
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/public/projects/blog/'),
      expect.any(Object)
    )
  })

  it('should handle malformed UUID in slug gracefully', async () => {
    const malformedSlug = 'blog-title-invalid-uuid-format'

    // Navigate to the route
    window.history.pushState({}, '', `/p/${malformedSlug}`)

    renderPublicBlogWithRoute(malformedSlug)

    // Should redirect to home without API call
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })
})