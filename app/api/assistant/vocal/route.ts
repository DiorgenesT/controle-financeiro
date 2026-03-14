import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts any integer to Portuguese words with gender support.
 * V28: Selective "Stretching" for slower pronunciation of digits.
 */
function integerToWords(n: number, gender: 'm' | 'f' = 'm'): string {
    if (n === 0) return 'zero';
    if (n === 100) return 'cé-ém'; // Stretched

    const unitsM = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const unitsF = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const units = gender === 'm' ? unitsM : unitsF;

    const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinn-te', 'trinn-ta', 'quarenn-ta', 'cinquen-ta', 'sessen-ta', 'seten-ta', 'oitenn-ta', 'noven-ta'];
    const hundreds = ['', 'cento', 'duzen-tos', 'trezen-tos', 'quatro-cen-tos', 'quinhen-tos', 'seiscen-tos', 'setecen-tos', 'oitocen-tos', 'novecen-tos'];

    let words = '';

    if (n >= 1000) {
        const t = Math.floor(n / 1000);
        words += (t === 1 ? 'miiil' : integerToWords(t, gender) + ' miiil');
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
 * V28: Strategic punctuation (dots and commas) to slow down only these segments.
 */
function currencyToWords(amountStr: string, decimalStr: string = '00'): string {
    const cleanInteger = amountStr.replace(/\./g, '');
    const reais = parseInt(cleanInteger);
    const centavos = parseInt(decimalStr);

    if (isNaN(reais)) return '';

    const reaisWords = integerToWords(reais, 'm');
    const suffix = reais === 1 ? 're-al' : 're-ais';

    // Using dot and comma combo to force a natural but slow explanation
    if (centavos === 0) return ` , . . ${reaisWords} ${suffix} . . , `;
    const centavosWords = integerToWords(centavos, 'm');
    return ` , . . ${reaisWords} ${suffix} e ${centavosWords} centavos . . , `;
}

function vocalPurifyV28(text: string): string {
    // V28: SELECTIVE STRETCHING & CACHE-KILLER PATH
    let result = text
        .replace(/\.{2,}/g, '.')
        .replace(/[:]/g, ',')
        .replace(/[!]/g, '.')

        /**
         * 1. EXTREMITY & PHONETIC ANCHORS
         */
        .replace(/^Em\b/gi, 'Êm')
        .replace(/estou aqui/gi, 'istô aqui')
        .replace(/ajuda/gi, 'ajúda')
        .replace(/avisar/gi, 'avisár')
        .replace(/precisar/gi, 'precisár')
        .replace(/disposição/gi, 'dis-pozzi-ssão')
        .replace(/confirmado/gi, 'confir-má-du')
        .replace(/Lançamento realizado/gi, 'Lan-ssamén-tu rre-alizado')

        /**
         * 2. ANALYTICAL SLOWDOWN for Numbers
         */
        .replace(/\b(\d{1,6})\b\s+(transação|transações)/gi, (_, n, word) => {
            return ` , . . ${integerToWords(parseInt(n), 'f')} . . , ${word}`;
        })
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => currencyToWords(integer, decimal))
        .replace(/R\$\s?([\d.]+)/g, (_, val) => currencyToWords(val))
        .replace(/([\d.]+)\s?%/g, (_, n) => ` , . . ${integerToWords(parseInt(n.replace(/\./g, '')), 'm')} por cento . . , `)
        .replace(/\b(\d{1,6})\b/g, (_, n) => ` , . . ${integerToWords(parseInt(n), 'm')} . . , `)

        /**
         * 3. VOWEL OPENING
         */
        .replace(/março/gi, 'marrço')
        .replace(/receita/gi, 'rreceita')
        .replace(/relatório/gi, 'rrela-tório')

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

        const cleanText = vocalPurifyV28(text);

        const starters = ['Pois bem. ', 'Olha só. ', 'Continuando. '];
        const randomStarter = starters[Math.floor(Math.random() * starters.length)];

        // V28: The "Stabilizer" pause
        const phoneticText = ` . . . ${randomStarter} , ${cleanText} . . . `;

        console.log(`\n##################################################`);
        console.log(`[VOCAL-v28-SELECTIVE-SLOWDOWN] Path: /api/assistant/vocal`);
        console.log(`[VOCAL-v28-SELECTIVE-SLOWDOWN] Original: "${text.substring(0, 50)}..."`);
        console.log(`[VOCAL-v28-SELECTIVE-SLOWDOWN] Phonetic: "${phoneticText.substring(0, 250)}..."`);
        console.log(`##################################################\n`);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice: voice as any,
            input: phoneticText,
            speed: 1.0, // Back to normal speed for text, phonetics handle numbers
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new Response(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('[VOCAL-v28] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
