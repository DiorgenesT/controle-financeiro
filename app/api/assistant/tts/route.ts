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
    // Brazilian Phonetic Armor: Stretch vowels in key words to force open sounds
    const suffixPhonetic = suffix === 'real' ? 'rre-ál' : 'rre-áis';

    if (centavos === 0) return `${phonetic} ${suffixPhonetic}`;
    return `${phonetic} ${suffixPhonetic} e ${centavos} centavos`;
}

function sanitizePhonetics(text: string): string {
    return text
        // Brazilian Phonetic Armor (Doubling vowels to prevent English flattening)
        .replace(/\bassistant\b/gi, 'as-sis-tenn-te')
        .replace(/\bfinanceiro\b/gi, 'fi-nann-cêi-ro')
        .replace(/\brelatório\b/gi, 'rre-la-tó-rio')
        .replace(/\bmarço\b/gi, 'marr-ço')
        .replace(/\bpix\b/gi, 'pícs')
        .replace(/\bdebit\b/gi, 'débito')
        .replace(/\bcredit_card\b/gi, 'cartão de crédito')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\binter\b/gi, 'ínter')
        .replace(/\bdólar\b/gi, 'dó-larr')
        .replace(/\bselic\b/gi, 'se-líc')

        // Conversions
        .replace(/([\d.]+)\s?%/g, '$1 pur-cen-to') // Force open 'o'

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

        const phoneticText = sanitizePhonetics(text);
        console.log(`[TTS-OpenAI-HD-v18] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS-OpenAI-HD-v18] Phonetic: "${phoneticText.substring(0, 50)}..."`);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: voice as any,
            input: phoneticText,
            speed: 1.0, // Reverted to 1.0 to avoid American-accent highlights found in slower speeds
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('[TTS-OpenAI-HD-v18] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
