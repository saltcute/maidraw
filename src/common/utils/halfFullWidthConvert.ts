interface RegExCharset {
    half: RegExp;
    full: RegExp;
    delta: number;
}
interface StringCharset {
    half: string;
    full: string;
}

type Charset = RegExCharset | StringCharset;

const charsets: Record<string, Charset> = {
    latin: { half: /[!-~]/g, full: /[！-～]/g, delta: 0xfee0 },
    hangul1: { half: /[ﾡ-ﾾ]/g, full: /[ᆨ-ᇂ]/g, delta: -0xedf9 },
    hangul2: { half: /[ￂ-ￜ]/g, full: /[ᅡ-ᅵ]/g, delta: -0xee61 },
    kana: {
        half: "｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ",
        full: "。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜",
    },
    extras: {
        half: "¢£¬¯¦¥₩\u0020|←↑→↓■°",
        full: "￠￡￢￣￤￥￦\u3000￨￩￪￫￬￭￮",
    },
};

function toFull(set: Charset) {
    return (c: string) => ("delta" in set ? String.fromCharCode(c.charCodeAt(0) + set.delta) : [...set.full][[...set.half].indexOf(c)]);
}
function toHalf(set: Charset) {
    return (c: string) => ("delta" in set ? String.fromCharCode(c.charCodeAt(0) - set.delta) : [...set.half][[...set.full].indexOf(c)]);
}
const sets = Object.values(charsets);

function getMatchingRegex(set: Charset, target: "half" | "full") {
    if ("delta" in set) {
        return set[target];
    } else {
        return new RegExp(`[${set[target]}]`);
    }
}

export function toFullWidth(str0: string) {
    return sets.reduce((str, set) => str.replace(getMatchingRegex(set, "half"), toFull(set)), str0);
}

export function toHalfWidth(str0: string) {
    return sets.reduce((str, set) => str.replace(getMatchingRegex(set, "full"), toHalf(set)), str0);
}
