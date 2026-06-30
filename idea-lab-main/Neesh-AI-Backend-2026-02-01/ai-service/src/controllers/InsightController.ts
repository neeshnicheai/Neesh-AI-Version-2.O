import { Request, Response } from 'express';
import { InsightService } from '../services/InsightService';

export class InsightController {
    private insightService: InsightService;

    constructor() {
        this.insightService = new InsightService();
    }

    async getProjectHealth(req: Request, res: Response) {
        const { projectId } = req.params;
        try {
            const health = await this.insightService.getProjectHealth(projectId);
            res.json(health);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    async getReadiness(req: Request, res: Response) {
        const { projectId } = req.params;
        try {
            const readiness = await this.insightService.getReadiness(projectId);
            res.json(readiness);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    async getRisks(req: Request, res: Response) {
        const { projectId } = req.params;
        try {
            const risks = await this.insightService.getRisks(projectId);
            res.json(risks);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Question Insights (List)
    // For now, LearningService notifications covers some of this.
    // Implementing basic stub if needed, or rely on existing Learning APIs.
}
