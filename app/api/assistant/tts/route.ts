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
 * V26: Adding heavy pause anchors (,,) to uniformize speed.
 */
function currencyToWords(amountStr: string, decimalStr: string = '00'): string {
    const cleanInteger = amountStr.replace(/\./g, '');
    const reais = parseInt(cleanInteger);
    const centavos = parseInt(decimalStr);

    if (isNaN(reais)) return '';

    const reaisWords = integerToWords(reais, 'm');
    const suffix = reais === 1 ? 'real' : 'reais';

    // Triple-comma pause for extreme cadence control
    if (centavos === 0) return ` , , , ${reaisWords} ${suffix} , , , `;
    const centavosWords = integerToWords(centavos, 'm');
    return ` , , , ${reaisWords} ${suffix} e ${centavosWords} centavos , , , `;
}

function sanitizePhonetics(text: string): string {
    // V26: CADENCE MASTERY (ULTRA-UNIFORM SPEED)
    let result = text
        /**
         * 1. PRE-CLEANING
         */
        .replace(/\.{2,}/g, '.')
        .replace(/[:]/g, ',')
        .replace(/[!]/g, '.')

        /**
         * 2. EXTREMITY SHIELDS (PHONETIC LOCK)
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
         * 3. TRANSLATIONS
         */
        .replace(/\bpix\b/gi, 'píquice')
        .replace(/\bnubank\b/gi, 'nubânqui')
        .replace(/\boff\b/gi, 'desligado')

        /**
         * 4. GENDER & NUMBERS (V26: TRIPLE ANCHORS)
         */
        .replace(/\b(\d{1,6})\b\s+(transação|transações)/gi, (_, n, word) => {
            return ` , , , ${integerToWords(parseInt(n), 'f')} , , , ${word}`;
        })
        .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, integer, decimal) => currencyToWords(integer, decimal))
        .replace(/R\$\s?([\d.]+)/g, (_, val) => currencyToWords(val))
        .replace(/([\d.]+)\s?%/g, (_, n) => ` , , , ${integerToWords(parseInt(n.replace(/\./g, '')), 'm')} por cento , , , `)
        .replace(/\b(\d{1,6})\b/g, (_, n) => ` , , , ${integerToWords(parseInt(n), 'm')} , , , `)

        /**
         * 5. VOWEL OPENING
         */
        .replace(/março/gi, 'marrço')
        .replace(/receita/gi, 'rreceita')
        .replace(/relatório/gi, 'rrela-tório')

        /**
         * 6. CLEANING GHOST COMMAS
         */
        .replace(/ , , , /g, ',,,') // Tighten the anchors for the engine
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
         * STABILIZER ANCHORING (V26)
         */
        const starters = ['Tudo certo. ', 'Pois bem. ', 'Olha só. ', 'Continuando. '];
        const randomStarter = starters[Math.floor(Math.random() * starters.length)];

        const phoneticText = `  ${randomStarter} ,,, ${cleanText} .  `;

        console.log(`\n************************************`);
        console.log(`[TTS-FORCE-v26-MASTER] Original: "${text.substring(0, 50)}..."`);
        console.log(`[TTS-FORCE-v26-MASTER] Phonetic: "${phoneticText.substring(0, 200)}..."`);
        console.log(`************************************\n`);

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
        console.error('[TTS-v26] Error:', error);
        return NextResponse.json({
            error: 'Failed to generate speech with OpenAI HD',
            details: error.message
        }, { status: 500 });
    }
}
