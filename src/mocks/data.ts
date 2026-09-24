export type TrackId = "push" | "pull" | "legs" | "core" | "cardio";
export type Effort = "Muito fáceis" | "Fáceis" | "Moderadas" | "Difíceis" | "Muito difíceis" | "Não completei";

export type Practice = {
  id: string; track: TrackId; name: string; dose: number; unit: "reps" | "seg";
  status: "dominado" | "atual" | "próximo"; suggestion: string;
};

export const tracks = [
  {id:"push",name:"Empurrar",icon:"↗",color:"#58b928",reference:"Flexão no solo",capacity:"10 flexões/min",checkpoint:"Máximo de flexões válidas"},
  {id:"pull",name:"Puxar",icon:"↓",color:"#5478e7",reference:"Barra fixa",capacity:"3 barras/min",checkpoint:"Vamos ver sua primeira série?"},
  {id:"legs",name:"Pernas",icon:"◇",color:"#ef9942",reference:"Agachamento profundo",capacity:"15 agachamentos/min",checkpoint:"Amplitude e controle"},
  {id:"core",name:"Core",icon:"✦",color:"#9b63d8",reference:"Crunch abdominal",capacity:"12 crunches/min",checkpoint:"Isometria de hollow"},
  {id:"cardio",name:"Cardio",icon:"≈",color:"#e4586f",reference:"Saltos de corda",capacity:"60 saltos/min",checkpoint:"Ritmo por 5 minutos"},
] as const;

export const practices: Practice[] = [
  {id:"push-incline",track:"push",name:"Flexão inclinada",dose:12,unit:"reps",status:"dominado",suggestion:"Use uma base um pouco mais baixa nas primeiras repetições."},
  {id:"push-floor",track:"push",name:"Flexão no solo",dose:10,unit:"reps",status:"atual",suggestion:"Hoje está confortável. Experimente maior amplitude na primeira série."},
  {id:"push-diamond",track:"push",name:"Flexão diamante",dose:4,unit:"reps",status:"próximo",suggestion:"Experimente as primeiras repetições em flexão diamante."},
  {id:"pull-row",track:"pull",name:"Remada australiana",dose:8,unit:"reps",status:"dominado",suggestion:"Pause um segundo com o peito próximo à barra."},
  {id:"pull-up",track:"pull",name:"Barra fixa",dose:3,unit:"reps",status:"atual",suggestion:"Experimente sua primeira barra em L-sit antes do EMOM."},
  {id:"pull-negative",track:"pull",name:"Negativa controlada",dose:4,unit:"reps",status:"próximo",suggestion:"Desça contando cinco segundos."},
  {id:"squat",track:"legs",name:"Agachamento profundo",dose:15,unit:"reps",status:"atual",suggestion:"Faça as primeiras repetições com pausa no fundo."},
  {id:"pistol-box",track:"legs",name:"Pistol no banco",dose:5,unit:"reps",status:"próximo",suggestion:"Teste uma repetição assistida de cada lado."},
  {id:"crunch",track:"core",name:"Crunch controlado",dose:12,unit:"reps",status:"atual",suggestion:"Segure dois segundos no topo da primeira repetição."},
  {id:"hollow",track:"core",name:"Hollow hold",dose:25,unit:"seg",status:"próximo",suggestion:"Mantenha a lombar apoiada; dobre os joelhos se precisar."},
  {id:"rope",track:"cardio",name:"Saltos de corda",dose:60,unit:"reps",status:"atual",suggestion:"Experimente alternar os pés nos primeiros 15 saltos."},
  {id:"fast-feet",track:"cardio",name:"Pés rápidos",dose:40,unit:"seg",status:"próximo",suggestion:"Comece leve e encontre um ritmo sustentável."},
];

export const evolution = {
  push:[{month:"Jan",value:5,effort:"Difícil"},{month:"Mar",value:7,effort:"Moderado"},{month:"Mai",value:9,effort:"Moderado"},{month:"Jul",value:10,effort:"Fácil"}],
  pull:[{month:"Jan",value:1,effort:"Muito difícil"},{month:"Mar",value:2,effort:"Difícil"},{month:"Mai",value:2,effort:"Moderado"},{month:"Jul",value:3,effort:"Moderado"}],
  legs:[{month:"Jan",value:10,effort:"Difícil"},{month:"Mar",value:12,effort:"Moderado"},{month:"Mai",value:14,effort:"Moderado"},{month:"Jul",value:15,effort:"Fácil"}],
  core:[{month:"Jan",value:7,effort:"Difícil"},{month:"Mar",value:9,effort:"Moderado"},{month:"Mai",value:11,effort:"Moderado"},{month:"Jul",value:12,effort:"Fácil"}],
  cardio:[{month:"Jan",value:35,effort:"Difícil"},{month:"Mar",value:45,effort:"Moderado"},{month:"Mai",value:55,effort:"Moderado"},{month:"Jul",value:60,effort:"Fácil"}],
};
