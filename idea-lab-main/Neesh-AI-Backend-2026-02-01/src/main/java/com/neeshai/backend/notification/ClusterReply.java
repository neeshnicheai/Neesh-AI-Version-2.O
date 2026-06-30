package com.neeshai.backend.notification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cluster_replies")
public class ClusterReply {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id", nullable = false)
    private QuestionCluster cluster;

    @Column(name = "answer_content", nullable = false, columnDefinition = "TEXT")
    private String answerContent;

    @Column(name = "email_subject")
    private String emailSubject;

    @Column(name = "recipient_ids", columnDefinition = "TEXT")
    private String recipientIds; // JSON array of instance IDs

    @Column(name = "recipient_count")
    private int recipientCount;

    @Column(name = "sent_by")
    private UUID sentBy;

    @Column(name = "sent_at")
    private Instant sentAt;

    public ClusterReply() {
    }

    public ClusterReply(QuestionCluster cluster, String answerContent, String emailSubject,
            String recipientIds, int recipientCount, UUID sentBy) {
        this.cluster = cluster;
        this.answerContent = answerContent;
        this.emailSubject = emailSubject;
        this.recipientIds = recipientIds;
        this.recipientCount = recipientCount;
        this.sentBy = sentBy;
    }

    @PrePersist
    protected void onCreate() {
        if (sentAt == null)
            sentAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public QuestionCluster getCluster() {
        return cluster;
    }

    public void setCluster(QuestionCluster cluster) {
        this.cluster = cluster;
    }

    public String getAnswerContent() {
        return answerContent;
    }

    public void setAnswerContent(String answerContent) {
        this.answerContent = answerContent;
    }

    public String getEmailSubject() {
        return emailSubject;
    }

    public void setEmailSubject(String emailSubject) {
        this.emailSubject = emailSubject;
    }

    public String getRecipientIds() {
        return recipientIds;
    }

    public void setRecipientIds(String recipientIds) {
        this.recipientIds = recipientIds;
    }

    public int getRecipientCount() {
        return recipientCount;
    }

    public void setRecipientCount(int recipientCount) {
        this.recipientCount = recipientCount;
    }

    public UUID getSentBy() {
        return sentBy;
    }

    public void setSentBy(UUID sentBy) {
        this.sentBy = sentBy;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }
}
