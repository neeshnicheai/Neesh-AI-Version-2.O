import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBlogs } from '../useBlogs'
import { setupFetchMock, mockApiResponses } from '@/test/api-mocks'
import { AuthContext } from '@/contexts/AuthContext'
import React from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const mockAuthValue = {
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
    isAuthenticated: false,
    token: null,
  }

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthContext.Provider, { value: mockAuthValue },
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    )
}

describe('useBlogs', () => {
  const fetchMock = setupFetchMock()

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.reset()
  })

  it('should fetch public blog successfully', async () => {
    fetchMock.mockResolvedValue(mockApiResponses.blog)

    const { result } = renderHook(() => useBlogs(), {
      wrapper: createWrapper(),
    })

    const blog = await result.current.getPublicBlog('test-project-id')

    expect(blog).toEqual(mockApiResponses.blog)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/public/projects/test-project-id/blog'),
      expect.objectContaining({
        method: 'GET',
      })
    )
  })

  it('should handle fetch error gracefully', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useBlogs(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.getPublicBlog('test-project-id')).rejects.toThrow('Network error')
  })

  it('should handle 404 response for non-existent blog', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Blog not found' }),
    })

    const { result } = renderHook(() => useBlogs(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.getPublicBlog('non-existent-id')).rejects.toThrow()
  })
})