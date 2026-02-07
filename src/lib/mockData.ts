import banner1 from "@/assets/banner1.jpg";
import banner2 from "@/assets/banner2.jpg";
import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";

export interface Banner {
  id: string;
  image: string;
  title?: string;
  link?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image: string;
  purchased: boolean;
  type: "modules" | "simple";
  purchaseLink?: string;
}

export interface Module {
  id: string;
  productId: string;
  title: string;
  order: number;
}

export interface ModuleContent {
  id: string;
  moduleId: string;
  type: "pdf" | "video" | "link" | "text";
  title: string;
  url?: string;
  content?: string;
}

export interface FeedPost {
  id: string;
  author: string;
  authorAvatar?: string;
  date: string;
  content: string;
  image?: string;
}

export interface CommunityPost {
  id: string;
  userName: string;
  userAvatar?: string;
  date: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
}

export const banners: Banner[] = [
  { id: "1", image: banner1, title: "Novos Conteúdos Disponíveis!", link: "#" },
  { id: "2", image: banner2, title: "Oferta Especial - 50% OFF", link: "#" },
];

export const products: Product[] = [
  { id: "1", name: "Guia Completo PDF", description: "Material exclusivo em PDF", image: product1, purchased: true, type: "modules" },
  { id: "2", name: "Curso em Vídeo", description: "Aulas completas online", image: product2, purchased: true, type: "modules" },
  { id: "3", name: "App Fitness", description: "Aplicativo de treinos", image: product3, purchased: false, type: "simple", purchaseLink: "#" },
  { id: "4", name: "Guia Nutricional", description: "Receitas e dicas", image: product4, purchased: false, type: "simple", purchaseLink: "#" },
];

export const modules: Module[] = [
  { id: "m1", productId: "1", title: "Dia 1", order: 1 },
  { id: "m2", productId: "1", title: "Dia 2", order: 2 },
  { id: "m3", productId: "1", title: "Dia 3", order: 3 },
  { id: "m4", productId: "1", title: "Dia 4", order: 4 },
  { id: "m5", productId: "1", title: "Dia 5", order: 5 },
  { id: "m6", productId: "1", title: "Dia 6", order: 6 },
  { id: "m7", productId: "2", title: "Módulo 1", order: 1 },
  { id: "m8", productId: "2", title: "Módulo 2", order: 2 },
  { id: "m9", productId: "2", title: "Módulo 3", order: 3 },
];

export const feedPosts: FeedPost[] = [
  {
    id: "f1",
    author: "Área de Membros",
    date: "7 de fevereiro",
    content: "🎉 Novo conteúdo disponível! Confira o módulo atualizado com dicas exclusivas para você alcançar seus objetivos mais rápido.",
  },
  {
    id: "f2",
    author: "Área de Membros",
    date: "5 de fevereiro",
    content: "💡 Dica do dia: A consistência é mais importante que a intensidade. Pequenos passos diários levam a grandes resultados!",
  },
];

export const communityPosts: CommunityPost[] = [
  {
    id: "c1",
    userName: "Maria Silva",
    date: "7 de fevereiro às 14:30",
    content: "Estou amando o conteúdo! Já vi resultados incríveis em apenas 2 semanas! 🙌",
    likes: 12,
    comments: 3,
  },
  {
    id: "c2",
    userName: "João Santos",
    date: "6 de fevereiro às 10:15",
    content: "Alguém mais já completou o Dia 5? Achei super prático!",
    likes: 8,
    comments: 5,
  },
];
