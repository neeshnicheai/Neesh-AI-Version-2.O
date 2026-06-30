package com.neeshai.backend.question;

import com.neeshai.backend.notification.NotificationService;
import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private static final Logger log = LoggerFactory.getLogger(QuestionService.class);

    private final UnansweredQuestionRepository questionRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    public QuestionService(UnansweredQuestionRepository questionRepository,
            ProjectRepository projectRepository,
            NotificationService notificationService) {
        this.questionRepository = questionRepository;
        this.projectRepository = projectRepository;
        this.notificationService = notificationService;
    }

    public QuestionDTOs.QuestionListResponse getUnansweredQuestions(UUID projectId) {
        List<UnansweredQuestion> questions = questionRepository
                .findByProjectIdAndIsResolvedFalseOrderByCreatedAtDesc(projectId);
        List<QuestionDTOs.QuestionResponse> responses = questions.stream()
                .map(QuestionDTOs.QuestionResponse::fromEntity)
                .collect(Collectors.toList());
        return new QuestionDTOs.QuestionListResponse(responses, responses.size());
    }

    @Transactional
    public QuestionDTOs.QuestionResponse reportUnansweredQuestion(UUID projectId, String questionText,
            String userName, String userEmail,
            String persona, String source) {
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        UnansweredQuestion question = new UnansweredQuestion(project, questionText);
        UnansweredQuestion saved = questionRepository.save(question);

        // Also feed into the clustering engine
        try {
            notificationService.ingestQuestion(projectId, questionText, userName, userEmail, persona, source);
        } catch (Exception e) {
            log.error("Failed to ingest question into clustering engine", e);
            // Don't fail the main question report if clustering fails
        }

        return QuestionDTOs.QuestionResponse.fromEntity(saved);
    }

    @Transactional
    public void markAsResolved(UUID questionId, UUID ownerId) {
        UnansweredQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        if (!question.getProject().getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        question.setResolved(true);
        questionRepository.save(question);
    }
}
