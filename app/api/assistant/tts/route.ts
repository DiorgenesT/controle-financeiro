import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts any integer to Portuguese words with gender support.
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
    // V24: EXTREME PORTECTION SHIELD
    let result = text
        /**
         * 1. PRE-CLEANING & PADDING
         */
        .replace(/\.{2,}/g, '.')
        .replace(/[:]/g, ',')
        .replace(/[!]/g, '.') // Eliminate "!" to avoid American entonation peaks

        /**
         * 2. EXTREMITY SHIELDS (PHONETIC LOCK)
         * We enforce PT-BR spelling for words at the very start/end.
         */
        .replace(/^Em\b/gi, 'Êm')
        .replace(/estou aqui/gi, 'istô a-quí')
        .replace(/ajuda/gi, 'a-jú-da')
        .replace(/avisar/gi, 'a-vi-sár')
        .replace(/precisar/gi, 'pre-ci-sár')
        .replace(/disposição/gi, 'dis-po-zi-ssão')
        .replace(/confirmado/gi, 'con-fir-má-du')
        .replace(/Lançamento realizado/gi, 'Lan-ssa-mén-tu rre-a-li-sa-du')

        /**
         * 3. TRANSLATIONS
         */
        .replace(/\bpix\b/gi, 'píquice')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\boff\b/gi, 'desligado')
        .replace(/\boverview\b/gi, 'panorama')

        /**
         * 4. GENDER & NUMBERS
         */
        .replace(/\b(\d{1,6})\b\s+(transação|transações)/gi, (_, n, word) => {
            return integerToWords(parseInt(n), 'f') + ' ' + word;
        })
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => currencyToWords(integer, decimal))
        .replace(/R\$\s?([\d.]+)/g, (_, val) => currencyToWords(val))
        .replace(/([\d.]+)\s?%/g, (_, n) => integerToWords(parseInt(n.replace(/\./g, '')), 'm') + ' por cento')
        .replace(/\b(\d{1,6})\b/g, (_, n) => integerToWords(parseInt(n), 'm'))

        /**
         * 5. VOWEL OPENING (FORCING BR ACCENT)
         */
        .replace(/março/gi, 'marr-çô')
        .replace(/receita/gi, 'rre-ceita')
        .replace(/relatório/gi, 'rre-la-tó-ri-o')
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
         * STABILIZER ANCHORING (V24)
         * Adding a short Portuguese natural starter for every segment to "anchor" the voice.
         * This uses common fillers that sound human and 100% Brazilian.
         */
        const starters = ['Tudo certo. ', 'Pois bem. ', 'Olha só. '];
        const randomStarter = starters[Math.floor(Math.random() * starters.length)];

        // We use the starter only if it's the beginning of a larger response or for success
        // This prevents English inflections in short segments like "Lançamento realizado"
        const phoneticText = `${randomStarter} ${cleanText} .`;

        console.log(`\n####################################`);
        console.log(`[TTS-FORCE-v24] Original: "${text.substring(0, 50)}..."`);
        console.log(`[TTS-FORCE-v24] Phonetic: "${phoneticText.substring(0, 150)}..."`);
        console.log(`####################################\n`);

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
        console.error('[TTS-v24] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
