import { useParams, Navigate } from "react-router-dom";
import { parseShareableUrl } from "@/lib/slugify";
import BlogPreview from "./BlogPreview";

const PublicBlog = () => {
  const { slugWithId } = useParams();

  if (!slugWithId) {
    return <Navigate to="/" replace />;
  }

  const parsed = parseShareableUrl(slugWithId);
  if (!parsed) {
    return <Navigate to="/" replace />;
  }

  return <BlogPreview publicId={parsed.id} />;
};

export default PublicBlog;
