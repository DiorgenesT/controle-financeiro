import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Sanitize text for natural PT-BR speech.
 * Replaces tech terms, symbols and English words with phonetic Portuguese.
 */
/**
 * Converts a numeric string to natural Brazilian words for currency.
 */
function convertToWords(amountStr: string, decimalStr: string = '00'): string {
    const cleanInteger = amountStr.replace(/\./g, '');
    const reais = parseInt(cleanInteger);
    const centavos = parseInt(decimalStr);

    if (isNaN(reais)) return '';

    // Space injection for better thousand recognition by OpenAI TTS
    const formattedReais = cleanInteger.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

    const suffix = reais === 1 ? 'real' : 'reais';
    // Add commas around the value for phonetic padding (forces a pause)
    if (centavos === 0) return `, ${formattedReais} ${suffix} ,`;
    return `, ${formattedReais} ${suffix} e ${centavos} centavos ,`;
}

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
        .replace(/^[\d.]+\s+/gm, '') // Remove leading list numbers
        .replace(/\b\d+\.\.\./g, '') // Remove list symbols
        .replace(/[:\-]/g, ',')      // Replace colons/dashes with commas

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
        console.log(`[TTS-OpenAI] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS-OpenAI] Phonetic: "${phoneticText.substring(0, 50)}..."`);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: phoneticText,
            speed: 0.9, // 10% slower for better clarity and less "atropelo"
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
