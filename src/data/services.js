export const shopInfo = {
  name: "Rota Do Corte",
  owner: "Gabriel",
  tagline: "A Arte do Corte & Barbaterapia com Ozónio",
  lateNightBadge: "Aberto até às 22:00",
  address: "Paião - Rua da Direita nº 75, 3090-495 Paião, Figueira da Foz",
  addressShort: "Rua da Direita nº 75, Paião",
  phone: "+351 935 190 491",
  phoneClean: "+351935190491",
  bookingUrl: "https://rotadocorte.tuaagenda.app/?utm_source=ig&utm_medium=social&utm_content=link_in_bio",
  mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=40.07041419999999,-8.8054765",
  instagramHandle: "@rota_do_corte_",
  instagramUrl: "https://www.instagram.com/rota_do_corte_/",
  heroImage: "/images/hero.jpg",
  logoImage: "/images/logo.png",
  hours: [
    { days: "Segunda a Sábado", hours: "10:00 – 22:00", lunch: "Almoço: 13:00 – 14:00", open: true },
    { days: "Domingo", hours: "Encerrado", open: false }
  ]
};

export const servicesData = [
  {
    id: "corte-barba-terapia",
    name: "Corte e Barba Terapia",
    price: 15.0,
    priceFormatted: "15,00 €",
    duration: "40 min",
    badge: "Mais Procurado",
    shortDesc: "A combinação perfeita: corte personalizado com barbaterapia completa a vapor de ozónio.",
    image: "/images/barba_ozonio_real.jpg",
    video: "/videos/corte_barba.mp4",
    featured: true,
    details: [
      "Corte de cabelo completo à escolha",
      "Sessão de barbaterapia com vapor de ozónio",
      "Toalha aquecida e bálsamo pós-barba nutritivo"
    ]
  },
  {
    id: "corte-cabelo",
    name: "Corte de Cabelo",
    price: 10.0,
    priceFormatted: "10,00 €",
    duration: "30 min",
    badge: null,
    shortDesc: "Corte masculino sob medida (degradê, tesoura, militar ou clássico) com acabamento à navalha.",
    image: "/images/gabriel_cutting.jpg",
    video: "/videos/corte_normal.mp4",
    featured: false,
    details: [
      "Visagismo e aconselhamento de estilo",
      "Degradê com transição suave ou tesoura",
      "Pézinho e contornos definidos com navalha"
    ]
  },
  {
    id: "combo-premium",
    name: "Combo Premium",
    price: 20.0,
    priceFormatted: "20,00 €",
    duration: "45 min",
    badge: "Experiência VIP",
    shortDesc: "Cuidado total: Corte, barbaterapia com ozónio, sobrancelha e tratamento facial revitalizante.",
    image: "/images/taper_fade_action.jpg",
    video: "/videos/corte_barba.mp4",
    featured: true,
    details: [
      "Corte de cabelo completo com lavagem",
      "Barbaterapia profunda com vaporizador de ozónio",
      "Limpeza de sobrancelhas e esfoliação facial"
    ]
  },
  {
    id: "corte-sobrancelha",
    name: "Corte de Cabelo + Sobrancelha",
    price: 11.0,
    priceFormatted: "11,00 €",
    duration: "30 min",
    badge: null,
    shortDesc: "Corte completo combinado com o alinhamento e limpeza geométrica da sobrancelha masculina.",
    image: "/images/cut_crop_fade.jpg",
    video: "/videos/razor_art_design.mp4",
    featured: false,
    details: [
      "Corte de cabelo personalizado",
      "Desenho e limpeza de sobrancelha com navalha",
      "Lavagem e finalização com produto matte/brilho"
    ]
  },
  {
    id: "barba-terapia",
    name: "Barba Terapia",
    price: 5.0,
    priceFormatted: "5,00 €",
    duration: "10 min",
    badge: null,
    shortDesc: "Ritual completo com toalha aquecida, vaporizador de ozónio e alinhamento preciso de contornos.",
    image: "/images/barba_ozonio_real.jpg",
    video: "/videos/barbaterapia.mp4",
    featured: false,
    details: [
      "Vaporizador de ozónio para amolecimento dos pelos",
      "Toalha aquecida relaxante e hidratante",
      "Alinhamento à lâmina e finalização suave"
    ]
  }
];
