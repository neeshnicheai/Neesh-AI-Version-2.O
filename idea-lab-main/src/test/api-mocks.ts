import { vi } from 'vitest'

// Mock API responses
export const mockApiResponses = {
  // User/Auth responses
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },

  // Project responses
  project: {
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test Description',
    ownerId: 'test-user-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },

  // Blog responses
  blog: {
    id: 'test-blog-id',
    heading: 'Test Blog',
    coverImageUrl: 'https://example.com/image.jpg',
    introduction: 'Test Introduction',
    content: 'Test Content',
    customFields: [],
  },

  // Chat responses
  chatResponse: {
    answer: 'This is a test response from the AI assistant.',
  },

  // FAQ responses
  faqs: [
    {
      id: 'faq-1',
      question: 'What is this about?',
      answer: 'This is a test FAQ answer.',
    }
  ]
}

// Mock API client
export const createMockApiClient = () => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}

// Mock fetch for global fetch calls
export const setupFetchMock = () => {
  global.fetch = vi.fn()

  return {
    mockResolvedValue: (value: any) => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => value,
        text: async () => JSON.stringify(value),
      })
    },
    mockRejectedValue: (error: any) => {
      (global.fetch as any).mockRejectedValue(error)
    },
    reset: () => {
      (global.fetch as any).mockReset()
    }
  }
}