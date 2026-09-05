export function IslandPreview() {
  const trees = [
    [143, 222],
    [162, 192],
    [195, 193],
    [213, 230],
    [88, 280],
    [110, 310],
    [497, 181],
    [519, 208],
    [529, 242],
    [458, 192],
    [441, 330],
    [483, 351],
    [216, 401],
    [244, 418],
    [137, 376],
    [166, 367],
    [328, 178],
    [362, 169],
  ];
  return (
    <svg
      className="island-preview"
      viewBox="0 0 640 540"
      role="img"
      aria-label="중앙 분수와 다섯 길드의 집이 숲길로 연결된 TeamWorld 섬"
    >
      <defs>
        <pattern
          id="waves"
          width="52"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <path d="M8 18h15m10 7h6" stroke="#d0ded8" strokeWidth="2" />
        </pattern>
        <pattern
          id="grass"
          width="30"
          height="27"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M8 9v3m4-5v3"
            stroke="#759074"
            strokeWidth="1"
            opacity=".5"
          />
        </pattern>
      </defs>
      <rect width="640" height="540" fill="#e4eae3" />
      <rect width="640" height="540" fill="url(#waves)" />
      <path
        d="M115 195 190 152 260 155 308 115 421 131 474 164 516 182 550 250 536 314 575 346 548 410 460 438 370 451 300 476 194 452 158 414 96 389 69 325 88 251Z"
        fill="#b8c6b4"
        transform="translate(0 15)"
      />
      <path
        d="M115 195 190 152 260 155 308 115 421 131 474 164 516 182 550 250 536 314 575 346 548 410 460 438 370 451 300 476 194 452 158 414 96 389 69 325 88 251Z"
        fill="#e7d9b4"
      />
      <path
        d="M128 207 195 167 267 173 316 131 414 147 466 183 505 195 532 252 515 319 554 350 532 394 456 420 366 433 299 457 205 434 171 399 112 376 86 323 103 257Z"
        fill="#9bb08b"
      />
      <path
        d="M128 207 195 167 267 173 316 131 414 147 466 183 505 195 532 252 515 319 554 350 532 394 456 420 366 433 299 457 205 434 171 399 112 376 86 323 103 257Z"
        fill="url(#grass)"
      />
      <g stroke="#ddcea8" strokeWidth="21" fill="none" strokeLinejoin="round">
        <path d="M182 267 320 300 427 239m-107 61 0-105m0 105-75 80m75-80 135 85" />
      </g>
      <path d="M276 270h85v64h-85z" fill="#e9debc" />
      <path
        d="M276 285h85m-85 16h85m-85 16h85m-64-47v64m22-64v64m21-64v64"
        stroke="#d6caaa"
      />
      <g fill="#658261">
        {trees.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cy="19" rx="15" ry="6" fill="#60735d" opacity=".25" />
            <rect x="-3" y="-7" width="6" height="26" fill="#7c7359" />
            <path d="M0-33 17-6H9L22 8H-22L-9-6H-17Z" />
            <path d="M0-33 0 8H-22L-9-6H-17Z" fill="#769469" />
          </g>
        ))}
      </g>
      <House x={177} y={248} color="#647d5f" />
      <House x={319} y={194} color="#ba9468" />
      <House x={432} y={242} color="#8f80a7" />
      <House x={234} y={379} color="#c3a573" />
      <House x={457} y={380} color="#7297a1" />
      <g transform="translate(319 300)">
        <ellipse cy="10" rx="27" ry="12" fill="#acb3a0" />
        <ellipse rx="27" ry="12" fill="#e8e3cd" />
        <ellipse rx="21" ry="8" fill="#80b1b5" />
        <rect x="-4" y="-22" width="8" height="23" fill="#dcdac8" />
        <ellipse cy="-23" rx="12" ry="5" fill="#eeebd8" />
        <path
          d="M0-27v-10m-3 16-8 10m14-10 8 10"
          stroke="#cce6df"
          strokeWidth="3"
        />
      </g>
      <g fill="#f3e2a3">
        {[
          [135, 335],
          [260, 213],
          [363, 370],
          [387, 225],
          [203, 331],
          [467, 291],
        ].map(([x, y], i) => (
          <g key={i}>
            <path
              d={`M${x} ${y - 4}v8m-4-4h8`}
              stroke="#efe2a6"
              strokeWidth="3"
            />
          </g>
        ))}
      </g>
      <g fontFamily="monospace" fontSize="9" textAnchor="middle" fill="#3f5046">
        <Label x={177} y={287} text="FOREST GUILD" />
        <Label x={319} y={223} text="MAKERS LAB" />
        <Label x={432} y={278} text="STARLIGHT" />
        <Label x={234} y={410} text="SANDSTONE" />
        <Label x={457} y={416} text="BLUE HARBOR" />
      </g>
      <g transform="translate(294 346)">
        <rect x="-4" y="-9" width="9" height="10" fill="#79855f" />
        <rect x="-4" y="-17" width="9" height="8" fill="#e4bb93" />
        <path d="M-6-17H7v-4H-4Z" fill="#586e56" />
        <path d="M-4 1v4m8-4v4" stroke="#44544b" strokeWidth="3" />
      </g>
      <path d="M580 112v35m-17-17h34" stroke="#a0b1a3" />
      <text x="580" y="101" textAnchor="middle" fontSize="11" fill="#7f9286">
        N
      </text>
      <path d="M66 181h24m-12-12v24" stroke="#9baea0" />
      <path d="M506 88h13m-6-6v13" stroke="#9baea0" />
    </svg>
  );
}
function House({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="22" rx="36" ry="10" fill="#6d815f" opacity=".25" />
      <path d="M-29-16h58v38h-58z" fill="#e5d8b6" />
      <path d="M-29 12h58v10h-58z" fill="#cbbf9c" />
      <path d="M-37-15 0-46 37-15 31-7H-31Z" fill={color} />
      <path
        d="M-27-20h54m-44-8h34m-25-8h16"
        stroke="#ffffff"
        opacity=".15"
        strokeWidth="2"
      />
      <path d="M-7 1h14v21H-7" fill="#706c55" />
      <path d="M-23-3h10v12h-10m36-12h10v12H13" fill="#a2b6a3" />
      <path d="M-18-3V9M18-3V9" stroke="#e9d6ac" strokeWidth="2" />
      <rect x="17" y="-39" width="7" height="17" fill="#a59377" />
    </g>
  );
}
function Label({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect
        x={x - 48}
        y={y - 10}
        width="96"
        height="17"
        rx="3"
        fill="#f8f3e3"
        opacity=".95"
      />
      <text x={x} y={y + 1}>
        {text}
      </text>
    </g>
  );
}
