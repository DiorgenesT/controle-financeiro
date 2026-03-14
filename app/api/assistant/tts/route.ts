import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts a numeric string to natural Brazilian words for specific bridges.
 */
function convertToWords(amountStr: string, decimalStr: string = '00'): string {
    const cleanInteger = amountStr.replace(/\./g, '');
    const reais = parseInt(cleanInteger);
    const centavos = parseInt(decimalStr);

    if (isNaN(reais)) return '';

    // Literal thousands bridge to ensure perfect pronunciation in HD model
    let phonetic = cleanInteger;
    if (reais >= 1000) {
        const thousands = Math.floor(reais / 1000);
        const remainder = reais % 1000;
        if (remainder === 0) {
            phonetic = `${thousands} mil`;
        } else {
            phonetic = `${thousands} mil e ${remainder}`;
        }
    }

    const suffix = reais === 1 ? 'real' : 'reais';
    if (centavos === 0) return `${phonetic} ${suffix}`;
    return `${phonetic} ${suffix} e ${centavos} centavos`;
}

function sanitizePhonetics(text: string): string {
    return text
        // Technical & UI Term Cleanup (Phonetic Overrides for Brazilian Purity)
        .replace(/\bassistant\b/gi, 'as-sis-tên-te')
        .replace(/\bfinancial\b/gi, 'fi-nan-cei-ro')
        .replace(/\breport\b/gi, 're-la-tó-rio')
        .replace(/\bdólar\b/gi, 'dó-lar')
        .replace(/\bselic\b/gi, 'se-líc')
        .replace(/\bipca\b/gi, 'i-pe-cê-á')
        .replace(/\bpix\b/gi, 'pícs')
        .replace(/\bdebit\b/gi, 'débito')
        .replace(/\bcredit_card\b/gi, 'cartão de crédito')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\binter\b/gi, 'ínter')

        // Conversions
        .replace(/([\d.]+)\s?%/g, '$1 por cento') // 10% -> 10 por cento

        .replace(/^[\d.]+\s+/gm, '')
        .replace(/\b\d+\.\.\./g, '')
        .replace(/[:\-]/g, ',')

        // Currency & Large Numbers Logic (Full phonetic expansion)
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => convertToWords(integer, decimal))
        .replace(/R\$\s?([\d.]+)/g, (_, val) => convertToWords(val))

        // Final safety for large numbers
        .replace(/(\d{1,3})\.(\d{3})/g, '$1$2')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(req: Request) {
    try {
        const { text, voice = 'nova' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const phoneticText = `  ${sanitizePhonetics(text)}  `; // Padding to prevent clipping
        console.log(`[TTS-OpenAI-HD-v16] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS-OpenAI-HD-v16] Phonetic: "${phoneticText.substring(0, 50)}..."`);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: voice as any,
            input: phoneticText,
            speed: 0.95, // Sweet spot for clarity vs natural rhythm
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('[TTS-OpenAI-HD-v16] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
