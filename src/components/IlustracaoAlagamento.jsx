// Ilustração própria da marca (não é foto). Mostra a situação que o canal resolve.
export default function IlustracaoAlagamento({ className = '' }) {
  return (
    <svg viewBox="0 0 640 400" className={className} role="img" aria-label="Ilustração: rua alagada em dia de chuva, com casas, uma palmeira de babaçu, um bueiro entupido e um aviso sendo registrado no mapa">
      <defs>
        <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3E2F6" /><stop offset="1" stopColor="#EEF4FC" /></linearGradient>
        <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2BB3E6" stopOpacity=".75" /><stop offset="1" stopColor="#0B4DA2" stopOpacity=".85" /></linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#ceu)" />
      <g fill="#A9C4E8"><ellipse cx="120" cy="48" rx="90" ry="26" /><ellipse cx="190" cy="40" rx="60" ry="24" /><ellipse cx="470" cy="56" rx="110" ry="28" /><ellipse cx="560" cy="44" rx="70" ry="22" /></g>
      <g stroke="#7FA6DA" strokeWidth="2" strokeLinecap="round" opacity=".7"><line x1="341" y1="78" x2="334" y2="98"/><line x1="414" y1="206" x2="407" y2="226"/><line x1="59" y1="58" x2="52" y2="78"/><line x1="558" y1="64" x2="551" y2="84"/><line x1="384" y1="189" x2="377" y2="209"/><line x1="69" y1="169" x2="62" y2="189"/><line x1="229" y1="49" x2="222" y2="69"/><line x1="98" y1="151" x2="91" y2="171"/><line x1="438" y1="57" x2="431" y2="77"/><line x1="256" y1="63" x2="249" y2="83"/><line x1="574" y1="148" x2="567" y2="168"/><line x1="70" y1="251" x2="63" y2="271"/><line x1="589" y1="71" x2="582" y2="91"/><line x1="238" y1="201" x2="231" y2="221"/><line x1="606" y1="55" x2="599" y2="75"/><line x1="600" y1="189" x2="593" y2="209"/><line x1="416" y1="52" x2="409" y2="72"/><line x1="236" y1="51" x2="229" y2="71"/><line x1="580" y1="259" x2="573" y2="279"/><line x1="146" y1="114" x2="139" y2="134"/><line x1="439" y1="76" x2="432" y2="96"/><line x1="563" y1="70" x2="556" y2="90"/><line x1="594" y1="118" x2="587" y2="138"/><line x1="583" y1="248" x2="576" y2="268"/><line x1="195" y1="66" x2="188" y2="86"/><line x1="605" y1="186" x2="598" y2="206"/><line x1="202" y1="135" x2="195" y2="155"/><line x1="109" y1="180" x2="102" y2="200"/><line x1="74" y1="184" x2="67" y2="204"/><line x1="71" y1="198" x2="64" y2="218"/><line x1="220" y1="167" x2="213" y2="187"/><line x1="554" y1="149" x2="547" y2="169"/><line x1="331" y1="159" x2="324" y2="179"/><line x1="609" y1="156" x2="602" y2="176"/><line x1="380" y1="116" x2="373" y2="136"/><line x1="264" y1="243" x2="257" y2="263"/><line x1="194" y1="218" x2="187" y2="238"/><line x1="259" y1="60" x2="252" y2="80"/><line x1="598" y1="116" x2="591" y2="136"/><line x1="547" y1="166" x2="540" y2="186"/><line x1="361" y1="226" x2="354" y2="246"/><line x1="469" y1="113" x2="462" y2="133"/><line x1="633" y1="58" x2="626" y2="78"/><line x1="130" y1="171" x2="123" y2="191"/><line x1="438" y1="82" x2="431" y2="102"/><line x1="360" y1="78" x2="353" y2="98"/><line x1="510" y1="147" x2="503" y2="167"/><line x1="50" y1="211" x2="43" y2="231"/><line x1="89" y1="235" x2="82" y2="255"/><line x1="581" y1="186" x2="574" y2="206"/><line x1="331" y1="127" x2="324" y2="147"/><line x1="368" y1="192" x2="361" y2="212"/><line x1="518" y1="188" x2="511" y2="208"/><line x1="477" y1="57" x2="470" y2="77"/><line x1="105" y1="109" x2="98" y2="129"/><line x1="495" y1="218" x2="488" y2="238"/><line x1="76" y1="55" x2="69" y2="75"/><line x1="327" y1="205" x2="320" y2="225"/><line x1="601" y1="214" x2="594" y2="234"/><line x1="466" y1="112" x2="459" y2="132"/><line x1="405" y1="267" x2="398" y2="287"/><line x1="365" y1="45" x2="358" y2="65"/><line x1="482" y1="130" x2="475" y2="150"/><line x1="182" y1="196" x2="175" y2="216"/><line x1="129" y1="166" x2="122" y2="186"/><line x1="70" y1="95" x2="63" y2="115"/><line x1="304" y1="73" x2="297" y2="93"/><line x1="263" y1="141" x2="256" y2="161"/><line x1="410" y1="263" x2="403" y2="283"/><line x1="518" y1="60" x2="511" y2="80"/></g>
      <g fill="#BCD2EE"><rect x="0" y="170" width="60" height="130" /><rect x="70" y="150" width="46" height="150" /><rect x="250" y="160" width="54" height="140" /><rect x="540" y="140" width="64" height="160" /><rect x="610" y="175" width="40" height="125" /></g>
      <g>
        <rect x="30" y="200" width="150" height="100" fill="#FFFFFF" />
        <path d="M20 204 L105 150 L190 204 Z" fill="#0B4DA2" />
        <rect x="92" y="238" width="28" height="62" fill="#072B5A" />
        <rect x="48" y="224" width="18" height="18" rx="2" fill="#2BB3E6" fillOpacity=".55"/><rect x="146" y="224" width="18" height="18" rx="2" fill="#2BB3E6" fillOpacity=".55"/>
        <rect x="200" y="216" width="120" height="84" fill="#E3ECF8" />
        <path d="M192 220 L260 178 L328 220 Z" fill="#072B5A" />
        <rect x="218" y="238" width="18" height="18" rx="2" fill="#2BB3E6" fillOpacity=".55"/><rect x="282" y="238" width="18" height="18" rx="2" fill="#2BB3E6" fillOpacity=".55"/>
      </g>
      <g>
        <path d="M372 300 C370 250 380 210 392 176" stroke="#8A6E52" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g fill="#2F8F6B"><path d="M392 176 C360 160 340 170 326 186 C350 172 370 174 392 176Z" /><path d="M392 176 C380 146 356 138 338 140 C362 150 378 160 392 176Z" /><path d="M392 176 C404 146 428 140 446 146 C420 152 404 162 392 176Z" /><path d="M392 176 C420 166 444 176 456 192 C432 180 412 178 392 176Z" /><path d="M392 176 C394 150 402 132 414 122 C406 142 400 158 392 176Z" /></g>
      </g>
      <rect x="0" y="296" width="640" height="8" fill="#8FA6C4" />
      <path d="M0 292 L0 292.0 L20 294.6 L40 296.0 L60 295.4 L80 293.1 L100 290.3 L120 288.4 L140 288.2 L160 289.8 L180 292.6 L200 295.0 L220 296.0 L240 295.0 L260 292.6 L280 289.8 L300 288.2 L320 288.4 L340 290.4 L360 293.1 L380 295.4 L400 296.0 L420 294.6 L440 292.0 L460 289.4 L480 288.0 L500 288.7 L520 290.9 L540 293.7 L560 295.7 L580 295.8 L600 294.1 L620 291.4 L640 289.0 L640 400 L0 400 Z" fill="url(#agua)" />
      <g>
        <rect x="430" y="306" width="74" height="14" rx="3" fill="#072B5A" />
        <g stroke="#5B7396" strokeWidth="3"><line x1="442" y1="308" x2="442" y2="318" /><line x1="454" y1="308" x2="454" y2="318" /><line x1="466" y1="308" x2="466" y2="318" /><line x1="478" y1="308" x2="478" y2="318" /><line x1="490" y1="308" x2="490" y2="318" /></g>
        <g fill="#B98A4A"><ellipse cx="448" cy="305" rx="8" ry="3" /><ellipse cx="482" cy="304" rx="6" ry="2.5" /><rect x="460" y="300" width="9" height="5" rx="1" fill="#E2E8F0" /></g>
      </g>
      <path d="M0 306 L0 308.9 L20 308.4 L40 306.1 L60 303.7 L80 303.1 L100 304.7 L120 307.4 L140 308.9 L160 308.3 L180 305.8 L200 303.5 L220 303.1 L240 305.0 L260 307.6 L280 309.0 L300 308.1 L320 305.6 L340 303.4 L360 303.2 L380 305.2 L400 307.8 L420 309.0 L440 307.9 L460 305.4 L480 303.3 L500 303.3 L520 305.4 L540 308.0 L560 309.0 L580 307.7 L600 305.1 L620 303.2 L640 303.4 L640 400 L0 400 Z" fill="#2BB3E6" fillOpacity=".35" />
      <path d="M0 330 L0 332.2 L20 329.8 L40 327.7 L60 328.1 L80 330.6 L100 332.5 L120 331.5 L140 328.9 L160 327.5 L180 328.9 L200 331.5 L220 332.5 L240 330.7 L260 328.1 L280 327.7 L300 329.8 L320 332.1 L340 332.1 L360 329.7 L380 327.7 L400 328.2 L420 330.7 L440 332.5 L460 331.5 L480 328.8 L500 327.5 L520 329.0 L540 331.6 L560 332.4 L580 330.6 L600 328.1 L620 327.7 L640 329.9 L640 400 L0 400 Z" fill="#0B4DA2" fillOpacity=".35" />
      <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".6" fill="none"><path d="M60 350 q14 -6 28 0" /><path d="M210 370 q14 -6 28 0" /><path d="M330 345 q14 -6 28 0" /><path d="M560 365 q14 -6 28 0" /></g>
      <g>
        <path d="M467 286 C456 270 438 256 438 236 A29 29 0 0 1 496 236 C496 256 478 270 467 286Z" fill="#0B4DA2" />
        <circle cx="467" cy="236" r="13" fill="none" stroke="#FFFFFF" strokeWidth="5" />
        <circle cx="467" cy="236" r="4.2" fill="#2BB3E6" />
        <path d="M478 214 A26 26 0 0 1 492 226" stroke="#2BB3E6" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M482 204 A38 38 0 0 1 502 222" stroke="#2BB3E6" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".6" />
      </g>
      <g>
        <rect x="488" y="112" width="122" height="58" rx="12" fill="#FFFFFF" />
        <circle cx="508" cy="141" r="9" fill="#E6F6FC" /><path d="M503 141 l4 4 l7 -8" stroke="#1A9CCF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="524" y="137" fontSize="11" fontWeight="600" fill="#072B5A" fontFamily="Inter, sans-serif">Aviso registrado</text>
        <text x="524" y="153" fontSize="9.5" fill="#516580" fontFamily="Inter, sans-serif">Protocolo enviado</text>
      </g>
    </svg>
  )
}
