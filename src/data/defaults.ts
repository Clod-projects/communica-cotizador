export type CatalogItem = {
  item_key: string;
  category: string;
  label: string;
  emoji: string;
  unit: string;
  base_price: number;
};

export const fallbackCatalog: CatalogItem[] = [
  { item_key: "MIC_WIRELESS", category: "Microfonía", label: "Micrófono inalámbrico", emoji: "🎤", unit: "pieza", base_price: 0 },
  { item_key: "PA_151_400", category: "Audio", label: "PA para 151–400", emoji: "🔊", unit: "evento", base_price: 0 },
  { item_key: "LIGHT_AMBIENT", category: "Iluminación", label: "Ambiente premium", emoji: "💡", unit: "evento", base_price: 0 },
  { item_key: "LED_M2", category: "Pantallas", label: "Pantalla LED (m²)", emoji: "📺", unit: "m2", base_price: 0 },
  { item_key: "CAM_1", category: "Cámaras", label: "Cámara 1", emoji: "📹", unit: "evento", base_price: 0 },
  { item_key: "CAM_ROBOT_1", category: "Cámaras", label: "Cámara robótica", emoji: "🤖", unit: "evento", base_price: 0 },
  { item_key: "OP_VIDEO", category: "Staff", label: "Operador video/LED", emoji: "🧑‍💻", unit: "dia", base_price: 0 }
];
