"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("waiting for JS...");

  useEffect(() => {
    setStatus("JS is working!");
  }, []);

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-bold">EdgeConnect</h1>
      <p>{status}</p>
    </main>
  );
}
