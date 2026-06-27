export const notFoundVerses = [
  {
    reference: "Gênesis 40:4",
    text: "O capitão da guarda os deixou aos cuidados de José, que lhes servia. Depois de certo tempo,",
  },
  {
    reference: "Êxodo 40:4",
    text: "Traga a mesa e arrume sobre ela tudo o que lhe pertence. Depois, traga o candelabro e coloque as suas lâmpadas.",
  },
  {
    reference: "Jó 40:4",
    text: "“Sou indigno; como posso te responder? Ponho a mão sobre a minha boca.",
  },
  {
    reference: "Salmos 40:4",
    text: "Bem-aventurado o homem que põe no SENHOR a sua confiança, que não vai atrás dos orgulhosos nem dos que se afastam para seguir deuses falsos!",
  },
  {
    reference: "Isaías 40:4",
    text: "Todo vale será levantado, e todos os montes e colinas serão nivelados; os terrenos acidentados se tornarão planos, e as escarpas serão aplanadas.",
  },
  {
    reference: "Jeremias 40:4",
    text: "Mas hoje eu o liberto das correntes que prendem as suas mãos. Se você quiser, venha comigo para a Babilônia, e eu cuidarei de você; se, porém, não quiser, pode ficar. Veja! Toda esta terra está diante de você; vá para onde for melhor e correto aos seus olhos.",
  },
  {
    reference: "Ezequiel 40:4",
    text: "Ele me disse: ― Filho do homem, fixe bem os olhos, procure ouvir bem e preste atenção em tudo o que vou mostrar a você, pois para isso você foi trazido aqui. Conte ao povo de Israel tudo o que você vai ver.",
  },
];

export function normalizeNotFoundVerseIndex(index: number) {
  return Math.abs(Math.trunc(index)) % notFoundVerses.length;
}

export function getRandomNotFoundVerseIndex(currentIndex?: number) {
  if (notFoundVerses.length === 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * notFoundVerses.length);

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * notFoundVerses.length);
  }

  return nextIndex;
}
