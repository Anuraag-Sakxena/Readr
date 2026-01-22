import ScreenCardEngine from "@/components/ScreenCardEngine";
import { mockEdition } from "@/lib/mockEdition";

export default function Home() {
  return <ScreenCardEngine cards={mockEdition} />;
}
