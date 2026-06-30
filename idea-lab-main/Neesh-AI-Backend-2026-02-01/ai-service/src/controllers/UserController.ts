import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

const FREE_PROJECT_LIMIT = 5;
const PRO_PROJECT_LIMIT = 999;

export class UserController {

    async getSubscription(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            const { data: user } = await supabase
                .from('users')
                .select('subscription_plan, subscription_expires_at, custom_logo_url, custom_branding_text')
                .eq('id', userId)
                .single();

            const plan = user?.subscription_plan?.toUpperCase() === 'PRO' ? 'PRO' : 'FREE';

            const { count: projectCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', userId)
                .eq('deleted', false);

            const maxProjects = plan === 'PRO' ? PRO_PROJECT_LIMIT : FREE_PROJECT_LIMIT;
            const count = projectCount || 0;

            res.json({
                plan,
                projectCount: count,
                maxProjects,
                canCreateProject: count < maxProjects,
                customLogoUrl: user?.custom_logo_url || '',
                customBrandingText: user?.custom_branding_text || '',
                subscriptionExpiresAt: user?.subscription_expires_at || null,
            });
        } catch (error) {
            console.error('[UserController] getSubscription error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async upgradeToPro(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            const { error } = await supabase
                .from('users')
                .update({
                    subscription_plan: 'PRO',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (error) throw error;

            res.json({ success: true, plan: 'PRO' });
        } catch (error) {
            console.error('[UserController] upgradeToPro error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateBranding(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { customLogoUrl, customBrandingText } = req.body;

            await supabase
                .from('users')
                .update({
                    custom_logo_url: customLogoUrl || null,
                    custom_branding_text: customBrandingText || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            res.json({ success: true });
        } catch (error) {
            console.error('[UserController] updateBranding error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
