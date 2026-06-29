"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyController = void 0;
const supabase_1 = require("../config/supabase");
const crypto_1 = require("crypto");
class ApiKeyController {
    async getUserApiKeys(req, res) {
        try {
            console.log('[ApiKeyController] Getting API keys for user:', req.user?.id);
            const { data: apiKeys, error } = await supabase_1.supabase
                .from('user_api_keys')
                .select('id, provider, created_at, updated_at')
                .eq('user_id', req.user?.id)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('[ApiKeyController] Database error:', error);
                return res.status(500).json({ error: 'Failed to fetch API keys' });
            }
            // Return keys without the actual API key values for security
            const sanitizedKeys = (apiKeys || []).map(key => ({
                id: key.id,
                provider: key.provider,
                createdAt: key.created_at,
                updatedAt: key.updated_at,
                hasKey: true
            }));
            res.json(sanitizedKeys);
        }
        catch (error) {
            console.error('[ApiKeyController] Error getting API keys:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async saveApiKey(req, res) {
        try {
            const { provider, apiKey } = req.body;
            console.log('[ApiKeyController] Saving API key for provider:', provider);
            if (!provider || !apiKey) {
                return res.status(400).json({ error: 'Provider and API key are required' });
            }
            if (!['GEMINI', 'OPENAI'].includes(provider)) {
                return res.status(400).json({ error: 'Invalid provider. Must be GEMINI or OPENAI' });
            }
            if (apiKey.length < 10 || apiKey.length > 200) {
                return res.status(400).json({ error: 'Invalid API key format' });
            }
            // Check if user already has a key for this provider
            const { data: existingKey, error: findError } = await supabase_1.supabase
                .from('user_api_keys')
                .select('id')
                .eq('user_id', req.user?.id)
                .eq('provider', provider)
                .single();
            if (existingKey) {
                // Update existing key
                const { error: updateError } = await supabase_1.supabase
                    .from('user_api_keys')
                    .update({
                    encrypted_api_key: apiKey, // In production, encrypt this
                    updated_at: new Date().toISOString()
                })
                    .eq('id', existingKey.id);
                if (updateError) {
                    console.error('[ApiKeyController] Update error:', updateError);
                    return res.status(500).json({ error: 'Failed to update API key' });
                }
                console.log('[ApiKeyController] Updated API key for provider:', provider);
                res.json({ message: 'API key updated successfully', provider });
            }
            else {
                // Create new key
                const keyData = {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: req.user?.id,
                    provider,
                    encrypted_api_key: apiKey, // In production, encrypt this
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                const { error: insertError } = await supabase_1.supabase
                    .from('user_api_keys')
                    .insert(keyData);
                if (insertError) {
                    console.error('[ApiKeyController] Insert error:', insertError);
                    return res.status(500).json({ error: 'Failed to save API key' });
                }
                console.log('[ApiKeyController] Created API key for provider:', provider);
                res.status(201).json({ message: 'API key saved successfully', provider });
            }
        }
        catch (error) {
            console.error('[ApiKeyController] Error saving API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async deleteApiKey(req, res) {
        try {
            const { provider } = req.params;
            console.log('[ApiKeyController] Deleting API key for provider:', provider);
            if (!['GEMINI', 'OPENAI'].includes(provider)) {
                return res.status(400).json({ error: 'Invalid provider' });
            }
            const { error } = await supabase_1.supabase
                .from('user_api_keys')
                .delete()
                .eq('user_id', req.user?.id)
                .eq('provider', provider);
            if (error) {
                console.error('[ApiKeyController] Delete error:', error);
                return res.status(500).json({ error: 'Failed to delete API key' });
            }
            console.log('[ApiKeyController] Deleted API key for provider:', provider);
            res.json({ message: 'API key deleted successfully', provider });
        }
        catch (error) {
            console.error('[ApiKeyController] Error deleting API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ApiKeyController = ApiKeyController;
