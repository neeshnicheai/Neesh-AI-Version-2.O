import { useSimilarBlogs, type SimilarBlog } from "@/hooks/usePromotions";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

interface MoreLikeThisProps {
  projectId: string | undefined;
}

const MoreLikeThis = ({ projectId }: MoreLikeThisProps) => {
  const { similarBlogs, loading } = useSimilarBlogs(projectId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const getPublicUrl = (blog: SimilarBlog) => {
    const slug = blog.slug || blog.projectId;
    return `/p/${slug}-${blog.projectId}`;
  };

  const hasBlogs = similarBlogs.length > 0;

  return (
    <div className="mt-10 mb-8">
      {/* Always-visible clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-2 text-left transition-all hover:opacity-80"
      >
        <span className="w-1 h-5 bg-primary rounded-full" />
        <span className="text-base font-semibold text-foreground">
          More Like This…
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
        {hasBlogs && !expanded && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {similarBlogs.length}
          </span>
        )}
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "max-h-[600px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        {loading ? (
          <div className="flex gap-4 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] h-48 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : hasBlogs ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Discover similar blogs you might enjoy
            </p>

            {/* Navigation arrows */}
            <div className="relative">
              {similarBlogs.length > 2 && (
                <div className="absolute -top-8 right-0 flex items-center gap-2 z-10">
                  <button
                    onClick={() => scroll("left")}
                    disabled={!canScrollLeft}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scroll("right")}
                    disabled={!canScrollRight}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Scrollable Carousel */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {similarBlogs.map((blog) => (
                  <a
                    key={blog.projectId}
                    href={getPublicUrl(blog)}
                    className="group flex-shrink-0 w-[280px] bg-card rounded-xl border border-border/30 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    {/* Cover Image */}
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-muted">
                      {blog.coverImageUrl ? (
                        <img
                          src={blog.coverImageUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {blog.title}
                      </h4>
                      {blog.oneLineSummary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {blog.oneLineSummary}
                        </p>
                      )}

                      {/* Author display */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          by {blog.authorName}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 px-4 bg-muted/30 rounded-xl border border-border/30">
            <Sparkles className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              No similar blogs available right now. Check back later —
              Pro users can promote their blogs to appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreLikeThis;
