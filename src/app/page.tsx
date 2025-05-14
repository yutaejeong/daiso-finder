"use client";

import Image from "next/image";
import { useState } from "react";
import { SimplifiedBranchResponse } from "./api/branches/search/types";

export default function Home() {
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<SimplifiedBranchResponse>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = new URL("/api/branches/search", window.location.origin);
    url.searchParams.set("keyword", branch);
    url.searchParams.set("currentPage", "1");
    url.searchParams.set("pageSize", "10");
    url.searchParams.set("pageIndex", "0");
    const response = await fetch(url);
    const data = await response.json();

    setBranches(data);
  };

  return (
    <main className="h-full">
      <div
        className="container"
        style={{
          maxWidth: 480,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Image
          src="/logo.svg"
          alt="logo"
          width={200}
          height={80}
          style={{ marginBottom: "24px" }}
        />
        <h1 style={{ marginBottom: "8px" }}>
          당신이 있는 매장의 상품을 찾아드립니다
        </h1>
        <div
          className="text-muted"
          style={{ fontSize: "1.1rem", marginBottom: "16px" }}
        >
          매장을 선택해주세요
        </div>
        <form className="input-group mb-3" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control"
            placeholder="매장명을 입력하세요"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
          />
          <button className="btn btn-red" type="submit">
            검색
          </button>
        </form>
        <div
          className="flex flex-col gap-2 overflow-y-auto"
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#f8f8f8",
            borderRadius: "4px",
          }}
        >
          {branches.map((branch) => (
            <div
              className="card"
              key={branch.code}
              style={{ marginBottom: "4px", cursor: "pointer" }}
            >
              <div className="card-body">
                <h5 className="card-title">{branch.name}</h5>
                <p className="card-text">{branch.address}</p>
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="text-muted w-full h-1/2 flex justify-center items-center">
              지점을 검색해주세요 🔎
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
