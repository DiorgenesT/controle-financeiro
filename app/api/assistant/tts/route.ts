import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts any integer to Portuguese words.
 * Handles up to 999,999.
 */
function integerToWords(n: number): string {
    if (n === 0) return 'zero';
    if (n === 100) return 'cem';

    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    let words = '';

    if (n >= 1000) {
        const t = Math.floor(n / 1000);
        words += (t === 1 ? 'mil' : integerToWords(t) + ' mil');
        n %= 1000;
        if (n > 0) words += (n < 100 || n % 100 === 0) ? ' e ' : ' ';
    }

    if (n >= 100) {
        words += hundreds[Math.floor(n / 100)];
        n %= 100;
        if (n > 0) words += ' e ';
    }

    if (n >= 20) {
        words += tens[Math.floor(n / 10)];
        n %= 10;
        if (n > 0) words += ' e ' + units[n];
    } else if (n >= 10) {
        words += teens[n - 10];
    } else if (n > 0) {
        words += units[n];
    }

    return words.trim();
}

/**
 * Specialized converter for currency.
 */
function currencyToWords(amountStr: string, decimalStr: string = '00'): string {
    const cleanInteger = amountStr.replace(/\./g, '');
    const reais = parseInt(cleanInteger);
    const centavos = parseInt(decimalStr);

    if (isNaN(reais)) return '';

    const reaisWords = integerToWords(reais);
    const suffix = reais === 1 ? 'real' : 'reais';

    if (centavos === 0) return `${reaisWords} ${suffix}`;
    const centavosWords = integerToWords(centavos);
    return `${reaisWords} ${suffix} e ${centavosWords} centavos`;
}

function sanitizePhonetics(text: string): string {
    // V21.1: ROBUST CLEANING PIPELINE
    let result = text
        /**
         * 1. PRE-CLEANING: Strip trailing/leading extra dots that cause clipping
         */
        .replace(/\.{2,}/g, '.') // Convert ... or .. to single dot
        .replace(/[:\-]/g, ',')  // Convert colons/hyphens to commas for natural pauses

        /**
         * 2. TRANSLATIONS: Mandatory terms
         */
        .replace(/\bpix\b/gi, 'píquice')
        .replace(/\bdebit\b/gi, 'débito')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\binter\b/gi, 'ínter')
        .replace(/\bcashback\b/gi, 'dinheiro de volta')
        .replace(/\boff\b/gi, 'desligado')
        .replace(/\boverview\b/gi, 'panorama')

        /**
         * 3. NUMBER EXPANSION: Convert all digits to words to prevent engine acceleration
         */
        // Currency
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => currencyToWords(integer, decimal))
        .replace(/R\$\s?([\d.]+)/g, (_, val) => currencyToWords(val))

        // Percentages
        .replace(/([\d.]+)\s?%/g, (_, n) => integerToWords(parseInt(n.replace(/\./g, ''))) + ' por cento')

        // Remaining Integers (Years, Counts)
        .replace(/\b(\d{1,6})\b/g, (_, n) => integerToWords(parseInt(n)))

        /**
         * 4. PHONETIC POLISH: Force open Brazilian vowels and rolling R
         */
        .replace(/\brelatório\b/gi, 'rre-lató-rio')
        .replace(/\breceita\b/gi, 'rre-ceita')
        .replace(/\bmarço\b/gi, 'marr-ço')

        /**
         * 5. FINAL CLEANUP
         */
        .replace(/\s+/g, ' ')
        .trim();

    return result;
}

export async function POST(req: Request) {
    try {
        const { text, voice = 'nova' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const cleanText = sanitizePhonetics(text);

        /**
         * STABILIZATION PADDING (V21.1)
         * Using clean spaces to stabilize the engine without jittery punctuation.
         */
        const phoneticText = `    ${cleanText}    `;

        console.log(`[TTS-OpenAI-HD-v21.1] Original: "${text.substring(0, 30)}..."`);
        console.log(`[TTS-OpenAI-HD-v21.1] Phonetic: "${phoneticText.substring(0, 100)}..."`);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: voice as any,
            input: phoneticText,
            speed: 1.0,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('[TTS-OpenAI-HD-v21.1] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
