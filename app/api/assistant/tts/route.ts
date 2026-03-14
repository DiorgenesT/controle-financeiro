import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
        .replace(/[:\-]/g, ',')      // Replace colons and hyphens with commas for natural pauses

        // Currency & Large Numbers Logic
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => {
            const cleanInteger = integer.replace(/\./g, '');
            const reais = parseInt(cleanInteger);
            const centavos = parseInt(decimal);
            const suffix = reais === 1 ? 'real' : 'reais';
            if (reais === 0 && centavos > 0) return `${centavos} centavos`;
            if (centavos === 0) return `${reais} ${suffix}`;
            return `${reais} ${suffix} e ${centavos} centavos`;
        })
        .replace(/R\$\s?([\d.]+)/g, (_, val) => {
            const clean = val.replace(/\./g, '');
            const reais = parseInt(clean);
            return `${reais} ${reais === 1 ? 'real' : 'reais'}`;
        })
        .replace(/(\d{1,3})\.(\d{3})/g, '$1$2') // Final safety for leftovers like 10.000
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(req: Request) {
    try {
        const { text, voice = 'nova' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const phoneticText = sanitizePhonetics(text);
        console.log(`[TTS-OpenAI] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS-OpenAI] Phonetic: "${phoneticText.substring(0, 50)}..."`);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: phoneticText,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('[TTS-OpenAI] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI',
            details: error.message
        }, { status: 500 });
    }
}
