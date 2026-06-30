package com.neeshai.backend.faq;

import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FAQService {

    private final FAQRepository faqRepository;
    private final ProjectRepository projectRepository;

    public FAQService(FAQRepository faqRepository, ProjectRepository projectRepository) {
        this.faqRepository = faqRepository;
        this.projectRepository = projectRepository;
    }

    public FAQDTOs.FAQListResponse getFAQsForProject(UUID projectId) {
        List<FAQ> faqs = faqRepository.findByProjectIdAndIsActiveTrueOrderByDisplayOrderAsc(projectId);
        List<FAQDTOs.FAQResponse> faqResponses = faqs.stream()
                .map(FAQDTOs.FAQResponse::fromEntity)
                .collect(Collectors.toList());
        return new FAQDTOs.FAQListResponse(faqResponses, faqResponses.size());
    }

    @Transactional
    public FAQDTOs.FAQResponse createFAQ(UUID projectId, UUID ownerId, FAQDTOs.CreateFAQRequest request) {
        Project project = validateProjectOwnership(projectId, ownerId);

        int count = faqRepository.countByProjectIdAndIsActiveTrue(projectId);
        int displayOrder = request.displayOrder() != null ? request.displayOrder() : count;

        FAQ faq = new FAQ(project, request.question(), request.answer(), displayOrder);
        FAQ savedFaq = faqRepository.save(faq);

        return FAQDTOs.FAQResponse.fromEntity(savedFaq);
    }

    @Transactional
    public FAQDTOs.FAQResponse updateFAQ(UUID faqId, UUID ownerId, FAQDTOs.UpdateFAQRequest request) {
        FAQ faq = faqRepository.findById(faqId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found"));

        validateProjectOwnership(faq.getProject().getId(), ownerId);

        if (request.question() != null) {
            faq.setQuestion(request.question());
        }
        if (request.answer() != null) {
            faq.setAnswer(request.answer());
        }
        if (request.displayOrder() != null) {
            faq.setDisplayOrder(request.displayOrder());
        }

        FAQ updatedFaq = faqRepository.save(faq);
        return FAQDTOs.FAQResponse.fromEntity(updatedFaq);
    }

    @Transactional
    public void deleteFAQ(UUID faqId, UUID ownerId) {
        FAQ faq = faqRepository.findById(faqId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found"));

        validateProjectOwnership(faq.getProject().getId(), ownerId);

        faq.setActive(false);
        faqRepository.save(faq);
    }

    private Project validateProjectOwnership(UUID projectId, UUID ownerId) {
        return projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .filter(p -> p.getOwnerId().equals(ownerId))
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or unauthorized"));
    }
}
