// api/publish-post.js
import { createClient } from '@supabase/supabase-js';

// Multilingual scam keywords (English, French, Spanish)
const scamKeywords = [
    // English
    'urgent', 'wire transfer', 'western union', 'moneygram', 'gift card',
    'paypal', 'cash app', 'zelle', 'bitcoin', 'crypto', 'deposit',
    'advance fee', 'credit card', 'bank transfer', 'send money', 'prepaid',
    'recruitment', 'casting', 'porn', 'actor', 'actress', 'earn', 'opportunity',
    'apply', 'application', 'whatsapp', 'well paid', 'lodging', 'transport',
    'respectable', 'hidden face', 'shooting', 'production',

    // French
    'urgent', 'virement', 'western union', 'moneygram', 'carte cadeau',
    'paypal', 'cash app', 'zelle', 'bitcoin', 'crypto', 'dépôt',
    'frais avance', 'carte de crédit', 'transfert bancaire', 'envoyer de l\'argent', 'prépayé',
    'recrutement', 'casting', 'porno', 'acteur', 'actrice', 'gagnez', 'opportunité',
    'candidature', 'postuler', 'whatsapp', 'bien payé', 'logé', 'véhiculé',
    'respectable', 'visage caché', 'tournage', 'production', 'industriel',
    'triplex prod', 'inscrivez-vous', 'envoyer votre candidature', 'par whatsapp',
    '10.000$', 'métier le mieux payé', 'modèle photos', 'magazines x',
    'visage découvert', 'logés', 'véhiculés',

    // Spanish
    'urgente', 'transferencia', 'western union', 'moneygram', 'tarjeta de regalo',
    'paypal', 'cash app', 'zelle', 'bitcoin', 'cripto', 'depósito',
    'tarifa por adelantado', 'tarjeta de crédito', 'transferencia bancaria', 'enviar dinero', 'prepagado',
    'reclutamiento', 'casting', 'porno', 'actor', 'actriz', 'ganar', 'oportunidad',
    'solicitud', 'postular', 'whatsapp', 'bien pagado', 'alojamiento', 'transporte',
    'respetable', 'cara oculta', 'rodaje', 'producción', 'industrial',
    'inscríbete', 'envía tu solicitud', 'por whatsapp', '10.000$', 'trabajo mejor pagado',
    'fotos para revistas x', 'rostro descubierto', 'alojados', 'transportados'
];

function containsScam(text) {
    const lower = text.toLowerCase();
    return scamKeywords.some(keyword => lower.includes(keyword.toLowerCase()));
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { title, description, imageUrls, userId, isVip } = req.body;
        if (!title || !description || !Array.isArray(imageUrls) || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // --- Scam check (multilingual) ---
        if (containsScam(description)) {
            const supabaseForCheck = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            const { data: profile, error: profileError } = await supabaseForCheck
                .from('profiles')
                .select('subscription_type')
                .eq('id', userId)
                .single();

            if (profileError || !profile || profile.subscription_type !== 'vip') {
                return res.status(403).json({
                    error: 'This post contains suspicious content and requires a VIP subscription to publish.'
                });
            }
        }

        // --- Geolocation (ip‑based) ---
        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
        let location = { city: null, region: null, country: null };
        if (ip && ip !== '::1' && ip !== '127.0.0.1') {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,region,country`);
                const geoData = await geoRes.json();
                if (geoData && geoData.city && geoData.region && geoData.country) {
                    location = { city: geoData.city, region: geoData.region, country: geoData.country };
                }
            } catch (geoErr) {
                console.error('Geolocation error:', geoErr);
            }
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase.from('posts').insert({
            user_id: userId,
            title,
            description,
            images: imageUrls,
            is_vip: isVip ? true : false,
            location,
        });

        if (error) throw error;

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: error.message });
    }
  }
