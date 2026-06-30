package com.neeshai.backend.notification;

import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final double SIMILARITY_THRESHOLD = 0.6;

    private final QuestionClusterRepository clusterRepository;
    private final ClusterInstanceRepository instanceRepository;
    private final ClusterReplyRepository replyRepository;
    private final ProjectRepository projectRepository;

    private final com.neeshai.backend.email.EmailService emailService;

    public NotificationService(QuestionClusterRepository clusterRepository,
            ClusterInstanceRepository instanceRepository,
            ClusterReplyRepository replyRepository,
            ProjectRepository projectRepository,
            com.neeshai.backend.email.EmailService emailService) {
        this.clusterRepository = clusterRepository;
        this.instanceRepository = instanceRepository;
        this.replyRepository = replyRepository;
        this.projectRepository = projectRepository;
        this.emailService = emailService;
    }

    // ===== Question Intake =====

    @Transactional
    public QuestionCluster ingestQuestion(UUID projectId, String questionText,
            String userName, String userEmail,
            String persona, String source) {
        log.info("Ingesting question for project {}: '{}'", projectId, questionText);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        String normalized = normalize(questionText);

        // Try exact normalized match first
        QuestionCluster cluster = clusterRepository.findByProjectIdAndNormalizedQuestion(projectId, normalized);

        // If no exact match, try fuzzy matching against existing clusters
        if (cluster == null) {
            List<QuestionCluster> existingClusters = clusterRepository
                    .findByProjectIdOrderByPriorityScoreDesc(projectId);
            cluster = findSimilarCluster(normalized, existingClusters);
        }

        if (cluster == null) {
            // Create new cluster
            cluster = new QuestionCluster(project, questionText, normalized);
            cluster.setTotalAskCount(1);
            cluster.setFirstAskedAt(Instant.now());
            cluster.setLastAskedAt(Instant.now());
            cluster = clusterRepository.save(cluster);
            log.info("Created new cluster: {}", cluster.getId());
        } else {
            // Update existing cluster
            cluster.setTotalAskCount(cluster.getTotalAskCount() + 1);
            cluster.setLastAskedAt(Instant.now());
            // If cluster was previously answered, mark as partially answered (new user
            // asking)
            if ("ANSWERED".equals(cluster.getStatus()) || "RESOLVED".equals(cluster.getStatus())) {
                cluster.setStatus("PARTIALLY_ANSWERED");
            }
            cluster = clusterRepository.save(cluster);
            log.info("Added to existing cluster: {} (now {} asks)", cluster.getId(), cluster.getTotalAskCount());
        }

        // Create instance
        ClusterInstance instance = new ClusterInstance(cluster, questionText, source,
                userName, userEmail, persona);
        instanceRepository.save(instance);

        // Recompute priority and persona summary
        recomputeClusterMetadata(cluster);

        return cluster;
    }

    // ===== Cluster Listing =====

    public NotificationDTOs.ClusterListResponse getClusters(UUID projectId, String status,
            String sort, String search) {
        List<QuestionCluster> clusters;
        if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
            clusters = clusterRepository.findByProjectIdAndStatusOrderByPriorityScoreDesc(projectId,
                    status.toUpperCase());
        } else {
            clusters = clusterRepository.findByProjectIdOrderByPriorityScoreDesc(projectId);
        }

        // Apply search filter
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            clusters = clusters.stream()
                    .filter(c -> c.getCanonicalQuestion().toLowerCase().contains(searchLower))
                    .collect(Collectors.toList());
        }

        // Apply sorting
        if ("recent".equalsIgnoreCase(sort)) {
            clusters.sort(Comparator.comparing(QuestionCluster::getLastAskedAt).reversed());
        } else if ("most_asked".equalsIgnoreCase(sort)) {
            clusters.sort(Comparator.comparingInt(QuestionCluster::getTotalAskCount).reversed());
        }
        // default: priority (already sorted by priorityScore desc)

        long unansweredCount = clusterRepository.countUnansweredByProjectId(projectId);

        List<NotificationDTOs.ClusterSummaryResponse> summaries = clusters.stream()
                .map(NotificationDTOs.ClusterSummaryResponse::fromEntity)
                .collect(Collectors.toList());

        return new NotificationDTOs.ClusterListResponse(summaries, summaries.size(), unansweredCount);
    }

    // ===== Cluster Detail =====

    public NotificationDTOs.ClusterDetailResponse getClusterDetail(UUID clusterId) {
        QuestionCluster cluster = clusterRepository.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found: " + clusterId));

        List<ClusterInstance> instances = instanceRepository.findByClusterIdOrderByAskedAtDesc(clusterId);
        List<ClusterReply> replies = replyRepository.findByClusterIdOrderBySentAtDesc(clusterId);

        return new NotificationDTOs.ClusterDetailResponse(
                cluster.getId(),
                cluster.getCanonicalQuestion(),
                cluster.getTotalAskCount(),
                cluster.getStatus(),
                cluster.getPersonaSummary(),
                cluster.getPriorityScore(),
                cluster.getFirstAskedAt(),
                cluster.getLastAskedAt(),
                instances.stream().map(NotificationDTOs.ClusterInstanceDTO::fromEntity).toList(),
                replies.stream().map(NotificationDTOs.ReplyHistoryDTO::fromEntity).toList());
    }

    // ===== Send Reply =====

    @Transactional
    public NotificationDTOs.SendReplyResponse sendReply(UUID clusterId, NotificationDTOs.SendReplyRequest request,
            UUID adminId) {
        QuestionCluster cluster = clusterRepository.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found: " + clusterId));

        List<ClusterInstance> toAnswer;
        if (request.sendToAll()) {
            toAnswer = instanceRepository.findByClusterIdAndStatus(clusterId, "UNANSWERED");
        } else {
            toAnswer = request.instanceIds().stream()
                    .map(id -> instanceRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Instance not found: " + id)))
                    .filter(i -> "UNANSWERED".equals(i.getStatus()))
                    .collect(Collectors.toList());
        }

        Instant now = Instant.now();
        for (ClusterInstance instance : toAnswer) {
            instance.setStatus("ANSWERED");
            instance.setAnsweredAt(now);
            instance.setAnswerContent(request.answerText());
            instance.setAnsweredBy(adminId);
            instanceRepository.save(instance);

            // Send email
            if (instance.getUserEmail() != null && !instance.getUserEmail().isEmpty()) {
                emailService.sendReply(instance.getUserEmail(), request.emailSubject(), request.answerText());
            } else {
                log.info("Skipping email for user '{}' (no email provided)", instance.getUserName());
            }
        }

        // Create reply audit log
        String recipientIdsJson = toAnswer.stream()
                .map(i -> "\"" + i.getId().toString() + "\"")
                .collect(Collectors.joining(",", "[", "]"));

        ClusterReply reply = new ClusterReply(cluster, request.answerText(),
                request.emailSubject(), recipientIdsJson, toAnswer.size(), adminId);
        replyRepository.save(reply);

        // Recompute cluster status
        long totalInstances = instanceRepository.countByClusterId(clusterId);
        long answeredInstances = instanceRepository.countAnsweredByClusterId(clusterId);

        if (answeredInstances >= totalInstances) {
            cluster.setStatus("ANSWERED");
        } else if (answeredInstances > 0) {
            cluster.setStatus("PARTIALLY_ANSWERED");
        }
        clusterRepository.save(cluster);

        return new NotificationDTOs.SendReplyResponse(
                clusterId,
                toAnswer.size(),
                (int) totalInstances,
                cluster.getStatus());
    }

    // ===== Badge Count =====

    public long getUnansweredCount(UUID projectId) {
        return clusterRepository.countUnansweredByProjectId(projectId);
    }

    // ===== Internal Helpers =====

    private void recomputeClusterMetadata(QuestionCluster cluster) {
        List<ClusterInstance> instances = instanceRepository.findByClusterIdOrderByAskedAtDesc(cluster.getId());

        // Persona summary
        Map<String, Long> personaCounts = instances.stream()
                .filter(i -> i.getUserPersona() != null && !i.getUserPersona().isEmpty())
                .collect(Collectors.groupingBy(ClusterInstance::getUserPersona, Collectors.counting()));

        StringBuilder sb = new StringBuilder("{");
        personaCounts.forEach((persona, count) -> {
            if (sb.length() > 1)
                sb.append(",");
            sb.append("\"").append(persona).append("\":").append(count);
        });
        sb.append("}");
        cluster.setPersonaSummary(sb.toString());

        // Priority score = frequency * recency_weight
        double frequency = cluster.getTotalAskCount();
        double hoursSinceLastAsk = (Instant.now().toEpochMilli() - cluster.getLastAskedAt().toEpochMilli()) / 3600000.0;
        double recencyWeight = Math.max(0.1, 1.0 / (1.0 + hoursSinceLastAsk / 24.0)); // decays over days
        cluster.setPriorityScore(frequency * recencyWeight);

        clusterRepository.save(cluster);
    }

    private String normalize(String text) {
        if (text == null)
            return "";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private QuestionCluster findSimilarCluster(String normalized, List<QuestionCluster> existing) {
        QuestionCluster bestMatch = null;
        double bestSimilarity = 0;

        for (QuestionCluster cluster : existing) {
            double similarity = computeSimilarity(normalized, cluster.getNormalizedQuestion());
            if (similarity > SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
                bestMatch = cluster;
                bestSimilarity = similarity;
            }
        }

        if (bestMatch != null) {
            log.info("Fuzzy matched to cluster '{}' with similarity {}", bestMatch.getCanonicalQuestion(),
                    bestSimilarity);
        }

        return bestMatch;
    }

    /**
     * Simple token-overlap based similarity (Jaccard index).
     * Phase 2 will replace this with embedding-based similarity.
     */
    private double computeSimilarity(String a, String b) {
        Set<String> tokensA = new HashSet<>(Arrays.asList(a.split("\\s+")));
        Set<String> tokensB = new HashSet<>(Arrays.asList(b.split("\\s+")));

        // Remove stop words
        Set<String> stopWords = Set.of("a", "an", "the", "is", "are", "was", "were", "be",
                "been", "being", "have", "has", "had", "do", "does", "did", "will", "would",
                "could", "should", "may", "might", "can", "to", "of", "in", "for", "on",
                "with", "at", "by", "from", "as", "into", "about", "what", "how", "which",
                "who", "when", "where", "why", "i", "me", "my", "we", "you", "your", "it",
                "its", "this", "that", "these", "those");
        tokensA.removeAll(stopWords);
        tokensB.removeAll(stopWords);

        if (tokensA.isEmpty() || tokensB.isEmpty())
            return 0;

        Set<String> intersection = new HashSet<>(tokensA);
        intersection.retainAll(tokensB);

        Set<String> union = new HashSet<>(tokensA);
        union.addAll(tokensB);

        return (double) intersection.size() / union.size();
    }
}
