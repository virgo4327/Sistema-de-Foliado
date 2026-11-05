const UNIDADES = ["","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve",
  "diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte"];
const DECENAS = ["","","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
const CENTENAS = ["","ciento","doscientos","trescientos","cuatrocientos","quinientos",
  "seiscientos","setecientos","ochocientos","novecientos"];
const VEINTI_ESPECIAL = {2:"veintidós",3:"veintitrés",6:"veintiséis"};

function nombreDecenas(n){
  if(n<=20) return UNIDADES[n];
  const d=Math.floor(n/10), u=n%10;
  if(d===2){
    if(u===0) return "veinte";
    return VEINTI_ESPECIAL[u] || "veinti"+UNIDADES[u];
  }
  return u===0 ? DECENAS[d] : DECENAS[d]+" y "+UNIDADES[u];
}
function nombreCentenas(n){
  if(n===100) return "cien";
  const c=Math.floor(n/100), r=n%100;
  const partC = c>0 ? CENTENAS[c] : "";
  const partR = r>0 ? nombreDecenas(r) : "";
  return [partC,partR].filter(Boolean).join(" ");
}
function apocope(str){
  return str
    .replace(/\bveintiuno$/, "veintiún")
    .replace(/\buno$/, "un");
}
function nombreMiles(n){
  const miles = Math.floor(n/1000), resto = n%1000;
  let partMiles = "";
  if(miles===1){
    partMiles = "mil";
  } else if(miles>0){
    partMiles = apocope(nombreCentenas(miles)) + " mil";
  }
  const partResto = resto>0 ? nombreCentenas(resto) : "";
  return [partMiles, partResto].filter(Boolean).join(" ");
}
export function numberToWordsWord(n){
  if(n===0) return "cero";
  let s;
  if(n<100) s = nombreDecenas(n);
  else if(n<1000) s = nombreCentenas(n);
  else s = nombreMiles(n);
  s = s.trim().replace(/\s+/g," ");
  return s.charAt(0).toUpperCase()+s.slice(1)+".";
}
export const MAX_WORD = 50000;