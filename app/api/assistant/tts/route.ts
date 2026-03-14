import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';

// Initialize the Google Cloud TTS client with the credentials from the environment
// We'll use the service account already present in FIREBASE_ADMIN_PRIVATE_KEY
const client = new TextToSpeechClient({
    credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.FIREBASE_PROJECT_ID,
});

/**
 * Sanitize text for natural PT-BR speech.
 * Replaces tech terms, symbols and English words with phonetic Portuguese.
 */
function sanitizePhonetics(text: string): string {
    return text
        // Technical & UI Term Cleanup
        .replace(/\bdebit\b/gi, 'débito')
        .replace(/\bcredit_card\b/gi, 'cartão de crédito')
        .replace(/\bpix\b/gi, 'pícs')
        .replace(/\bboleto\b/gi, 'bolêto')
        .replace(/\bincome\b/gi, 'receita')
        .replace(/\bexpense\b/gi, 'despesa')
        .replace(/\bfixed\b/gi, 'fixo')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\bitau\b/gi, 'itaú')
        .replace(/\binter\b/gi, 'ínter')
        .replace(/\bbradesco\b/gi, 'bradêsco')
        .replace(/\bsantander\b/gi, 'santandér')
        .replace(/^[\d.]+\s+/gm, '') // Remove leading list numbers like "1. "
        .replace(/\b\d+\.\.\./g, '') // Remove list symbols like "1..." or "2..."

        // Currency & Large Numbers Logic
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => {
            const cleanInteger = integer.replace(/\./g, '');
            const reais = parseInt(cleanInteger);
            const centavos = parseInt(decimal);
            const suffix = reais === 1 ? 'real' : 'reais';
            // Space injection for better thousand recognition by TTS
            const formattedReais = cleanInteger.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
            if (centavos === 0) return `${formattedReais} ${suffix}`;
            return `${formattedReais} ${suffix} e ${centavos} centavos`;
        })
        .replace(/R\$\s?([\d.]+)/g, (_, val) => {
            const clean = val.replace(/\./g, '');
            const reais = parseInt(clean);
            const formatted = clean.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
            return `${formatted} ${reais === 1 ? 'real' : 'reais'}`;
        })
        .replace(/(\d{1,3})\.(\d{3})/g, '$1$2') // Final safety for leftovers like 10.000
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const phoneticText = sanitizePhonetics(text);
        console.log(`[TTS-Google] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS-Google] Phonetic: "${phoneticText.substring(0, 50)}..."`);

        const request = {
            input: { text: phoneticText },
            // Voice selection: pt-BR-Neural2-A is one of the most natural Brazilian voices
            voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A' },
            audioConfig: {
                audioEncoding: 'MP3' as const,
                pitch: 0,
                speakingRate: 1.05 // Slightly faster for a more agile feel
            },
        };

        const [response] = await client.synthesizeSpeech(request);
        const buffer = response.audioContent as Buffer;

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('[TTS-Google] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with Google Cloud',
            details: error.message
        }, { status: 500 });
    }
}
