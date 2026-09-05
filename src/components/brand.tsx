import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TeamWorld 홈">
      <span className="brand-mark">
        tw<span>✦</span>
      </span>
      <span>
        teamworld<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
