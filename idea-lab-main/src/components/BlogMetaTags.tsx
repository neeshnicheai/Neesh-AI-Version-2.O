import { useEffect } from 'react'

interface BlogMetaTagsProps {
  title?: string
  description?: string
  imageUrl?: string
  url?: string
}

const BlogMetaTags = ({ title, description, imageUrl, url }: BlogMetaTagsProps) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | Neesh AI`
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description)
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle && title) {
      ogTitle.setAttribute('content', title)
    }

    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription && description) {
      ogDescription.setAttribute('content', description)
    }

    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage && imageUrl) {
      ogImage.setAttribute('content', imageUrl)
    } else if (ogImage && !imageUrl) {
      // Remove og:image if no image
      ogImage.remove()
    } else if (!ogImage && imageUrl) {
      // Create og:image if it doesn't exist
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:image')
      meta.setAttribute('content', imageUrl)
      document.head.appendChild(meta)
    }

    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl && url) {
      ogUrl.setAttribute('content', url)
    } else if (!ogUrl && url) {
      // Create og:url if it doesn't exist
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:url')
      meta.setAttribute('content', url)
      document.head.appendChild(meta)
    }

    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle && title) {
      twitterTitle.setAttribute('content', title)
    } else if (!twitterTitle && title) {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:title')
      meta.setAttribute('content', title)
      document.head.appendChild(meta)
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (twitterDescription && description) {
      twitterDescription.setAttribute('content', description)
    } else if (!twitterDescription && description) {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:description')
      meta.setAttribute('content', description)
      document.head.appendChild(meta)
    }

    const twitterImage = document.querySelector('meta[name="twitter:image"]')
    if (twitterImage && imageUrl) {
      twitterImage.setAttribute('content', imageUrl)
    } else if (!twitterImage && imageUrl) {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:image')
      meta.setAttribute('content', imageUrl)
      document.head.appendChild(meta)
    }

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      document.title = 'Neesh AI – Validate Your Ideas with AI'

      const resetDescription = document.querySelector('meta[name="description"]')
      if (resetDescription) {
        resetDescription.setAttribute('content', 'AI-powered content and niche project validation platform')
      }

      const resetOgTitle = document.querySelector('meta[property="og:title"]')
      if (resetOgTitle) {
        resetOgTitle.setAttribute('content', 'Neesh AI – Validate Your Ideas with AI')
      }

      const resetOgDescription = document.querySelector('meta[property="og:description"]')
      if (resetOgDescription) {
        resetOgDescription.setAttribute('content', 'AI-powered content and niche project validation platform')
      }
    }
  }, [title, description, imageUrl, url])

  return null // This component doesn't render anything
}

export default BlogMetaTags