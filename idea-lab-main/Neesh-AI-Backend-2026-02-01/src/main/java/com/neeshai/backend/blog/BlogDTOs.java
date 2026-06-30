package com.neeshai.backend.blog;

import java.util.List;
import java.util.Map;

public class BlogDTOs {

        // Using Map<String, Object> instead of a rigid record so that
        // feedback form data (title, description, fields array) is preserved
        // through JSON serialization/deserialization.

        public record BlogContentDTO(
                        String heading,
                        String coverImageUrl,
                        String introduction,
                        String content,
                        List<Map<String, Object>> customFields) {
        }

        public record UpdateBlogRequest(
                        String heading,
                        String coverImageUrl,
                        String introduction,
                        String content,
                        List<Map<String, Object>> customFields) {
        }
}
