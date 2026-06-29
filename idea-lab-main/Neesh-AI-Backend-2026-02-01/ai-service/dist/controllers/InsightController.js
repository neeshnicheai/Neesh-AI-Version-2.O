"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightController = void 0;
const InsightService_1 = require("../services/InsightService");
class InsightController {
    constructor() {
        this.insightService = new InsightService_1.InsightService();
    }
    async getProjectHealth(req, res) {
        const { projectId } = req.params;
        try {
            const health = await this.insightService.getProjectHealth(projectId);
            res.json(health);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async getReadiness(req, res) {
        const { projectId } = req.params;
        try {
            const readiness = await this.insightService.getReadiness(projectId);
            res.json(readiness);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async getRisks(req, res) {
        const { projectId } = req.params;
        try {
            const risks = await this.insightService.getRisks(projectId);
            res.json(risks);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.InsightController = InsightController;
