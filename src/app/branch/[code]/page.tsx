"use client";

import { useParams } from "next/navigation";

export default function Branch() {
  const { code } = useParams();

  return (
    <main>
      <h1>Branch</h1>
    </main>
  );
}
