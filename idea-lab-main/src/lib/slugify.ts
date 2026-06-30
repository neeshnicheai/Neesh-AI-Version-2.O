export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const generateShareableUrl = (projectId: string, projectTitle: string): string => {
  const slug = slugify(projectTitle);
  const baseUrl = window.location.origin;
  return `${baseUrl}/p/${slug}-${projectId}`;
};

export const parseShareableUrl = (slugWithId: string): { slug: string; id: string } | null => {
  // UUID format: 8-4-4-4-12 hex characters (e.g. c7e3f37b-90fe-4d68-a2a7-bca5d2800f27)
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const match = slugWithId.match(uuidRegex);
  if (!match) return null;

  const id = match[1];
  // Slug is everything before the UUID, minus the trailing hyphen separator
  const slug = slugWithId.substring(0, slugWithId.length - id.length).replace(/-$/, '');

  return { slug, id };
};
