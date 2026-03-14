import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts any integer to Portuguese words with gender support.
 * Handles up to 999,999.
 */
function integerToWords(n: number, gender: 'm' | 'f' = 'm'): string {
    if (n === 0) return 'zero';
    if (n === 100) return 'cem';

    const unitsM = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const unitsF = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const units = gender === 'm' ? unitsM : unitsF;

    const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    let words = '';

    if (n >= 1000) {
        const t = Math.floor(n / 1000);
        words += (t === 1 ? 'mil' : integerToWords(t, gender) + ' mil');
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
 * Specialized converter for currency (always masculine 'reais').
 */
function currencyToWords(amountStr: string, decimalStr: string = '00'): string {
    const cleanInteger = amountStr.replace(/\./g, '');
    const reais = parseInt(cleanInteger);
    const centavos = parseInt(decimalStr);

    if (isNaN(reais)) return '';

    const reaisWords = integerToWords(reais, 'm');
    const suffix = reais === 1 ? 'real' : 'reais';

    if (centavos === 0) return `${reaisWords} ${suffix}`;
    const centavosWords = integerToWords(centavos, 'm');
    return `${reaisWords} ${suffix} e ${centavosWords} centavos`;
}

function sanitizePhonetics(text: string): string {
    // V23.2: ABSOLUTE PURITY & GENDER FIX (FORCE LOAD)
    let result = text
        /**
         * 1. PRE-CLEANING
         */
        .replace(/\.{2,}/g, '.')
        .replace(/[:\-]/g, ',')

        /**
         * 2. PHONETIC ARMOR (CRITICAL PHRASES)
         * We override success and common phrases to lock the engine into BR entonation.
         */
        .replace(/Lançamento realizado/gi, 'Lan-ssa-mén-tu rre-a-li-sa-du')
        .replace(/confirmado/gi, 'con-fir-má-du')
        .replace(/estou aqui/gi, 'is-tô a-quí')
        .replace(/se precisar/gi, 'se pre-ci-sár')
        .replace(/ajuda/gi, 'a-jú-da')
        .replace(/Em março/gi, 'Êm marr-çô')
        .replace(/Março de/gi, 'Marr-çô de')

        /**
         * 3. TRANSLATIONS
         */
        .replace(/\bpix\b/gi, 'píquice')
        .replace(/\bdebit\b/gi, 'débito')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\binter\b/gi, 'ínter')
        .replace(/\bcashback\b/gi, 'dinheiro de volta')
        .replace(/\boff\b/gi, 'desligado')
        .replace(/\boverview\b/gi, 'panorama')

        /**
         * 4. NUMBER EXPANSION WITH GENDER (PRIORITY TRANSACÕES)
         */
        // Specific feminine count for transactions to fix "vinte e dois transações"
        .replace(/\b(\d{1,6})\b\s+(transação|transações)/gi, (_, n, word) => {
            return integerToWords(parseInt(n), 'f') + ' ' + word;
        })

        // Currency (Masculine)
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => currencyToWords(integer, decimal))
        .replace(/R\$\s?([\d.]+)/g, (_, val) => currencyToWords(val))

        // Percentages (Masculine)
        .replace(/([\d.]+)\s?%/g, (_, n) => integerToWords(parseInt(n.replace(/\./g, '')), 'm') + ' por cento')

        // Remaining Integers (Years, etc - usually masculine)
        .replace(/\b(\d{1,6})\b/g, (_, n) => integerToWords(parseInt(n), 'm'))

        /**
         * 5. FINAL POLISH
         */
        .replace(/disposição/gi, 'dis-po-si-ção')
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
         * NATURAL STABILIZATION (V23.2)
         * Using clean spaces. THE "BOM." ANCHOR IS PERMANENTLY REMOVED.
         */
        const phoneticText = `   ${cleanText}   `;

        // Force log for verification
        console.log(`\n>>> [TTS-FORCE-LOAD-v23.2] <<<`);
        console.log(`Original: "${text.substring(0, 50)}..."`);
        console.log(`Phonetic: "${phoneticText.substring(0, 100)}..."\n`);

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
        console.error('[TTS-v23.2] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
