// Hero 线描剪影：金字塔 / 齐格拉特 / 烽燧 / 帕特农 / 天坛，一条文明天际线（墨色线描）
export function SkylineSilhouette() {
  return (
    <svg viewBox="0 0 720 300" className="skyline-svg" aria-hidden="true">
      <defs>
        <linearGradient id="skyfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".07" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="720" height="300" fill="url(#skyfade)" />
      {/* 星点 */}
      {[[64,52],[130,34],[212,64],[300,26],[388,48],[470,30],[556,58],[640,40],[98,88],[520,90]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={i%3===0?1.4:1} fill="currentColor" opacity=".26" />
      ))}
      <g fill="none" stroke="currentColor" opacity=".4" strokeWidth="1.1" strokeLinejoin="round">
        {/* 金字塔 */}
        <path d="M40 250 L120 150 L200 250" />
        <path d="M120 150 L120 250" strokeDasharray="2 5" opacity=".45" />
        <path d="M156 250 L230 172 L300 250" opacity=".55" />
        {/* 齐格拉特（乌尔塔庙） */}
        <path d="M330 250 L330 226 L356 226 L356 206 L382 206 L382 186 L408 186 L408 168 L424 168 L424 250" />
        {/* 帕特农神庙 */}
        <path d="M448 250 L448 214 L528 214 L528 250" />
        <path d="M444 214 L532 214 L528 202 L448 202 Z" />
        {[462,478,494,510].map((x)=>(<line key={x} x1={x} y1="214" x2={x} y2="250" opacity=".55" />))}
        {/* 天坛祈年殿 */}
        <path d="M560 250 L560 236 L640 236 L640 250" opacity=".85" />
        <path d="M556 236 L600 200 L644 236" />
        <path d="M566 214 L600 186 L634 214" />
        <line x1="600" y1="186" x2="600" y2="176" />
        {/* 长城烽燧 */}
        <path d="M668 250 L668 216 L688 216 L688 232 L708 232 L708 250" />
        {/* 地平线 */}
        <line x1="0" y1="250" x2="720" y2="250" opacity=".7" />
      </g>
      {/* 基座：纸色，压住地平线以下 */}
      <rect x="0" y="250" width="720" height="50" className="skyline-base" />
    </svg>
  )
}
