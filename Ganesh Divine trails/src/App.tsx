import { useState } from "react";
import Lobby, { type ModeId } from "./components/Lobby";
import RunMode from "./game/RunMode";
import KaveriMode from "./game/KaveriMode";
import ModakMode from "./game/ModakMode";
import { resetInput } from "./game/core";

export default function App() {
  const [mode, setMode] = useState<ModeId | null>(null);

  const exit = () => {
    resetInput();
    setMode(null);
  };

  if (mode === "run") return <RunMode onExit={exit} />;
  if (mode === "kaveri") return <KaveriMode onExit={exit} />;
  if (mode === "modak") return <ModakMode onExit={exit} />;
  return <Lobby onPlay={(m) => setMode(m)} />;
}
