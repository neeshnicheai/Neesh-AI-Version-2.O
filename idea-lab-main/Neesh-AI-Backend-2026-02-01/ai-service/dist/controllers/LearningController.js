"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningController = void 0;
const LearningService_1 = require("../services/LearningService");
class LearningController {
    constructor() {
        this.learningService = new LearningService_1.LearningService();
    }
    async submitFeedback(req, res) {
        const { logId, questionId, type, comment } = req.body;
        try {
            await this.learningService.submitFeedback(logId, questionId, type, comment);
            res.json({ status: 'success' });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async submitManualAnswer(req, res) {
        // Internal API: needs userId/founderId passed? 
        // Or backend passes it.
        const { projectId, questionId, answer, founderId, answerType } = req.body;
        try {
            await this.learningService.submitManualAnswer(projectId, questionId, answer, answerType || 'OVERRIDE', founderId);
            res.json({ status: 'success' });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async getNotifications(req, res) {
        const { projectId } = req.params;
        try {
            const data = await this.learningService.getNotifications(projectId);
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.LearningController = LearningController;
