import Fretboard from "@/components/instruments/Fretboard";

export default function Home() {
  return (
    <>
      <div
        style={{
          width: "50em",
          height: "15em",
          resize: "both",
          overflow: "hidden",
        }}
      >
        <Fretboard />
      </div>
    </>
  );
}
