import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import BlogPreview from '../BlogPreview'
import { mockApiResponses, setupFetchMock } from '@/test/api-mocks'

// Mock the hooks
vi.mock('@/hooks/useBlogs', () => ({
  useBlogs: () => ({
    getPublicBlog: vi.fn().mockResolvedValue(mockApiResponses.blog),
  }),
}))

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    getProject: vi.fn().mockResolvedValue(mockApiResponses.project),
  }),
}))

vi.mock('@/hooks/useCoverImage', () => ({
  useCoverImage: () => ({
    coverImage: 'https://example.com/cover.jpg',
  }),
}))

vi.mock('@/hooks/useFAQs', () => ({
  usePublicFAQs: () => ({
    faqs: mockApiResponses.faqs,
    loading: false,
  }),
}))

vi.mock('@/hooks/useQuestions', () => ({
  useQuestions: () => ({
    reportQuestion: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'test-project-id' }),
  }
})

describe('BlogPreview', () => {
  const fetchMock = setupFetchMock()

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.reset()
  })

  it('renders blog preview with loading state initially', () => {
    render(<BlogPreview />)
    expect(screen.getByText('Loading blog...')).toBeInTheDocument()
  })

  it('renders blog content after loading', async () => {
    fetchMock.mockResolvedValue(mockApiResponses.blog)

    render(<BlogPreview />)

    await waitFor(() => {
      expect(screen.getByText('Test Blog')).toBeInTheDocument()
    })
  })

  it('displays "No Blog Content" when no data is available', async () => {
    fetchMock.mockResolvedValue(null)

    render(<BlogPreview />)

    await waitFor(() => {
      expect(screen.getByText('No Blog Content')).toBeInTheDocument()
    })
  })

  it('handles public blog rendering correctly', async () => {
    fetchMock.mockResolvedValue(mockApiResponses.blog)

    render(<BlogPreview publicId="test-public-id" />)

    await waitFor(() => {
      expect(screen.getByText('Test Blog')).toBeInTheDocument()
    })
  })

  it('shows back to editor button when not in public mode', async () => {
    fetchMock.mockResolvedValue(mockApiResponses.blog)

    render(<BlogPreview />)

    await waitFor(() => {
      expect(screen.getByText('Back to Editor')).toBeInTheDocument()
    })
  })

  it('does not show back to editor button in public mode', async () => {
    fetchMock.mockResolvedValue(mockApiResponses.blog)

    render(<BlogPreview publicId="test-public-id" />)

    await waitFor(() => {
      expect(screen.queryByText('Back to Editor')).not.toBeInTheDocument()
    })
  })
})