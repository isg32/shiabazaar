import Image from "next/image";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--color-canvas, #faf9f5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "36px",
        zIndex: 9999,
        animation: "sb-fade-in 0.35s ease both",
      }}
    >
      <Image
        src="/logo-main.png"
        alt="Shia Bazaar"
        width={200}
        height={70}
        priority
        style={{ opacity: 0.92 }}
      />
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "2px solid var(--color-hairline, #e6dfd8)",
          borderTopColor: "var(--color-primary, #cc785c)",
          borderRadius: "50%",
          animation: "sb-spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}
