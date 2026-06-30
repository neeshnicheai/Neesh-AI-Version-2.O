import { Request, Response } from 'express';
import { LearningService } from '../services/LearningService';

export class LearningController {
    private learningService: LearningService;

    constructor() {
        this.learningService = new LearningService();
    }

    async submitFeedback(req: Request, res: Response) {
        const { logId, questionId, type, comment } = req.body;
        try {
            await this.learningService.submitFeedback(logId, questionId, type, comment);
            res.json({ status: 'success' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    async submitManualAnswer(req: Request, res: Response) {
        // Internal API: needs userId/founderId passed? 
        // Or backend passes it.
        const { projectId, questionId, answer, founderId, answerType } = req.body;
        try {
            await this.learningService.submitManualAnswer(projectId, questionId, answer, answerType || 'OVERRIDE', founderId);
            res.json({ status: 'success' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    async getNotifications(req: Request, res: Response) {
        const { projectId } = req.params;
        try {
            const data = await this.learningService.getNotifications(projectId);
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
