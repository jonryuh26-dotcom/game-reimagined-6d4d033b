import { createFileRoute } from "@tanstack/react-router";
import GameClient from "@/game/GameClient";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <GameClient />;
}
