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
        .replace(/\bdebit\b/gi, 'débito')
        .replace(/\bcredit_card\b/gi, 'cartão de crédito')
        .replace(/\bpix\b/gi, 'pícs')
        .replace(/\bboleto\b/gi, 'bolêto')
        .replace(/\bincome\b/gi, 'receita')
        .replace(/\bexpense\b/gi, 'despesa')
        .replace(/\binstallments\b/gi, 'parcelas')
        .replace(/\bfixed\b/gi, 'fixo')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\bitau\b/gi, 'itaú')
        .replace(/\binter\b/gi, 'ínter')
        .replace(/R\$/g, 'reais')
        .replace(/(\d+),(\d{2})/g, '$1 reais e $2 centavos')
        .replace(/(\d+)\s?reais e 00 centavos/g, '$1 reais')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(req: Request) {
    try {
        const { text, voice = 'shimmer' } = await req.json(); // Switch to shimmer for better BR expression

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const phoneticText = sanitizePhonetics(text);
        console.log(`[TTS] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS] Phonetic: "${phoneticText.substring(0, 50)}..."`);

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
        console.error('[TTS] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech',
            details: error.message
        }, { status: 500 });
    }
}
