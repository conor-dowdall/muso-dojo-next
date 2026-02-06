import Fretboard from "@/components/instruments/Fretboard";

export default function Home() {
  return (
    <>
      <Fretboard />
      <Fretboard config={{ theme: "dark" }} />
      <Fretboard config={{ theme: "light" }} />
      <Fretboard config={{ theme: "wood" }} />
    </>
  );
}
