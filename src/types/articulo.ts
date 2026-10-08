export interface Articulo {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  image: string | null;
  imageCaption: string | null;
  contentHtml: string;
  readingTime: number;
  editionNumber: number;
}